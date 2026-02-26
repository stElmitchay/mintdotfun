import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplCore } from "@metaplex-foundation/mpl-core";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import {
  createSignerFromKeypair,
  signerIdentity,
} from "@metaplex-foundation/umi";
import type { Umi, Signer } from "@metaplex-foundation/umi";

const rpcUrl =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";

let cachedUmi: Umi | null = null;
let cachedSigner: Signer | null = null;

/**
 * Returns a server-side Umi instance configured with the mirror authority
 * keypair. Used in API routes for updating mirror metadata on-chain and
 * uploading frames to Arweave.
 */
export function getMirrorAuthorityUmi(): Umi {
  if (cachedUmi) return cachedUmi;

  if (!process.env.MIRROR_AUTHORITY_SECRET) {
    throw new Error(
      "MIRROR_AUTHORITY_SECRET env var is required. " +
        "Set it to a JSON byte array of a Solana keypair secret key."
    );
  }

  const umi = createUmi(rpcUrl).use(mplCore()).use(irysUploader());

  const secretKey = new Uint8Array(
    JSON.parse(process.env.MIRROR_AUTHORITY_SECRET)
  );
  const keypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
  const signer = createSignerFromKeypair(umi, keypair);
  umi.use(signerIdentity(signer));

  cachedSigner = signer;
  cachedUmi = umi;
  return umi;
}

/**
 * Returns the mirror authority signer (the keypair that updates mirror metadata).
 */
export function getMirrorAuthoritySigner(): Signer {
  if (!cachedSigner) getMirrorAuthorityUmi();
  return cachedSigner!;
}

/**
 * Returns the mirror authority public key as a string.
 */
export function getMirrorAuthorityPubkey(): string {
  const signer = getMirrorAuthoritySigner();
  return signer.publicKey.toString();
}

/**
 * Reset the cached Umi instance (e.g. after an error).
 */
export function resetMirrorAuthorityCache(): void {
  cachedUmi = null;
  cachedSigner = null;
}
