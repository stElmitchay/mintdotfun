import { NextRequest, NextResponse } from "next/server";
import { generateMirrorConfig } from "@/lib/mirrors/configGenerator";
import { validateMirrorConfig } from "@/lib/mirrors/configValidator";

/**
 * POST /api/mirrors/generate-config
 *
 * AI-generates a full MirrorTypeConfig from a city name.
 * Returns the generated config for the user to review and edit.
 *
 * Body: { cityName: string, country?: string, theme?: string }
 */
export async function POST(req: NextRequest) {
  // Privy auth check
  const privyToken = req.cookies.get("privy-token")?.value;
  if (!privyToken) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  let body: { cityName: string; country?: string; theme?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.cityName || typeof body.cityName !== "string") {
    return NextResponse.json(
      { error: "cityName is required" },
      { status: 400 }
    );
  }

  try {
    const config = await generateMirrorConfig(
      body.cityName,
      body.country,
      body.theme
    );

    // Validate the generated config
    const validation = validateMirrorConfig(config);

    return NextResponse.json({
      config,
      validation,
    });
  } catch (err) {
    console.error("[api/mirrors/generate-config] Failed:", err);
    return NextResponse.json(
      {
        error: `Config generation failed: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 500 }
    );
  }
}
