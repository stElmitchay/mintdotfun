export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  selected: boolean;
}

export interface CollectionConfig {
  name: string;
  description: string;
  symbol: string;
  sellerFeeBasisPoints: number; // royalty in basis points (e.g., 500 = 5%)
}

export interface GenerationRequest {
  prompt: string;
  count: number;
  style?: string;
  referenceImageUrl?: string;
}

export interface MintRequest {
  collection: CollectionConfig;
  images: GeneratedImage[];
}

export interface MintedNFT {
  mint: string;
  name: string;
  imageUrl: string;
  explorerUrl: string;
}

export interface MintedCollection {
  id: string;
  config: CollectionConfig;
  collectionAddress: string;
  nfts: MintedNFT[];
  mintedAt: number;
  walletAddress: string;
}

export type GenerationStatus = "idle" | "generating" | "complete" | "error";
export type MintStatus = "idle" | "uploading" | "minting" | "complete" | "error";
