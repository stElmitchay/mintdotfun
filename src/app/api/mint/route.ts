import { NextResponse } from "next/server";

// Minting is now handled client-side using the user's Privy wallet.
// This route is kept as a placeholder for future server-side operations
// like metadata upload to Arweave via Irys.

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Minting has moved client-side. Use the MintPanel component with your connected wallet.",
    },
    { status: 410 }
  );
}
