import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";

/**
 * Verify that a creation payment transaction is valid.
 * Checks that the tx transferred at least minAmountSol to the platform wallet.
 *
 * On devnet with MIRROR_CREATION_FEE_SOL=0, this is skipped.
 */
export async function verifyCreationPayment(
  txSignature: string,
  expectedPayer: string,
  minAmountSol: number
): Promise<{ valid: boolean; error?: string }> {
  // Skip verification if fee is 0 (devnet)
  if (minAmountSol <= 0) {
    return { valid: true };
  }

  const rpcUrl =
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
  const connection = new Connection(rpcUrl, "confirmed");

  try {
    const tx = await connection.getTransaction(txSignature, {
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) {
      return { valid: false, error: "Transaction not found" };
    }

    if (tx.meta?.err) {
      return { valid: false, error: "Transaction failed on-chain" };
    }

    // Check that the expected payer signed the transaction
    const signers = tx.transaction.message.getAccountKeys();
    const payerKey = signers.get(0)?.toBase58();
    if (payerKey !== expectedPayer) {
      return {
        valid: false,
        error: "Transaction was not signed by the expected payer",
      };
    }

    // Check SOL transfer amount via balance changes
    const preBalances = tx.meta?.preBalances ?? [];
    const postBalances = tx.meta?.postBalances ?? [];

    if (preBalances.length > 0 && postBalances.length > 0) {
      const payerSpent =
        (preBalances[0] - postBalances[0]) / LAMPORTS_PER_SOL;
      // Account for tx fees (~0.000005 SOL)
      if (payerSpent < minAmountSol - 0.01) {
        return {
          valid: false,
          error: `Insufficient payment: ${payerSpent.toFixed(4)} SOL (need ${minAmountSol} SOL)`,
        };
      }
    }

    return { valid: true };
  } catch (err) {
    return {
      valid: false,
      error: `Verification failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
