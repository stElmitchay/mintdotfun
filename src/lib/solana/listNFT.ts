import type { Umi } from "@metaplex-foundation/umi";
import {
  publicKey as toPublicKey,
  signAllTransactions,
} from "@metaplex-foundation/umi";
import {
  addPlugin,
  type AddPluginArgsPlugin,
} from "@metaplex-foundation/mpl-core";

export interface ListNFTResult {
  txSignature: string;
}

/**
 * Lists an NFT on the marketplace by adding FreezeDelegate (frozen) and
 * TransferDelegate plugins, delegating authority to the marketplace keypair.
 *
 * Requires exactly 1 wallet approval from the seller.
 */
export async function listNFT(
  umi: Umi,
  mintAddress: string,
  priceLamports: number,
  nftName: string,
  nftImageUrl: string,
  nftDescription: string
): Promise<ListNFTResult> {
  // 1. Fetch marketplace authority public key
  const authorityRes = await fetch("/api/marketplace/authority");
  if (!authorityRes.ok) {
    const data = await authorityRes.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch marketplace authority");
  }
  const { authority } = await authorityRes.json();
  const marketplaceAuthority = toPublicKey(authority);
  const assetPubkey = toPublicKey(mintAddress);

  // 2. Build transaction with FreezeDelegate + TransferDelegate plugins
  const freezePlugin: AddPluginArgsPlugin = {
    type: "FreezeDelegate",
    frozen: true,
    authority: {
      type: "Address",
      address: marketplaceAuthority,
    },
  };

  const transferPlugin: AddPluginArgsPlugin = {
    type: "TransferDelegate",
    authority: {
      type: "Address",
      address: marketplaceAuthority,
    },
  };

  const builder = addPlugin(umi, {
    asset: assetPubkey,
    plugin: freezePlugin,
  }).add(
    addPlugin(umi, {
      asset: assetPubkey,
      plugin: transferPlugin,
    })
  );

  // 3. Use finalized blockhash (same pattern as mintNFT.ts)
  const blockhash = await umi.rpc.getLatestBlockhash({
    commitment: "finalized",
  });
  const builtTx = builder.setBlockhash(blockhash).build(umi);

  // 4. Sign — seller is the only signer (1 popup)
  let signedTxs;
  try {
    signedTxs = await signAllTransactions([
      {
        transaction: builtTx,
        signers: builder.getSigners(umi),
      },
    ]);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("User rejected") || message.includes("denied")) {
      throw new Error("Transaction was rejected. Please approve in your wallet.");
    }
    throw new Error(`Transaction signing failed: ${message}`);
  }
  const signedTx = signedTxs[0];

  // 5. Send and confirm
  let sig;
  try {
    sig = await umi.rpc.sendTransaction(signedTx);
    await umi.rpc.confirmTransaction(sig, {
      commitment: "confirmed",
      strategy: { type: "blockhash", ...blockhash },
    });
  } catch (err) {
    throw new Error(
      `Listing transaction failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  const txSignature = Buffer.from(sig).toString("base64");
  const sellerWallet = umi.identity.publicKey.toString();

  // 6. Register listing in the database via API
  const listRes = await fetch("/api/marketplace/list", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mintAddress,
      sellerWallet,
      priceLamports,
      txSignature,
      nftName,
      nftImageUrl,
      nftDescription,
    }),
  });

  if (!listRes.ok) {
    const data = await listRes.json().catch(() => ({}));
    throw new Error(data.error || "Failed to register listing");
  }

  return { txSignature };
}
