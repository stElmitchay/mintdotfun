import { NextRequest, NextResponse } from "next/server";
import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  type UIMessage,
} from "ai";
import { google } from "@ai-sdk/google";
import { getAgentById, saveMessage, incrementInteractions } from "@/lib/agent/db";
import { searchMemories, storeMemory } from "@/lib/agent/memory";
import { buildSystemPrompt } from "@/lib/agent/systemPrompt";
import { createAgentTools } from "@/lib/agent/tools";
import { checkAndApplyEvolution } from "@/lib/agent/evolution";

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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  // Auth check
  const privyToken = req.cookies.get("privy-token")?.value;
  if (!privyToken) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

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

  // Build system prompt
  const systemPrompt = buildSystemPrompt({ agent, recentMemories });

  // Create tools
  const tools = createAgentTools(agent);

  // Convert UIMessages → ModelMessages for streamText
  const modelMessages = await convertToModelMessages(messages);

  // Stream response
  const result = streamText({
    model: google("gemini-2.5-flash"),
    system: systemPrompt,
    messages: modelMessages,
    tools,
    stopWhen: stepCountIs(5),
    onFinish: async ({ text }) => {
      try {
        if (userQuery) {
          await saveMessage({
            agentId,
            sessionId,
            role: "user",
            content: userQuery,
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

  return result.toUIMessageStreamResponse();
}
