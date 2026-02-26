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
 * Returns a server-side Umi instance configured with the agent authority
 * keypair. Used for uploading agent data to Arweave and updating
 * on-chain agent attributes.
 */
export function getAgentAuthorityUmi(): Umi {
  if (cachedUmi) return cachedUmi;

  if (!process.env.AGENT_AUTHORITY_SECRET) {
    throw new Error(
      "AGENT_AUTHORITY_SECRET env var is required. " +
        "Set it to a JSON byte array of a Solana keypair secret key."
    );
  }

  const umi = createUmi(rpcUrl).use(mplCore()).use(irysUploader());

  const secretKey = new Uint8Array(
    JSON.parse(process.env.AGENT_AUTHORITY_SECRET)
  );
  const keypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
  const signer = createSignerFromKeypair(umi, keypair);
  umi.use(signerIdentity(signer));

  cachedSigner = signer;
  cachedUmi = umi;
  return umi;
}

export function getAgentAuthoritySigner(): Signer {
  if (!cachedSigner) getAgentAuthorityUmi();
  return cachedSigner!;
}

export function getAgentAuthorityPubkey(): string {
  const signer = getAgentAuthoritySigner();
  return signer.publicKey.toString();
}

export function resetAgentAuthorityCache(): void {
  cachedUmi = null;
  cachedSigner = null;
}
