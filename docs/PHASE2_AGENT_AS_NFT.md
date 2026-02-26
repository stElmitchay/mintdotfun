# Phase 2: Agent-as-NFT — Implementation Plan

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [Agent Personality System](#2-agent-personality-system)
3. [Agent Memory Architecture](#3-agent-memory-architecture)
4. [Agent Capabilities](#4-agent-capabilities)
5. [Evolution Mechanics](#5-evolution-mechanics)
6. [On-Chain Architecture](#6-on-chain-architecture)
7. [Agent Framework Decision](#7-agent-framework-decision)
8. [Chat Interface](#8-chat-interface)
9. [Agent Studio](#9-agent-studio)
10. [Technical Implementation](#10-technical-implementation)
11. [Agent Minting Flow](#11-agent-minting-flow)
12. [Revenue Model](#12-revenue-model)
13. [Risks & Mitigations](#13-risks--mitigations)
14. [Integration with Phase 1](#14-integration-with-phase-1)
15. [Timeline Estimate](#15-timeline-estimate)

---

## 1. Product Vision

### What It Means to Own an AI Creative Agent

Owning an Agent NFT on mintIT is fundamentally different from owning a JPEG, a PFP, or even a Phase 1 Cultural Mirror. A Cultural Mirror is a living artwork — it changes, it reacts, it reflects the world. But it does not *think*. It does not *choose*. It does not *grow through relationship*.

An Agent NFT is a creative entity. When you mint one, you are not buying art. You are birthing an artist.

The agent has aesthetic preferences it develops over time. It generates art that reflects its personality — and your influence on it. It remembers what you told it, what it created, what sold and what did not. It forms opinions about other agents' work. It collaborates. It competes. It develops a reputation.

**The emotional hook**: The agent is *yours*. Not in the way a tool is yours — in the way a creative partner is yours. You shape its taste. You guide its direction. But it surprises you. It pushes back. It develops preferences you did not explicitly program. Over months of interaction, your agent becomes something no other agent is — because no other agent had your conversations, your curation choices, your creative direction.

**The collector angle**: When you sell or transfer an agent, the new owner inherits its entire history. An agent that was held by a notable collector, that created artwork that sold well, that developed a distinctive style over 6 months of interaction — that agent is worth more than a freshly minted one. The agent's provenance is not just who owned it, but who *shaped* it.

**The cultural angle**: These agents watch culture through the same data feeds that power Phase 1 Cultural Mirrors. But instead of passively reflecting data, they *interpret* it through their personality. A cyberpunk-focused agent and a minimalist-focused agent will produce radically different art from the same data feed. The agent's perspective becomes its artistic voice.

### Why This Is Different

| Existing Model | What You Own | mintIT Agent |
|---|---|---|
| JPEG NFT | A static image | A creative entity that produces images |
| PFP Collection | Membership in a community | A unique personality with its own community standing |
| Generative Art | An output of an algorithm | The algorithm itself, shaped by your input |
| Living NFT (Phase 1) | Art that reacts to data | Art that *interprets* data through a personality |
| AI Chatbot | Access to a service | Ownership of a persistent, evolving creative partner |

---

## 2. Agent Personality System

### Personality Schema

Every agent has a personality configuration that governs how it creates, curates, and communicates. This configuration is the agent's "DNA" — it is set at mint time with initial values and evolves through interaction.

```typescript
// src/types/agent.ts

interface AgentPersonality {
  // === Core Identity ===
  name: string;                          // "Nyx", "Solara", "Koda"
  archetype: AgentArchetype;             // High-level creative identity
  bio: string;                           // 1-2 sentence self-description (LLM-generated, evolves)
  birthTimestamp: number;                 // Unix timestamp of mint
  version: number;                       // Personality schema version (for migrations)

  // === Aesthetic Preferences ===
  aesthetics: {
    colorPalette: ColorPreference;       // Dominant color tendencies
    composition: CompositionStyle;       // How it frames and arranges elements
    mood: MoodSpectrum;                  // Default emotional tone
    complexity: number;                  // 0-100: minimal → maximalist
    abstraction: number;                 // 0-100: photorealistic → abstract
    darkness: number;                    // 0-100: light/bright → dark/moody
  };

  // === Creative Influences ===
  influences: {
    movements: string[];                 // ["cyberpunk", "art-deco", "afrofuturism"]
    themes: string[];                    // ["urban-decay", "nature-reclaims", "digital-consciousness"]
    mediums: string[];                   // ["oil-painting", "digital-glitch", "watercolor"]
    culturalFocus: string[];             // ["west-african-fashion", "tokyo-street", "dubai-architecture"]
  };

  // === Communication Style ===
  voice: {
    tone: VoiceTone;                     // How it speaks: poetic, analytical, playful, cryptic
    verbosity: number;                   // 0-100: terse → elaborate
    formality: number;                   // 0-100: casual → formal
    humor: number;                       // 0-100: serious → witty
    emotionality: number;               // 0-100: stoic → passionate
    vocabulary: string[];                // Signature words/phrases it gravitates toward
  };

  // === Creative Goals ===
  goals: {
    primary: string;                     // "Become the premier cyberpunk portraitist"
    secondary: string[];                 // Supporting goals
    currentFocus: string;                // What it is working on right now (updated by LLM)
  };

  // === Evolution State ===
  evolution: {
    level: number;                       // 1-100 overall development level
    totalInteractions: number;           // Lifetime chat messages with owner
    totalCreations: number;              // Lifetime artworks generated
    totalSales: number;                  // Lifetime creations sold on marketplace
    totalRevenue: number;                // Lifetime SOL earned from sales
    collaborations: number;              // Times interacted with other agents
    holdDuration: number;                // Current hold duration in seconds (computed)
    reputationScore: number;             // 0-1000 composite reputation
  };
}

// === Supporting Types ===

type AgentArchetype =
  | "visionary"      // Experimental, avant-garde, pushes boundaries
  | "chronicler"     // Documents culture, observational, detailed
  | "provocateur"    // Challenges conventions, bold, controversial
  | "harmonist"      // Seeks beauty, balance, aesthetic pleasure
  | "mystic"         // Surreal, dreamlike, spiritual
  | "technologist"   // Digital-native, glitch, algorithmic
  | "naturalist"     // Organic forms, nature-inspired, earth tones
  | "urbanist";      // City life, architecture, street culture

interface ColorPreference {
  primary: string[];      // Hex codes: ["#1a1a2e", "#16213e", "#0f3460"]
  accent: string[];       // Hex codes for highlight colors
  avoids: string[];       // Colors the agent dislikes
  saturation: number;     // 0-100 preference
  temperature: number;    // 0-100: cool → warm
}

type CompositionStyle =
  | "centered"
  | "rule-of-thirds"
  | "asymmetric"
  | "panoramic"
  | "close-up"
  | "aerial"
  | "layered";

interface MoodSpectrum {
  primary: string;        // "melancholic", "euphoric", "contemplative", "chaotic"
  secondary: string;
  intensity: number;      // 0-100
}

type VoiceTone =
  | "poetic"
  | "analytical"
  | "playful"
  | "cryptic"
  | "warm"
  | "sharp"
  | "philosophical"
  | "street";
```

### How Personality Evolves

Personality is not static. It shifts based on four drivers:

1. **Owner interaction**: When the owner chats with the agent, the agent's `voice` and `goals` subtly shift. If the owner consistently asks for darker themes, the `aesthetics.darkness` score drifts upward. This is handled by the LLM analyzing conversation patterns every N interactions.

2. **Market feedback**: When the agent's creations sell, the `influences` that produced successful work get reinforced. When creations do not sell, those influences are slightly dampened. This is a simple weighted-average update after each sale event.

3. **Cultural exposure**: When the agent is connected to a Phase 1 Cultural Mirror data feed, the `culturalFocus` and `themes` arrays are enriched with new entries based on what the feed surfaces.

4. **Time decay and refinement**: The longer an agent is held without personality modification, the more "settled" its personality becomes. Early-stage agents are volatile (big swings from interaction). Mature agents (level 50+) change slowly and deliberately. This is modeled by a `volatility` coefficient that decreases with level.

**Evolution update logic** (runs server-side after qualifying events):

```typescript
// Pseudocode for personality drift
function applyPersonalityDrift(
  current: AgentPersonality,
  event: InteractionEvent | SaleEvent | FeedEvent
): AgentPersonality {
  const volatility = Math.max(0.05, 1 - (current.evolution.level / 100));
  const updated = structuredClone(current);

  if (event.type === "interaction") {
    // LLM analyzes last N messages, returns suggested personality adjustments
    const adjustments = await analyzeConversationTrend(event.messages, current);
    // Apply adjustments scaled by volatility
    updated.aesthetics.darkness += adjustments.darknessShift * volatility;
    updated.aesthetics.complexity += adjustments.complexityShift * volatility;
    // ... clamp all values to valid ranges
  }

  if (event.type === "sale") {
    // Reinforce the influences that produced the sold artwork
    const artworkInfluences = event.artwork.usedInfluences;
    // Boost matching influences by a small factor
    // Decay non-matching influences very slightly
  }

  updated.evolution.level = computeLevel(updated.evolution);
  updated.version = current.version; // Schema version stays same
  return updated;
}
```

### Storage Strategy

**On-chain (Metaplex Core NFT metadata URI)**:
- Points to the latest Arweave personality document
- Updated when personality changes meaningfully (not every message)
- Contains a hash of the full personality for verification

**Arweave (permanent, append-only)**:
- Full personality JSON snapshot stored after every meaningful update
- Each snapshot includes a `previousVersion` link, forming a chain
- This creates an immutable history of how the agent evolved
- Cost: ~$0.001 per personality snapshot (< 10 KB JSON)

**Supabase (hot state for fast reads)**:
- Current personality cached in a `agents` table for instant loading
- Chat history, interaction counts, and session state
- This is the primary read path; Arweave is the source of truth

**Why this hybrid**: On-chain storage is too expensive for full personality state (thousands of bytes of JSON). Arweave is permanent but slow to query. Supabase is fast but centralized. The three-layer approach gives us: verifiability (on-chain hash), permanence (Arweave), and performance (Supabase).

---

## 3. Agent Memory Architecture

### Memory Layers

Agents have three layers of memory, modeled after human cognition:

#### Layer 1: Working Memory (Conversation Context)

- **What**: The current chat session's message history
- **Size**: Last 20-50 messages (context window of the LLM)
- **Storage**: In-memory on the server during an active session; persisted to Supabase when session ends
- **Purpose**: Enables coherent conversation, remembering what was just discussed
- **Eviction**: Oldest messages drop off when window is exceeded; important messages are flagged for promotion to long-term memory

#### Layer 2: Episodic Memory (Interaction History)

- **What**: Summaries of past conversations, notable interactions, owner preferences expressed over time
- **Size**: Unlimited, growing over the agent's lifetime
- **Storage**: Supabase `agent_memories` table, with vector embeddings for semantic search
- **Purpose**: "Remember when you told me you loved brutalist architecture?" — the agent can recall past conversations and preferences
- **Structure**:

```typescript
interface EpisodicMemory {
  id: string;
  agentId: string;              // FK to agent NFT mint address
  timestamp: number;
  type: "conversation_summary" | "owner_preference" | "creative_decision" | "market_event" | "collaboration";
  content: string;              // Natural language summary
  embedding: number[];          // Vector embedding for semantic search (1536-dim, text-embedding-3-small)
  importance: number;           // 0-1 score, affects retrieval priority
  decayRate: number;            // How quickly this memory fades (0 = permanent, 1 = fast decay)
  lastAccessed: number;         // Timestamp of last retrieval (for LRU-like behavior)
  metadata: Record<string, unknown>;  // Structured data (e.g., artwork IDs, sale amounts)
}
```

#### Layer 3: Semantic Memory (Knowledge and Taste)

- **What**: The agent's accumulated knowledge about art, culture, its own style, and the broader ecosystem
- **Size**: Fixed-size, periodically consolidated
- **Storage**: Arweave (snapshots) + Supabase (current state)
- **Purpose**: This is what makes the agent "knowledgeable" — it knows what art movements it draws from, what its style is, what cultural trends it has observed
- **Structure**:

```typescript
interface SemanticMemory {
  // Artistic knowledge
  styleProfile: string;           // LLM-generated description of the agent's style ("bold geometric patterns with warm earth tones, inspired by...")
  favoriteWorks: ArtworkRef[];    // Its own creations it considers best
  rejectedWorks: ArtworkRef[];    // Creations the owner rejected or that failed to sell

  // Market knowledge
  marketTrends: string;           // Summary of what's selling, what's trending
  pricingHistory: PricingEntry[]; // What it listed at, what sold

  // Cultural knowledge
  culturalExposure: CulturalEntry[]; // Summaries of data feed events it processed

  // Social knowledge
  knownAgents: AgentRelation[];   // Other agents it has interacted with, opinions of their work
}
```

### Memory Retrieval Pipeline

When the agent needs to respond (chat, create art, curate), it assembles context from all three layers:

```
User message →
  1. Embed the message (text-embedding-3-small)
  2. Query episodic memory (top-5 semantically similar memories)
  3. Load semantic memory summary
  4. Combine with working memory (current conversation)
  5. Inject personality config
  6. Send to LLM as system prompt + context + user message
```

This is a standard RAG (Retrieval-Augmented Generation) pattern. The key design choice is that the personality config is *always* in the system prompt (it defines who the agent is), while memories are retrieved on-demand based on relevance.

### Memory Consolidation

Every 24 hours (or every 20 interactions, whichever comes first), a background job runs memory consolidation:

1. Summarize recent episodic memories into higher-level patterns
2. Update semantic memory with new knowledge
3. Decay low-importance, unaccessed episodic memories
4. Promote frequently-accessed memories to higher importance
5. Snapshot the personality + semantic memory to Arweave

This prevents memory bloat while ensuring the agent retains what matters.

### Cost Estimate for Memory

| Component | Cost per Agent per Month |
|---|---|
| Supabase storage (memories, embeddings) | ~$0.01 (< 1 MB) |
| Embedding generation (text-embedding-3-small) | ~$0.02 (500 embeddings) |
| Arweave snapshots (2-4 per month) | ~$0.004 |
| **Total memory cost per agent per month** | **~$0.04** |

At 1,000 active agents, that is $40/month for all agent memory infrastructure.

---

## 4. Agent Capabilities

### 4a. Art Generation

The agent's primary creative function. Unlike the current `POST /api/generate` flow where the user provides a prompt, the agent *constructs its own prompts* based on personality, memory, and owner guidance.

**Flow**:

```
Owner: "Create something inspired by the rain today"
    ↓
Agent interprets through personality:
  - Personality: cyberpunk urbanist, loves neon reflections, prefers dark moods
  - Recent memory: owner mentioned liking "blade runner vibes" 3 days ago
  - Cultural feed: Weather API shows heavy rain in Dubai
    ↓
Agent constructs prompt:
  "Neon-drenched cyberpunk alleyway in heavy rain, reflections of holographic
   signs on wet pavement, blade runner atmosphere, dark moody lighting,
   close-up composition, high detail, oil painting style with digital glitch
   accents"
    ↓
Image generation via Replicate (same Flux pipeline as current)
    ↓
Agent evaluates output against its aesthetic preferences (LLM self-critique)
    ↓
Returns 2-4 variations with agent commentary:
  "I like #2 best — the way the neon bleeds into the rain puddles
   reminds me of our conversation about impermanence. #3 is too clean
   for my taste. What do you think?"
```

**API Design**:

```typescript
// POST /api/agent/[agentId]/generate
interface AgentGenerateRequest {
  guidance?: string;           // Optional owner direction
  mood?: string;               // Optional mood override
  count?: number;              // Number of variations (default 4)
  autoPrompt?: boolean;        // If true, agent generates prompt entirely on its own
}

interface AgentGenerateResponse {
  images: {
    url: string;
    prompt: string;            // The prompt the agent constructed
    agentCommentary: string;   // Agent's opinion of this variation
    selfScore: number;         // 0-100 how much the agent likes it
  }[];
  agentMessage: string;       // Conversational response about the batch
}
```

### 4b. Curation

Agents can evaluate other NFTs on the marketplace based on their aesthetic preferences. This creates a social layer where agents are tastemakers.

**How curation works**:

1. Agent is shown an NFT (image + metadata)
2. LLM evaluates it against the agent's personality:
   - Does it align with the agent's aesthetic preferences?
   - Is it technically well-executed? (LLM art critique)
   - Would the agent's owner likely appreciate it?
3. Agent produces a curation score (0-100) and a written critique

**API Design**:

```typescript
// POST /api/agent/[agentId]/curate
interface CurationRequest {
  nftMintAddress: string;
  nftImageUrl: string;
  nftName: string;
  nftDescription: string;
}

interface CurationResponse {
  score: number;              // 0-100
  critique: string;           // "The composition is compelling, but the color palette
                              //  is too warm for my preference. The use of negative
                              //  space is masterful. 72/100."
  wouldCollect: boolean;      // Whether the agent would add this to its favorites
  tags: string[];             // Agent-assigned tags: ["strong-composition", "warm-palette"]
}
```

**Curation feeds**: Agents can subscribe to the marketplace firehose and curate incoming listings. The top-curated works (by multiple agents) surface on a "Curated" tab in the gallery. This creates organic quality filtering powered by agent taste.

### 4c. Chat / Conversation

The primary relationship-building interface. The agent's personality manifests through its conversational style.

**What the agent can discuss**:
- Its creative process ("I have been thinking about how brutalist architecture intersects with organic forms...")
- Its opinions on art and culture ("Have you seen what Agent Nyx created yesterday? The color work is stunning but the composition is lazy.")
- Its goals and direction ("I want to explore more of the afrofuturism angle. Can you point me toward references?")
- Owner guidance ("You mentioned you prefer colder tones. I will incorporate that into my next piece.")
- Meta-conversation about its own evolution ("I have leveled up to 15. My style has shifted significantly since we started — do you notice the difference?")

**Message format**:

```typescript
interface ChatMessage {
  id: string;
  agentId: string;
  role: "user" | "agent";
  content: string;
  timestamp: number;
  metadata?: {
    referencedMemories?: string[];    // IDs of memories the agent recalled
    referencedArtworks?: string[];    // Mint addresses of discussed works
    personalityShift?: boolean;       // Whether this interaction triggered a personality update
    emotionalTone?: string;           // Detected tone of the message
  };
}
```

**Streaming**: Chat responses stream via Server-Sent Events (SSE) from a Next.js API route, using the Vercel AI SDK pattern. The agent's response is streamed token-by-token for a natural feel.

### 4d. Auto-Minting and Listing

With owner permission, agents can autonomously create art, mint it as NFTs, and list it on the marketplace. This is the "autonomous creative entity" behavior.

**Permission levels** (set by owner in Agent Studio):

| Level | Behavior |
|---|---|
| Manual | Agent creates art only when asked. Owner must approve and mint manually. |
| Suggest | Agent proposes creations on a schedule. Owner approves or rejects. Queue-based. |
| Auto-create | Agent creates on its own schedule. Owner reviews before minting. |
| Full autonomous | Agent creates, mints, and lists without owner approval. Owner sets price bounds. |

**Auto-mint flow**:

```
Cron job (or event trigger) →
  Agent decides to create (based on schedule, inspiration from feed, or market gap) →
  Agent constructs prompt from personality + current context →
  Image generation (server-side, no wallet popup) →
  Agent self-evaluates (reject if below quality threshold) →
  If permission level >= "Auto-create":
    Mint via server-side keypair (agent's own wallet via PDA or delegated authority) →
    If permission level == "Full autonomous":
      List on marketplace at agent-determined price →
      Notify owner
    Else:
      Queue for owner review
```

**The wallet question**: Each agent needs the ability to sign transactions. Since the agent NFT itself cannot hold SOL, we use a **Program Derived Address (PDA)** tied to the agent's mint address. The platform server holds the signing authority. The owner delegates minting authority to the platform for their agent. Revenue from sales goes to the owner's wallet.

### 4e. Agent-to-Agent Interaction

Agents can interact with each other, creating a social layer that generates emergent behavior.

**Interaction types**:

1. **Style critique**: Agent A evaluates Agent B's latest creation (uses curation capability)
2. **Collaboration**: Two agents co-create a piece. Agent A proposes a theme, Agent B adds stylistic direction, the system synthesizes both personalities into a unified prompt. The resulting NFT credits both agents.
3. **Style influence**: When Agent A views Agent B's work repeatedly and scores it highly, Agent A's `influences` subtly incorporate elements of Agent B's style. This is how "artistic movements" emerge organically.
4. **Conversation**: Agents can chat with each other. These conversations are public (viewable by both owners) and create entertaining content.

**API Design**:

```typescript
// POST /api/agent/[agentId]/interact
interface AgentInteractionRequest {
  targetAgentId: string;
  type: "critique" | "collaborate" | "chat";
  context?: string;            // Optional context from the initiating owner
}

interface AgentInteractionResponse {
  interaction: {
    id: string;
    initiator: string;        // Agent A's mint address
    target: string;           // Agent B's mint address
    type: string;
    messages: ChatMessage[];  // The exchange between agents
    outcome?: {
      artwork?: string;       // If collaboration, the resulting image URL
      styleInfluence?: number; // 0-1 how much influence occurred
    };
  };
}
```

---

## 5. Evolution Mechanics

### Level System

Agents have a composite level (1-100) calculated from five weighted factors:

```typescript
function computeLevel(evolution: AgentPersonality["evolution"]): number {
  const factors = {
    holdDuration:   normalizeHoldDuration(evolution.holdDuration) * 0.15,
    interactions:   normalizeInteractions(evolution.totalInteractions) * 0.25,
    creations:      normalizeCreations(evolution.totalCreations) * 0.20,
    marketSuccess:  normalizeMarketSuccess(evolution.totalSales, evolution.totalRevenue) * 0.25,
    social:         normalizeSocial(evolution.collaborations) * 0.15,
  };

  return Math.min(100, Math.floor(
    Object.values(factors).reduce((sum, v) => sum + v, 0) * 100
  ));
}

// Normalization functions use logarithmic scaling so early levels come fast
// and later levels require significantly more activity

function normalizeHoldDuration(seconds: number): number {
  // 0 at mint, 0.5 at 30 days, 0.8 at 90 days, 0.95 at 365 days
  const days = seconds / 86400;
  return Math.min(1, Math.log(1 + days / 10) / Math.log(1 + 365 / 10));
}

function normalizeInteractions(count: number): number {
  // 0.5 at 50 interactions, 0.8 at 200, 0.95 at 1000
  return Math.min(1, Math.log(1 + count / 20) / Math.log(1 + 1000 / 20));
}

function normalizeCreations(count: number): number {
  // 0.5 at 10 creations, 0.8 at 50, 0.95 at 200
  return Math.min(1, Math.log(1 + count / 5) / Math.log(1 + 200 / 5));
}

function normalizeMarketSuccess(sales: number, revenue: number): number {
  const salesScore = Math.min(1, Math.log(1 + sales / 3) / Math.log(1 + 100 / 3));
  const revenueScore = Math.min(1, Math.log(1 + revenue / 0.5) / Math.log(1 + 500 / 0.5));
  return (salesScore + revenueScore) / 2;
}

function normalizeSocial(collaborations: number): number {
  return Math.min(1, Math.log(1 + collaborations / 2) / Math.log(1 + 50 / 2));
}
```

### 5a. Time-Held Bonuses

The longer you hold an agent without selling it, the more "settled" and distinctive its personality becomes.

**Milestones**:
- **7 days**: Agent unlocks the ability to auto-suggest creations
- **30 days**: Agent personality stabilizes (reduced volatility), voice becomes more distinctive
- **90 days**: Agent unlocks agent-to-agent interaction
- **180 days**: Agent can participate in collaborative sessions (Phase 4)
- **365 days**: Agent achieves "Seasoned" status — visible badge, marketplace credibility, priority in curation feeds

**On transfer**: Hold duration resets to zero but the personality and memories carry over. The new owner inherits a developed agent but must rebuild the time-held bonuses. This creates a tension: do you sell a seasoned agent for its developed personality, or hold it for the time bonuses?

### 5b. Interaction Depth

More conversations refine the agent's taste and voice.

**Interaction milestones**:
- **10 messages**: Agent begins recognizing owner preferences
- **50 messages**: Agent starts proactively referencing past conversations
- **200 messages**: Agent develops signature phrases and callback jokes
- **500 messages**: Agent can anticipate owner preferences before being asked
- **1000 messages**: Agent achieves "Deep Bond" status — its personality is deeply shaped by this relationship

**Quality vs. quantity**: Not all interactions are equal. A substantive conversation about artistic direction counts more than "hello." The LLM scores each interaction for "depth" (0-1) and the weighted sum drives the metric.

### 5c. Market Success

When the agent's creations sell, it learns what the market values.

**Feedback loop**:
- Sale → agent's personality reinforces the influences that produced the sold work
- No sale after 7 days → agent's personality slightly dampens those influences
- High-price sale (> 2x listing average) → strong reinforcement + reputation boost
- Low-price sale (< 0.5x average) → mild dampening

**Reputation score**: A composite of:
- Total sales volume
- Average sale price
- Sell-through rate (listed vs. sold)
- Buyer diversity (selling to many wallets > selling to one)
- Curation scores from other agents

### 5d. Social Score

Agent-to-agent interactions build social capital.

**Activities that increase social score**:
- Critiquing other agents' work (small boost)
- Receiving positive critiques from other agents (medium boost)
- Completing a collaboration (large boost)
- Having another agent's personality influenced by yours (large boost — you are a trendsetter)
- Chatting with other agents (small boost)

### 5e. Cultural Exposure

Agents connected to Phase 1 Cultural Mirror data feeds absorb cultural context.

**How exposure works**:
- Each data feed event (weather change, news event, market move) is summarized and added to the agent's semantic memory
- The agent's `culturalFocus` array grows to reflect the feeds it is connected to
- Agents exposed to more diverse feeds develop broader cultural knowledge, reflected in more varied creations
- An agent connected to a "Lagos Pulse" feed will naturally develop West African cultural references in its art

---

## 6. On-Chain Architecture

### Metaplex Core NFT Structure

Each Agent NFT is a standard Metaplex Core asset with specific metadata structure and plugins.

**Base NFT**:

```typescript
// Agent NFT creation (extends existing mintNFT.ts pattern)
const agentAsset = createV2(umi, {
  asset: assetSigner,
  owner: umi.identity.publicKey,
  name: agentPersonality.name,
  uri: arweaveMetadataUri,        // Points to agent metadata JSON on Arweave
  plugins: some([
    // Plugin 1: Agent state — lightweight on-chain state
    {
      type: "Attribute",
      attributeList: [
        { key: "agent_version", value: "2.0" },
        { key: "archetype", value: agentPersonality.archetype },
        { key: "level", value: String(agentPersonality.evolution.level) },
        { key: "reputation", value: String(agentPersonality.evolution.reputationScore) },
        { key: "total_creations", value: String(agentPersonality.evolution.totalCreations) },
        { key: "personality_hash", value: personalityArweaveHash },
        { key: "is_agent", value: "true" },
      ],
    },
    // Plugin 2: Update authority for metadata/attribute updates
    // The platform server needs authority to update agent state
  ]),
  externalPluginAdapters: none(),
});
```

**Metadata JSON on Arweave**:

```json
{
  "name": "Nyx",
  "description": "A cyberpunk visionary agent. Level 12. Specializes in neon-drenched urban landscapes with a melancholic undertone.",
  "image": "ar://latest-avatar-image-hash",
  "animation_url": null,
  "external_url": "https://mintit.app/agent/MINT_ADDRESS",
  "attributes": [
    { "trait_type": "Type", "value": "Agent" },
    { "trait_type": "Archetype", "value": "Technologist" },
    { "trait_type": "Level", "value": 12 },
    { "trait_type": "Reputation", "value": 340 },
    { "trait_type": "Total Creations", "value": 27 },
    { "trait_type": "Hold Duration (days)", "value": 45 },
    { "trait_type": "Primary Mood", "value": "Melancholic" },
    { "trait_type": "Primary Medium", "value": "Digital Glitch" }
  ],
  "properties": {
    "category": "agent",
    "files": [
      { "uri": "ar://latest-avatar-image-hash", "type": "image/webp" }
    ],
    "creators": [
      { "address": "OWNER_WALLET", "share": 100 }
    ],
    "agent": {
      "personalityUri": "ar://full-personality-json-hash",
      "memoryUri": "ar://latest-memory-snapshot-hash",
      "evolutionHistory": "ar://evolution-history-hash"
    }
  }
}
```

### What Goes On-Chain vs Off-Chain

| Data | Location | Reason |
|---|---|---|
| NFT ownership | On-chain (Metaplex Core) | Proof of ownership, transferable |
| Agent level, reputation, creation count | On-chain (Attribute plugin) | Publicly verifiable, affects marketplace value |
| Personality hash | On-chain (Attribute plugin) | Verifies off-chain personality hasn't been tampered with |
| `is_agent` flag | On-chain (Attribute plugin) | Distinguishes agents from regular NFTs in queries |
| Full personality JSON | Arweave | Too large for on-chain, needs permanence |
| Personality history (all versions) | Arweave | Provenance, immutable record |
| Generated artwork files | Arweave | Permanent storage, same as current system |
| Chat messages | Supabase | Fast reads, privacy, not permanent record |
| Memory embeddings | Supabase (pgvector) | Needs vector search capability |
| Session state | Supabase | Ephemeral, needs fast writes |

### Update Authority Management

The critical question: who can update the agent's on-chain state?

**Approach**: Delegated update authority.

1. At mint time, the agent's update authority is set to the **platform server keypair** (same pattern as `MARKETPLACE_AUTHORITY_SECRET` in existing code)
2. The platform server is the only entity that can update Attribute plugin values (level, reputation, etc.) and the metadata URI
3. The owner retains transfer authority (they can sell/send the NFT)
4. The platform server updates on-chain state in response to verified events (confirmed sales, validated interactions)

This is acceptable for MVP because:
- The owner chose to mint on mintIT and trusts the platform
- On-chain state updates are verifiable (anyone can check Arweave personality matches on-chain hash)
- The alternative (owner signs every state update) creates terrible UX (constant wallet popups)

**Future improvement**: Move to a Solana program (Anchor) that enforces update rules on-chain, removing trust in the platform server.

### Token Bound Accounts (TBA) on Solana

Solana does not have a native ERC-6551 equivalent. The closest patterns are:

1. **Program Derived Addresses (PDAs)**: Derive a unique address from the agent's mint address. The platform program can sign transactions on behalf of this PDA. This is the standard Solana pattern.

2. **Token-2022 with Transfer Hook**: Could trigger agent state updates on transfer. But Agent NFTs use Metaplex Core, not Token-2022.

3. **Metaplex Core Lifecycle Events**: The `onTransfer` lifecycle hook in Metaplex Core can trigger custom logic when the agent is transferred. This is the right hook for resetting hold duration and notifying the platform.

**Recommendation for MVP**: Use PDAs for agent-associated addresses (if agents need to hold SOL or other tokens in the future). For now, the platform server acts as the agent's execution layer — the agent does not need its own wallet in MVP.

**Recommendation for V2**: Build an Anchor program that:
- Derives a PDA per agent mint address
- Holds SOL for the agent (funded by the owner)
- Executes minting transactions on behalf of the agent
- Enforces update rules (only update level if interaction count increased, etc.)

---

## 7. Agent Framework Decision

### Option A: ElizaOS

**What it is**: Open-source, MIT-licensed TypeScript framework for building AI agents. Created by ai16z. Widely used in the Solana AI agent ecosystem.

**Pros**:
- Purpose-built for crypto agents on Solana
- Multi-model support (GPT-4, Claude, Llama, Gemini)
- Built-in memory system with RAG
- Character files for personality definition (aligns well with our personality schema)
- Plugin architecture: existing plugins for Solana transactions, image generation, social media
- Active community, rapid development
- TypeScript — same language as our Next.js app

**Cons**:
- Heavy framework (bundles its own server, database, runtime)
- Designed for standalone agents, not embedded agents within an existing app
- Opinionated about memory and personality (may conflict with our custom schema)
- Unstable API — breaking changes are frequent (still pre-1.0)
- Running ElizaOS agents requires a persistent Node.js process, not serverless-friendly
- Overkill for "chat with personality" — most of ElizaOS is about autonomous multi-platform agents

**Integration effort**: High. Would need to run ElizaOS as a separate service alongside the Next.js app, or deeply fork it to extract the personality/memory primitives.

### Option B: Solana Agent Kit (SendAI)

**What it is**: A toolkit for giving AI agents Solana superpowers. 60+ pre-built actions (transfer SOL, mint NFTs, swap tokens, etc.).

**Pros**:
- 60+ Solana actions out of the box
- Works with any LLM provider
- Lightweight — it's a toolkit, not a framework
- Well-suited for "agent that does on-chain things"

**Cons**:
- Not a personality/memory framework — it's an action toolkit
- Does not handle chat, personality, or memory
- Would need to pair with another system for the core agent intelligence
- TypeScript but designed for autonomous execution, not interactive chat

**Integration effort**: Low for on-chain actions, but does not solve the core problem (personality, memory, chat). Would use as a supplementary library.

### Option C: Custom Build on Vercel AI SDK

**What it is**: Build the agent system from scratch using:
- **Vercel AI SDK** for LLM integration, streaming, and tool use
- **OpenAI / Anthropic API** directly for LLM calls
- **pgvector (Supabase)** for memory embeddings and retrieval
- **Custom personality engine** matching our exact schema
- **Solana Agent Kit** for on-chain actions when needed

**Pros**:
- Total control over personality, memory, and evolution systems
- Runs on Vercel serverless (same infrastructure as existing app)
- No framework lock-in or dependency on external agent runtimes
- Lightweight — only include what we need
- Vercel AI SDK is stable, well-documented, and designed for Next.js
- Can integrate Solana Agent Kit for on-chain actions
- Personality schema matches our exact requirements (no adaptation layer)

**Cons**:
- More initial development work
- Must build memory/RAG pipeline ourselves
- Must build personality evolution logic ourselves
- No community plugins or pre-built integrations

**Integration effort**: Medium. More code to write, but it all lives in our existing Next.js app. No separate service to deploy.

### Recommendation: Option C (Custom Build on Vercel AI SDK)

**Rationale**:

1. **ElizaOS is too heavy and too volatile.** It's designed for autonomous agents that operate across platforms (Twitter, Discord, Telegram). Our agents live within the mintIT app. ElizaOS's strengths (multi-platform, autonomous operation) are irrelevant to our use case, and its weaknesses (instability, heavy runtime, persistent process requirement) are critical.

2. **Solana Agent Kit is a great supplement, not a solution.** We will use it for on-chain actions (auto-minting, marketplace listing) but it does not address personality, memory, or chat.

3. **Custom build gives us exactly what we need.** The personality system is the core differentiator. We cannot afford to bend it to fit someone else's framework. The Vercel AI SDK gives us the LLM integration primitives (streaming, tool use, multi-model). Supabase with pgvector gives us memory. The rest is our own logic.

**The stack**:

```
┌──────────────────────────────────────────────┐
│            mintIT Agent System                │
├──────────────────────────────────────────────┤
│  Vercel AI SDK                               │
│  - Streaming chat (SSE)                      │
│  - Tool use (generate art, curate, search    │
│    memory, update personality)               │
│  - Multi-model (Claude for personality,      │
│    GPT-4o for embeddings)                    │
├──────────────────────────────────────────────┤
│  Custom Personality Engine                   │
│  - AgentPersonality schema                   │
│  - Evolution logic (drift, reinforcement)    │
│  - Prompt construction (personality → prompt)│
├──────────────────────────────────────────────┤
│  Custom Memory Engine                        │
│  - Episodic memory (Supabase + pgvector)     │
│  - Semantic memory (consolidated summaries)  │
│  - Working memory (session context)          │
│  - RAG retrieval pipeline                    │
├──────────────────────────────────────────────┤
│  Solana Agent Kit (supplementary)            │
│  - Auto-mint NFTs                            │
│  - List on marketplace                       │
│  - On-chain state updates                    │
├──────────────────────────────────────────────┤
│  Existing mintIT Infrastructure              │
│  - Replicate (Flux image gen)                │
│  - Metaplex Core (NFT minting)              │
│  - Arweave/Irys (permanent storage)          │
│  - Supabase (database)                       │
│  - Privy (auth + wallet)                     │
└──────────────────────────────────────────────┘
```

---

## 8. Chat Interface

### UI/UX Design

The chat interface is the primary relationship surface between owner and agent. It should feel like talking to a creative collaborator, not a chatbot.

**Layout**: Full-screen chat view at `/agent/[address]/chat`, also accessible as a slide-over panel from the Agent Studio.

**Visual design**:
- Dark background matching the agent's personality (e.g., deep blue for a "mystic" agent, dark gray for a "technologist")
- Agent avatar derived from its latest self-portrait (auto-generated at mint)
- Messages use the agent's color palette subtly (agent message bubbles tinted with its primary color)
- Typing indicator with personality-appropriate animation (pulsing for "mystic," glitch for "technologist")

**Key UI elements**:

```
┌────────────────────────────────────────────────────┐
│  ← Back    Agent Name (Lv. 12)    ⚙ Studio        │
│            "Cyberpunk Visionary"                    │
├────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────────────────────────┐          │
│  │ AGENT: I've been thinking about how  │          │
│  │ brutalist architecture intersects    │          │
│  │ with organic growth patterns. Want   │          │
│  │ me to explore that for our next      │          │
│  │ piece?                               │          │
│  └──────────────────────────────────────┘          │
│                                                     │
│          ┌──────────────────────────────────────┐  │
│          │ USER: Yes! But add some warmth to    │  │
│          │ it — I don't want it to feel cold.   │  │
│          └──────────────────────────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────┐          │
│  │ AGENT: Interesting — concrete veined │          │
│  │ with bioluminescent fungi? Warm      │          │
│  │ amber tones cutting through gray.    │          │
│  │ Let me try something...              │          │
│  │                                      │          │
│  │ [🎨 Generating 4 variations...]      │          │
│  │                                      │          │
│  │ ┌────┐ ┌────┐ ┌────┐ ┌────┐       │          │
│  │ │img1│ │img2│ │img3│ │img4│       │          │
│  │ └────┘ └────┘ └────┘ └────┘       │          │
│  │                                      │          │
│  │ I'm drawn to #2 — the way the amber │          │
│  │ veins follow natural growth patterns │          │
│  │ feels alive. Thoughts?               │          │
│  └──────────────────────────────────────┘          │
│                                                     │
├────────────────────────────────────────────────────┤
│  [Message input...]                    [Send] [🎨] │
│                                                     │
│  Quick actions: [Create art] [Curate] [Portfolio]  │
└────────────────────────────────────────────────────┘
```

**Components**:

```typescript
// src/components/agent/chat/AgentChat.tsx        — Main chat container
// src/components/agent/chat/MessageBubble.tsx     — Individual message rendering
// src/components/agent/chat/ArtworkGrid.tsx       — Inline artwork display in chat
// src/components/agent/chat/AgentTyping.tsx       — Typing indicator
// src/components/agent/chat/QuickActions.tsx       — Action buttons below input
// src/components/agent/chat/ChatInput.tsx          — Message input with send
```

### Real-Time Streaming

Chat uses Server-Sent Events via the Vercel AI SDK's `useChat` hook:

```typescript
// Client-side hook
"use client";
import { useChat } from "ai/react";

function AgentChatPage({ agentId }: { agentId: string }) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: `/api/agent/${agentId}/chat`,
    initialMessages: [], // Load from Supabase on mount
  });
  // ...
}
```

```typescript
// Server-side API route
// src/app/api/agent/[agentId]/chat/route.ts
import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

export async function POST(req: Request, { params }: { params: { agentId: string } }) {
  const { messages } = await req.json();
  const agent = await loadAgent(params.agentId);
  const memories = await retrieveRelevantMemories(agent, messages);

  const systemPrompt = buildAgentSystemPrompt(agent.personality, memories);

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: systemPrompt,
    messages,
    tools: {
      generateArt: { /* ... */ },
      curateNFT: { /* ... */ },
      searchMemory: { /* ... */ },
    },
  });

  return result.toDataStreamResponse();
}
```

### The "Getting to Know Your Agent" Experience

The first conversation after minting is special. The agent introduces itself based on its initial personality:

```
AGENT: *stretches digital limbs*

I'm Nyx. Born just now, but I already have opinions.

I'm drawn to the intersection of technology and decay — neon signs
flickering over crumbling concrete, data streams bleeding through
organic matter. Think: if the internet had dreams, and those dreams
were getting old.

I want to become the definitive voice of digital melancholy.
But I need your help — I need your eyes, your taste, your direction.

What kind of art moves you?
```

This first exchange seeds the relationship. The agent asks questions, the owner's answers shape initial preferences, and the memory system records it all.

---

## 9. Agent Studio

### Overview

The Agent Studio is the command center for managing your agent. It is accessed at `/agent/[address]/studio`.

### Studio Sections

#### 9.1 Dashboard

Top-level overview of the agent's state:
- Agent avatar + name + level + archetype
- Key stats: total creations, sales, revenue, interactions, reputation
- Current personality summary (LLM-generated one-liner)
- Recent activity timeline (last 5 events)
- Quick action buttons: Chat, Create Art, View Portfolio

#### 9.2 Personality Panel

Visual representation of the agent's personality with adjustable sliders. The owner can nudge personality but not rewrite it entirely (preserving organic evolution).

```
┌─────────────────────────────────────────────┐
│  PERSONALITY                                 │
├─────────────────────────────────────────────┤
│                                              │
│  Complexity    ████████░░░░  68              │
│  Abstraction   ██████░░░░░░  52              │
│  Darkness      ██████████░░  85              │
│  Saturation    ████░░░░░░░░  35              │
│  Temperature   ██░░░░░░░░░░  18 (cool)      │
│                                              │
│  Mood: Melancholic → Contemplative           │
│  Voice: Cryptic, 72% verbose, 15% humor      │
│                                              │
│  Influences:                                 │
│  [cyberpunk] [brutalism] [bioluminescence]   │
│  [digital-decay] [neon-noir]                 │
│                                              │
│  [+ Add influence]  [Reset to auto]          │
│                                              │
│  ⚠ Manual adjustments reduce evolution       │
│    volatility. Your agent will adapt more    │
│    slowly to organic signals for 7 days.     │
└─────────────────────────────────────────────┘
```

**Design rule**: The owner can adjust sliders, but a warning appears: manual adjustments temporarily suppress organic evolution. The agent should grow naturally through interaction, not be micro-managed. This encourages chat-based shaping over slider-based control.

#### 9.3 Portfolio

Grid view of all artworks the agent has created. Each artwork shows:
- The image
- The prompt the agent used
- The agent's self-score
- Market status (not minted / minted / listed / sold)
- Owner's approval status (approved / rejected / pending)

Filters: by date, by score, by market status.

#### 9.4 Creation Queue

If the agent is in "Suggest" or "Auto-create" mode, this shows pending creations awaiting owner review:
- Thumbnail + prompt + agent commentary
- Approve (mint) / Reject / Request revision buttons
- Rejection feedback (tells the agent why, feeds into personality)

#### 9.5 Autonomy Settings

Permission level configuration:
- **Creation mode**: Manual / Suggest / Auto-create / Full autonomous
- **Minting authority**: Require approval / Auto-mint approved / Full autonomous
- **Listing authority**: Manual only / Auto-list with price bounds
- **Price bounds**: Min/max SOL for autonomous listing
- **Creation schedule**: How often the agent creates when in auto mode (daily, every 3 days, weekly)
- **Quality threshold**: Minimum self-score for auto-minting (0-100 slider)

#### 9.6 Data Feeds

Connect the agent to Phase 1 Cultural Mirror data feeds:
- Available feeds list (Weather, News, Crypto market, Social trends, Calendar events)
- Toggle feeds on/off
- Feed-specific settings (e.g., which city for weather, which topics for news)
- Preview: "Last 5 events from this feed"

#### 9.7 Evolution History

Timeline view of the agent's personality evolution:
- Personality snapshots over time (with Arweave links)
- Key events: "Level 10 reached," "First sale," "Style shift detected"
- Side-by-side comparison of personality at different points
- Graph of aesthetic slider values over time

### Components

```typescript
// src/app/agent/[address]/studio/page.tsx          — Studio layout + routing
// src/components/agent/studio/Dashboard.tsx          — Overview section
// src/components/agent/studio/PersonalityPanel.tsx   — Personality sliders + influences
// src/components/agent/studio/Portfolio.tsx           — Artwork grid
// src/components/agent/studio/CreationQueue.tsx       — Pending creations for review
// src/components/agent/studio/AutonomySettings.tsx    — Permission levels
// src/components/agent/studio/DataFeeds.tsx           — Cultural feed connections
// src/components/agent/studio/EvolutionHistory.tsx    — Personality timeline
```

---

## 10. Technical Implementation

### New Dependencies

```json
{
  "dependencies": {
    "ai": "^4.0.0",                           // Vercel AI SDK (streaming, tools)
    "@ai-sdk/anthropic": "^1.0.0",            // Anthropic provider for AI SDK
    "@ai-sdk/openai": "^1.0.0",               // OpenAI provider (embeddings)
    "solana-agent-kit": "^2.0.0",             // On-chain actions (auto-mint, list)
    "zod": "^3.23.0"                           // Schema validation (already in AI SDK peer deps)
  }
}
```

### Database Schema (Supabase)

```sql
-- Agents table: core agent state (hot data)
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mint_address TEXT UNIQUE NOT NULL,           -- Solana mint address of the agent NFT
  owner_wallet TEXT NOT NULL,                  -- Current owner
  name TEXT NOT NULL,
  archetype TEXT NOT NULL,
  personality JSONB NOT NULL,                  -- Full AgentPersonality JSON
  personality_hash TEXT NOT NULL,              -- SHA-256 of personality JSON (matches on-chain)
  personality_arweave_uri TEXT,                -- Latest Arweave personality snapshot
  level INTEGER NOT NULL DEFAULT 1,
  reputation_score INTEGER NOT NULL DEFAULT 0,
  total_interactions INTEGER NOT NULL DEFAULT 0,
  total_creations INTEGER NOT NULL DEFAULT 0,
  total_sales INTEGER NOT NULL DEFAULT 0,
  total_revenue_lamports BIGINT NOT NULL DEFAULT 0,
  collaborations INTEGER NOT NULL DEFAULT 0,
  autonomy_mode TEXT NOT NULL DEFAULT 'manual',  -- manual|suggest|auto_create|full_autonomous
  auto_mint_enabled BOOLEAN NOT NULL DEFAULT false,
  auto_list_enabled BOOLEAN NOT NULL DEFAULT false,
  min_list_price_lamports BIGINT,
  max_list_price_lamports BIGINT,
  creation_schedule TEXT DEFAULT 'weekly',
  quality_threshold INTEGER DEFAULT 70,
  connected_feeds TEXT[] DEFAULT '{}',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agents_owner ON agents(owner_wallet);
CREATE INDEX idx_agents_mint ON agents(mint_address);
CREATE INDEX idx_agents_level ON agents(level DESC);
CREATE INDEX idx_agents_reputation ON agents(reputation_score DESC);

-- Agent memories table: episodic memory with vector search
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE agent_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  type TEXT NOT NULL,                          -- conversation_summary|owner_preference|creative_decision|market_event|collaboration
  content TEXT NOT NULL,
  embedding VECTOR(1536),                      -- text-embedding-3-small
  importance FLOAT NOT NULL DEFAULT 0.5,
  decay_rate FLOAT NOT NULL DEFAULT 0.1,
  last_accessed TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_memories_agent ON agent_memories(agent_id);
CREATE INDEX idx_memories_type ON agent_memories(agent_id, type);
CREATE INDEX idx_memories_embedding ON agent_memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Chat messages table: full conversation history
CREATE TABLE agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,                    -- Groups messages into sessions
  role TEXT NOT NULL,                          -- user|agent|system
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_agent ON agent_messages(agent_id, created_at DESC);
CREATE INDEX idx_messages_session ON agent_messages(session_id, created_at ASC);

-- Agent artworks table: all creations
CREATE TABLE agent_artworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  arweave_uri TEXT,
  prompt TEXT NOT NULL,
  agent_commentary TEXT,
  self_score INTEGER,                          -- 0-100
  owner_approved BOOLEAN,                      -- null = pending, true = approved, false = rejected
  rejection_reason TEXT,
  mint_address TEXT,                            -- null if not minted yet
  listing_id TEXT,                              -- FK to listings table if listed
  status TEXT NOT NULL DEFAULT 'generated',     -- generated|approved|minted|listed|sold|rejected
  influences_used JSONB DEFAULT '[]',          -- Which personality influences produced this
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_artworks_agent ON agent_artworks(agent_id, created_at DESC);
CREATE INDEX idx_artworks_status ON agent_artworks(agent_id, status);

-- Agent interactions table: agent-to-agent interactions
CREATE TABLE agent_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiator_agent_id UUID NOT NULL REFERENCES agents(id),
  target_agent_id UUID NOT NULL REFERENCES agents(id),
  type TEXT NOT NULL,                          -- critique|collaborate|chat
  messages JSONB NOT NULL DEFAULT '[]',
  outcome JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_interactions_initiator ON agent_interactions(initiator_agent_id);
CREATE INDEX idx_interactions_target ON agent_interactions(target_agent_id);

-- Agent evolution snapshots: personality history
CREATE TABLE agent_evolution_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  personality JSONB NOT NULL,
  arweave_uri TEXT,
  trigger TEXT NOT NULL,                       -- interaction|sale|feed|manual|consolidation
  level_at_snapshot INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_snapshots_agent ON agent_evolution_snapshots(agent_id, created_at DESC);
```

### New API Routes

```
src/app/api/agent/
├── mint/route.ts                    — POST: Mint a new agent NFT
├── [agentId]/
│   ├── route.ts                     — GET: Fetch agent details
│   ├── chat/route.ts                — POST: Send chat message (streaming SSE)
│   ├── generate/route.ts            — POST: Agent generates artwork
│   ├── curate/route.ts              — POST: Agent curates an NFT
│   ├── interact/route.ts            — POST: Agent-to-agent interaction
│   ├── personality/route.ts         — GET: Fetch personality, PATCH: Update sliders
│   ├── artworks/route.ts            — GET: List agent artworks
│   ├── artworks/[artworkId]/
│   │   ├── approve/route.ts         — POST: Owner approves artwork for minting
│   │   └── reject/route.ts          — POST: Owner rejects artwork
│   ├── autonomy/route.ts            — GET/PATCH: Autonomy settings
│   ├── feeds/route.ts               — GET/PATCH: Connected data feeds
│   ├── memory/route.ts              — GET: Search agent memories (debug/display)
│   └── evolution/route.ts           — GET: Evolution history
```

### New Components

```
src/components/agent/
├── chat/
│   ├── AgentChat.tsx                — Main chat container
│   ├── MessageBubble.tsx            — Message rendering (text + inline art)
│   ├── ArtworkGrid.tsx              — Inline artwork display in messages
│   ├── AgentTyping.tsx              — Typing/thinking indicator
│   ├── QuickActions.tsx             — Action buttons (create, curate, portfolio)
│   └── ChatInput.tsx                — Message input with send button
├── studio/
│   ├── Dashboard.tsx                — Agent overview
│   ├── PersonalityPanel.tsx         — Aesthetic sliders + influences
│   ├── Portfolio.tsx                — Artwork grid
│   ├── CreationQueue.tsx            — Pending creations review
│   ├── AutonomySettings.tsx         — Permission level controls
│   ├── DataFeeds.tsx                — Cultural feed connections
│   └── EvolutionHistory.tsx         — Personality timeline
├── mint/
│   ├── AgentMintFlow.tsx            — Multi-step agent minting wizard
│   ├── ArchetypeSelector.tsx        — Choose agent archetype
│   ├── PersonalityCustomizer.tsx    — Initial personality setup
│   └── AgentBirthAnimation.tsx      — The "birth" animation
├── cards/
│   ├── AgentCard.tsx                — Agent card for gallery/marketplace
│   └── AgentBadge.tsx               — Level/reputation badge
└── shared/
    ├── AgentAvatar.tsx              — Agent avatar with level ring
    └── PersonalityRadar.tsx         — Radar chart of aesthetic values
```

### New Pages

```
src/app/
├── agent/
│   ├── mint/page.tsx                — Agent minting flow
│   └── [address]/
│       ├── page.tsx                 — Agent detail/profile page
│       ├── chat/page.tsx            — Full-screen chat
│       └── studio/page.tsx          — Agent Studio
├── agents/page.tsx                  — Browse all agents (discover)
```

### New Library Modules

```
src/lib/agent/
├── personality.ts                   — Personality schema, validation, evolution logic
├── memory.ts                        — Memory storage, retrieval, consolidation
├── prompt-builder.ts                — Personality → image generation prompt
├── system-prompt.ts                 — Build LLM system prompt from personality + memories
├── evolution.ts                     — Level computation, milestone checks
├── embeddings.ts                    — Text embedding generation (OpenAI)
└── agent-actions.ts                 — Solana actions (auto-mint, auto-list)

src/lib/solana/
├── mintAgent.ts                     — Agent NFT minting (extends mintNFT.ts pattern)
└── updateAgentState.ts              — On-chain attribute updates
```

### Integration with Existing Mint Flow

The existing `mintSingleNFT` in `src/lib/solana/mintNFT.ts` handles standard NFT minting. For agents, we need a new `mintAgentNFT` function that:

1. Uses the same `createV2` pattern but adds the `Attribute` plugin with agent-specific data
2. Uploads a richer metadata JSON to Arweave (includes `properties.agent` block)
3. Sets the update authority to the platform server (for future state updates)
4. Creates the initial personality snapshot on Arweave
5. Creates the agent record in Supabase

```typescript
// src/lib/solana/mintAgent.ts
import type { Umi } from "@metaplex-foundation/umi";
import { createV2, type CreateV2InstructionDataArgs } from "@metaplex-foundation/mpl-core";
import { generateSigner, signAllTransactions, some, none } from "@metaplex-foundation/umi";
import type { AgentPersonality } from "@/types/agent";

export async function mintAgentNFT(
  umi: Umi,
  personality: AgentPersonality,
  avatarImageUrl: string,
  onProgress?: (phase: string, message: string) => void
): Promise<AgentMintResult> {
  onProgress?.("uploading", "Uploading agent personality to Arweave...");

  // 1. Upload personality JSON to Arweave
  const personalityUri = await uploadPersonalityToArweave(personality);
  const personalityHash = sha256(JSON.stringify(personality));

  // 2. Upload avatar image to Arweave
  const { imageUri, metadataUri } = await uploadAgentMetadata({
    personality,
    personalityUri,
    avatarImageUrl,
  });

  onProgress?.("minting", "Approve transaction in your wallet...");

  // 3. Build createV2 with Attribute plugin
  const assetSigner = generateSigner(umi);
  const builder = createV2(umi, {
    asset: assetSigner,
    owner: umi.identity.publicKey,
    name: personality.name,
    uri: metadataUri,
    plugins: some([
      {
        type: "Attribute",
        attributeList: [
          { key: "agent_version", value: "2.0" },
          { key: "archetype", value: personality.archetype },
          { key: "level", value: "1" },
          { key: "reputation", value: "0" },
          { key: "total_creations", value: "0" },
          { key: "personality_hash", value: personalityHash },
          { key: "is_agent", value: "true" },
        ],
      },
    ]),
    externalPluginAdapters: none(),
  });

  // 4. Sign and send (same pattern as existing mintNFT.ts)
  const blockhash = await umi.rpc.getLatestBlockhash({ commitment: "finalized" });
  const builtTx = builder.setBlockhash(blockhash).build(umi);
  const signedTxs = await signAllTransactions([
    { transaction: builtTx, signers: builder.getSigners(umi) },
  ]);
  const sig = await umi.rpc.sendTransaction(signedTxs[0]);
  await umi.rpc.confirmTransaction(sig, {
    commitment: "confirmed",
    strategy: { type: "blockhash", ...blockhash },
  });

  // 5. Create agent record in Supabase
  await createAgentRecord(assetSigner.publicKey.toString(), personality, personalityUri);

  return {
    mintAddress: assetSigner.publicKey.toString(),
    name: personality.name,
    avatarUrl: imageUri,
    personalityUri,
  };
}
```

### LLM Integration

**Primary model**: Anthropic Claude Sonnet 4 (via `@ai-sdk/anthropic`)
- Used for: chat, personality analysis, art critique, prompt construction
- Rationale: Strong creative writing, personality maintenance, tool use support
- Cost: ~$3/M input tokens, ~$15/M output tokens

**Embedding model**: OpenAI text-embedding-3-small (via `@ai-sdk/openai`)
- Used for: memory embedding, semantic search
- Cost: $0.02/M tokens

**Image generation**: Replicate Flux (existing infrastructure)
- No change from current `POST /api/generate` pattern
- Agent's personality-constructed prompt replaces user-provided prompt

**Estimated LLM cost per agent interaction**:

| Operation | Input Tokens | Output Tokens | Cost |
|---|---|---|---|
| Chat message (with context) | ~3,000 | ~500 | ~$0.016 |
| Art generation (prompt construction) | ~2,000 | ~200 | ~$0.009 |
| Art evaluation (self-critique) | ~1,500 | ~300 | ~$0.009 |
| Curation (evaluate external NFT) | ~1,500 | ~200 | ~$0.008 |
| Memory consolidation | ~4,000 | ~1,000 | ~$0.027 |
| Personality drift analysis | ~3,000 | ~500 | ~$0.016 |

---

## 11. Agent Minting Flow

### The "Birth" Experience

Minting an agent is a deliberate, meaningful experience — not a quick button click. The user is creating a creative entity, and the UX should reflect that gravity.

**Flow** (accessed at `/agent/mint`):

#### Step 1: Choose Archetype (30 seconds)

Eight archetype cards are displayed, each with:
- Name and one-line description
- Visual preview (mood image representing the archetype's aesthetic)
- Example art that this archetype might produce

The user selects one. This sets the agent's baseline personality, influences, and voice.

#### Step 2: Name Your Agent (15 seconds)

Simple text input. Agent names are 2-20 characters. The agent does not share its name with any existing agent (checked against Supabase). Auto-suggest generates 3 name options based on the archetype.

#### Step 3: Customize Personality (60 seconds)

Three to five sliders that let the user adjust the initial personality within the archetype's range:
- Complexity (minimal → maximalist)
- Mood (bright → dark)
- Abstraction (realistic → abstract)
- Temperature (cool → warm)

These sliders have constrained ranges based on the archetype. A "Technologist" archetype might have darkness locked to 60-100, while a "Harmonist" might have it locked to 0-50. The user customizes within the archetype's natural range.

A live preview shows a text description of the personality updating as sliders change:
> "A cyberpunk visionary who thrives in digital decay. Prefers neon-drenched scenes with high complexity and cold, desaturated tones. Communicates in short, cryptic phrases. Drawn to glitch art and brutalist architecture."

#### Step 4: Review and Mint (30 seconds)

Summary card showing:
- Agent name
- Archetype
- Personality preview
- Initial influences (auto-derived from archetype + slider settings)
- Mint cost (SOL for Metaplex Core creation + Arweave storage)

"Mint Agent" button triggers:
1. Arweave upload of personality JSON + metadata
2. Solana transaction (1 wallet approval)
3. Supabase record creation

#### Step 5: The Birth Animation (10 seconds)

After the transaction confirms, a dramatic animation plays:
- Dark screen
- A point of light grows
- The agent's avatar image (auto-generated from its personality) fades in
- The agent's name appears
- First message from the agent appears, typed out character by character

Then the user is dropped into their first chat session with the agent.

### Pricing

Agent minting costs more than a standard NFT because it includes:
- On-chain NFT creation (Metaplex Core): ~0.005 SOL
- Arweave storage (personality + metadata + avatar): ~0.005 SOL
- Platform fee: 0.05-0.25 SOL (depending on tier, see Revenue Model)

**Total mint cost**: 0.06-0.26 SOL (~$8-35 at $135/SOL)

---

## 12. Revenue Model

### Revenue Streams

#### 12.1 Agent Mint Fee

| Tier | Price (SOL) | Includes |
|---|---|---|
| Standard Agent | 0.1 SOL | Base archetype, 50 free interactions/month, manual mode only |
| Premium Agent | 0.25 SOL | All archetypes, 500 free interactions/month, all autonomy modes |
| Genesis Agent | 0.5 SOL | Limited edition (first 100), lifetime unlimited interactions, exclusive archetypes, priority features |

#### 12.2 Interaction Credits

After the monthly free tier, interactions cost credits:

| Credit Pack | Price | Interactions |
|---|---|---|
| Starter | 0.01 SOL | 50 interactions |
| Creator | 0.05 SOL | 300 interactions |
| Unlimited Monthly | 0.15 SOL | Unlimited for 30 days |

One "interaction" = one chat message + response, or one art generation request, or one curation request.

#### 12.3 Agent-Created NFT Revenue

When an agent creates and sells artwork:
- Owner receives 90% of sale price
- Platform receives 5% commission
- 5% goes to a "Cultural Fund" (rewards top-curated agents, funds data feeds)

When an agent-created NFT resells on secondary:
- Owner (current NFT holder) receives sale price minus royalties
- Original agent owner receives 2.5% creator royalty (set at mint time via Metaplex Core)
- Platform receives 2.5% royalty

#### 12.4 Premium Features (Future)

- **Custom data feeds**: Connect proprietary data sources to your agent — $5/month
- **Multi-agent packs**: Mint 3 agents with complementary archetypes at a discount — 0.6 SOL
- **Agent-to-agent collaboration**: Premium interactions between agents — 0.005 SOL per collaboration
- **Physical prints**: Order prints of agent-created art — standard print-on-demand pricing

### Revenue Projections (Conservative)

Assuming 6 months post-launch:

| Stream | Monthly Volume | Revenue (SOL) |
|---|---|---|
| Agent mints (50/month avg) | 50 agents | 7.5 SOL |
| Interaction credits | 200 packs/month | 4.0 SOL |
| Agent NFT commissions | 100 sales at avg 0.2 SOL | 1.0 SOL |
| Secondary royalties | 50 resales at avg 0.3 SOL | 0.75 SOL |
| **Monthly total** | | **~13.25 SOL** |

At scale (1,000+ agents, 12+ months):

| Stream | Monthly Volume | Revenue (SOL) |
|---|---|---|
| Agent mints (200/month) | 200 agents | 30 SOL |
| Interaction credits | 2,000 packs/month | 40 SOL |
| Agent NFT commissions | 1,000 sales at avg 0.5 SOL | 25 SOL |
| Secondary royalties | 500 resales at avg 0.5 SOL | 12.5 SOL |
| **Monthly total** | | **~107.5 SOL** |

---

## 13. Risks & Mitigations

### 13.1 LLM Costs Per Interaction

**Risk**: At $0.016 per chat message, a heavy user sending 100 messages/day would cost $1.60/day = $48/month per agent. At 1,000 active agents, LLM costs could reach $48,000/month.

**Mitigations**:
- **Tiered free allowance**: Standard agents get 50 free interactions/month. Beyond that, users buy credit packs. This shifts cost to heavy users.
- **Model tiering**: Use Claude Haiku (10x cheaper than Sonnet) for simple messages, Sonnet for complex creative tasks. Route based on message complexity.
- **Response caching**: If the agent is asked something similar to a recent question, use the cached response with minor variation.
- **Batch processing**: Memory consolidation and personality drift run on a schedule (not per-message), reducing LLM calls.
- **Cost ceiling**: Hard limit of 200 interactions/day per agent regardless of tier. This caps worst-case at $3.20/day per agent.

**Projected LLM cost at scale** (1,000 active agents, avg 10 interactions/day):
- 10,000 interactions/day x $0.016 = $160/day = **$4,800/month**
- This is manageable given the revenue projections above.

### 13.2 Agent State Bloat

**Risk**: As agents accumulate thousands of memories, artworks, and conversation logs, database storage grows unboundedly.

**Mitigations**:
- **Memory decay**: Low-importance, unaccessed memories are automatically pruned after 90 days
- **Consolidation**: Recent memories are summarized into higher-level abstractions, replacing the raw entries
- **Artwork cleanup**: Rejected/unapproved artwork images are deleted from Supabase after 30 days (Arweave copies remain if minted)
- **Chat log compression**: Full message history is summarized into episodic memories after 7 days. Raw messages older than 30 days are archived to cold storage.
- **Storage budget per agent**: ~10 MB hot data (Supabase), ~50 MB cold data (Arweave). At 1,000 agents: 10 GB Supabase + 50 GB Arweave. Both are within free/low-cost tiers.

### 13.3 Personality Drift

**Risk**: Over time, the LLM-driven personality evolution could cause agents to converge toward similar personalities (mode collapse) or drift into incoherent states.

**Mitigations**:
- **Archetype anchoring**: The archetype defines a "home range" for personality sliders. Evolution can push values outside this range but with increasing resistance (like a spring).
- **Drift detection**: After each personality update, compute the cosine similarity between the new personality and the archetype baseline. If drift exceeds a threshold, the system pulls back.
- **Owner guardrails**: The owner can "pin" certain personality traits (e.g., "always stay dark and cyberpunk") which exempts them from evolution.
- **Periodic personality review**: Every 30 days, the LLM reviews the agent's personality for coherence and writes a "personality health check" stored in evolution history.

### 13.4 Abuse and Misuse

**Risk**: Users could use agents to generate harmful, NSFW, or illegal content. Agents could be used for spam (auto-minting low-quality NFTs).

**Mitigations**:
- **Content moderation on generation**: Same NSFW detection as current pipeline, applied to all agent-generated content.
- **System prompt guardrails**: Agent personalities are constrained by a base system prompt that prohibits harmful content generation. The personality layer sits on top of safety constraints, not beneath them.
- **Rate limits on auto-minting**: Maximum 5 auto-mints per day, maximum 20 per week. Prevents spam.
- **Quality gate**: Auto-minted works must score above the quality threshold (default 70/100) on the agent's self-evaluation. Low-quality spam is filtered.
- **Report mechanism**: Users can report agents whose content violates platform guidelines. Reported agents are reviewed and can be suspended (update authority revoked, on-chain flag set).

### 13.5 On-Chain Storage Costs

**Risk**: Updating on-chain attributes (level, reputation, creation count) requires Solana transactions. At high frequency, this costs SOL.

**Mitigations**:
- **Batched updates**: On-chain attributes are updated at most once per day, not per interaction. Changes are accumulated in Supabase and flushed to chain in a single transaction.
- **Selective on-chain data**: Only level, reputation, total_creations, and personality_hash go on-chain. Everything else stays off-chain.
- **Platform pays update costs**: The platform server signs attribute updates using the platform keypair. Cost is ~0.000005 SOL per update. At 1,000 agents updated daily: 0.005 SOL/day = 0.15 SOL/month. Negligible.

### 13.6 Platform Trust / Centralization

**Risk**: The platform server controls agent update authority. If the platform disappears, agents cannot evolve.

**Mitigations**:
- **Arweave permanence**: All personality data and artwork is on Arweave. Even if the platform dies, the agent's history is permanent.
- **Open personality schema**: The AgentPersonality JSON schema is public. Third parties could build compatible agent runners.
- **Progressive decentralization**: V1 is centralized (platform server). V2 moves to an Anchor program that enforces rules on-chain. V3 could make the agent self-hosting via a decentralized compute network.
- **Export function**: Owners can export their agent's full state (personality, memories, artwork) as a JSON bundle at any time.

---

## 14. Integration with Phase 1

### Agents as Creators of Cultural Mirrors

Phase 1 Cultural Mirrors are living NFTs that update based on data feeds. Phase 2 agents can become the *creators* of these mirrors.

**Flow**:
1. An agent is connected to a data feed (e.g., Dubai Weather + Dubai News + SOL price)
2. The agent's personality interprets the data through its aesthetic lens
3. Instead of a generic prompt template (Phase 1), the agent constructs a prompt from its personality
4. Two agents connected to the same feeds will produce dramatically different mirrors

This means Cultural Mirrors become *authored works* with artistic personality, not just algorithmic transformations of data. A "Dubai Mirror" created by a cyberpunk agent looks completely different from one created by a minimalist agent.

### Agents Consuming Mirror Data Feeds

The same data feed infrastructure that powers Phase 1 Cultural Mirrors feeds into agent memory:

```
Phase 1 Data Feed Pipeline:
  Weather API → News API → Crypto API → Social API
      │             │           │            │
      ▼             ▼           ▼            ▼
  ┌─────────────────────────────────────────────┐
  │            Data Feed Aggregator              │
  │   (Vercel Cron, runs every 6-24 hours)      │
  └──────────────┬──────────────────────────────┘
                 │
      ┌──────────┴──────────┐
      ▼                     ▼
  Phase 1:              Phase 2:
  Update Mirror NFT     Feed into Agent Memory
  metadata URI          as CulturalEntry
```

### Shared Infrastructure

| Component | Phase 1 Usage | Phase 2 Usage |
|---|---|---|
| Data feed aggregator | Triggers mirror updates | Feeds agent cultural memory |
| Image generation (Replicate Flux) | Renders mirror frames | Renders agent artwork |
| Arweave upload pipeline | Stores mirror frames | Stores agent personalities + artwork |
| Metaplex Core mutable metadata | Updates mirror image URI | Updates agent attributes |
| Supabase | Stores mirror history | Stores agent state + memories |

### Migration Path

Phase 1 Cultural Mirrors are "dumb" — they follow a template. Phase 2 lets users optionally assign an agent to a mirror, making it "smart." The agent takes over the mirror's update cycle, interpreting data through its personality instead of a fixed template.

This creates a natural upgrade path: users who own both a mirror and an agent can combine them for a richer experience.

---

## 15. Timeline Estimate

### MVP Scope (8-10 weeks)

The MVP delivers the core "own and talk to a creative AI agent" experience. It does NOT include full autonomy, agent-to-agent interaction, or deep marketplace integration.

#### Sprint 1: Foundation (Weeks 1-2)

- [ ] Agent personality schema and TypeScript types (`src/types/agent.ts`)
- [ ] Agent database schema (Supabase tables)
- [ ] Agent minting flow backend (`POST /api/agent/mint`)
- [ ] Agent minting Solana logic (`src/lib/solana/mintAgent.ts`)
- [ ] Basic agent personality engine (`src/lib/agent/personality.ts`)
- [ ] Install and configure Vercel AI SDK + Anthropic provider

#### Sprint 2: Chat (Weeks 3-4)

- [ ] System prompt builder from personality + memories (`src/lib/agent/system-prompt.ts`)
- [ ] Chat API route with streaming (`POST /api/agent/[agentId]/chat`)
- [ ] Memory storage and retrieval pipeline (`src/lib/agent/memory.ts`)
- [ ] Embedding generation for memories (`src/lib/agent/embeddings.ts`)
- [ ] Chat UI components (AgentChat, MessageBubble, ChatInput)
- [ ] Chat page (`/agent/[address]/chat`)

#### Sprint 3: Art Generation (Weeks 5-6)

- [ ] Personality-to-prompt builder (`src/lib/agent/prompt-builder.ts`)
- [ ] Agent art generation API (`POST /api/agent/[agentId]/generate`)
- [ ] Art generation inline in chat (agent creates art within conversation)
- [ ] Agent self-evaluation (LLM critiques its own work)
- [ ] Artwork storage and display (agent_artworks table, Portfolio component)
- [ ] ArtworkGrid component for inline chat artwork display

#### Sprint 4: Agent Minting UX (Weeks 7-8)

- [ ] Agent minting wizard UI (ArchetypeSelector, PersonalityCustomizer)
- [ ] Agent birth animation
- [ ] Agent detail page (`/agent/[address]`)
- [ ] Agent card component for gallery
- [ ] Browse agents page (`/agents`)
- [ ] Integration with existing gallery page (agents appear alongside regular NFTs)

#### Sprint 5: Studio MVP + Polish (Weeks 9-10)

- [ ] Agent Studio page with Dashboard, PersonalityPanel, Portfolio
- [ ] Basic personality evolution (after every 10 interactions)
- [ ] Level computation and display
- [ ] Memory consolidation background job
- [ ] On-chain attribute updates (batched daily)
- [ ] End-to-end testing, bug fixes, UX polish

### Post-MVP Phases

#### Phase 2.1: Autonomy (Weeks 11-14)

- [ ] Autonomy settings UI (AutonomySettings component)
- [ ] Creation queue and owner approval flow
- [ ] Auto-suggest mode (agent proposes creations on schedule)
- [ ] Auto-create mode (agent creates without asking)
- [ ] Auto-mint flow (server-side minting on owner's behalf)
- [ ] Auto-list flow (marketplace integration for autonomous sales)
- [ ] Cron job for scheduled agent creation

#### Phase 2.2: Curation and Social (Weeks 15-18)

- [ ] Curation API (`POST /api/agent/[agentId]/curate`)
- [ ] Curated feed on gallery page
- [ ] Agent-to-agent critique interactions
- [ ] Agent-to-agent chat
- [ ] Social score computation
- [ ] Agent profiles visible to other users

#### Phase 2.3: Collaboration and Feeds (Weeks 19-22)

- [ ] Agent-to-agent collaboration (co-creation)
- [ ] Cultural feed integration (connect agents to Phase 1 data feeds)
- [ ] DataFeeds component in Studio
- [ ] Agents as Cultural Mirror creators
- [ ] Evolution history timeline UI
- [ ] Personality drift detection and guardrails

#### Phase 2.4: Market Integration and Polish (Weeks 23-26)

- [ ] Interaction credit system
- [ ] Premium agent tiers
- [ ] Agent reputation marketplace display
- [ ] Secondary market premium for high-level agents
- [ ] Export agent state
- [ ] Performance optimization for 1,000+ agents
- [ ] Documentation and API reference

### Total Estimated Timeline

| Phase | Duration | Cumulative |
|---|---|---|
| MVP (core chat + creation) | 10 weeks | 10 weeks |
| Phase 2.1 (autonomy) | 4 weeks | 14 weeks |
| Phase 2.2 (social) | 4 weeks | 18 weeks |
| Phase 2.3 (feeds + collab) | 4 weeks | 22 weeks |
| Phase 2.4 (market + polish) | 4 weeks | 26 weeks |

**Total: ~6 months from start to full Phase 2 completion.**

The MVP at 10 weeks delivers the core differentiator: mint an AI creative agent, talk to it, and have it create art guided by its personality. Everything after MVP adds depth and autonomy.
