import { NextRequest, NextResponse } from "next/server";
import { getFrames } from "@/lib/mirrors/db";

/**
 * GET /api/mirrors/timeline?type=dubai&limit=20&offset=0
 *
 * Returns the frame history for a mirror type (paginated, newest first).
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mirrorType = url.searchParams.get("type");
  const limit = Math.min(
    parseInt(url.searchParams.get("limit") || "20", 10),
    100
  );
  const offset = Math.max(
    parseInt(url.searchParams.get("offset") || "0", 10),
    0
  );

  if (!mirrorType) {
    return NextResponse.json(
      { error: "type query parameter required" },
      { status: 400 }
    );
  }

  try {
    const { frames, total } = await getFrames(mirrorType, limit, offset);
    return NextResponse.json({ frames, total });
  } catch (err) {
    console.error("[api/mirrors/timeline] Failed:", err);
    return NextResponse.json(
      {
        error: `Failed to fetch timeline: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 500 }
    );
  }
}
