// ============================================================
// Cultural Mirrors — Type Definitions
// ============================================================

// --- Data Feed Types ---

export interface CalendarEvent {
  name: string;
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
  description: string;
  visualImpact: string;
}

export interface DataFeedConfig {
  mirrorType: string;
  location: { lat: number; lon: number; city: string; country: string };
  weatherEnabled: boolean;
  newsKeywords: string[];
  newsRegion: string;
  onChainEnabled: boolean;
  calendarCountry: string;
  customEvents: CalendarEvent[];
  dataWeights: {
    weather: number;
    news: number;
    onChain: number;
    social: number;
    calendar: number;
  };
}

export interface MirrorStyle {
  basePrompt: string;
  negativePrompt: string;
  aspectRatio: "1:1";
  outputFormat: "webp";
  outputQuality: number;
  promptStrength: number;
}

export interface MirrorTypeConfig {
  id: string;
  name: string;
  tagline: string;
  description: string;
  dataFeedConfig: DataFeedConfig;
  style: MirrorStyle;
  updateCadenceHours: number;
  updateTimeUtc: string;
  architecturalAnchors: string[];
  culturalMotifs: string[];
  colorPaletteGuidelines: string;
  mintPriceSol: number;
  maxSupply: number | null;
}

// --- Data Snapshot Types ---

export interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  condition: string;
  description: string;
  windSpeed: number;
  visibility: number;
  sunrise: string;
  sunset: string;
}

export interface NewsData {
  headlines: { title: string; source: string; description: string }[];
  topKeyword: string;
}

export interface OnChainData {
  solPrice: number;
  sol24hChange: number;
  solMarketCap: number;
  solVolume: number;
  trendingCoins: string[];
}

export interface SocialData {
  trendingSearches: string[];
  interestScore: number;
}

export interface CalendarData {
  holidays: { name: string; type: string }[];
  customEvents: { name: string; description: string; visualImpact: string }[];
}

export interface DataSnapshot {
  weather: WeatherData | null;
  news: NewsData | null;
  onChain: OnChainData | null;
  social: SocialData | null;
  calendar: CalendarData | null;
  fetchedAt: string;
}

// --- AI Interpretation Types ---

export interface InterpretedScene {
  sceneDescription: string;
  imagePrompt: string;
  mood: string;
  dominantColors: string[];
  keyElements: string[];
  dataSignals: string[];
  continuityNotes: string;
  changeNotes: string;
}

// --- Frame & Mirror Types ---

export interface MirrorFrame {
  id: string;
  mirrorType: string;
  frameNumber: number;
  imageUri: string;
  metadataUri: string;
  sceneDescription: string;
  mood: string;
  dominantColors: string[];
  keyElements: string[];
  dataSignals: string[];
  dataSnapshot: DataSnapshot;
  generatedAt: string;
  previousFrameId: string | null;
}

export interface ActiveMirror {
  id: string;
  mintAddress: string;
  mirrorType: string;
  ownerWallet: string;
  currentFrameNumber: number;
  currentMetadataUri: string;
  isActive: boolean;
  mintedAt: string;
  lastUpdatedAt: string | null;
}

// --- Client-side UI Types ---

export interface MirrorTypeInfo {
  id: string;
  name: string;
  tagline: string;
  description: string;
  currentFrameImageUri: string | null;
  currentFrameNumber: number;
  holdersCount: number;
  mintPriceSol: number;
  maxSupply: number | null;
  updateCadenceHours: number;
  isActive: boolean;
  creatorWallet: string | null;
}

export type MirrorMintStatus =
  | "idle"
  | "preparing"
  | "minting"
  | "registering"
  | "complete"
  | "error";
