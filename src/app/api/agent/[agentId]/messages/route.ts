import { NextRequest, NextResponse } from "next/server";
import { requirePrivyAuth } from "@/lib/auth/privy";
import {
  getAgentById,
  getAgentByMintAddress,
  getSessionMessages,
} from "@/lib/agent/db";

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    s
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const auth = await requirePrivyAuth(req);
  if (!auth.ok) return auth.response;

  const { agentId } = await params;
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  const agent = isUuid(agentId)
    ? await getAgentById(agentId)
    : await getAgentByMintAddress(agentId);
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const isOwner =
    auth.wallets.size === 0 ||
    auth.wallets.has(agent.owner_wallet.toLowerCase());
  if (!isOwner) {
    return NextResponse.json(
      { error: "Only the owner can view chat history" },
      { status: 403 }
    );
  }

  const rows = await getSessionMessages({
    agentId: agent.id,
    sessionId,
    limit: 300,
  });

  const messages = rows
    .map((row) => {
      const role = String(row.role);
      if (role !== "user" && role !== "assistant" && role !== "system") {
        return null;
      }

      const metadata =
        row.metadata && typeof row.metadata === "object"
          ? (row.metadata as Record<string, unknown>)
          : {};
      const attachmentsRaw = metadata.attachments;
      const attachments = Array.isArray(attachmentsRaw)
        ? attachmentsRaw.filter(
            (a) =>
              a &&
              typeof a === "object" &&
              typeof (a as Record<string, unknown>).url === "string"
          )
        : [];

      return {
        id: String(row.id),
        role,
        content: String(row.content ?? ""),
        createdAt: row.created_at ? new Date(String(row.created_at)) : undefined,
        parts: [{ type: "text", text: String(row.content ?? "") }],
        experimental_attachments: attachments,
      };
    })
    .filter(Boolean);

  return NextResponse.json({ messages });
}

