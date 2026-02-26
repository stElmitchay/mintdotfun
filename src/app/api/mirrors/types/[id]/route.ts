import { NextRequest, NextResponse } from "next/server";
import { getMirrorConfig } from "@/lib/mirrors/config";

/**
 * GET /api/mirrors/types/[id]
 *
 * Returns the full config for a single mirror type.
 * Used by detail pages that need the full MirrorTypeConfig.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const config = await getMirrorConfig(id);
    return NextResponse.json({ config });
  } catch {
    return NextResponse.json(
      { error: `Mirror type not found: ${id}` },
      { status: 404 }
    );
  }
}
