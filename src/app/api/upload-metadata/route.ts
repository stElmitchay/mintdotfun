import { NextRequest, NextResponse } from "next/server";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import {
  createSignerFromKeypair,
  signerIdentity,
  createGenericFile,
} from "@metaplex-foundation/umi";
import type { Umi } from "@metaplex-foundation/umi";

const rpcUrl =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2000;

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        await new Promise((r) =>
          setTimeout(r, RETRY_DELAY_MS * (attempt + 1))
        );
      }
    }
  }
  throw new Error(
    `${label} failed after ${MAX_RETRIES + 1} attempts: ${lastError instanceof Error ? lastError.message : String(lastError)}`
  );
}

// Cached across requests within the same serverless instance.
let cachedUmi: Umi | null = null;

function getServerUmi(): Umi {
  if (cachedUmi) return cachedUmi;

  if (!process.env.ARWEAVE_WALLET_SECRET) {
    throw new Error(
      "ARWEAVE_WALLET_SECRET env var is required. " +
        "Generate a keypair, fund it with SOL, and set the secret key as a JSON byte array."
    );
  }

  const umi = createUmi(rpcUrl).use(irysUploader());

  const secretKey = new Uint8Array(
    JSON.parse(process.env.ARWEAVE_WALLET_SECRET)
  );
  const keypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
  const signer = createSignerFromKeypair(umi, keypair);
  umi.use(signerIdentity(signer));

  cachedUmi = umi;
  return umi;
}

/**
 * POST /api/upload-metadata
 *
 * Uploads an image + NFT metadata JSON to Arweave server-side so the
 * client never needs to sign Irys transactions (zero wallet popups).
 *
 * Body: { imageUrl, name, description?, creatorAddress }
 * Response: { imageUri, metadataUri }
 */
export async function POST(req: NextRequest) {
  const privyToken = req.cookies.get("privy-token")?.value;
  if (!privyToken) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  let body: {
    imageUrl: string;
    name: string;
    description?: string;
    creatorAddress: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.imageUrl || !body.name || !body.creatorAddress) {
    return NextResponse.json(
      { error: "Missing required fields: imageUrl, name, creatorAddress" },
      { status: 400 }
    );
  }

  try {
    const umi = getServerUmi();

    // --- Download image ---
    const resp = await fetch(body.imageUrl);
    if (!resp.ok)
      throw new Error(`Failed to download image: HTTP ${resp.status}`);
    const contentType = resp.headers.get("content-type") || "image/webp";
    const imageBytes = new Uint8Array(await resp.arrayBuffer());

    // --- Upload image to Arweave ---
    const imageFile = createGenericFile(imageBytes, `${body.name}.webp`, {
      contentType,
    });
    const [imageUri] = await withRetry(
      () => umi.uploader.upload([imageFile]),
      "Image upload"
    );

    // --- Upload metadata JSON to Arweave ---
    const metadata = {
      name: body.name,
      description: body.description
        ? `${body.description}\n\nGenerated with AI`
        : "Generated with AI",
      image: imageUri,
      attributes: [{ trait_type: "Generation", value: "AI" }],
      properties: {
        category: "image",
        files: [{ uri: imageUri, type: contentType }],
        creators: [{ address: body.creatorAddress, share: 100 }],
      },
    };

    const metadataUri = await withRetry(
      () => umi.uploader.uploadJson(metadata),
      "Metadata upload"
    );

    return NextResponse.json({ imageUri, metadataUri });
  } catch (err) {
    console.error("Upload failed:", err);
    // Reset cached umi so next request re-initialises
    cachedUmi = null;
    return NextResponse.json(
      {
        error: `Upload failed: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 500 }
    );
  }
}
