export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  selected: boolean;
}

export interface NFTConfig {
  name: string;
  description: string;
}

export interface GenerationRequest {
  prompt: string;
  count: number;
  style?: string;
  referenceImageUrl?: string;
}

export interface MintedNFT {
  mint: string;
  name: string;
  description: string;
  imageUrl: string;
  explorerUrl: string;
  mintedAt: number;
  walletAddress: string;
}

export type GenerationStatus = "idle" | "generating" | "complete" | "error";
export type MintStatus = "idle" | "uploading" | "minting" | "complete" | "error";
