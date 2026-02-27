import { NextRequest, NextResponse } from "next/server";
import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  type UIMessage,
} from "ai";
import {
  getAgentById,
  saveMessage,
  incrementInteractions,
  ensureAgentPermissions,
} from "@/lib/agent/db";
import { searchMemories, storeMemory } from "@/lib/agent/memory";
import { buildSystemPrompt } from "@/lib/agent/systemPrompt";
import { createAgentTools, restrictToolsForViewer } from "@/lib/agent/tools";
import { checkAndApplyEvolution } from "@/lib/agent/evolution";
import { requirePrivyAuth } from "@/lib/auth/privy";
import {
  getAgentLlmProvider,
  getAgentModelForProvider,
  getDefaultAgentModel,
  getGoogleFallbackModel,
  isUnsupportedProviderModelError,
} from "@/lib/agent/llm";
import {
  isQuotaError,
  markModelCooldown,
  parseModelCandidates,
  pickPreferredModel,
} from "@/lib/agent/modelFallback";

// ============================================================
// POST /api/agent/[agentId]/chat — Streaming agent chat
// ============================================================

/** Extract text content from a UIMessage (parts-based in ai v6). */
function extractTextFromMessage(msg: UIMessage): string {
  return msg.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

function extractAttachmentsFromMessage(
  msg: UIMessage
): Array<{ url: string; name?: string; contentType?: string }> {
  const raw = (
    msg as unknown as {
      experimental_attachments?: Array<{
        url: string;
        name?: string;
        contentType?: string;
      }>;
    }
  ).experimental_attachments;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (a): a is { url: string; name?: string; contentType?: string } =>
        Boolean(a && typeof a.url === "string")
    )
    .map((a) => ({
      url: a.url,
      name: a.name,
      contentType: a.contentType,
    }));
}

function getChatModelCandidates(): string[] {
  return parseModelCandidates({
    primary: process.env.AGENT_CHAT_MODEL,
    fallbacksCsv: process.env.AGENT_CHAT_MODEL_FALLBACKS,
    defaultModel: getDefaultAgentModel("chat"),
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const auth = await requirePrivyAuth(req);
  if (!auth.ok) return auth.response;

  const { agentId } = await params;

  // Parse body
  let body: { messages: UIMessage[]; sessionId: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { messages, sessionId } = body;
  if (!messages || !sessionId) {
    return NextResponse.json(
      { error: "messages and sessionId are required" },
      { status: 400 }
    );
  }

  // Load agent
  const agent = await getAgentById(agentId);
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  // Extract last user message for memory search
  const lastUserMessage = [...messages]
    .reverse()
    .find((m) => m.role === "user");
  const userQuery = lastUserMessage
    ? extractTextFromMessage(lastUserMessage)
    : "";
  const userAttachments = lastUserMessage
    ? extractAttachmentsFromMessage(lastUserMessage)
    : [];

  // Search relevant memories
  let recentMemories: Array<{ content: string; similarity: number }> = [];
  if (userQuery) {
    try {
      recentMemories = await searchMemories({
        agentId,
        query: userQuery,
        limit: 5,
        threshold: 0.6,
      });
    } catch {
      // Memory search is non-critical; continue without
    }
  }

  // Create tools
  const isOwner =
    auth.wallets.size === 0 ||
    auth.wallets.has(agent.owner_wallet.toLowerCase());
  const permissions = await ensureAgentPermissions(agent);
  const tools = restrictToolsForViewer(createAgentTools(agent), {
    isOwner,
    allowedActions: permissions.allowed_actions,
    isPaused: permissions.is_paused,
  });
  const availableToolNames = Object.keys(tools);
  const systemPrompt = buildSystemPrompt({
    agent,
    recentMemories,
    availableTools: availableToolNames,
  });

  // Convert UIMessages → ModelMessages for streamText
  const modelMessages = await convertToModelMessages(messages);

  // Stream response
  const modelCandidates = getChatModelCandidates();
  const selectedModelId = pickPreferredModel(modelCandidates);
  const provider = getAgentLlmProvider();

  try {
    const result = streamText({
      model: getAgentModelForProvider(provider, selectedModelId),
      system: systemPrompt,
      messages: modelMessages,
      tools,
      maxRetries: 0,
      stopWhen: stepCountIs(5),
      onError: ({ error }) => {
        if (isQuotaError(error)) {
          // Cooldown this model for 15 minutes so the next request can fail over.
          markModelCooldown(selectedModelId, 15 * 60 * 1000);
        }
        console.error("[chat/stream] Error:", error);
      },
      onFinish: async ({ text }) => {
        try {
          if (userQuery || userAttachments.length > 0) {
            await saveMessage({
              agentId,
              sessionId,
              role: "user",
              content:
                userQuery ||
                (userAttachments.length === 1
                  ? "Uploaded 1 image."
                  : `Uploaded ${userAttachments.length} images.`),
              metadata:
                userAttachments.length > 0
                  ? { attachments: userAttachments }
                  : undefined,
            });
          }
          if (text) {
            await saveMessage({
              agentId,
              sessionId,
              role: "assistant",
              content: text,
            });
          }

          await incrementInteractions(agentId);

          // Store user message as memory for future recall
          if (userQuery.length > 20) {
            await storeMemory({
              agentId,
              type: "conversation",
              content: userQuery,
              importance: 0.3,
              metadata: { sessionId },
            }).catch(() => {});
          }

          // Check evolution (side effect)
          await checkAndApplyEvolution(agentId).catch(() => {});
        } catch (err) {
          console.error("[chat/onFinish] Error:", err);
        }
      },
    });

    return result.toTextStreamResponse();
  } catch (err) {
    if (provider === "anthropic" && isUnsupportedProviderModelError(err)) {
      const googleFallbackModel = getGoogleFallbackModel("chat");
      console.warn(
        `[chat] Anthropic provider/model incompatible, falling back to Google model: ${googleFallbackModel}`
      );
      const fallbackResult = streamText({
        model: getAgentModelForProvider("google", googleFallbackModel),
        system: systemPrompt,
        messages: modelMessages,
        tools,
        maxRetries: 0,
        stopWhen: stepCountIs(5),
      });
      return fallbackResult.toTextStreamResponse();
    }

    if (isQuotaError(err)) {
      markModelCooldown(selectedModelId, 15 * 60 * 1000);
      return NextResponse.json(
        {
          error:
            "Model quota reached. Try again shortly; fallback model will be used on the next request.",
        },
        { status: 429 }
      );
    }
    throw err;
  }
}
