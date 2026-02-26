import { type Umi } from "@metaplex-foundation/umi";
import { transferSol } from "@metaplex-foundation/mpl-toolbox";
import {
  sol,
  publicKey as toPublicKey,
  base58,
} from "@metaplex-foundation/umi";

/**
 * Pay the mirror creation fee (SOL transfer to platform wallet).
 * Returns the transaction signature as a base58 string.
 */
export async function payMirrorCreationFee(
  umi: Umi,
  platformWallet: string,
  amountSol: number
): Promise<string> {
  if (amountSol <= 0) {
    // No fee required (devnet)
    return "devnet-no-fee";
  }

  const tx = transferSol(umi, {
    destination: toPublicKey(platformWallet),
    amount: sol(amountSol),
  });

  const { blockhash } = await umi.rpc.getLatestBlockhash({
    commitment: "finalized",
  });

  const built = await tx.setBlockhash(blockhash).buildAndSign(umi);
  const sig = await umi.rpc.sendTransaction(built);
  await umi.rpc.confirmTransaction(sig, {
    strategy: { type: "blockhash", ...(await umi.rpc.getLatestBlockhash()) },
  });

  return base58.deserialize(sig)[0];
}
