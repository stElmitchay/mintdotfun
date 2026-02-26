import { z } from "zod";

// ============================================================
// Agent-as-NFT Type System
// ============================================================

// === Enums as const unions ===

export type AgentArchetype =
  | "visionary"
  | "chronicler"
  | "provocateur"
  | "harmonist"
  | "mystic"
  | "technologist"
  | "naturalist"
  | "urbanist";

export type CompositionStyle =
  | "centered"
  | "rule-of-thirds"
  | "asymmetric"
  | "panoramic"
  | "close-up"
  | "aerial"
  | "layered";

export type VoiceTone =
  | "poetic"
  | "analytical"
  | "playful"
  | "cryptic"
  | "warm"
  | "sharp"
  | "philosophical"
  | "street";

export type AutonomyMode =
  | "manual"
  | "suggest"
  | "auto_create"
  | "full_autonomous";

// === Nested Interfaces ===

export interface ColorPreference {
  primary: string[];
  accent: string[];
  avoids: string[];
  saturation: number; // 0-100
  temperature: number; // 0-100 (cool → warm)
}

export interface MoodSpectrum {
  primary: string;
  secondary: string;
  intensity: number; // 0-100
}

export interface AgentAesthetics {
  colorPalette: ColorPreference;
  composition: CompositionStyle;
  mood: MoodSpectrum;
  complexity: number; // 0-100
  abstraction: number; // 0-100
  darkness: number; // 0-100
}

export interface AgentInfluences {
  movements: string[];
  themes: string[];
  mediums: string[];
  culturalFocus: string[];
}

export interface AgentVoice {
  tone: VoiceTone;
  verbosity: number; // 0-100
  formality: number; // 0-100
  humor: number; // 0-100
  emotionality: number; // 0-100
  vocabulary: string[];
}

export interface AgentGoals {
  primary: string;
  secondary: string[];
  currentFocus: string;
}

export interface AgentEvolution {
  level: number;
  totalInteractions: number;
  totalCreations: number;
  totalSales: number;
  totalRevenue: number; // in SOL
  collaborations: number;
  holdDuration: number; // seconds (computed at read time)
  reputationScore: number; // 0-1000
}

// === Main Personality Interface ===

export interface AgentPersonality {
  name: string;
  archetype: AgentArchetype;
  bio: string;
  birthTimestamp: number;
  version: number;
  aesthetics: AgentAesthetics;
  influences: AgentInfluences;
  voice: AgentVoice;
  goals: AgentGoals;
  evolution: AgentEvolution;
}

// === Zod Schemas ===

export const AgentArchetypeSchema = z.enum([
  "visionary",
  "chronicler",
  "provocateur",
  "harmonist",
  "mystic",
  "technologist",
  "naturalist",
  "urbanist",
]);

export const CreateAgentRequestSchema = z.object({
  name: z.string().min(2).max(20).trim(),
  archetype: AgentArchetypeSchema,
  complexity: z.number().min(0).max(100).optional(),
  abstraction: z.number().min(0).max(100).optional(),
  darkness: z.number().min(0).max(100).optional(),
  temperature: z.number().min(0).max(100).optional(),
  ownerAddress: z.string().min(32).max(64),
});

export type CreateAgentRequest = z.infer<typeof CreateAgentRequestSchema>;

// === Mint Result ===

export interface AgentMintResult {
  mintAddress: string;
  name: string;
  archetype: AgentArchetype;
  avatarUrl: string;
  personalityUri: string;
  metadataUri: string;
  agentAuthorityPubkey: string;
}
