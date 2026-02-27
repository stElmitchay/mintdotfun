import { NextRequest, NextResponse } from "next/server";
import { requirePrivyAuth } from "@/lib/auth/privy";
import {
  ensureAgentPermissions,
  getAgentById,
  getAgentByMintAddress,
} from "@/lib/agent/db";
import { createAgentTools, restrictToolsForViewer } from "@/lib/agent/tools";
import { getSolanaToolDiagnostics } from "@/lib/agent/solanaKit";
import {
  findUnresolvedActionValues,
  listSolanaActionDefinitions,
  resolveAllowedActionIds,
} from "@/lib/agent/solanaActions";

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
  const agent = isUuid(agentId)
    ? await getAgentById(agentId)
    : await getAgentByMintAddress(agentId);
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const isOwner =
    auth.wallets.size === 0 ||
    auth.wallets.has(agent.owner_wallet.toLowerCase());
  const permissions = await ensureAgentPermissions(agent);
  const tools = restrictToolsForViewer(createAgentTools(agent), {
    isOwner,
    allowedActions: permissions.allowed_actions,
    isPaused: permissions.is_paused,
  });
  const toolNames = Object.keys(tools).sort();
  const solanaTools = toolNames.filter(
    (name) => name === name.toUpperCase() || name.includes("_")
  );
  const solanaDiagnostics = getSolanaToolDiagnostics();
  const allowedActionIds = [...resolveAllowedActionIds(permissions.allowed_actions)].sort();
  const unresolvedAllowedActions = findUnresolvedActionValues(
    permissions.allowed_actions
  );

  return NextResponse.json({
    isOwner,
    walletClaimsCount: auth.wallets.size,
    permissions: {
      mode: permissions.mode,
      isPaused: permissions.is_paused,
      allowedActions: permissions.allowed_actions,
      allowedActionIds,
      unresolvedAllowedActions,
    },
    totalTools: toolNames.length,
    solanaToolsCount: solanaTools.length,
    tools: toolNames,
    solanaTools,
    solanaActionCatalog: listSolanaActionDefinitions(),
    solanaDiagnostics,
  });
}
