import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function getExplorerUrl(
  address: string,
  type: "address" | "tx" = "address"
): string {
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";
  const cluster = network === "mainnet-beta" ? "" : `?cluster=${network}`;
  return `https://explorer.solana.com/${type}/${address}${cluster}`;
}

/**
 * Returns a URL to view an mpl-core asset on the Metaplex Core inspector.
 * Unlike Solana Explorer, this renders the NFT name, image, and metadata.
 */
export function getCoreAssetUrl(address: string): string {
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";
  return `https://core.metaplex.com/explorer/${address}?env=${network}`;
}
