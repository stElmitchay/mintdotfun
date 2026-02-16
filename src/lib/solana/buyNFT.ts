import type { Umi } from "@metaplex-foundation/umi";

export interface BuyNFTResult {
  txSignature: string;
}

/**
 * Purchases a listed NFT. The flow:
 * 1. Server builds and partially signs the tx (thaw + transfer delegate)
 * 2. Client deserializes, signs for SOL transfer (1 wallet popup)
 * 3. Client sends and confirms
 * 4. Client calls confirm-purchase to update listing in DB
 */
export async function buyNFT(
  umi: Umi,
  listingId: string
): Promise<BuyNFTResult> {
  const buyerWallet = umi.identity.publicKey.toString();

  // 1. Get partially-signed tx from server
  const res = await fetch("/api/marketplace/buy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ listingId, buyerWallet }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to build buy transaction");
  }

  const { transaction: txBase64, blockhash } = await res.json();

  // 2. Deserialize the partially-signed transaction
  const txBytes = Uint8Array.from(atob(txBase64), (c) => c.charCodeAt(0));
  const partialTx = umi.transactions.deserialize(txBytes);

  // 3. Sign with buyer's wallet (fills the SOL transfer signature slot)
  let signedTx;
  try {
    signedTx = await umi.identity.signTransaction(partialTx);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("User rejected") || message.includes("denied")) {
      throw new Error("Transaction was rejected. Please approve in your wallet.");
    }
    throw new Error(`Transaction signing failed: ${message}`);
  }

  // 4. Send and confirm
  let sig;
  try {
    sig = await umi.rpc.sendTransaction(signedTx);
    await umi.rpc.confirmTransaction(sig, {
      commitment: "confirmed",
      strategy: { type: "blockhash", ...blockhash },
    });
  } catch (err) {
    throw new Error(
      `Purchase transaction failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  const txSignature = Buffer.from(sig).toString("base64");

  // 5. Confirm purchase in database
  const confirmRes = await fetch("/api/marketplace/confirm-purchase", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      listingId,
      buyerWallet,
      txSignature,
    }),
  });

  if (!confirmRes.ok) {
    // The on-chain tx succeeded, so log a warning but don't fail the user
    console.warn("Failed to confirm purchase in database, but on-chain tx succeeded");
  }

  return { txSignature };
}
