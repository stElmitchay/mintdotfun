import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplCore } from "@metaplex-foundation/mpl-core";
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
 * Returns a server-side Umi instance configured with the marketplace
 * authority keypair. Used in API routes for building/signing marketplace txs.
 */
export function getMarketplaceUmi(): Umi {
  if (cachedUmi) return cachedUmi;

  if (!process.env.MARKETPLACE_AUTHORITY_SECRET) {
    throw new Error(
      "MARKETPLACE_AUTHORITY_SECRET env var is required. " +
        "Set it to a JSON byte array of a Solana keypair secret key."
    );
  }

  const umi = createUmi(rpcUrl).use(mplCore());

  const secretKey = new Uint8Array(
    JSON.parse(process.env.MARKETPLACE_AUTHORITY_SECRET)
  );
  const keypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
  const signer = createSignerFromKeypair(umi, keypair);
  umi.use(signerIdentity(signer));

  cachedSigner = signer;
  cachedUmi = umi;
  return umi;
}

/**
 * Returns the marketplace authority signer (the delegate keypair).
 */
export function getMarketplaceSigner(): Signer {
  if (!cachedSigner) getMarketplaceUmi();
  return cachedSigner!;
}

/**
 * Returns the marketplace authority public key as a string.
 */
export function getMarketplaceAuthorityPubkey(): string {
  const signer = getMarketplaceSigner();
  return signer.publicKey.toString();
}
