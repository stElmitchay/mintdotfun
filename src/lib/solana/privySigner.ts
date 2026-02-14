import {
  type Signer,
  type Transaction,
  type TransactionFactoryInterface,
  publicKey as toPublicKey,
} from "@metaplex-foundation/umi";

/**
 * Minimal interface matching Privy's ConnectedStandardSolanaWallet.
 * The wallet-standard signTransaction operates on raw serialized bytes.
 */
export interface PrivySolanaWallet {
  address: string;
  signTransaction(
    ...inputs: { transaction: Uint8Array; chain?: string }[]
  ): Promise<
    { signedTransaction: Uint8Array } | { signedTransaction: Uint8Array }[]
  >;
  signMessage(
    ...inputs: { message: Uint8Array }[]
  ): Promise<
    | { signedMessage: Uint8Array; signature: Uint8Array }
    | { signedMessage: Uint8Array; signature: Uint8Array }[]
  >;
}

/**
 * Type guard: checks if a wallet object implements the PrivySolanaWallet shape.
 * This avoids unsafe `as unknown as` casts at call sites.
 */
export function isPrivySolanaWallet(
  wallet: unknown
): wallet is PrivySolanaWallet {
  if (typeof wallet !== "object" || wallet === null) return false;
  const w = wallet as Record<string, unknown>;
  return (
    typeof w.address === "string" &&
    typeof w.signTransaction === "function" &&
    typeof w.signMessage === "function"
  );
}

/**
 * Creates a Umi Signer from a Privy Solana wallet.
 *
 * Bridges between Umi's transaction format and the wallet-standard
 * byte-based signTransaction interface that Privy exposes.
 *
 * @param chain - The CAIP-2 chain ID (e.g. "solana:devnet") to pass
 *   with every signTransaction call so the wallet routes to the correct RPC.
 */
export function createSignerFromPrivyWallet(
  transactionFactory: TransactionFactoryInterface,
  wallet: PrivySolanaWallet,
  chain?: string
): Signer {
  const pubkey = toPublicKey(wallet.address);

  const signTransaction = async (
    transaction: Transaction
  ): Promise<Transaction> => {
    const serialized = transactionFactory.serialize(transaction);
    const result = await wallet.signTransaction({
      transaction: new Uint8Array(serialized),
      chain,
    });

    const signed = Array.isArray(result)
      ? result[0]?.signedTransaction
      : result?.signedTransaction;

    if (!signed) {
      throw new Error("Wallet returned empty signed transaction");
    }

    return transactionFactory.deserialize(new Uint8Array(signed));
  };

  const signAllTransactions = async (
    transactions: Transaction[]
  ): Promise<Transaction[]> => {
    const inputs = transactions.map((tx) => ({
      transaction: new Uint8Array(transactionFactory.serialize(tx)),
      chain,
    }));
    const result = await wallet.signTransaction(...inputs);
    const results = Array.isArray(result) ? result : [result];

    return results.map((r, i) => {
      if (!r?.signedTransaction) {
        throw new Error(`Wallet returned empty signed transaction at index ${i}`);
      }
      return transactionFactory.deserialize(new Uint8Array(r.signedTransaction));
    });
  };

  const signMessage = async (message: Uint8Array): Promise<Uint8Array> => {
    const result = await wallet.signMessage({
      message: new Uint8Array(message),
    });
    const output = Array.isArray(result) ? result[0] : result;

    if (!output?.signature) {
      throw new Error("Wallet returned empty message signature");
    }

    return new Uint8Array(output.signature);
  };

  return {
    publicKey: pubkey,
    signTransaction,
    signAllTransactions,
    signMessage,
  };
}
