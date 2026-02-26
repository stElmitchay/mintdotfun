import { updateV1 } from "@metaplex-foundation/mpl-core";
import { publicKey as toPublicKey } from "@metaplex-foundation/umi";
import { getMirrorAuthorityUmi } from "./mirrorAuthority";

// ============================================================
// On-chain Metadata Updater — updateV1 via mirror authority
// ============================================================

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;

/**
 * Update a mirror NFT's metadata URI on-chain.
 *
 * Uses the mirror authority keypair (set as updateAuthority at mint time).
 * No user wallet involved — fully server-side.
 */
export async function updateMirrorOnChain(
  mintAddress: string,
  newMetadataUri: string
): Promise<string> {
  const umi = getMirrorAuthorityUmi();

  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const builder = updateV1(umi, {
        asset: toPublicKey(mintAddress),
        newUri: newMetadataUri,
      });

      // Use finalized blockhash (proven pattern from existing codebase)
      const blockhash = await umi.rpc.getLatestBlockhash({
        commitment: "finalized",
      });
      const builtTx = builder.setBlockhash(blockhash).build(umi);
      const signedTx = await umi.identity.signTransaction(builtTx);
      const sig = await umi.rpc.sendTransaction(signedTx);

      await umi.rpc.confirmTransaction(sig, {
        commitment: "confirmed",
        strategy: { type: "blockhash", ...blockhash },
      });

      return Buffer.from(sig).toString("base64");
    } catch (err) {
      lastError = err;
      console.error(
        `[mirror-update] On-chain update failed for ${mintAddress} (attempt ${attempt + 1}/${MAX_RETRIES}):`,
        err instanceof Error ? err.message : err
      );

      if (attempt < MAX_RETRIES - 1) {
        await new Promise((r) =>
          setTimeout(r, RETRY_DELAY_MS * (attempt + 1))
        );
      }
    }
  }

  throw new Error(
    `On-chain update failed for ${mintAddress} after ${MAX_RETRIES} attempts: ${lastError instanceof Error ? lastError.message : String(lastError)}`
  );
}
