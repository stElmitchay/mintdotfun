import { NextRequest, NextResponse } from "next/server";
import { updateMirrorTypeWithLock } from "@/lib/mirrors/updater";
import { getMirrorConfig } from "@/lib/mirrors/config";

// Allow up to 60 seconds for the full pipeline (Vercel Pro)
export const maxDuration = 60;

/**
 * POST /api/mirrors/update?type=dubai
 *
 * Triggers a full update cycle for a mirror type.
 * Called by cron scheduler or manually for testing.
 *
 * Auth: CRON_SECRET bearer token (NOT Privy — this is server-to-server).
 */
export async function POST(req: NextRequest) {
  // Authenticate with CRON_SECRET
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get mirror type from query param or body
  const url = new URL(req.url);
  let mirrorType = url.searchParams.get("type");

  if (!mirrorType) {
    try {
      const body = await req.json();
      mirrorType = body.mirrorType ?? null;
    } catch {
      // No body
    }
  }

  if (!mirrorType) {
    return NextResponse.json(
      { error: "Mirror type required. Pass ?type=dubai or { mirrorType: 'dubai' }" },
      { status: 400 }
    );
  }

  // Validate mirror type exists
  try {
    await getMirrorConfig(mirrorType);
  } catch {
    return NextResponse.json(
      { error: `Unknown mirror type: ${mirrorType}` },
      { status: 400 }
    );
  }

  try {
    const { result, deduped } = await updateMirrorTypeWithLock(mirrorType);

    return NextResponse.json({
      success: true,
      deduped,
      ...result,
    });
  } catch (err) {
    console.error(`[api/mirrors/update] Failed for ${mirrorType}:`, err);
    return NextResponse.json(
      {
        error: `Update failed: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 500 }
    );
  }
}
