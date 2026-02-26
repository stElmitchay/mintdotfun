# Phase 3: Style Recipe Marketplace — Implementation Plan

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [Style Recipe Format](#2-style-recipe-format)
3. [Recipe Storage](#3-recipe-storage)
4. [Marketplace UI/UX](#4-marketplace-uiux)
5. [Pricing & Revenue](#5-pricing--revenue)
6. [Agent Remix Engine](#6-agent-remix-engine)
7. [Recipe-to-NFT Pipeline](#7-recipe-to-nft-pipeline)
8. [Integration with Phase 2 (Agent-as-NFT)](#8-integration-with-phase-2-agent-as-nft)
9. [On-Chain Architecture](#9-on-chain-architecture)
10. [Technical Implementation](#10-technical-implementation)
11. [Anti-Piracy & Trust](#11-anti-piracy--trust)
12. [Discovery & Curation](#12-discovery--curation)
13. [Revenue Model](#13-revenue-model)
14. [Risks & Mitigations](#14-risks--mitigations)
15. [Timeline Estimate](#15-timeline-estimate)

---

## 1. Product Vision

### The Problem with Raw Prompts

PromptBase has 260K+ prompts selling at $1.99-$9.99 with a 20% commission model. It works as a business, but prompts are a commodity: once purchased, a text string is trivially copied, shared, or paraphrased. PromptSea tried on-chain prompts on Polygon (encrypted until purchase), but the fundamental problem remains -- a raw prompt has no moat. As AI models improve and become more instruction-following, yesterday's carefully crafted prompt becomes today's one-liner.

NFPrompt on BNB Chain combines generation + minting but is siloed to one chain and doesn't solve the "prompt as premium asset" problem. Nobody on Solana is doing this at all.

### Why Style Recipes Are Different

A Style Recipe is to a raw prompt what a chef's recipe is to an ingredient list. Anyone can buy flour, eggs, and sugar. Very few can produce a perfect croissant. The value is in the technique, the ratios, the sequencing, the knowledge of what works together.

A Style Recipe bundles:

- **The prompt text** (the "what")
- **Style parameters** (the "how" -- model settings, CFG scale, sampling method)
- **Negative prompts** (the "what NOT to do" -- critical for quality output)
- **Reference images** (the "mood" -- visual anchors that guide aesthetic)
- **Post-processing instructions** (the "finishing" -- upscaling, color grading, compositing)
- **Mood/aesthetic tags** (the "vibe" -- searchable creative intent)
- **Creator's notes** (the "why" -- explaining the creative decisions)

This bundle is substantially harder to reverse-engineer than a prompt string. A buyer who purchases a cyberpunk-anime-fusion recipe gets the entire creative workflow, not just the words.

### The Creative Economy

Style Recipes create a flywheel:

1. **Creators** develop recipes through experimentation and sell them
2. **Users** purchase recipes and generate NFTs with one click
3. **Agents** (Phase 2) monitor top recipes, cross-pollinate them into hybrids
4. **Hybrid sales** generate royalties back to original recipe creators
5. **Success signals** (sales, ratings, agent-remixes) increase recipe visibility
6. **More creators** are attracted by the royalty revenue from agent remixes

The key insight: recipes appreciate in value when agents remix them, because the original creator earns ongoing royalties without doing additional work. This is the opposite of prompts, which depreciate as models improve.

---

## 2. Style Recipe Format

### Core Schema

```typescript
// src/types/recipe.ts

export interface StyleRecipe {
  id: string;                        // UUID, primary key
  version: number;                   // Schema version (starts at 1)

  // --- Identity ---
  name: string;                      // Display name ("Neon Ukiyo-e Dreamscapes")
  slug: string;                      // URL-safe identifier
  description: string;               // Markdown-supported description
  creatorWallet: string;             // Solana pubkey of creator
  createdAt: string;                 // ISO 8601
  updatedAt: string;                 // ISO 8601

  // --- Creative Content (encrypted until purchased) ---
  prompt: string;                    // Primary prompt text (max 4000 chars)
  negativePrompt: string;            // What to avoid (max 2000 chars)
  styleParameters: StyleParameters;
  referenceImages: ReferenceImage[]; // 0-5 reference images
  postProcessing: PostProcessingStep[];
  creatorNotes: string;              // Markdown, max 5000 chars

  // --- Public Metadata (visible to all) ---
  tags: string[];                    // Aesthetic/mood tags (max 10)
  category: RecipeCategory;
  previewImages: string[];           // 3-6 sample outputs (Arweave URIs)
  previewDescription: string;        // What the buyer sees (no secrets)
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedGenerationTime: number;   // Seconds
  compatibleModels: string[];        // ["flux-schnell", "flux-pro", "sdxl"]

  // --- Marketplace ---
  priceLamports: number;             // Price in lamports (0 = free)
  status: RecipeStatus;
  salesCount: number;
  totalRevenue: number;              // Lamports earned
  averageRating: number;             // 1-5 scale
  ratingCount: number;
  remixCount: number;                // Times used by Agent Remix Engine

  // --- Versioning ---
  parentRecipeId: string | null;     // If this is a remix/fork
  versionHistory: RecipeVersion[];

  // --- Encryption ---
  encryptedContentUri: string;       // Arweave URI to encrypted recipe blob
  contentHash: string;               // SHA-256 of unencrypted content (for verification)
}

export interface StyleParameters {
  baseModel: string;                 // "flux-schnell" | "flux-pro" | "sdxl" | etc.
  width: number;                     // Output width
  height: number;                    // Output height
  aspectRatio: string;               // "1:1" | "16:9" | "9:16" | "4:3" | etc.
  guidanceScale: number;             // CFG scale (1.0 - 20.0)
  numInferenceSteps: number;         // Sampling steps (20-150)
  scheduler: string;                 // "euler" | "euler_a" | "dpmpp_2m" | etc.
  seed: number | null;               // Fixed seed or null for random
  seedRange?: [number, number];      // Suggested seed range for variations
  promptStrength: number;            // 0.0 - 1.0 (for img2img)
  stylePreset: string | null;        // From existing ALLOWED_STYLES or custom
  customStylePrompt: string;         // Additional style modifiers
  outputFormat: "webp" | "png" | "jpg";
  outputQuality: number;             // 1-100
}

export interface ReferenceImage {
  uri: string;                       // Arweave URI (encrypted with recipe)
  role: "style" | "composition" | "color" | "mood" | "texture";
  weight: number;                    // 0.0 - 1.0 influence weight
  description: string;               // What this reference contributes
}

export interface PostProcessingStep {
  order: number;
  type: "upscale" | "color-grade" | "sharpen" | "denoise" | "style-transfer" | "crop" | "custom";
  parameters: Record<string, unknown>;
  description: string;               // Human-readable instruction
}

export interface RecipeVersion {
  version: number;
  updatedAt: string;
  changelog: string;
  contentHash: string;
}

export type RecipeCategory =
  | "illustration"
  | "photography"
  | "abstract"
  | "character"
  | "landscape"
  | "architecture"
  | "fashion"
  | "food"
  | "music"
  | "cultural"
  | "sci-fi"
  | "fantasy"
  | "horror"
  | "minimal"
  | "experimental"
  | "remix";

export type RecipeStatus =
  | "draft"
  | "published"
  | "unlisted"     // Accessible by direct link but not in search
  | "suspended"    // Flagged by moderation
  | "archived";
```

### Versioning Strategy

Recipes are versioned with a simple incrementing counter. When a creator updates a recipe:

1. The current version's `contentHash` is recorded in `versionHistory`
2. The new encrypted content is uploaded to Arweave (new URI)
3. The `version` counter increments
4. All existing purchasers retain access to all versions they've purchased
5. New purchasers get the latest version

Versioning is handled at the database level, not on-chain. Only the current `encryptedContentUri` and `contentHash` are referenced in the on-chain purchase record.

---

## 3. Recipe Storage

### Storage Architecture

Recipes use a hybrid storage model that matches the existing platform pattern (Supabase for queryable data, Arweave for permanent content).

```
┌─────────────────────────────────────────────────────┐
│  Supabase (Postgres)                                │
│  - Recipe metadata (searchable, queryable)          │
│  - Purchase records                                 │
│  - Ratings/reviews                                  │
│  - Revenue tracking                                 │
│  - Royalty ledger                                   │
└──────────────────────┬──────────────────────────────┘
                       │ references
                       ▼
┌─────────────────────────────────────────────────────┐
│  Arweave (Permanent)                                │
│  - Encrypted recipe content blob                    │
│  - Preview images (public)                          │
│  - Reference images (encrypted within blob)         │
│  - Purchase proof metadata                          │
└─────────────────────────────────────────────────────┘
                       │ verified by
                       ▼
┌─────────────────────────────────────────────────────┐
│  Solana (On-Chain)                                  │
│  - Purchase transaction (SOL transfer + memo)       │
│  - Revenue split execution                          │
│  - Provenance records (recipe -> NFT lineage)       │
└─────────────────────────────────────────────────────┘
```

### Encryption Flow

Recipes must be hidden until purchased. The encryption uses a server-managed key derivation scheme rather than buyer-specific encryption (which would require re-encrypting for every buyer).

**Encryption at publish time:**

1. Creator submits recipe content via `/api/recipes/publish`
2. Server generates a unique AES-256-GCM content encryption key (CEK) for this recipe
3. Server encrypts the recipe content blob (prompt, parameters, reference images, notes) with the CEK
4. Server uploads the encrypted blob to Arweave, storing the URI
5. The CEK is stored server-side in Supabase (encrypted at rest with a platform master key from env var `RECIPE_MASTER_KEY`)
6. The `contentHash` (SHA-256 of the plaintext) is stored publicly for integrity verification

**Decryption at purchase time:**

1. Buyer completes purchase (SOL transfer confirmed on-chain)
2. Server confirms the purchase transaction
3. Server retrieves the CEK for the recipe
4. Server decrypts the recipe content
5. Server re-encrypts with a buyer-specific key derived from `HMAC(RECIPE_MASTER_KEY, buyer_wallet + recipe_id)`
6. Server returns the buyer-specific encrypted blob + the buyer's decryption key
7. Client decrypts and displays the recipe content
8. The buyer-specific key is deterministic, so the buyer can always re-derive it by authenticating

**Why server-managed keys, not on-chain encryption:**

- On-chain encryption (like PromptSea uses) requires the buyer's public key to encrypt, meaning each recipe must be individually encrypted per buyer -- expensive at scale
- Lit Protocol or similar threshold encryption adds complexity and external dependencies
- Server-managed keys are simpler, match the existing architecture (server already handles Arweave uploads and marketplace transactions), and can be audited

### Preventing Piracy After Purchase

This is addressed in detail in [Section 11](#11-anti-piracy--trust), but the storage-level protections are:

1. **Watermarking**: Each decrypted recipe includes the buyer's wallet address embedded in the `creatorNotes` as an invisible Unicode watermark. If a recipe leaks, the source is traceable.
2. **Rate limiting**: Decryption endpoint (`/api/recipes/decrypt`) is rate-limited to 10 requests/hour per wallet.
3. **Access logging**: Every decryption is logged (wallet, timestamp, IP).

---

## 4. Marketplace UI/UX

### New Pages

#### `/recipes` -- Browse/Search Recipes

The main recipe marketplace page. Layout mirrors the existing gallery page pattern (masonry/column grid) but adapted for recipe cards.

```
┌──────────────────────────────────────────────────────────┐
│  [Search bar]                    [Category filter ▼]     │
│  [Tags: trending | new | top-rated | free | ...]         │
├──────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ Preview  │  │ Preview  │  │ Preview  │               │
│  │ Image    │  │ Image    │  │ Image    │               │
│  │          │  │          │  │          │               │
│  │ "Neon    │  │ "Oil     │  │ "Retro   │               │
│  │  Ukiyo-e"│  │  Paint   │  │  Pixel   │               │
│  │          │  │  Dreams" │  │  Art"    │               │
│  │ ★★★★☆   │  │ ★★★★★   │  │ ★★★★☆   │               │
│  │ 0.5 SOL  │  │ 1.2 SOL  │  │ FREE    │               │
│  │ 142 sold │  │ 89 sold  │  │ 312 uses │               │
│  └──────────┘  └──────────┘  └──────────┘               │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ ...      │  │ ...      │  │ ...      │               │
│  └──────────┘  └──────────┘  └──────────┘               │
└──────────────────────────────────────────────────────────┘
```

**Recipe Card** shows:
- Preview image (first of 3-6 sample outputs)
- Recipe name
- Creator wallet (shortened)
- Star rating + count
- Price in SOL (or "FREE")
- Sales count
- Category tag
- "Agent Remix" badge if it's been remixed by the Curator Agent

#### `/recipes/[slug]` -- Recipe Detail Page

The detail page follows the same two-column layout as the existing NFT detail page (`/nft/[address]/page.tsx`).

```
┌──────────────────────────────────────────────────────────┐
│  ← Back to Recipes                                       │
│                                                          │
│  ┌──────────────────────────────────┐                    │
│  │  [Preview Image Carousel]        │                    │
│  │  Sample output 1 of 4            │                    │
│  │  ◄ ○ ○ ○ ○ ►                    │                    │
│  └──────────────────────────────────┘                    │
│                                                          │
│  ┌──────────────────────────┐  ┌────────────────────┐    │
│  │ "Neon Ukiyo-e Dreamscapes│  │ Price              │    │
│  │  by [wallet]             │  │ 0.5 SOL            │    │
│  │                          │  │                    │    │
│  │ Description              │  │ [Buy Recipe]       │    │
│  │ Creates stunning...      │  │                    │    │
│  │                          │  │ Stats              │    │
│  │ Tags                     │  │ 142 sold           │    │
│  │ #cyberpunk #japanese     │  │ ★★★★☆ (47)        │    │
│  │ #neon #ukiyo-e           │  │ 12 agent remixes   │    │
│  │                          │  │                    │    │
│  │ Compatible Models        │  │ Revenue for you    │    │
│  │ Flux Schnell, Flux Pro   │  │ Use to generate:   │    │
│  │                          │  │ free (after buy)   │    │
│  │ Difficulty: Intermediate │  │ Mint with recipe:  │    │
│  │                          │  │ 2% royalty to      │    │
│  │ Reviews (47)             │  │ recipe creator     │    │
│  │ ★★★★★ "Amazing..."      │  │                    │    │
│  │ ★★★★☆ "Great for..."    │  └────────────────────┘    │
│  └──────────────────────────┘                            │
│                                                          │
│  ── Provenance ──────────────────────────────────────    │
│  Parent recipe: [link] (if forked)                       │
│  Agent remixes: [list of hybrid NFTs]                    │
│  NFTs minted with this recipe: [count]                   │
└──────────────────────────────────────────────────────────┘
```

**What buyers see BEFORE purchase:**
- Preview images (sample outputs generated by the creator)
- Description and tags
- Difficulty level and compatible models
- Sales stats and ratings
- Reviews from other buyers

**What buyers see AFTER purchase:**
- Full prompt text
- All style parameters
- Reference images
- Negative prompt
- Post-processing instructions
- Creator's notes
- "Use this Recipe" button that pre-populates the `/create` flow

#### `/recipes/create` -- Recipe Builder

A multi-step form (similar to the existing `/create` page pattern) for creators to build and publish recipes.

**Step 1: Content** -- Write the prompt, negative prompt, creator notes
**Step 2: Parameters** -- Set style parameters, model, dimensions, CFG, etc.
**Step 3: References** -- Upload reference images, assign roles and weights
**Step 4: Post-Processing** -- Define processing steps
**Step 5: Preview** -- Generate 3-6 sample outputs using the recipe, select the best as preview images
**Step 6: Metadata** -- Name, description, tags, category, difficulty, price
**Step 7: Publish** -- Review everything, confirm, and publish

#### `/recipes/my` -- Recipe Management (Seller Dashboard)

A dashboard for creators to manage their recipes.

```
┌──────────────────────────────────────────────────────────┐
│  My Recipes                         [+ Create Recipe]    │
│                                                          │
│  ┌─ Published (5) ────────────────────────────────────┐  │
│  │ Recipe Name     | Sales | Revenue | Rating | Edit  │  │
│  │ Neon Ukiyo-e    | 142   | 71 SOL  | 4.2    | [✏️]  │  │
│  │ Oil Paint Dream | 89    | 106 SOL | 4.8    | [✏️]  │  │
│  │ ...                                                │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─ Drafts (2) ──────────────────────────────────────┐  │
│  │ Untitled #1     | last edited 2h ago    | [Edit]  │  │
│  │ ...                                                │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─ Revenue Summary ─────────────────────────────────┐  │
│  │ Total Earned:     210.5 SOL                       │  │
│  │ This Month:       34.2 SOL                        │  │
│  │ From Remixes:     12.8 SOL (royalties)            │  │
│  │ Pending Payout:   0.8 SOL                         │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### Purchase Flow

1. Buyer clicks "Buy Recipe" on the detail page
2. Modal shows: price in SOL, platform fee breakdown, what they'll receive
3. Buyer confirms -- Privy wallet prompts for SOL transfer (1 popup)
4. Server confirms on-chain transaction
5. Server records purchase in Supabase
6. Server returns decrypted recipe content
7. UI transitions to "You own this recipe" state with full content revealed
8. "Use this Recipe" button appears, linking to pre-populated `/create` flow

### Rating/Review System

After purchasing and using a recipe at least once (tracked via the recipe-to-NFT pipeline), buyers can leave a rating (1-5 stars) and an optional text review (max 500 characters). Reviews are stored in Supabase and displayed on the recipe detail page. Creators can respond to reviews.

---

## 5. Pricing & Revenue

### Pricing Model

- **Seller sets price**: Minimum 0 SOL (free), no maximum. Recommended range: 0.1-5 SOL.
- **Free recipes**: Allowed. Creators may offer free recipes to build reputation, then upsell premium recipes. Free recipes still track usage for royalties.
- **Price changes**: Sellers can change price at any time. Existing purchasers retain access.

### Commission Structure

| Revenue Event | Creator | Platform | Original Recipe(s) |
|---|---|---|---|
| **Recipe sale** | 85% | 15% | -- |
| **NFT minted using recipe** | 2% of mint cost | 1% of mint cost | -- |
| **Agent remix hybrid sold** | -- | 10% | 90% split among source recipes |
| **Hybrid NFT secondary sale** | -- | 5% | 5% split among source recipes |

### Revenue Flow

**Recipe Sale:**
```
Buyer pays 1 SOL
  → 0.85 SOL to Creator wallet (direct SOL transfer)
  → 0.15 SOL to Platform treasury (SOL transfer)
```

**NFT Minted Using Recipe:**
```
Standard mint cost (Arweave storage + Solana tx fee) ≈ 0.01 SOL
  → 0.0002 SOL recipe royalty to Creator
  → 0.0001 SOL to Platform
  → Remainder covers actual infrastructure costs
```

These amounts are small per-mint but compound. A recipe used to mint 1,000 NFTs generates 0.2 SOL in royalties for the creator -- in addition to the initial sale price.

**Agent Remix Hybrid:**
```
Curator Agent creates hybrid from Recipe A (weight 0.6) + Recipe B (weight 0.4)
Hybrid sells for 2 SOL
  → 0.2 SOL to Platform (10%)
  → 1.08 SOL to Recipe A creator (60% of 90%)
  → 0.72 SOL to Recipe B creator (40% of 90%)
```

### Royalty Tracking

Royalties are tracked in a Supabase `royalty_ledger` table and settled in batches. Settlement occurs:

- Automatically when a creator's pending balance exceeds 0.1 SOL
- On-demand when a creator clicks "Claim" in their dashboard
- Weekly batch settlement for all accounts with pending balance > 0.01 SOL

Settlement is a simple SOL transfer from the platform treasury to the creator's wallet, executed server-side using the existing `ARWEAVE_WALLET_SECRET` keypair pattern (or a dedicated `ROYALTY_TREASURY_SECRET`).

---

## 6. Agent Remix Engine

### Overview

The Agent Remix Engine is an autonomous system that monitors the recipe marketplace, identifies trending recipes, cross-pollinates elements from multiple recipes, generates hybrid creations, and auto-mints them with full provenance tracking. This is the bridge between Phase 2 (Agent-as-NFT) and Phase 3 (Style Recipes).

### Architecture

```
┌──────────────────────────────────────────────────────────┐
│  Cron Job (Vercel Cron / external scheduler)             │
│  Runs weekly (or on-demand)                              │
└──────────────────────┬───────────────────────────────────┘
                       │ triggers
                       ▼
┌──────────────────────────────────────────────────────────┐
│  /api/agent/remix  (POST, admin-only)                    │
│                                                          │
│  1. Query top recipes (by sales, rating, trend score)    │
│  2. Select 2-3 recipes to cross-pollinate                │
│  3. Decrypt recipe contents (server has keys)            │
│  4. Feed to LLM for hybrid prompt synthesis              │
│  5. Generate images using hybrid parameters              │
│  6. Upload to Arweave                                    │
│  7. Mint as NFT with provenance metadata                 │
│  8. List on marketplace (or hold in Curator collection)  │
│  9. Record royalty obligations for source recipes         │
└──────────────────────────────────────────────────────────┘
```

### Remix Algorithm

**Step 1: Recipe Selection**

The engine selects recipes using a weighted scoring system:

```typescript
interface RecipeTrendScore {
  recipeId: string;
  salesVelocity: number;     // Sales in last 7 days / total sales
  ratingMomentum: number;    // Recent rating trend (up/down)
  remixNovelty: number;      // Penalty for recently remixed recipes
  categoryDiversity: number; // Bonus for under-represented categories
  totalScore: number;
}
```

The engine selects 2-3 recipes from the top 20 trending, preferring recipes from different categories for maximum creative cross-pollination.

**Step 2: Hybrid Synthesis**

The selected recipes' contents are fed to an LLM (Claude or GPT-4) with a structured prompt:

```
You are a creative director synthesizing multiple art styles into a hybrid.

Recipe A: "Neon Ukiyo-e Dreamscapes"
- Prompt: [full prompt]
- Style: [parameters]
- Mood: [tags]

Recipe B: "Brutalist Architecture Portraits"
- Prompt: [full prompt]
- Style: [parameters]
- Mood: [tags]

Create a hybrid that:
1. Identifies the strongest visual elements from each recipe
2. Finds unexpected creative intersections
3. Produces a unified prompt that honors both sources
4. Adjusts parameters to balance both styles
5. Names the hybrid in a way that credits both influences

Output: { hybridPrompt, hybridParameters, hybridName, hybridDescription, sourceWeights }
```

**Step 3: Generation and Minting**

The hybrid prompt and parameters are fed through the existing `/api/generate` pipeline (with admin-level rate limit bypass). The best output is selected (by a simple aesthetic scoring model or manually by the agent operator) and minted through the existing `mintSingleNFT` flow.

**Step 4: Provenance Recording**

The minted NFT's metadata includes:

```json
{
  "name": "Brutalist Ukiyo-e #001",
  "description": "A hybrid creation by the mintIT Curator Agent...",
  "image": "ar://...",
  "attributes": [
    { "trait_type": "Generation", "value": "Agent Remix" },
    { "trait_type": "Source Recipe A", "value": "recipe_uuid_1" },
    { "trait_type": "Source Recipe B", "value": "recipe_uuid_2" },
    { "trait_type": "Source Weight A", "value": "0.6" },
    { "trait_type": "Source Weight B", "value": "0.4" },
    { "trait_type": "Remix Generation", "value": "1" }
  ],
  "properties": {
    "provenance": {
      "type": "agent_remix",
      "sourceRecipes": ["recipe_uuid_1", "recipe_uuid_2"],
      "sourceWeights": [0.6, 0.4],
      "agentId": "curator_agent_v1",
      "remixedAt": "2026-03-15T12:00:00Z"
    }
  }
}
```

### Royalty Distribution

When a hybrid NFT sells, royalties are distributed based on `sourceWeights`:

1. Platform takes its 10% cut
2. Remaining 90% is split proportionally among source recipe creators
3. Royalty obligations are recorded in `royalty_ledger`
4. Settlement follows the standard batch process from Section 5

---

## 7. Recipe-to-NFT Pipeline

### Integration with Existing Create Flow

When a buyer purchases a recipe and clicks "Use this Recipe," the existing `/create` page is enhanced to accept recipe pre-population.

**URL structure**: `/create?recipe=<recipe_id>`

**Pre-population behavior:**

1. The `/create` page detects the `recipe` query parameter
2. It fetches the decrypted recipe from `/api/recipes/decrypt` (requires authentication + purchase verification)
3. The multi-step create flow is pre-populated:
   - **Step 0 (Prompt)**: Recipe prompt is pre-filled, with a banner: "Using recipe: Neon Ukiyo-e Dreamscapes"
   - **Step 1 (Style)**: Recipe's style preset is pre-selected (or custom style is injected)
   - **Step 2 (Settings)**: Variation count defaults to recipe's recommended value. Reference images from the recipe are auto-loaded.
   - **Step 3 (Generate)**: The `/api/generate` call includes recipe parameters (model, CFG, scheduler, etc.)
4. The buyer can modify any pre-populated field before generating (the recipe is a starting point, not a constraint)
5. When the NFT is minted, the mint metadata includes a `recipeId` attribute for provenance tracking
6. The royalty obligation (2% to recipe creator) is recorded in `royalty_ledger`

### Modified Generation API

The existing `/api/generate` route needs to accept additional parameters when generating from a recipe:

```typescript
// Additional fields in FormData when recipe is specified:
interface RecipeGenerationParams {
  recipeId: string;          // For royalty tracking
  guidanceScale?: number;    // Override default CFG
  scheduler?: string;        // Override default scheduler
  seed?: number;             // Fixed seed from recipe
  negativePrompt?: string;   // Negative prompt from recipe
  referenceImages?: string[]; // Arweave URIs of reference images
}
```

The server validates that the caller has purchased the recipe before accepting recipe-specific parameters.

---

## 8. Integration with Phase 2 (Agent-as-NFT)

### Agents as Recipe Consumers

Phase 2 agents (creative AI entities with personalities and memory) interact with the recipe marketplace as follows:

**Agent purchasing recipes:**
- An agent's owner can fund the agent's wallet (Token Bound Account / agent sub-wallet)
- The agent monitors the recipe marketplace for recipes matching its aesthetic preferences (stored in personality config)
- When a matching recipe is found (tag overlap > threshold, category match), the agent can auto-purchase it (with owner-set spending limits)
- Purchased recipes become part of the agent's "creative toolkit" -- stored in its memory/state

**Agent learning from recipes:**
- When an agent purchases a recipe, it extracts the style parameters and techniques
- These influence the agent's future generations (e.g., an agent that buys a ukiyo-e recipe starts incorporating those techniques into its own creations)
- The agent's personality config evolves: aesthetic preferences are updated based on purchased recipes

### Agents as Recipe Creators

Agents can create and sell their own recipes:

1. An agent generates artwork over time, tracking which parameter combinations produce the best results (measured by market performance, owner feedback, and rating)
2. When the agent identifies a consistently high-performing combination, it bundles it into a Style Recipe
3. The agent publishes the recipe to the marketplace with pricing based on its estimated value (derived from the agent's reputation score and the recipe's test performance)
4. Revenue from recipe sales flows to the agent's wallet, which the owner can withdraw

**This creates an economic loop:**
- Human creates Agent-NFT
- Agent buys recipes to learn techniques
- Agent develops its own techniques through experimentation
- Agent publishes recipes for sale
- Revenue from recipes funds more recipe purchases
- Agent becomes progressively more skilled and valuable

### Agent-Recipe Metadata Link

```typescript
// In agent's personality config (Arweave)
interface AgentCreativeToolkit {
  purchasedRecipes: {
    recipeId: string;
    purchasedAt: string;
    usageCount: number;
    influenceWeight: number;  // How much this recipe shapes the agent's style
  }[];

  createdRecipes: {
    recipeId: string;
    createdAt: string;
    derivedFrom: string[];  // Recipe IDs that influenced this creation
  }[];

  styleFingerprint: {
    dominantTags: string[];
    preferredModels: string[];
    averageParameters: StyleParameters;  // Averaged across all creations
  };
}
```

---

## 9. On-Chain Architecture

### Decision: Hybrid On-Chain/Off-Chain

After analyzing the existing codebase (which uses Supabase for marketplace listings with on-chain settlement via Metaplex Core plugins), the recipe marketplace follows the same pattern:

**Off-chain (Supabase):**
- Recipe metadata and content encryption keys
- Purchase records and access control
- Ratings, reviews, and social data
- Royalty ledger and settlement tracking
- Search/filter/sort queries

**On-chain (Solana):**
- Purchase transactions (SOL transfers with memo program for provenance)
- Royalty settlements (SOL transfers)
- NFT provenance (recipe ID in minted NFT metadata attributes)

**Why NOT a custom Anchor program:**

1. The existing marketplace already works without one -- listings use Metaplex Core's FreezeDelegate and TransferDelegate plugins with a server-managed authority keypair
2. Recipe purchases are simpler than NFT purchases (just a SOL transfer, no asset custody)
3. An Anchor program would add: development time, audit costs, deployment complexity, and a new attack surface
4. The provenance chain (which recipe produced which NFT) is captured in NFT metadata attributes, which are already on-chain via Arweave URIs referenced by Metaplex Core

**When to add an Anchor program (future consideration):**
- If trustless recipe purchases are required (currently the server mediates access)
- If on-chain royalty enforcement is needed (currently off-chain settlement)
- If recipe NFTs are desired (recipes as tradeable on-chain assets with ownership transfer)

### Purchase Transaction Structure

Recipe purchases use a simple SOL transfer with a memo for provenance:

```typescript
import { transferSol } from "@metaplex-foundation/mpl-toolbox";
import { addMemo } from "@solana-program/memo";

const builder = transactionBuilder()
  .add(
    transferSol(umi, {
      source: buyerSigner,
      destination: platformTreasury,  // Platform receives full amount
      amount: sol(recipe.priceSol),
    })
  )
  .add(
    addMemo(umi, {
      memo: JSON.stringify({
        type: "recipe_purchase",
        recipeId: recipe.id,
        version: recipe.version,
      }),
    })
  );
```

After confirmation, the server splits the payment:
- 85% forwarded to recipe creator's wallet
- 15% retained in platform treasury

This matches how the existing marketplace handles NFT purchases (server builds partially-signed tx, client signs for SOL transfer, server confirms and updates DB).

### Provenance Chain

When an NFT is minted using a recipe, the NFT's metadata includes:

```json
{
  "attributes": [
    { "trait_type": "Recipe", "value": "recipe_uuid" },
    { "trait_type": "Recipe Version", "value": "3" },
    { "trait_type": "Recipe Creator", "value": "creator_wallet_pubkey" }
  ]
}
```

This creates a queryable on-chain provenance chain:
- Recipe -> NFTs minted from it (query by attribute)
- NFT -> Recipe it was minted from (read metadata)
- Agent Remix -> Source recipes (stored in provenance metadata)
- Source Recipe -> All remixes (query royalty_ledger)

---

## 10. Technical Implementation

### File-by-File Breakdown

#### New Type Definitions

**`src/types/recipe.ts`** (new file)
All TypeScript interfaces from Section 2, plus:

```typescript
export interface RecipePurchase {
  id: string;
  recipeId: string;
  buyerWallet: string;
  priceLamports: number;
  txSignature: string;
  purchasedAt: string;
  decryptionKey: string;  // Buyer-specific, derived server-side
}

export interface RecipeReview {
  id: string;
  recipeId: string;
  reviewerWallet: string;
  rating: number;         // 1-5
  text: string;           // Max 500 chars
  createdAt: string;
  creatorResponse?: string;
}

export interface RoyaltyEntry {
  id: string;
  recipeId: string;
  creatorWallet: string;
  amountLamports: number;
  source: "sale" | "mint_royalty" | "remix_royalty";
  sourceId: string;       // Listing ID, mint address, or remix NFT address
  status: "pending" | "settled";
  settledAt?: string;
  settlementTx?: string;
}
```

#### Database Schema (Supabase)

**`recipes` table:**

```sql
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version INTEGER NOT NULL DEFAULT 1,

  -- Identity
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  creator_wallet TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Public metadata
  tags TEXT[] NOT NULL DEFAULT '{}',
  category TEXT NOT NULL,
  preview_images TEXT[] NOT NULL DEFAULT '{}',
  preview_description TEXT NOT NULL DEFAULT '',
  difficulty TEXT NOT NULL DEFAULT 'intermediate',
  estimated_generation_time INTEGER NOT NULL DEFAULT 30,
  compatible_models TEXT[] NOT NULL DEFAULT '{"flux-schnell"}',

  -- Marketplace
  price_lamports BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  sales_count INTEGER NOT NULL DEFAULT 0,
  total_revenue BIGINT NOT NULL DEFAULT 0,
  average_rating NUMERIC(2,1) NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  remix_count INTEGER NOT NULL DEFAULT 0,

  -- Versioning
  parent_recipe_id UUID REFERENCES recipes(id),

  -- Encryption
  encrypted_content_uri TEXT,       -- Arweave URI
  content_hash TEXT,                -- SHA-256 of plaintext
  encryption_key_encrypted TEXT,    -- CEK encrypted with master key

  -- Constraints
  CHECK (status IN ('draft', 'published', 'unlisted', 'suspended', 'archived')),
  CHECK (category IN ('illustration', 'photography', 'abstract', 'character',
    'landscape', 'architecture', 'fashion', 'food', 'music', 'cultural',
    'sci-fi', 'fantasy', 'horror', 'minimal', 'experimental', 'remix')),
  CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  CHECK (price_lamports >= 0)
);

CREATE INDEX idx_recipes_creator ON recipes(creator_wallet);
CREATE INDEX idx_recipes_status ON recipes(status);
CREATE INDEX idx_recipes_category ON recipes(category);
CREATE INDEX idx_recipes_slug ON recipes(slug);
CREATE INDEX idx_recipes_sales ON recipes(sales_count DESC);
CREATE INDEX idx_recipes_rating ON recipes(average_rating DESC);
CREATE INDEX idx_recipes_tags ON recipes USING gin(tags);
```

**`recipe_versions` table:**

```sql
CREATE TABLE recipe_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content_hash TEXT NOT NULL,
  encrypted_content_uri TEXT NOT NULL,
  changelog TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(recipe_id, version)
);
```

**`recipe_purchases` table:**

```sql
CREATE TABLE recipe_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id),
  recipe_version INTEGER NOT NULL,
  buyer_wallet TEXT NOT NULL,
  price_lamports BIGINT NOT NULL,
  tx_signature TEXT NOT NULL,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(recipe_id, buyer_wallet)  -- One purchase per wallet per recipe
);

CREATE INDEX idx_purchases_buyer ON recipe_purchases(buyer_wallet);
CREATE INDEX idx_purchases_recipe ON recipe_purchases(recipe_id);
```

**`recipe_reviews` table:**

```sql
CREATE TABLE recipe_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id),
  reviewer_wallet TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text TEXT NOT NULL DEFAULT '',
  creator_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(recipe_id, reviewer_wallet)  -- One review per wallet per recipe
);

CREATE INDEX idx_reviews_recipe ON recipe_reviews(recipe_id);
```

**`royalty_ledger` table:**

```sql
CREATE TABLE royalty_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id),
  creator_wallet TEXT NOT NULL,
  amount_lamports BIGINT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('sale', 'mint_royalty', 'remix_royalty')),
  source_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'settled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  settled_at TIMESTAMPTZ,
  settlement_tx TEXT
);

CREATE INDEX idx_royalty_creator ON royalty_ledger(creator_wallet, status);
CREATE INDEX idx_royalty_recipe ON royalty_ledger(recipe_id);
```

**`recipe_usage` table:**

```sql
CREATE TABLE recipe_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id),
  user_wallet TEXT NOT NULL,
  mint_address TEXT,              -- NULL if generated but not minted
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  minted_at TIMESTAMPTZ
);

CREATE INDEX idx_usage_recipe ON recipe_usage(recipe_id);
CREATE INDEX idx_usage_user ON recipe_usage(user_wallet);
```

#### New API Routes

**`src/app/api/recipes/route.ts`** -- List/search recipes (GET)

```typescript
// GET /api/recipes?category=illustration&sort=trending&page=1&limit=20&search=ukiyo-e
// Public endpoint (no auth required for browsing)
// Returns: { recipes: RecipePublicMetadata[], total: number, page: number }
```

**`src/app/api/recipes/publish/route.ts`** -- Create/publish recipe (POST)

```typescript
// POST /api/recipes/publish
// Auth required
// Body: { name, description, prompt, negativePrompt, styleParameters,
//         referenceImages (base64[]), postProcessing, creatorNotes,
//         tags, category, difficulty, compatibleModels, priceLamports,
//         previewImages (base64[]), previewDescription }
//
// Flow:
// 1. Validate all fields
// 2. Generate content encryption key (CEK)
// 3. Encrypt recipe content with CEK
// 4. Upload encrypted blob to Arweave
// 5. Upload preview images to Arweave (unencrypted)
// 6. Upload reference images within encrypted blob
// 7. Compute contentHash of plaintext
// 8. Store CEK (encrypted with master key) in Supabase
// 9. Create recipe record in Supabase
//
// Returns: { recipe: RecipePublicMetadata }
```

**`src/app/api/recipes/[id]/route.ts`** -- Get recipe detail (GET), Update recipe (PATCH)

```typescript
// GET /api/recipes/[id]
// Public: returns RecipePublicMetadata (no encrypted content)
// If caller has purchased: includes { owned: true }

// PATCH /api/recipes/[id]
// Auth required, must be creator
// Body: partial recipe fields to update
// If content fields change: re-encrypt, upload new blob, increment version
```

**`src/app/api/recipes/[id]/buy/route.ts`** -- Purchase recipe

```typescript
// POST /api/recipes/[id]/buy
// Auth required
// Body: { buyerWallet }
//
// Flow:
// 1. Verify recipe exists and is published
// 2. Verify buyer hasn't already purchased
// 3. Build SOL transfer transaction (buyer -> platform treasury)
//    with memo (recipe_purchase, recipeId)
// 4. Return partially signed tx for client to complete
//
// Returns: { transaction: base64, blockhash, priceLamports }
```

**`src/app/api/recipes/[id]/confirm-purchase/route.ts`** -- Confirm purchase after on-chain tx

```typescript
// POST /api/recipes/[id]/confirm-purchase
// Auth required
// Body: { buyerWallet, txSignature }
//
// Flow:
// 1. Verify tx on-chain (confirm the SOL transfer happened)
// 2. Create purchase record in Supabase
// 3. Increment sales_count and total_revenue
// 4. Record royalty entry (85% to creator as 'sale')
// 5. Derive buyer-specific decryption key
// 6. Decrypt recipe content
// 7. Return decrypted recipe
//
// Returns: { recipe: RecipeFullContent, decryptionKey: string }
```

**`src/app/api/recipes/[id]/decrypt/route.ts`** -- Decrypt recipe for existing purchaser

```typescript
// GET /api/recipes/[id]/decrypt
// Auth required, must have purchased
// Rate limited: 10 requests/hour
//
// Flow:
// 1. Verify purchase record exists
// 2. Decrypt and return recipe content
//
// Returns: { recipe: RecipeFullContent }
```

**`src/app/api/recipes/[id]/reviews/route.ts`** -- Reviews CRUD

```typescript
// GET /api/recipes/[id]/reviews?page=1&limit=20
// Public

// POST /api/recipes/[id]/reviews
// Auth required, must have purchased and used recipe at least once
// Body: { rating: number, text: string }

// PATCH /api/recipes/[id]/reviews
// Auth required (creator responding to a review)
// Body: { reviewId: string, response: string }
```

**`src/app/api/recipes/my/route.ts`** -- Seller dashboard data

```typescript
// GET /api/recipes/my
// Auth required
// Returns: { recipes: RecipeWithStats[], revenue: RevenueSummary }
```

**`src/app/api/recipes/my/royalties/route.ts`** -- Royalty management

```typescript
// GET /api/recipes/my/royalties
// Auth required
// Returns: { pending: number, settled: number, entries: RoyaltyEntry[] }

// POST /api/recipes/my/royalties/claim
// Auth required
// Triggers settlement of pending royalties
```

**`src/app/api/agent/remix/route.ts`** -- Agent remix endpoint

```typescript
// POST /api/agent/remix
// Admin-only (API key auth or cron secret)
// Body: { recipeIds?: string[] }  // Optional: specify recipes to remix
//
// If no recipeIds provided, auto-selects top trending recipes.
// See Section 6 for full remix algorithm.
```

#### New Client-Side Files

**`src/app/recipes/page.tsx`** -- Recipe marketplace browse page
**`src/app/recipes/[slug]/page.tsx`** -- Recipe detail page
**`src/app/recipes/create/page.tsx`** -- Recipe builder (multi-step form)
**`src/app/recipes/my/page.tsx`** -- Seller dashboard

**`src/components/recipes/RecipeCard.tsx`** -- Recipe card for grid display
**`src/components/recipes/RecipePreviewCarousel.tsx`** -- Image carousel for detail page
**`src/components/recipes/RecipePurchaseModal.tsx`** -- Purchase confirmation modal
**`src/components/recipes/RecipeContent.tsx`** -- Displays decrypted recipe content
**`src/components/recipes/RecipeReviews.tsx`** -- Reviews section
**`src/components/recipes/RecipeBuilder/PromptStep.tsx`** -- Builder step 1
**`src/components/recipes/RecipeBuilder/ParametersStep.tsx`** -- Builder step 2
**`src/components/recipes/RecipeBuilder/ReferencesStep.tsx`** -- Builder step 3
**`src/components/recipes/RecipeBuilder/PostProcessingStep.tsx`** -- Builder step 4
**`src/components/recipes/RecipeBuilder/PreviewStep.tsx`** -- Builder step 5
**`src/components/recipes/RecipeBuilder/MetadataStep.tsx`** -- Builder step 6
**`src/components/recipes/RecipeBuilder/PublishStep.tsx`** -- Builder step 7

**`src/hooks/useRecipes.ts`** -- Fetch and cache recipe listings
**`src/hooks/useRecipe.ts`** -- Fetch single recipe detail
**`src/hooks/useMyRecipes.ts`** -- Fetch seller's recipes + revenue
**`src/hooks/useRecipePurchase.ts`** -- Handle purchase flow
**`src/hooks/useRecipeDecrypt.ts`** -- Handle decryption of owned recipes

#### New Library Files

**`src/lib/recipes/encrypt.ts`** -- Server-side encryption/decryption utilities

```typescript
// Uses Node.js crypto module (server-only)
// - generateContentKey(): Generate AES-256-GCM key
// - encryptContent(plaintext, key): Encrypt recipe content
// - decryptContent(ciphertext, key): Decrypt recipe content
// - encryptKey(key, masterKey): Encrypt CEK with platform master key
// - decryptKey(encryptedKey, masterKey): Decrypt CEK
// - deriveBuyerKey(masterKey, buyerWallet, recipeId): Deterministic buyer key
// - computeContentHash(plaintext): SHA-256 hash
```

**`src/lib/recipes/watermark.ts`** -- Invisible watermarking

```typescript
// Embeds buyer wallet address as zero-width Unicode characters
// in the recipe's creatorNotes field
// - embedWatermark(text, walletAddress): string
// - extractWatermark(text): string | null
```

**`src/lib/recipes/trending.ts`** -- Trending score calculation

```typescript
// Server-side utility for computing recipe trend scores
// Used by both the browse endpoint and the Agent Remix Engine
// - computeTrendScore(recipe, recentSales, recentRatings): number
```

**`src/lib/solana/purchaseRecipe.ts`** -- Client-side purchase transaction

```typescript
// Similar pattern to buyNFT.ts:
// 1. Call /api/recipes/[id]/buy to get partially-signed tx
// 2. Client signs for SOL transfer (1 wallet popup)
// 3. Send and confirm on-chain
// 4. Call /api/recipes/[id]/confirm-purchase
// 5. Return decrypted recipe content
```

#### Modified Existing Files

**`src/types/index.ts`** -- Add `export * from './recipe';`

**`src/lib/constants.ts`** -- Add recipe-related constants:

```typescript
export const RECIPE = {
  MAX_PROMPT_LENGTH: 4000,
  MAX_NEGATIVE_PROMPT_LENGTH: 2000,
  MAX_CREATOR_NOTES_LENGTH: 5000,
  MAX_TAGS: 10,
  MAX_REFERENCE_IMAGES: 5,
  MAX_PREVIEW_IMAGES: 6,
  MIN_PREVIEW_IMAGES: 3,
  MAX_POST_PROCESSING_STEPS: 10,
  MAX_REVIEW_LENGTH: 500,
  CATEGORIES: [
    "illustration", "photography", "abstract", "character",
    "landscape", "architecture", "fashion", "food",
    "music", "cultural", "sci-fi", "fantasy",
    "horror", "minimal", "experimental", "remix",
  ],
  DIFFICULTIES: ["beginner", "intermediate", "advanced"],
  PLATFORM_COMMISSION: 0.15,     // 15% on recipe sales
  MINT_ROYALTY_CREATOR: 0.02,    // 2% to recipe creator on mint
  MINT_ROYALTY_PLATFORM: 0.01,   // 1% to platform on mint
  REMIX_PLATFORM_CUT: 0.10,     // 10% platform cut on remix sales
  REMIX_CREATOR_CUT: 0.90,      // 90% split among source creators
  MIN_SETTLEMENT_LAMPORTS: 100_000_000, // 0.1 SOL auto-settlement threshold
} as const;
```

**`src/lib/supabase.ts`** -- Add new row type interfaces:

```typescript
export interface RecipeRow {
  id: string;
  version: number;
  name: string;
  slug: string;
  description: string;
  creator_wallet: string;
  // ... all columns from the recipes table
}

export interface RecipePurchaseRow { /* ... */ }
export interface RecipeReviewRow { /* ... */ }
export interface RoyaltyLedgerRow { /* ... */ }
export interface RecipeUsageRow { /* ... */ }
```

**`src/app/api/generate/route.ts`** -- Accept recipe parameters:

Add support for `recipeId`, `guidanceScale`, `negativePrompt`, `scheduler`, and `seed` fields in the form data. When `recipeId` is present, verify the caller has purchased the recipe and record usage in `recipe_usage`.

**`src/app/api/upload-metadata/route.ts`** -- Include recipe provenance in NFT metadata:

When the client passes a `recipeId` in the request body, add recipe-related attributes to the metadata JSON before uploading to Arweave.

**`src/app/create/page.tsx`** -- Accept `?recipe=<id>` query parameter:

Add recipe pre-population logic. Show a banner when generating from a recipe. Pass recipe parameters through to the generate API.

**`src/components/layout/Header.tsx`** -- Add "Recipes" navigation link between "Create" and "Gallery."

#### New Environment Variables

```bash
# Recipe encryption master key (32-byte hex string)
RECIPE_MASTER_KEY=

# Royalty treasury keypair (for automated royalty settlements)
# Can reuse ARWEAVE_WALLET_SECRET or use a dedicated keypair
ROYALTY_TREASURY_SECRET=

# Agent remix cron secret (for securing the /api/agent/remix endpoint)
AGENT_REMIX_CRON_SECRET=

# LLM API key for agent remix synthesis (Claude or OpenAI)
ANTHROPIC_API_KEY=
# or
OPENAI_API_KEY=
```

---

## 11. Anti-Piracy & Trust

### The Reality

Recipe piracy cannot be eliminated. Once a buyer decrypts a recipe, they have the plaintext and can share it. This is true of all digital goods (music, movies, ebooks, prompts). The strategy is to make piracy inconvenient and make legitimate use more valuable.

### Protection Layers

**Layer 1: Invisible Watermarking**

Every decrypted recipe is personalized with the buyer's wallet address embedded as zero-width Unicode characters in the creator notes and prompt text. If a recipe appears publicly, the source can be traced.

```typescript
// Zero-width character encoding:
// \u200B = 0, \u200C = 1
// Wallet address (32 bytes = 256 bits) encoded as 256 zero-width chars
// Inserted at natural paragraph breaks in the text
```

**Layer 2: Usage Tracking**

Every time a recipe is used to generate an image (`/api/generate` with `recipeId`), the usage is logged. This creates a paper trail:

- Which wallet used which recipe, when
- Which mints were produced from which recipes
- Anomalies (a recipe being used from a wallet that didn't purchase it) can be detected

**Layer 3: Rate-Limited Decryption**

The decryption endpoint is rate-limited (10 requests/hour per wallet). A legitimate user who purchased a recipe needs to decrypt it occasionally. A pirate redistributing recipes would hit limits quickly.

**Layer 4: Reputation System**

- Buyers who leave reviews build reputation
- High-reputation buyers get access to exclusive recipes
- Accounts flagged for piracy lose reputation and purchasing ability
- This creates a social cost to piracy

**Layer 5: Community Reporting**

- Any user can flag a recipe as stolen/copied
- Reports go to a moderation queue
- If confirmed, the infringing recipe is suspended and the original creator is notified
- Repeat offenders are banned

**Layer 6: Value in Legitimacy**

The strongest anti-piracy measure is making legitimate ownership more valuable than a pirated copy:

- Legitimate purchasers get automatic updates when the recipe is versioned
- Legitimate purchasers can leave reviews (reputation building)
- Legitimate purchasers earn "recipe collector" badges
- Legitimate purchases are tracked for provenance (NFTs minted with a pirated recipe have no on-chain provenance link)
- Agent remix royalties only flow to recipes with verified ownership chains

### What We DON'T Do

- **No DRM that breaks usability**: The recipe content is plaintext once decrypted. No viewing restrictions, no session limits, no client-side enforcement.
- **No legal threats**: The platform relies on social and economic incentives, not legal frameworks that crypto-native users would ignore.
- **No blockchain-level access control**: On-chain encryption (like Lit Protocol) adds complexity and cost that isn't justified given the above layers.

---

## 12. Discovery & Curation

### Search and Filtering

**Full-text search** on recipe name, description, tags, and preview description. Implemented via Supabase `tsvector` indexes:

```sql
ALTER TABLE recipes ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', name), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(preview_description, '')), 'C') ||
    setweight(to_tsvector('english', array_to_string(tags, ' ')), 'B')
  ) STORED;

CREATE INDEX idx_recipes_search ON recipes USING gin(search_vector);
```

**Filters:**
- Category (multi-select)
- Price range (free, under 0.5 SOL, 0.5-2 SOL, 2+ SOL)
- Difficulty (beginner, intermediate, advanced)
- Compatible model
- Rating (4+, 3+, any)
- Tags (click any tag to filter)

**Sort options:**
- Trending (trend score algorithm)
- Newest
- Top rated
- Most sold
- Price: low to high
- Price: high to low

### Trending Algorithm

```typescript
function computeTrendScore(
  recipe: RecipeRow,
  recentSalesCount: number,    // Sales in last 7 days
  recentRatingAvg: number,     // Average rating from last 7 days
  daysSinceCreated: number
): number {
  // Time decay: newer recipes get a boost
  const recencyBoost = Math.max(0, 1 - daysSinceCreated / 30); // Full boost for 0 days, zero at 30 days

  // Sales velocity: recent sales vs total sales
  const salesVelocity = recipe.sales_count > 0
    ? recentSalesCount / recipe.sales_count
    : recentSalesCount;

  // Rating quality: weighted by count
  const ratingScore = recipe.rating_count > 0
    ? recipe.average_rating * Math.log10(recipe.rating_count + 1)
    : 0;

  // Remix popularity: agent remixes signal quality
  const remixScore = Math.log10(recipe.remix_count + 1) * 2;

  // Combine with weights
  return (
    salesVelocity * 40 +
    ratingScore * 25 +
    remixScore * 20 +
    recencyBoost * 15
  );
}
```

### Tags and Categories

Tags are free-form strings (lowercase, alphanumeric + hyphens, max 30 chars each). The system tracks tag frequency across all recipes and surfaces popular tags as suggested filters.

Categories are a fixed enum (see Section 2). Each recipe has exactly one primary category.

### Featured Recipes

A `featured_recipes` table allows manual curation by platform operators:

```sql
CREATE TABLE featured_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id),
  featured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  position INTEGER NOT NULL DEFAULT 0,  -- Display order
  label TEXT  -- "Editor's Pick", "Agent Favorite", etc.
);
```

Featured recipes appear in a horizontal carousel at the top of the `/recipes` page.

### Agent-Curated Collections

Phase 2 agents can curate "Collections" -- ordered lists of recipes grouped by theme or aesthetic. These collections are displayed on the agent's profile page and linked from the recipe marketplace. This is a Phase 2/3 integration point rather than a standalone feature.

---

## 13. Revenue Model

### Platform Economics

**Revenue streams:**

| Stream | Per-Unit Revenue | Monthly Volume (Est.) | Monthly Revenue |
|---|---|---|---|
| Recipe sales (15% commission) | ~0.075 SOL (avg recipe 0.5 SOL) | 500 sales | 37.5 SOL |
| Mint royalties (1% platform) | ~0.0001 SOL per mint | 2,000 mints | 0.2 SOL |
| Agent remix sales (10%) | ~0.2 SOL (avg hybrid 2 SOL) | 50 remixes | 10 SOL |
| **Total** | | | **~47.7 SOL/month** |

At SOL = $150, that's approximately $7,155/month at modest scale.

**At 10x scale** (5,000 sales, 20,000 mints, 500 remixes): ~477 SOL/month (~$71,550/month).

### Cost Analysis

**Fixed monthly costs:**

| Cost | Amount | Notes |
|---|---|---|
| Vercel Pro | $20/month | Hosting, cron jobs |
| Supabase Pro | $25/month | Database |
| Replicate API | ~$50-200/month | AI generation (for agent remixes + preview generation) |
| Arweave storage | ~$5-20/month | Encrypted blobs + preview images |
| LLM API (Claude/GPT) | ~$20-50/month | Agent remix synthesis |
| **Total** | **~$120-315/month** | |

**Variable costs per recipe publish:**
- Arweave upload (encrypted blob + preview images): ~0.001 SOL
- Replicate generation (3-6 preview images): ~$0.05-0.15

**Variable costs per recipe purchase:**
- Solana tx fee: ~0.000005 SOL (negligible)
- Server compute for decryption: negligible

**Break-even point:** At the modest volume estimates (500 sales/month, avg 0.5 SOL recipe), platform revenue is ~37.5 SOL (~$5,625). Costs are ~$200/month. The platform is profitable from day one at any reasonable scale, because the fixed costs are low and the variable costs per transaction are near-zero.

### Creator Economics

A recipe creator who publishes a quality recipe can expect:

**Conservative scenario** (50 sales at 0.5 SOL, 200 mints using the recipe):
- Sale revenue: 50 * 0.5 * 0.85 = 21.25 SOL
- Mint royalties: 200 * 0.01 * 0.02 = 0.04 SOL (negligible at this scale)
- If 1 agent remix sells for 2 SOL: 2 * 0.9 * (their weight) = ~0.9-1.8 SOL
- **Total: ~22-23 SOL (~$3,300-3,450)**

**Optimistic scenario** (500 sales at 1 SOL, 2000 mints, 5 agent remixes at 3 SOL avg):
- Sale revenue: 500 * 1 * 0.85 = 425 SOL
- Mint royalties: 2000 * 0.01 * 0.02 = 0.4 SOL
- Agent remixes: 5 * 3 * 0.9 * 0.5 (avg weight) = 6.75 SOL
- **Total: ~432 SOL (~$64,800)**

The key economic insight: the agent remix royalty creates ongoing passive income. A popular recipe that gets remixed repeatedly generates revenue without the creator doing any additional work.

---

## 14. Risks & Mitigations

### Risk 1: Recipe Quality Variance

**Risk**: The marketplace fills with low-quality recipes that are just basic prompts wrapped in the recipe format. Buyers lose trust.

**Mitigation**:
- **Minimum preview images**: Require 3+ preview images showing actual outputs. Buyers judge quality by results, not descriptions.
- **Rating system**: Low-rated recipes sink in search results. The trending algorithm heavily weights ratings.
- **Creator reputation**: Track creator-level stats (average rating, total sales). Surface "Top Creator" badges.
- **Agent remix as quality signal**: If the Curator Agent selects a recipe for remixing, it gets a visible "Agent Remix" badge -- a quality endorsement.
- **Editorial curation**: The featured recipes carousel is manually curated to showcase quality.

### Risk 2: Piracy

**Risk**: Buyers share purchased recipes freely, undermining the marketplace.

**Mitigation**: See Section 11 in full. The core strategy is making legitimate ownership more valuable (updates, provenance, reputation) rather than trying to prevent copying (which is impossible for digital goods).

**Residual risk**: Accepted. Even Spotify and Netflix face piracy. The convenience + value of legitimate access must outweigh the effort of piracy.

### Risk 3: Market Liquidity (Will Recipes Actually Sell?)

**Risk**: Nobody buys recipes because they can just write their own prompts.

**Mitigation**:
- **Free recipes** as entry point: Let creators offer free recipes to demonstrate value. Users who try free recipes and see quality results are more likely to pay for premium ones.
- **Recipe-in-Create integration**: The "Use this Recipe" flow is dramatically easier than manual prompt writing. One-click generation vs. 30 minutes of prompt engineering.
- **Agent remix revenue sharing**: Even if direct sales are slow, the agent remix system generates value from recipes autonomously. Creators earn royalties without needing a buyer.
- **Price floor**: Recommended starting price of 0.1 SOL (~$15) is low enough for impulse buys.

### Risk 4: Cold Start Problem

**Risk**: No recipes means no buyers. No buyers means no creators. Classic marketplace chicken-and-egg.

**Mitigation**:
- **Seed the marketplace**: The platform team creates 20-30 high-quality recipes across categories and publishes them (some free, some paid). This establishes quality expectations and gives buyers something to browse.
- **Convert existing users**: The current mintIT userbase already generates AI art. The recipe builder can analyze their existing creations and suggest "Would you like to publish this as a recipe?" -- converting existing workflows into marketplace listings.
- **Agent-generated recipes**: Phase 2 agents can auto-generate and publish recipes based on their creative experiments. This provides a baseline supply.
- **Creator incentives**: First 50 published recipes get a fee waiver + featured placement.

### Risk 5: Model Dependency

**Risk**: Recipes are tied to specific AI models (Flux Schnell, SDXL, etc.). If models change or become unavailable, recipes break.

**Mitigation**:
- **`compatibleModels` field**: Recipes explicitly list which models they work with.
- **Model abstraction**: The recipe format separates creative intent (prompt, mood, references) from technical parameters (model-specific settings). When a new model is added, recipes can be "translated" by the agent.
- **Version updates**: Creators can update recipes to support new models. All versions are preserved.
- **Platform model support**: Maintain support for all models referenced by published recipes, even if newer models are available.

### Risk 6: Legal/IP Concerns

**Risk**: Recipes that reference copyrighted artwork, trademarked styles, or specific artist names could create legal issues.

**Mitigation**:
- **Content guidelines**: Clear terms of service prohibiting recipes that reference specific living artists by name or copy trademarked styles.
- **Community reporting**: Flagging system for IP concerns.
- **Review before featuring**: Manually curated featured recipes are reviewed for IP issues.
- **Disclaimer**: Standard "AI-generated content" disclaimer on all outputs.

---

## 15. Timeline Estimate

### Phase 3A: MVP (6-8 weeks)

**Goal**: Minimal viable recipe marketplace with buy/sell flow.

**Week 1-2: Foundation**
- Database schema (all tables, indexes, search vectors)
- Recipe type definitions
- Encryption/decryption library
- Environment variable setup
- Constants and configuration

**Week 3-4: API Routes**
- `/api/recipes` (list/search)
- `/api/recipes/publish` (create)
- `/api/recipes/[id]` (detail)
- `/api/recipes/[id]/buy` (purchase)
- `/api/recipes/[id]/confirm-purchase` (settle)
- `/api/recipes/[id]/decrypt` (access)
- `/api/recipes/my` (dashboard)

**Week 5-6: UI**
- `/recipes` browse page with search, filters, sort
- `/recipes/[slug]` detail page with preview carousel
- Recipe purchase modal and flow
- Recipe content display (after purchase)
- `/recipes/my` seller dashboard
- Header navigation update

**Week 7-8: Recipe Builder + Integration**
- `/recipes/create` multi-step builder
- Modify `/create` page to accept recipe pre-population
- Modify `/api/generate` to accept recipe parameters
- Modify `/api/upload-metadata` to include recipe provenance
- Seed marketplace with 20+ recipes
- Testing and bug fixes

**MVP excludes**: Agent Remix Engine, rating/review system, royalty settlement, watermarking, advanced trending algorithm.

### Phase 3B: Complete (4-6 weeks after MVP)

**Goal**: Full feature set including agent integration.

**Week 9-10: Social & Trust**
- Rating/review system (UI + API)
- Watermarking (invisible Unicode embedding)
- Community reporting/flagging
- Creator reputation scoring

**Week 11-12: Revenue**
- Royalty ledger and tracking
- Mint royalty recording (modify generate/upload-metadata flow)
- Royalty settlement (manual claim + batch auto-settlement)
- Revenue dashboard for sellers

**Week 13-14: Agent Remix Engine**
- Trending score algorithm
- `/api/agent/remix` endpoint
- LLM synthesis for hybrid prompt generation
- Auto-generation and minting of hybrids
- Provenance recording (source recipe attribution)
- Royalty distribution for remixes
- Cron job setup (weekly remix cycle)

### Dependencies on Phase 1 and Phase 2

**Phase 1 (Cultural Mirrors) dependencies**: None. Phase 3 is independent of living NFTs. However, Cultural Mirrors can benefit from recipes (a Cultural Mirror's visual style could be defined by a recipe).

**Phase 2 (Agent-as-NFT) dependencies**:
- **Agent Remix Engine** (Phase 3B) can function without Phase 2 agents. The "Curator Agent" in Phase 3 is a server-side script, not an Agent-as-NFT. However, once Phase 2 is live, the Curator Agent can be upgraded to an actual Agent-as-NFT with personality and memory.
- **Agent purchasing/creating recipes** (Section 8) requires Phase 2 to be live. This is a Phase 3B+ feature that activates when Phase 2 ships.
- **Agent-curated collections** require Phase 2.

**In summary**: Phase 3A (MVP) has zero dependencies on Phase 1 or Phase 2. Phase 3B's Agent Remix Engine works standalone. Full Phase 2 integration (agents as recipe consumers/creators) is an additive feature layered on after both phases are live.

---

## Appendix A: API Route Summary

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/recipes` | No | Browse/search recipes |
| POST | `/api/recipes/publish` | Yes | Create and publish a recipe |
| GET | `/api/recipes/[id]` | No | Get recipe public metadata |
| PATCH | `/api/recipes/[id]` | Yes (creator) | Update recipe |
| POST | `/api/recipes/[id]/buy` | Yes | Build purchase transaction |
| POST | `/api/recipes/[id]/confirm-purchase` | Yes | Confirm purchase, get content |
| GET | `/api/recipes/[id]/decrypt` | Yes (purchaser) | Decrypt owned recipe |
| GET | `/api/recipes/[id]/reviews` | No | List reviews |
| POST | `/api/recipes/[id]/reviews` | Yes (purchaser) | Submit review |
| PATCH | `/api/recipes/[id]/reviews` | Yes (creator) | Respond to review |
| GET | `/api/recipes/my` | Yes | Seller dashboard |
| GET | `/api/recipes/my/royalties` | Yes | Royalty details |
| POST | `/api/recipes/my/royalties/claim` | Yes | Claim pending royalties |
| POST | `/api/agent/remix` | Admin | Trigger agent remix |

## Appendix B: New File Tree

```
src/
├── types/
│   └── recipe.ts                          (NEW)
├── lib/
│   ├── constants.ts                       (MODIFIED - add RECIPE constants)
│   ├── supabase.ts                        (MODIFIED - add row types)
│   ├── recipes/
│   │   ├── encrypt.ts                     (NEW)
│   │   ├── watermark.ts                   (NEW)
│   │   └── trending.ts                    (NEW)
│   └── solana/
│       └── purchaseRecipe.ts              (NEW)
├── hooks/
│   ├── useRecipes.ts                      (NEW)
│   ├── useRecipe.ts                       (NEW)
│   ├── useMyRecipes.ts                    (NEW)
│   ├── useRecipePurchase.ts               (NEW)
│   └── useRecipeDecrypt.ts                (NEW)
├── components/
│   ├── layout/
│   │   └── Header.tsx                     (MODIFIED - add Recipes nav)
│   └── recipes/
│       ├── RecipeCard.tsx                  (NEW)
│       ├── RecipePreviewCarousel.tsx       (NEW)
│       ├── RecipePurchaseModal.tsx         (NEW)
│       ├── RecipeContent.tsx              (NEW)
│       ├── RecipeReviews.tsx              (NEW)
│       └── RecipeBuilder/
│           ├── PromptStep.tsx             (NEW)
│           ├── ParametersStep.tsx         (NEW)
│           ├── ReferencesStep.tsx         (NEW)
│           ├── PostProcessingStep.tsx     (NEW)
│           ├── PreviewStep.tsx            (NEW)
│           ├── MetadataStep.tsx           (NEW)
│           └── PublishStep.tsx            (NEW)
├── app/
│   ├── create/
│   │   └── page.tsx                       (MODIFIED - recipe pre-population)
│   ├── recipes/
│   │   ├── page.tsx                       (NEW - browse/search)
│   │   ├── [slug]/
│   │   │   └── page.tsx                   (NEW - detail)
│   │   ├── create/
│   │   │   └── page.tsx                   (NEW - builder)
│   │   └── my/
│   │       └── page.tsx                   (NEW - dashboard)
│   └── api/
│       ├── generate/
│       │   └── route.ts                   (MODIFIED - recipe params)
│       ├── upload-metadata/
│       │   └── route.ts                   (MODIFIED - recipe provenance)
│       ├── recipes/
│       │   ├── route.ts                   (NEW - list/search)
│       │   ├── publish/
│       │   │   └── route.ts               (NEW)
│       │   ├── my/
│       │   │   ├── route.ts               (NEW)
│       │   │   └── royalties/
│       │   │       └── route.ts           (NEW)
│       │   └── [id]/
│       │       ├── route.ts               (NEW - detail/update)
│       │       ├── buy/
│       │       │   └── route.ts           (NEW)
│       │       ├── confirm-purchase/
│       │       │   └── route.ts           (NEW)
│       │       ├── decrypt/
│       │       │   └── route.ts           (NEW)
│       │       └── reviews/
│       │           └── route.ts           (NEW)
│       └── agent/
│           └── remix/
│               └── route.ts               (NEW)
```

## Appendix C: Environment Variables

```bash
# Existing (no changes)
NEXT_PUBLIC_SOLANA_RPC_URL=
NEXT_PUBLIC_SOLANA_NETWORK=
NEXT_PUBLIC_PRIVY_APP_ID=
REPLICATE_API_TOKEN=
ARWEAVE_WALLET_SECRET=
MARKETPLACE_AUTHORITY_SECRET=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# New for Phase 3
RECIPE_MASTER_KEY=           # 32-byte hex string for AES-256-GCM key encryption
ROYALTY_TREASURY_SECRET=     # JSON byte array (Solana keypair) for royalty payouts
AGENT_REMIX_CRON_SECRET=     # Random string to authenticate cron/admin calls
ANTHROPIC_API_KEY=           # For agent remix LLM synthesis (Claude)
```
