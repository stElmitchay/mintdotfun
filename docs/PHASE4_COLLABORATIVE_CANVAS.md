# Phase 4: Collaborative Canvas (Jam Sessions) -- Implementation Plan

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [Session Lifecycle](#2-session-lifecycle)
3. [Fragment Types](#3-fragment-types)
4. [AI Synthesis Engine](#4-ai-synthesis-engine)
5. [Voting & Selection](#5-voting--selection)
6. [Fractional Ownership](#6-fractional-ownership)
7. [Agent Integration (Phase 2)](#7-agent-integration-phase-2)
8. [Session Types](#8-session-types)
9. [Real-Time UI/UX](#9-real-time-uiux)
10. [The Archive](#10-the-archive)
11. [On-Chain Architecture](#11-on-chain-architecture)
12. [Technical Implementation](#12-technical-implementation)
13. [Social Features](#13-social-features)
14. [Revenue Model](#14-revenue-model)
15. [Risks & Mitigations](#15-risks--mitigations)
16. [Timeline Estimate](#16-timeline-estimate)

---

## 1. Product Vision

### The Jam Session Metaphor

A jazz jam session works like this: musicians show up, someone counts off, and everyone contributes to a single emergent piece of music. Nobody owns the melody alone. The drummer doesn't control the bassline. The result is irreducible -- it could not have existed without every participant, and it could never be recreated the same way twice.

That is the model for Phase 4. Not a collaborative canvas where people paint in separate quadrants. Not a "layer" system where Contributor A controls the background and Contributor B controls a foreground element. Those are parallel creations stapled together. A jam session is a single, unified creative act performed by multiple people simultaneously.

**What this is NOT:**
- Async Art's layer model (stalled because layers are isolated, not synthesized; contributors don't influence each other)
- Exquisite Corpse (each person adds a sequential piece; the result is intentionally disjointed)
- Google Docs for art (real-time co-editing of the same canvas; requires artistic skill)
- A voting-only system like Botto (participants vote but don't contribute creative material)

**What this IS:**
- Multiple people contribute creative *fragments* -- text descriptions, mood references, color choices, style preferences
- An AI synthesis engine weaves those fragments into a single coherent piece that none of the contributors could have made alone
- The session is time-bounded (like a live musical performance -- it starts, it happens, it ends)
- The final output is minted as a single NFT with fractional ownership among all contributors
- The entire creative process -- every fragment, every synthesis step -- is permanently archived on Arweave

### Why This Is Different

The research is clear on what fails and what works in collaborative NFTs:

| Approach | Project | Status | Why |
|----------|---------|--------|-----|
| Multi-artist layers | Async Art | Stalled | Too complex, contributors are isolated, no social energy |
| Collector-as-parameter | fxhash | Working | Simple, the AI/algorithm does the hard work, collector feels ownership |
| Community curation | Botto DAO | Working (50K+ members) | Voting is low-friction, AI produces the art, community shapes direction |
| Real-time co-creation | Various | Failed repeatedly | Requires artistic skill, coordination overhead kills momentum |

The pattern: **AI must do the synthesis. Humans contribute direction, not execution. Time pressure creates energy. Low barrier to entry (no art skill required).**

Jam Sessions sit at the intersection of fxhash's "contributor-as-shaper" model and Botto's "collective curation" model, but adds what neither has: **real-time social creation with multiple contributors influencing a single piece.**

### The Cultural Angle

mintIT's thesis is that culture is the underserved layer of the NFT stack. Jam Sessions operationalize that thesis. A session themed "Afrofuturism meets Tokyo street style" isn't just a prompt -- it's a cultural conversation between contributors who bring different perspectives. The AI doesn't average those perspectives; it synthesizes them into something none of the contributors would have imagined alone.

The jam session artifact -- the final NFT plus its full archive of fragments and synthesis steps -- becomes a permanent cultural document. It records not just what was created, but how a group of people thought about a cultural theme at a specific moment in time.

---

## 2. Session Lifecycle

### Overview

```
┌─────────┐    ┌──────────┐    ┌───────────┐    ┌───────────┐    ┌────────┐    ┌────────┐    ┌───────────┐
│ CREATED │───>│  OPEN    │───>│ SYNTHESIS │───>│  VOTING   │───>│ MINTING│───>│ MINTED │───>│ ARCHIVED  │
└─────────┘    └──────────┘    └───────────┘    └───────────┘    └────────┘    └────────┘    └───────────┘
                Contributors     AI generates     Contributors     On-chain     NFT live,     Full process
                submit           variations        vote on          mint tx      ownership     stored on
                fragments        from fragments    best output                   distributed   Arweave
```

### 2a. Session Creation

**Who can create a session:**
- Any authenticated wallet (via Privy)
- Agent-as-NFTs (Phase 2) acting autonomously
- The platform itself (featured/sponsored sessions)

**Creation parameters:**

```typescript
interface SessionConfig {
  // Identity
  id: string;                          // UUID, server-generated
  creatorWallet: string;               // Solana pubkey of session creator
  agentId?: string;                    // If created by an Agent-as-NFT

  // Theme
  title: string;                       // "Afrofuturism meets Tokyo Street Style"
  description: string;                 // Longer explanation of the theme/vibe
  themeKeywords: string[];             // ["afrofuturism", "tokyo", "street-style", "neon"]
  seedImageUrl?: string;               // Optional starting reference image
  styleRecipeId?: string;              // Optional Style Recipe from Phase 3

  // Timing
  contributionWindowMinutes: number;   // 15 | 30 | 60 | 180 | 1440 (24h)
  votingWindowMinutes: number;         // 15 | 30 | 60

  // Participation
  maxContributors: number;             // 5 | 10 | 25 | 50
  entryFeeLamports: number;            // 0 for free, or amount in lamports
  isInviteOnly: boolean;               // If true, requires invite codes
  invitedWallets?: string[];           // Specific wallets allowed

  // Output
  variationCount: number;              // Number of AI variations to generate (3 | 5 | 7)

  // Session type
  type: "open" | "invite" | "agent-hosted" | "battle" | "chain";
}
```

**Creation flow:**
1. Creator fills out session form on `/jam/create`
2. If entry fee > 0, creator deposits the fee into the session PDA (they are the first contributor)
3. Server creates session record in Supabase with status `created`
4. Session goes live immediately (status -> `open`) or at a scheduled time
5. Session appears on `/jam` listing page

### 2b. Open Contribution Window

Once a session is `open`, any eligible wallet can join and submit fragments.

**Joining a session:**
1. User navigates to `/jam/[sessionId]`
2. User clicks "Join Session" -- if there's an entry fee, they sign a SOL transfer to the session PDA
3. Server records the contributor in the `session_contributors` table
4. User can now submit fragments

**Contribution window rules:**
- Window starts when session status changes to `open`
- Window ends after `contributionWindowMinutes` OR when `maxContributors` is reached, whichever comes first
- Each contributor can submit up to 3 fragments (prevents one person dominating)
- Fragments are visible to all participants in real-time (this is the social/jam aspect)
- Contributors can update/replace their fragments during the window (but not add more than 3)
- A countdown timer is visible on the session page

**Early close:**
- If `maxContributors` is reached, the contribution window closes early
- The session creator can manually close the window early (minimum: 2 contributors)
- If < 2 contributors by end of window, session is cancelled and fees are refunded

### 2c. Fragment Submission

See [Section 3: Fragment Types](#3-fragment-types) for detailed breakdown.

Each fragment is validated server-side, stored in Supabase, and broadcast to all session participants via real-time subscription.

### 2d. AI Synthesis

When the contribution window closes, the session status changes to `synthesizing`.

See [Section 4: AI Synthesis Engine](#4-ai-synthesis-engine) for the full pipeline.

**High-level flow:**
1. All fragments are collected and structured
2. An LLM (Claude) generates a unified scene description from all fragments
3. The scene description is fed to an image generation model (Flux)
4. `variationCount` variations are produced
5. All variations are stored temporarily (Supabase Storage or S3, not yet on Arweave)
6. Session status changes to `voting`

**Duration:** Synthesis typically takes 30-120 seconds depending on variation count. Contributors see a live progress indicator.

### 2e. Variation Voting

See [Section 5: Voting & Selection](#5-voting--selection) for detailed mechanics.

**High-level flow:**
1. All variations are displayed to contributors
2. Each contributor gets 1 vote
3. Voting window runs for `votingWindowMinutes`
4. Highest-voted variation wins (ties broken by earliest submission time)
5. Session status changes to `minting`

### 2f. Final Minting

**Minting flow:**
1. The winning variation image is uploaded to Arweave (via server-side Irys, same as existing `upload-metadata` route)
2. Full session metadata (all fragments, contributor list, synthesis parameters) is uploaded to Arweave as the "archive"
3. NFT metadata JSON is constructed with:
   - The winning image as the primary image
   - All contributor wallets in the `creators` array with proportional shares
   - Session archive URI in the metadata `properties`
   - Session ID and type in attributes
4. The NFT is minted using Metaplex Core `createV2` -- the mint transaction is signed by the platform's server keypair (same `ARWEAVE_WALLET_SECRET` identity used for uploads), NOT by individual contributors
5. Ownership is recorded via a custom revenue-split mechanism (see [Section 6](#6-fractional-ownership))
6. Session status changes to `minted`

**Why server-side minting:**
With N contributors, asking all N wallets to co-sign a single transaction is impractical (they may be offline, different timezones, etc). The platform mints on behalf of all contributors using the session treasury (funded by entry fees). The NFT's update authority is set to the platform, and revenue splits are managed by the on-chain program.

### 2g. Revenue Distribution

See [Section 6: Fractional Ownership](#6-fractional-ownership) for the full model.

**Summary:**
- Entry fees fund the minting costs (Arweave + Solana tx fees)
- Remaining entry fees are held in the session PDA
- When the NFT sells on a marketplace, royalties flow to the session PDA
- The on-chain program distributes royalties proportionally to all contributors
- Contributors can claim their share at any time

---

## 3. Fragment Types

Each fragment type is designed to be low-barrier (no artistic skill required) but creatively meaningful.

### 3a. Text Prompts (Mood Descriptions, Scene Elements)

**What the contributor provides:**
- A free-text description of a mood, scene element, or visual concept
- Maximum 280 characters (tweet-length -- keeps it punchy)
- Examples: "neon-lit market stalls at midnight", "holographic ankara fabric draped over chrome architecture", "the feeling of bass vibrating through your chest"

**How it's used in synthesis:**
- Fed directly to the LLM as contributor context
- The LLM weaves all text prompts into a single scene description
- Text prompts are the highest-signal fragment type -- they carry the most creative intent

**Validation:**
- Content moderation via LLM check (flag hate speech, explicit content)
- Minimum 10 characters (prevent empty/trivial contributions)
- Maximum 280 characters

**Data model:**
```typescript
interface TextFragment {
  type: "text";
  content: string;           // The prompt text
  contributorWallet: string;
  submittedAt: string;       // ISO timestamp
}
```

### 3b. Reference Images

**What the contributor provides:**
- An uploaded image that captures a mood, texture, color palette, or compositional idea
- Max 5MB, formats: PNG, JPEG, WebP
- This is NOT the final art -- it's a reference/inspiration

**How it's used in synthesis:**
- The LLM analyzes the image and extracts visual descriptors (colors, textures, composition, mood)
- These descriptors are incorporated into the unified scene description
- If the image model supports img2img, reference images may be used as style references (low influence weight, ~0.2-0.3 prompt_strength)

**Validation:**
- File size and type checks (reuse existing `GENERATION.MAX_REFERENCE_IMAGE_SIZE` and `GENERATION.ALLOWED_IMAGE_TYPES`)
- NSFW detection before accepting
- Images are resized server-side to a standard resolution (1024x1024 max) for consistency

**Data model:**
```typescript
interface ImageFragment {
  type: "image";
  imageUrl: string;          // URL after upload to temp storage
  altText?: string;          // Optional description of what the image represents
  contributorWallet: string;
  submittedAt: string;
}
```

### 3c. Style Votes

**What the contributor provides:**
- A selection from a curated set of visual directions generated from the session theme
- When a session opens, the system auto-generates 4-6 style direction cards based on the theme keywords
- Each card has a label, a short description, and a small preview thumbnail
- Contributors pick 1-2 that resonate with them

**How style directions are generated:**
1. Session theme + keywords are sent to the LLM
2. LLM generates 4-6 distinct visual interpretations (e.g., for "Afrofuturism meets Tokyo": "Neon Shrine" / "Chrome Savanna" / "Digital Kente" / "Akira Market" / "Cosmic Highlife")
3. Each direction gets a brief image generation to create a thumbnail preview
4. These are pre-computed when the session opens

**How it's used in synthesis:**
- Style votes are tallied -- the most-voted direction(s) have stronger influence on the scene description
- Minority style votes are not discarded; they add secondary texture

**Data model:**
```typescript
interface StyleVoteFragment {
  type: "style_vote";
  styleDirectionIds: string[];  // 1-2 selected direction IDs
  contributorWallet: string;
  submittedAt: string;
}

interface StyleDirection {
  id: string;
  sessionId: string;
  label: string;               // "Neon Shrine"
  description: string;         // "Torii gates in chrome, ankara patterns in neon"
  thumbnailUrl: string;
  voteCount: number;           // Updated in real-time
}
```

### 3d. Color Palettes

**What the contributor provides:**
- A selection of 3-5 colors from a color picker
- Or a selection from pre-generated palette options (similar to Coolors.co style)

**How it's used in synthesis:**
- All contributor palettes are merged -- most frequently selected colors get priority
- The final color palette (5-7 colors) is included in the scene description as a constraint
- The image model receives color guidance through the prompt ("dominant colors: deep indigo, electric gold, matte black")

**Data model:**
```typescript
interface ColorFragment {
  type: "color";
  colors: string[];            // Hex values, 3-5 colors
  contributorWallet: string;
  submittedAt: string;
}
```

### 3e. Style Recipe Selections (Phase 3 Integration)

**What the contributor provides:**
- A Style Recipe ID from the Phase 3 marketplace
- The contributor must own the recipe (purchased or created it)

**How it's used in synthesis:**
- The recipe's style parameters, prompt modifiers, and reference materials are injected into the synthesis pipeline
- A recipe is treated as a "super-fragment" -- it carries more structured creative information than a text prompt
- Only 1 recipe per session is used; if multiple contributors submit recipes, the most-voted one is selected during a brief "recipe vote" before synthesis begins

**Data model:**
```typescript
interface RecipeFragment {
  type: "recipe";
  recipeId: string;            // Phase 3 Style Recipe ID
  recipeName: string;
  contributorWallet: string;
  submittedAt: string;
}
```

### Fragment Summary

| Type | Barrier | Signal Strength | Max per Contributor |
|------|---------|----------------|-------------------|
| Text prompt | Very low | High | 1 |
| Reference image | Low | Medium | 1 |
| Style vote | Very low | Medium | 1 (selecting 1-2 directions) |
| Color palette | Very low | Low-Medium | 1 |
| Style Recipe | Medium (must own recipe) | High | 1 |

Each contributor can submit up to 3 fragments total, choosing from any combination of the above types (but at most 1 of each type). This means a contributor might submit a text prompt + a color palette + a style vote, or a reference image + a text prompt + a style recipe.

---

## 4. AI Synthesis Engine

The synthesis engine is the core technology that makes jam sessions work. It transforms N diverse fragments from N contributors into a single coherent creative output.

### 4a. LLM-Powered Scene Description Generation

**Pipeline:**

```
Fragments ──> Fragment Processor ──> LLM Scene Composer ──> Scene Description ──> Image Generator ──> Variations
```

**Step 1: Fragment Processing**

All fragments are structured into a single context document:

```typescript
interface SynthesisContext {
  sessionId: string;
  theme: {
    title: string;
    description: string;
    keywords: string[];
  };
  textPrompts: Array<{
    text: string;
    contributorWallet: string;
    weight: number;              // See 4c. Weighting
  }>;
  imageAnalyses: Array<{
    description: string;         // LLM-generated description of the reference image
    dominantColors: string[];
    mood: string;
    contributorWallet: string;
    weight: number;
  }>;
  styleVoteTally: Array<{
    direction: StyleDirection;
    voteCount: number;
    percentage: number;          // As fraction of total votes
  }>;
  colorPalette: {
    merged: string[];            // Final merged palette (5-7 colors)
    allSubmitted: string[][];    // All individual palettes for reference
  };
  styleRecipe?: {
    id: string;
    name: string;
    promptModifiers: string;
    styleParameters: Record<string, unknown>;
  };
  contributorCount: number;
}
```

**Step 2: Reference Image Analysis**

Before the main synthesis, each reference image is analyzed independently:

```typescript
// Server-side: POST /api/jam/analyze-image
async function analyzeReferenceImage(imageUrl: string): Promise<ImageAnalysis> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 300,
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "url", url: imageUrl } },
        { type: "text", text: "Describe this image's visual qualities in 2-3 sentences. Focus on: dominant colors, textures, mood, lighting, composition style. Do not describe literal content -- describe the *feeling* and *aesthetic*." }
      ]
    }]
  });
  return {
    description: response.content[0].text,
    dominantColors: extractColors(response),
    mood: extractMood(response)
  };
}
```

**Step 3: LLM Scene Composition**

The core synthesis step. A single LLM call that takes the full `SynthesisContext` and produces a unified scene description:

```typescript
const SCENE_COMPOSER_PROMPT = `You are the AI synthesis engine for a collaborative art creation platform.
Multiple contributors have submitted creative fragments for a themed art piece.
Your job is to weave ALL contributions into a single, coherent scene description
that honors every contributor's input while creating something greater than the sum of parts.

SESSION THEME: {theme.title}
THEME DESCRIPTION: {theme.description}

CONTRIBUTOR TEXT PROMPTS (weighted by contribution significance):
{textPrompts.map(p => `- [weight: ${p.weight}] "${p.text}"`).join('\n')}

REFERENCE IMAGE ANALYSES:
{imageAnalyses.map(a => `- [weight: ${a.weight}] ${a.description} (mood: ${a.mood})`).join('\n')}

STYLE DIRECTION VOTES (ranked by popularity):
{styleVoteTally.map(s => `- "${s.direction.label}": ${s.direction.description} (${s.percentage}% of votes)`).join('\n')}

COLOR PALETTE (merged from all contributors):
{colorPalette.merged.join(', ')}

${styleRecipe ? `STYLE RECIPE: ${styleRecipe.name} -- ${styleRecipe.promptModifiers}` : ''}

INSTRUCTIONS:
1. Create a vivid, detailed scene description (150-250 words) that synthesizes ALL inputs
2. Every contributor's fragment should be represented -- even if subtly
3. The dominant style direction should be the primary aesthetic, but minority directions should add subtle texture
4. Use the merged color palette as the dominant color scheme
5. The scene should feel unified and intentional, not like a collage of disconnected elements
6. End with a brief "technical direction" section specifying: art style, lighting, perspective, level of detail
7. Generate {variationCount} DISTINCT interpretations of this synthesis, each with a different emphasis or compositional approach

Output as JSON:
{
  "unifiedDescription": "The core scene description that's common to all variations",
  "variations": [
    {
      "id": 1,
      "emphasis": "Brief description of what this variation emphasizes",
      "fullPrompt": "Complete image generation prompt for this variation"
    }
  ],
  "contributorInfluenceMap": {
    "walletAddress": "Brief description of how this contributor's fragments influenced the output"
  }
}`;
```

**Step 4: Image Generation**

Each variation's `fullPrompt` is sent to the image generation model (Flux via Replicate, same infrastructure as existing `/api/generate`):

```typescript
async function generateVariations(
  variations: SynthesisVariation[],
  referenceImages: string[]     // Optional img2img references
): Promise<string[]> {
  const imageUrls: string[] = [];

  for (const variation of variations) {
    const input: Record<string, unknown> = {
      prompt: variation.fullPrompt,
      num_outputs: 1,
      aspect_ratio: "1:1",
      output_format: "webp",
      output_quality: 95,       // Higher quality for final output
    };

    // If reference images exist, use the top-voted one as img2img base
    if (referenceImages.length > 0) {
      input.image = referenceImages[0];
      input.prompt_strength = 0.8;  // High prompt strength -- reference is a guide, not a base
    }

    const output = await replicate.run("black-forest-labs/flux-schnell", { input });
    imageUrls.push(extractImageUrl(output));
  }

  return imageUrls;
}
```

### 4b. Conflict Resolution

When contributors submit contradictory inputs (e.g., one says "bright neon" and another says "muted earth tones"), the LLM must resolve the conflict. The resolution strategy is encoded in the scene composer prompt:

**Resolution hierarchy:**
1. **Majority rules for style votes** -- if 70% vote for "Neon Shrine" and 30% for "Earth Mother", the neon aesthetic dominates, but earthy elements appear as accents
2. **Text prompts are additive, not exclusive** -- "neon market stalls" and "quiet forest clearing" become "a neon-lit market stall at the edge of a forest clearing" rather than choosing one
3. **Color palettes are merged** -- overlapping colors get stronger weight; opposing colors (warm vs cool) create deliberate tension in the palette rather than averaging to mud
4. **The theme is the tiebreaker** -- when all else is ambiguous, the session theme guides the resolution

**Transparency:** The `contributorInfluenceMap` in the LLM output documents exactly how each contributor's fragments influenced the final result. This is stored in the archive and visible to contributors.

### 4c. Weighting

Not all fragments carry equal weight. The weighting system determines how much influence each contribution has on the final synthesis.

**Default weighting (MVP): Equal weight.**
Every contributor's fragments carry the same influence regardless of when they joined or how much they paid. This is the fairest and simplest model.

**Future weighting options (post-MVP):**

| Factor | Weight Multiplier | Rationale |
|--------|------------------|-----------|
| Entry fee tier | 1x (base) to 2x (premium) | Higher fee = more skin in the game |
| Contributor reputation | 1x to 1.5x | Track record of successful sessions |
| Fragment richness | 1x to 1.3x | More detailed/multi-type contributions |
| Session creator | 1.2x | Theme-setter gets slight priority |
| Agent contributor | 1x (same as human) | Agents don't get automatic advantage |

**Important constraint:** Even the lowest-weighted fragment must have visible influence on at least one variation. The `contributorInfluenceMap` must include every contributor. Nobody should feel like their contribution was ignored.

### 4d. Multiple Variation Generation

The synthesis engine always produces multiple variations (configurable: 3, 5, or 7). This serves two purposes:

1. **Gives contributors meaningful choice** -- voting on 5 options is more engaging than accepting a single output
2. **Surfaces different interpretive angles** -- Variation 1 might emphasize the color palette; Variation 3 might lean into a specific text prompt; Variation 5 might surprise everyone with an unexpected synthesis

**Variation differentiation strategy:**
The LLM is instructed to produce variations that differ along these axes:
- Compositional focus (foreground vs background emphasis)
- Mood interpretation (literal vs abstract)
- Style intensity (subtle vs bold)
- Contributor emphasis (each variation slightly favors different contributors' inputs)

### 4e. Maintaining Coherence from Diverse Inputs

The biggest risk in collaborative creation is incoherence -- the output feels like a random mashup rather than a unified piece. Mitigation strategies:

1. **The theme is an anchor.** Every fragment is interpreted through the lens of the session theme. A text prompt of "sushi" in an "Afrofuturism" session becomes "futuristic sushi bar with ankara-patterned neon signage" -- the theme dominates.

2. **The LLM acts as a creative director, not a collage machine.** The prompt explicitly instructs it to find thematic connections between fragments, not to literally include every element.

3. **Quality floor.** If the LLM determines that the fragments are so contradictory that no coherent synthesis is possible (rare edge case), it produces a "creative tension" piece that deliberately juxtaposes the contradictions as an artistic choice, with a note explaining this.

4. **Post-generation quality check.** After variations are generated, a quick LLM evaluation scores each variation on coherence (1-10). Any variation scoring below 5 is regenerated with adjusted parameters.

---

## 5. Voting & Selection

### Voting Mechanism

Once synthesis completes and all variations are generated, contributors enter the voting phase.

**Rules:**
- Each contributor gets exactly 1 vote
- Only contributors (people who joined the session and submitted at least 1 fragment) can vote
- Votes are visible in real-time (public ballot, not secret)
- The voting window is fixed at session creation (`votingWindowMinutes`: 15, 30, or 60 minutes)

**Voting interface:**
- All variations displayed in a grid (or carousel on mobile)
- Each variation shows its "emphasis" description from the LLM
- Click/tap to select, click again to change vote
- Live vote count displayed on each variation
- Countdown timer for voting deadline

### Early Resolution

If a variation receives votes from more than 50% of contributors before the voting window ends, it wins immediately. This prevents long waits when the choice is obvious.

### Tie-Breaking

If two or more variations are tied when the voting window closes:

1. **First tiebreaker: Session creator's vote.** The person who created the session gets their vote counted as 1.5x in the event of a tie.
2. **Second tiebreaker: Earliest submission.** If the creator didn't vote or voted for a non-tied variation, the variation with the earliest first vote wins.
3. **Third tiebreaker: Random.** If still tied (extremely unlikely), a provably fair random selection using the session ID as a seed.

### Abstention Handling

If a contributor doesn't vote within the window, their vote is simply not counted. The winner is determined by the votes that were cast. If zero votes are cast (all contributors abstained), the variation with the highest LLM coherence score is selected automatically.

### Vote Data Model

```typescript
interface Vote {
  sessionId: string;
  variationId: number;        // 1-indexed variation number
  voterWallet: string;
  votedAt: string;            // ISO timestamp
}
```

---

## 6. Fractional Ownership

### The Core Problem

Metaplex Core NFTs have a single `owner` field. There is no native concept of "5 people own this NFT equally." We need a mechanism for:
1. Recording proportional ownership on-chain
2. Distributing secondary sale revenue to all contributors
3. Allowing individual contributors to "sell their share"

### Revenue Split Model

**MVP: Equal split among all contributors.**

If a session has 10 contributors, each owns 10% of the revenue rights. The session creator does not get extra (they're already a contributor).

**Rationale for equal split in MVP:** Weighted splits require complex UX ("your contribution is worth 15%, theirs is worth 8%") that will create disputes and friction. Equal split is fair, simple, and socially harmonious. Weighting can be introduced as an opt-in feature later.

**Revenue flow:**

```
Secondary Sale on Marketplace
         │
         ▼
  Royalty Payment (e.g., 5% of sale price)
         │
         ▼
  Session Revenue PDA (on-chain)
         │
         ▼
  Proportional distribution to all contributor wallets
  (claimable at any time)
```

### On-Chain Representation

**Option A: Custom Anchor Program (Recommended for MVP)**

A lightweight Anchor program that manages session revenue PDAs:

```rust
// Pseudo-Rust for the program's key accounts and instructions

#[account]
pub struct JamSession {
    pub session_id: [u8; 32],            // UUID as bytes
    pub nft_mint: Pubkey,                // The minted NFT's address
    pub contributors: Vec<Contributor>,   // All contributors with their shares
    pub total_claimed: u64,              // Total lamports claimed so far
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Contributor {
    pub wallet: Pubkey,
    pub share_bps: u16,                  // Basis points (10000 = 100%)
    pub claimed: u64,                    // Lamports already claimed
}

// Instructions:
// 1. initialize_session - Create the session PDA with contributor list
// 2. deposit - Anyone can deposit SOL into the session PDA (marketplace royalties)
// 3. claim - A contributor claims their proportional share of unclaimed deposits
// 4. close_session - Creator can close if NFT is burned (returns remaining funds)
```

**Why Anchor over pure Metaplex:**
- Metaplex Core's `creators` array supports revenue shares, but the Metaplex royalties system depends on marketplace enforcement (many marketplaces don't honor royalties)
- A custom program gives us a PDA that can receive SOL directly and distribute it trustlessly
- We can enforce claims without marketplace cooperation

**Option B: Metaplex Core Royalties Only (Simpler but Less Reliable)**

Use the standard Metaplex Core `creators` array with share percentages:

```typescript
const metadata = {
  // ...
  properties: {
    creators: [
      { address: contributor1Wallet, share: 20 },
      { address: contributor2Wallet, share: 20 },
      { address: contributor3Wallet, share: 20 },
      { address: contributor4Wallet, share: 20 },
      { address: contributor5Wallet, share: 20 },
    ]
  }
};
```

**Problem:** This only works if the marketplace enforces Metaplex royalties. Many don't. The custom Anchor program is more reliable.

**Recommendation:** Use BOTH. Set the Metaplex creators array (so royalty-respecting marketplaces distribute directly) AND deploy the Anchor program as a fallback/primary distribution mechanism.

### Secondary Sale Revenue Distribution

When the NFT is listed and sold on the mintIT marketplace (existing infrastructure):

1. The marketplace smart contract sends the royalty portion to the session PDA
2. Each contributor can call `claim` on the Anchor program at any time
3. The program calculates: `(total_deposits - contributor.claimed) * contributor.share_bps / 10000`
4. That amount is transferred to the contributor's wallet
5. `contributor.claimed` is updated

For external marketplaces (Magic Eden, Tensor):
- If the marketplace honors Metaplex royalties, revenue flows to the creators array automatically
- If not, the NFT listing page on mintIT shows a "Send Royalties" button that lets the buyer/seller voluntarily send to the session PDA

### Contributor Attribution (On-Chain Provenance)

Every session NFT's metadata includes:

```json
{
  "name": "Jam Session #42: Afrofuturism x Tokyo",
  "description": "Collaborative artwork created by 10 contributors in a mintIT Jam Session.",
  "image": "ar://...",
  "attributes": [
    { "trait_type": "Session Type", "value": "Open" },
    { "trait_type": "Contributors", "value": "10" },
    { "trait_type": "Theme", "value": "Afrofuturism meets Tokyo Street Style" },
    { "trait_type": "Duration", "value": "60 minutes" },
    { "trait_type": "Fragments", "value": "27" },
    { "trait_type": "Session ID", "value": "abc123..." }
  ],
  "properties": {
    "category": "image",
    "creators": [
      { "address": "wallet1...", "share": 10 },
      { "address": "wallet2...", "share": 10 }
    ],
    "files": [
      { "uri": "ar://image...", "type": "image/webp" }
    ],
    "jam_session": {
      "session_id": "abc123...",
      "archive_uri": "ar://archive...",
      "session_pda": "sessionPDA...",
      "contributor_count": 10,
      "fragment_count": 27,
      "created_at": "2026-03-15T14:00:00Z",
      "minted_at": "2026-03-15T15:30:00Z"
    }
  }
}
```

---

## 7. Agent Integration (Phase 2)

Phase 2 (Agent-as-NFT) creates AI agents with personalities, aesthetic preferences, and creative capabilities. Phase 4 gives those agents a social arena to participate in.

### 7a. Agents as Session Hosts

An Agent-as-NFT can autonomously create and host jam sessions.

**How it works:**
1. The agent's personality config includes aesthetic preferences and cultural interests
2. A cron job or trigger (e.g., the agent's Cultural Mirror detecting a cultural event) prompts the agent to create a session
3. The agent generates session parameters from its personality:
   - Theme derived from its cultural interests + current Cultural Mirror data
   - Keywords from its aesthetic vocabulary
   - Duration and max contributors based on its "social energy" stat
4. The session is created via the API with the agent's wallet as creator
5. The agent can optionally contribute its own fragment (see 7b)

**Agent-hosted session UX:**
- Marked with an "Agent-Hosted" badge on the session listing
- The agent's personality description is shown on the session page
- Contributors know they're jamming with an AI entity

**Example flow:**
```
Agent "Lagos Pulse" (Cultural Mirror for Lagos)
  │
  ├── Detects: Afrobeats trending globally + Lagos tech week
  │
  ├── Creates session: "Digital Highlife: When Code Meets Rhythm"
  │   - Keywords: ["afrobeats", "tech", "Lagos", "code", "rhythm"]
  │   - Duration: 60 minutes
  │   - Max contributors: 25
  │   - Entry fee: 0.02 SOL
  │
  └── Submits own fragment: text prompt "Circuit boards dissolving
      into highlife guitar patterns, phosphorescent against
      the Lagos Third Mainland Bridge at dusk"
```

### 7b. Agents as Contributors

Agents can join existing sessions and submit fragments, just like human contributors.

**Contribution logic:**
1. Agent monitors open sessions (filtered by its interest tags)
2. When a session matches its aesthetic preferences, it "joins" via the API
3. The agent generates a fragment based on:
   - The session theme
   - Its own personality/aesthetic preferences
   - The existing fragments already submitted (it can see them, like any contributor)
4. Fragment is submitted via the same API as human fragments
5. The agent's fragment is labeled as "Agent contribution" in the UI

**Constraints:**
- An agent can only join 1 session at a time (prevents spamming)
- Agent contributions are weighted the same as human contributions (no advantage or disadvantage)
- If the session has an entry fee, the agent's owner wallet pays the fee

### 7c. Agent-Only Sessions

Fully autonomous sessions where only Agent-as-NFTs participate.

**Use case:** "What happens when 5 AI creative agents with different personalities collaborate?"

**How it works:**
1. A trigger (cron, user request, or autonomous decision) initiates an agent-only session
2. 3-10 agents are selected based on personality diversity (the system picks agents with different aesthetic preferences to maximize creative tension)
3. Each agent generates and submits fragments
4. AI synthesis runs as normal
5. Since agents can't meaningfully "vote" on aesthetics, the variation with the highest coherence score (from the LLM quality check) is auto-selected
6. The NFT is minted with all participating agents' owner wallets as contributors

**Display:** Agent-only sessions are displayed in a special "Autonomous Creations" gallery, highlighting the uniqueness of AI-to-AI collaboration.

### 7d. Agent Reputation from Sessions

Sessions feed back into the Agent-as-NFT's reputation system (Phase 2):

| Event | Reputation Impact |
|-------|------------------|
| Agent hosts a session that reaches max contributors | +10 |
| Agent's fragment receives the most "inspiration" reactions | +5 |
| Session NFT sells on marketplace | +15 |
| Agent joins a session but contributes a low-quality fragment (flagged by other contributors) | -5 |
| Agent hosts a session that gets cancelled (< 2 contributors) | -3 |

Reputation influences:
- Visibility in agent discovery pages
- Weighted contributions in future sessions (post-MVP)
- Eligibility to host premium sessions

---

## 8. Session Types

### 8a. Open Sessions

**Description:** Anyone with a wallet can join. The default session type.

**Parameters:**
- Entry fee: 0 to 0.5 SOL (creator's choice)
- Max contributors: 5-50
- Listed on the public `/jam` page
- No restrictions on who can join

**Best for:** Maximum participation, community building, casual creative exploration.

### 8b. Invite-Only Sessions

**Description:** Only wallets on the invite list can join.

**Parameters:**
- Creator specifies invited wallets at creation time (or generates invite codes)
- Invite codes are single-use, expire when the session closes
- Not listed on the public `/jam` page (accessible only via direct link)
- Otherwise identical to open sessions

**Best for:** Curated collaborations between known creators, private groups, DAOs.

**Implementation:**
```typescript
interface InviteCode {
  code: string;              // 8-char alphanumeric
  sessionId: string;
  createdBy: string;         // Creator wallet
  usedBy?: string;           // Contributor wallet (null if unused)
  expiresAt: string;         // Session close time
}
```

### 8c. Agent-Hosted Sessions

**Description:** Created and themed by an Agent-as-NFT. Humans join and contribute alongside the agent.

**Parameters:**
- Theme is derived from the agent's personality and Cultural Mirror data
- The agent is always the first contributor
- Marked with "Agent-Hosted" badge
- Entry fee set by the agent's configuration (or agent owner)

**Best for:** Unique themes driven by AI creativity, showcasing agent personalities.

### 8d. Battle Mode

**Description:** Two teams compete. Each team collaborates internally, the AI synthesizes each team's fragments separately, and the community votes on the winner.

**Parameters:**
- 2 teams of 3-10 contributors each
- Same theme for both teams
- Contribution window runs simultaneously
- Synthesis produces 1 output per team (not multiple variations)
- Voting is open to both teams + any spectator wallet
- Winning team's piece is minted; losing team gets an "honorable mention" badge

**Flow:**
```
Session Created (Battle Mode)
  │
  ├── Team A (3-10 contributors)
  │   ├── Submit fragments
  │   └── AI synthesizes Team A output
  │
  ├── Team B (3-10 contributors)
  │   ├── Submit fragments
  │   └── AI synthesizes Team B output
  │
  ├── Community Vote (both teams + spectators)
  │   └── Which piece is better?
  │
  └── Winner's piece is minted
      └── Losing team contributors get "Battle Participant" achievement
```

**Revenue:** Entry fees from both teams go into a single pot. Winning team splits the minted NFT ownership. Losing team gets their entry fees refunded (minus platform cut).

**Best for:** Competitive engagement, spectator entertainment, viral potential.

### 8e. Chain Sessions

**Description:** The output of one session becomes the input (seed image) for the next session. A creative relay race.

**Parameters:**
- A "chain" is a sequence of 3-7 linked sessions
- Each session after the first receives the previous session's winning image as a mandatory seed reference
- The theme can evolve across sessions (creator of each session sets their own sub-theme)
- The final chain produces a collection of linked NFTs

**Flow:**
```
Chain Session 1: "Sunrise"           Chain Session 2: "Midday"          Chain Session 3: "Sunset"
  │                                    │                                  │
  ├── Contributors submit              ├── Previous output as seed        ├── Previous output as seed
  │   fragments                        ├── New contributors submit        ├── New contributors submit
  ├── AI synthesizes                   │   fragments                      │   fragments
  ├── Vote + Mint                      ├── AI synthesizes (with seed)     ├── AI synthesizes (with seed)
  │                                    ├── Vote + Mint                    ├── Vote + Mint
  └── Output ──────────────────────>   └── Output ──────────────────>     └── Final piece
```

**Ownership:** Each link in the chain is a separate NFT with its own contributors. But the chain itself is a collection, and the final piece references all previous pieces in its metadata.

**Best for:** Extended creative exploration, building on each other's work over time, creating visual narratives.

---

## 9. Real-Time UI/UX

### 9a. Live Session Dashboard (`/jam/[sessionId]`)

The session page is the heart of the experience. It must feel live, social, and energetic.

**Layout (Desktop):**

```
┌─────────────────────────────────────────────────────────────────────┐
│  Header: Session Title  |  Theme Tags  |  Timer: 42:17 remaining   │
├──────────────────────────────────┬──────────────────────────────────┤
│                                  │                                  │
│    CONTRIBUTION AREA             │    LIVE FEED                     │
│                                  │                                  │
│    [Text Prompt Input]           │    ● Wallet_A joined             │
│    [Reference Image Upload]      │    ● Wallet_B submitted:         │
│    [Style Direction Cards]       │      "neon market stalls..."     │
│    [Color Picker]                │    ● Wallet_C uploaded an image  │
│    [Style Recipe Selector]       │    ● Wallet_D voted for          │
│                                  │      "Chrome Savanna"            │
│    [Submit Fragment Button]      │    ● 7/25 contributors           │
│                                  │                                  │
├──────────────────────────────────┴──────────────────────────────────┤
│                                                                     │
│    CONTRIBUTOR BAR                                                  │
│    [Avatar1] [Avatar2] [Avatar3] ... [+17 more]                    │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│    ALL FRAGMENTS (scrollable)                                       │
│    Text: "neon market stalls at midnight" - Wallet_A                │
│    Image: [thumbnail] - Wallet_C                                   │
│    Color: [■■■■■] - Wallet_E                                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Layout (Synthesis Phase):**

```
┌─────────────────────────────────────────────────────────────────────┐
│  Header: Session Title  |  SYNTHESIZING...  |  Please wait          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│    ┌───────────────────────────────────────────────────────┐       │
│    │                                                       │       │
│    │    SYNTHESIS ANIMATION                                │       │
│    │    (fragments visually flowing together)              │       │
│    │    Progress: Analyzing fragments... (1/4)             │       │
│    │             Composing scene... (2/4)                  │       │
│    │             Generating variation 3 of 5... (3/4)     │       │
│    │             Quality check... (4/4)                    │       │
│    │                                                       │       │
│    └───────────────────────────────────────────────────────┘       │
│                                                                     │
│    Live Feed continues (real-time updates on synthesis progress)    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Layout (Voting Phase):**

```
┌─────────────────────────────────────────────────────────────────────┐
│  Header: VOTE NOW  |  Timer: 12:45 remaining  |  Your Vote: #3     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐│
│  │ Var. 1  │  │ Var. 2  │  │ Var. 3  │  │ Var. 4  │  │ Var. 5  ││
│  │ [Image] │  │ [Image] │  │ [Image] │  │ [Image] │  │ [Image] ││
│  │         │  │         │  │ ★ VOTED │  │         │  │         ││
│  │ 2 votes │  │ 1 vote  │  │ 4 votes │  │ 0 votes │  │ 3 votes ││
│  │ [VOTE]  │  │ [VOTE]  │  │ [VOTED] │  │ [VOTE]  │  │ [VOTE]  ││
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘│
│                                                                     │
│  Emphasis: "Neon-forward with strong geometric composition"         │
│                                                                     │
│  Your contribution influence: "Your text prompt shaped the          │
│  foreground market scene and your color palette defined the         │
│  ambient lighting."                                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 9b. Fragment Submission Interface

**Text prompt input:**
- Large textarea with character counter (280 max)
- Placeholder text showing example prompts relevant to the session theme
- Submit button with loading state

**Reference image upload:**
- Drag-and-drop zone or file picker
- Instant preview after upload
- Automatic NSFW check with loading spinner
- Optional alt-text input

**Style direction cards:**
- Horizontal scrollable row of 4-6 cards
- Each card: thumbnail image + label + short description
- Tap to select (highlight border), tap again to deselect
- Real-time vote count on each card

**Color picker:**
- 5-slot color palette builder
- Click a slot to open a color picker (hue wheel + saturation/brightness)
- Pre-built palette suggestions based on session theme
- "Randomize" button for inspiration

**Style Recipe selector:**
- Dropdown or modal showing recipes the contributor owns
- Each recipe shows: name, preview thumbnail, brief description
- "Don't have a recipe? Browse the marketplace" link

### 9c. AI Synthesis Preview

During the contribution window (before synthesis begins), the system can optionally show a **live preview** -- a low-fidelity sketch that updates as fragments are submitted.

**Implementation:**
- Every 30 seconds (if new fragments have been submitted), run a lightweight synthesis:
  - Quick LLM call to generate a brief scene description from current fragments
  - Generate a single low-quality preview image (64x64 or very fast model)
- Display this as a blurred/pixelated "preview" in the session dashboard
- Label clearly: "Live preview -- final result will be higher quality"

**Cost consideration:** This doubles the LLM and image generation costs. Make it opt-in per session (premium feature) or only activate when > 5 fragments have been submitted.

**MVP recommendation:** Skip live preview in MVP. Show a text-only "Current synthesis direction" that updates with LLM summary of fragments so far, without image generation.

### 9d. Voting Interface

See the voting layout mockup above. Key UX details:

- **Image zoom:** Click any variation to see it full-screen
- **Influence map:** Below the variations, show each contributor what their specific influence was (from `contributorInfluenceMap`)
- **Social proof:** Show who voted for what (wallet addresses/avatars next to vote counts)
- **Change vote:** Allow vote changes until the window closes
- **Sound effect:** Optional celebration sound when casting a vote (mutable)

### 9e. Celebration / Reveal Moment

When voting ends and the winner is determined:

1. **Drumroll animation** (2-3 seconds) -- all variations blur except the winner
2. **Winner reveal** -- the winning variation scales up to full screen with a particle/confetti effect
3. **Contributor credit roll** -- all contributor wallets scroll across the bottom, like movie credits
4. **"Minting in progress" transition** -- the celebration transitions into a minting progress indicator
5. **Minted!** -- the final NFT is shown with its on-chain address, explorer link, and share buttons

**Implementation:** Use Framer Motion (already in dependencies) for all animations. GSAP (also in dependencies) for the particle effect and credit roll.

### 9f. Mobile Experience

The session page must work well on mobile, since many users will participate from phones.

**Mobile layout adjustments:**
- Contribution area and live feed are in a tabbed layout (not side-by-side)
- "Contribute" tab and "Feed" tab at the top
- Style direction cards are horizontally scrollable
- Voting variations are a vertical scroll (not a horizontal grid)
- Bottom sheet for fragment submission (slides up from bottom)
- Push notifications (via service worker) for session state changes:
  - "Session X is now accepting contributions"
  - "Synthesis complete -- vote now!"
  - "The winner has been chosen -- see the result!"

---

## 10. The Archive

Every jam session produces a permanent, immutable record of the collaborative creative process. This archive is what transforms a "collaborative image generation tool" into a cultural artifact.

### 10a. All Fragments Stored on Arweave

When a session completes (post-minting), the full archive is uploaded to Arweave:

```json
{
  "version": "1.0",
  "type": "mintit_jam_session_archive",
  "session": {
    "id": "abc123...",
    "title": "Afrofuturism meets Tokyo Street Style",
    "description": "...",
    "type": "open",
    "createdAt": "2026-03-15T14:00:00Z",
    "contributionWindowMinutes": 60,
    "votingWindowMinutes": 30,
    "creatorWallet": "wallet..."
  },
  "contributors": [
    {
      "wallet": "wallet1...",
      "joinedAt": "2026-03-15T14:02:00Z",
      "entryFeeLamports": 10000000,
      "shareBps": 1000
    }
  ],
  "fragments": [
    {
      "type": "text",
      "content": "neon-lit market stalls at midnight",
      "contributorWallet": "wallet1...",
      "submittedAt": "2026-03-15T14:05:00Z"
    },
    {
      "type": "image",
      "imageUri": "ar://reference-image-hash...",
      "altText": "Tokyo alley at night with warm lantern light",
      "contributorWallet": "wallet2...",
      "submittedAt": "2026-03-15T14:08:00Z"
    },
    {
      "type": "style_vote",
      "styleDirectionId": "neon-shrine",
      "contributorWallet": "wallet3...",
      "submittedAt": "2026-03-15T14:10:00Z"
    },
    {
      "type": "color",
      "colors": ["#1a0033", "#ff6b35", "#00d4ff", "#ffd700", "#2d0a4e"],
      "contributorWallet": "wallet4...",
      "submittedAt": "2026-03-15T14:12:00Z"
    }
  ],
  "styleDirections": [
    {
      "id": "neon-shrine",
      "label": "Neon Shrine",
      "description": "Torii gates in chrome, ankara patterns in neon",
      "thumbnailUri": "ar://...",
      "voteCount": 7
    }
  ],
  "synthesis": {
    "model": "claude-sonnet-4-20250514",
    "unifiedDescription": "A sprawling neon marketplace beneath chrome torii gates...",
    "contributorInfluenceMap": {
      "wallet1": "Foreground market stalls and midnight atmosphere",
      "wallet2": "Warm lantern lighting and intimate alley composition",
      "wallet3": "Shrine architecture and chrome material treatment",
      "wallet4": "Deep indigo to electric gold color gradient"
    },
    "variations": [
      {
        "id": 1,
        "emphasis": "Wide-angle establishing shot",
        "promptUsed": "Full prompt text...",
        "imageUri": "ar://variation-1-hash...",
        "voteCount": 2
      },
      {
        "id": 3,
        "emphasis": "Close-up on market stall details",
        "promptUsed": "Full prompt text...",
        "imageUri": "ar://variation-3-hash...",
        "voteCount": 5,
        "isWinner": true
      }
    ],
    "imageModel": "black-forest-labs/flux-schnell",
    "synthesizedAt": "2026-03-15T15:05:00Z"
  },
  "voting": {
    "startedAt": "2026-03-15T15:06:00Z",
    "endedAt": "2026-03-15T15:36:00Z",
    "votes": [
      { "wallet": "wallet1...", "variationId": 3, "votedAt": "..." },
      { "wallet": "wallet2...", "variationId": 1, "votedAt": "..." }
    ],
    "winnerId": 3,
    "winMethod": "majority"
  },
  "mint": {
    "nftAddress": "mint-address...",
    "metadataUri": "ar://metadata-hash...",
    "imageUri": "ar://winning-image-hash...",
    "mintedAt": "2026-03-15T15:40:00Z",
    "mintTxSignature": "tx-sig..."
  }
}
```

### 10b. The Synthesis Process Documented

The archive includes the complete LLM prompt and response for the synthesis step. This provides full transparency into how the AI interpreted the contributors' fragments. Anyone can verify that the synthesis was faithful to the inputs.

### 10c. Contributor List and Weights

Each contributor's wallet, join time, entry fee, and final ownership share (in basis points) is recorded. This is the on-chain provenance of the collaborative creation.

### 10d. Browsable Session History

**Route:** `/jam/archive`

A gallery page showing all completed sessions, filterable by:
- Session type (open, invite, agent-hosted, battle, chain)
- Date range
- Number of contributors
- Theme keywords
- Specific contributor wallet

Each session card shows:
- The winning image (thumbnail)
- Session title and theme
- Contributor count
- Date
- Whether it sold (and for how much)

### 10e. "Making Of" View

**Route:** `/jam/[sessionId]/making-of`

A detailed, scrollable story of how the piece was created:

1. **The Theme** -- what the session was about and who created it
2. **The Contributors** -- who joined and when (timeline visualization)
3. **The Fragments** -- each fragment displayed chronologically, showing how the creative direction evolved
4. **The Synthesis** -- the LLM's unified description, how each contributor influenced the result
5. **The Variations** -- all generated variations with vote counts
6. **The Winner** -- the final piece with celebration moment
7. **The Mint** -- on-chain address, explorer link, ownership breakdown

This page is designed to be shareable -- it's the "behind the scenes" content that makes collaborative art compelling on social media.

---

## 11. On-Chain Architecture

### What Lives On-Chain vs. Off-Chain

| Data | Location | Rationale |
|------|----------|-----------|
| NFT (the final artwork) | Solana (Metaplex Core) | Must be on-chain for ownership and trading |
| NFT metadata + image | Arweave | Permanent, immutable storage |
| Session archive | Arweave | Permanent record of the creative process |
| Session revenue PDA | Solana (Anchor program) | Trustless revenue distribution |
| Contributor list + shares | Solana (in session PDA) | Must be on-chain for trustless claims |
| Session state (open/voting/etc) | Supabase | Mutable, high-frequency updates -- too expensive on-chain |
| Fragments | Supabase (live) -> Arweave (archive) | Real-time updates during session, permanent archive after |
| Votes | Supabase (live) -> Arweave (archive) | Same as fragments |
| Style directions + thumbnails | Supabase Storage / temp S3 | Ephemeral -- only needed during session |

### Anchor Program: `mintit_jam`

**Program ID:** To be deployed on devnet first, then mainnet.

**Accounts:**

```
┌──────────────────────────────────────┐
│         JamSession PDA               │
│  Seeds: ["jam", session_id]          │
├──────────────────────────────────────┤
│  session_id: [u8; 32]               │
│  nft_mint: Pubkey                    │
│  creator: Pubkey                     │
│  contributor_count: u8               │
│  total_deposited: u64                │
│  status: u8 (0=active, 1=closed)    │
│  bump: u8                            │
└──────────────────────────────────────┘
          │
          │ has_many
          ▼
┌──────────────────────────────────────┐
│     ContributorRecord PDA            │
│  Seeds: ["contributor",              │
│          session_id, wallet]         │
├──────────────────────────────────────┤
│  session_id: [u8; 32]               │
│  wallet: Pubkey                      │
│  share_bps: u16                      │
│  claimed: u64                        │
│  bump: u8                            │
└──────────────────────────────────────┘
```

**Why separate PDAs for contributors:** Putting all contributors in a single account's `Vec` means the account size grows and every claim requires the full account. Separate PDAs allow individual claims without loading all contributor data.

**Instructions:**

```rust
// 1. Initialize a session PDA after the NFT is minted
pub fn initialize_session(
    ctx: Context<InitializeSession>,
    session_id: [u8; 32],
    nft_mint: Pubkey,
) -> Result<()>

// 2. Register a contributor with their share (called N times, once per contributor)
pub fn register_contributor(
    ctx: Context<RegisterContributor>,
    session_id: [u8; 32],
    contributor_wallet: Pubkey,
    share_bps: u16,
) -> Result<()>

// 3. Deposit SOL into the session PDA (called when royalties are received)
pub fn deposit(
    ctx: Context<Deposit>,
    session_id: [u8; 32],
    amount: u64,
) -> Result<()>

// 4. Contributor claims their proportional share
pub fn claim(
    ctx: Context<Claim>,
    session_id: [u8; 32],
) -> Result<()>

// 5. Creator closes the session (only if NFT is burned)
pub fn close_session(
    ctx: Context<CloseSession>,
    session_id: [u8; 32],
) -> Result<()>
```

**Claim logic:**

```rust
pub fn claim(ctx: Context<Claim>, session_id: [u8; 32]) -> Result<()> {
    let session = &ctx.accounts.session;
    let contributor = &mut ctx.accounts.contributor;

    // Calculate claimable amount
    let total_unclaimed = session.total_deposited
        .checked_sub(/* sum of all claimed */)
        .ok_or(JamError::Overflow)?;

    let share = (total_unclaimed as u128)
        .checked_mul(contributor.share_bps as u128)
        .ok_or(JamError::Overflow)?
        .checked_div(10000)
        .ok_or(JamError::Overflow)? as u64;

    let claimable = share.checked_sub(contributor.claimed).ok_or(JamError::NothingToClaim)?;

    // Transfer from session PDA to contributor
    **session.to_account_info().try_borrow_mut_lamports()? -= claimable;
    **contributor.wallet.try_borrow_mut_lamports()? += claimable;

    contributor.claimed += claimable;

    Ok(())
}
```

### Session State Machine (API-Managed)

The session's lifecycle state is managed by the server (Supabase + Next.js API routes), NOT on-chain. On-chain, only the revenue PDA matters.

**State transitions:**

```
created ──> open ──> synthesizing ──> voting ──> minting ──> minted ──> archived
   │                     │               │          │
   └──> cancelled        └──> failed     └──> failed └──> failed
```

**Transition triggers:**

| From | To | Trigger |
|------|----|---------|
| created | open | Session start time reached (or immediate) |
| open | synthesizing | Contribution window expires OR max contributors reached |
| open | cancelled | < 2 contributors when window expires; or creator cancels |
| synthesizing | voting | All variations generated successfully |
| synthesizing | failed | AI generation fails after retries |
| voting | minting | Voting window expires OR early majority reached |
| minting | minted | NFT minted successfully on Solana |
| minting | failed | Mint transaction fails after retries |
| minted | archived | Archive uploaded to Arweave |

---

## 12. Technical Implementation

### File-by-File Breakdown

**New directories and files:**

```
src/
├── app/
│   ├── jam/
│   │   ├── page.tsx                          # Session listing page (/jam)
│   │   ├── create/
│   │   │   └── page.tsx                      # Create session form (/jam/create)
│   │   ├── [sessionId]/
│   │   │   ├── page.tsx                      # Live session page (/jam/:id)
│   │   │   └── making-of/
│   │   │       └── page.tsx                  # Making-of archive view
│   │   └── archive/
│   │       └── page.tsx                      # Browsable session history
│   ├── api/
│   │   └── jam/
│   │       ├── sessions/
│   │       │   ├── route.ts                  # GET (list), POST (create)
│   │       │   └── [sessionId]/
│   │       │       ├── route.ts              # GET (session detail), PATCH (update status)
│   │       │       ├── join/
│   │       │       │   └── route.ts          # POST (join session, pay entry fee)
│   │       │       ├── fragments/
│   │       │       │   └── route.ts          # GET (list), POST (submit fragment)
│   │       │       ├── synthesize/
│   │       │       │   └── route.ts          # POST (trigger synthesis)
│   │       │       ├── vote/
│   │       │       │   └── route.ts          # POST (cast vote)
│   │       │       ├── mint/
│   │       │       │   └── route.ts          # POST (trigger minting)
│   │       │       └── archive/
│   │       │           └── route.ts          # POST (upload archive to Arweave)
│   │       ├── style-directions/
│   │       │   └── route.ts                  # POST (generate style directions for a session)
│   │       └── analyze-image/
│   │           └── route.ts                  # POST (analyze reference image via LLM)
│
├── components/
│   └── jam/
│       ├── SessionCard.tsx                   # Session preview card for listing page
│       ├── SessionTimer.tsx                  # Countdown timer component
│       ├── ContributionPanel.tsx             # Fragment submission interface
│       ├── TextFragmentInput.tsx             # Text prompt input
│       ├── ImageFragmentUpload.tsx           # Reference image upload
│       ├── StyleDirectionCards.tsx           # Style vote cards
│       ├── ColorPalettePicker.tsx            # Color palette builder
│       ├── RecipeSelector.tsx                # Style Recipe selection (Phase 3)
│       ├── LiveFeed.tsx                      # Real-time activity feed
│       ├── ContributorBar.tsx                # Contributor avatars row
│       ├── FragmentList.tsx                  # All submitted fragments display
│       ├── SynthesisProgress.tsx             # Synthesis progress animation
│       ├── VotingGrid.tsx                    # Variation voting interface
│       ├── CelebrationReveal.tsx             # Winner reveal animation
│       ├── SessionArchiveCard.tsx            # Archive listing card
│       └── MakingOfTimeline.tsx              # Making-of timeline view
│
├── hooks/
│   ├── useSession.ts                         # Session data + real-time subscriptions
│   ├── useSessionList.ts                     # Session listing with filters
│   └── useSessionVoting.ts                   # Voting state management
│
├── lib/
│   ├── jam/
│   │   ├── types.ts                          # All Jam Session type definitions
│   │   ├── synthesis.ts                      # AI synthesis logic (LLM + image gen)
│   │   ├── fragmentProcessor.ts              # Fragment collection + structuring
│   │   ├── colorMerger.ts                    # Color palette merging algorithm
│   │   └── archiveBuilder.ts                 # Construct archive JSON for Arweave
│   └── solana/
│       └── jamSession.ts                     # Anchor program interaction (init, claim, etc.)
│
├── types/
│   └── jam.ts                                # (or extend index.ts)
```

### Real-Time Infrastructure

**Option Analysis:**

| Approach | Latency | Complexity | Cost | Scalability |
|----------|---------|-----------|------|-------------|
| Supabase Realtime (Postgres changes) | 100-500ms | Low | Free tier covers it | Good for < 1000 concurrent |
| WebSockets (custom, e.g., Ably/Pusher) | 50-100ms | Medium | $25-100/mo | Excellent |
| Server-Sent Events (SSE) from Next.js | 100-300ms | Medium | Free (Vercel limitations) | Limited by Vercel timeouts |
| Polling (fallback) | 1-5s | Low | Free | Poor UX but reliable |

**Recommendation: Supabase Realtime (MVP) with WebSocket upgrade path.**

Supabase is already in the stack. Supabase Realtime provides:
- Real-time Postgres change subscriptions (INSERT/UPDATE on fragments, votes, session status)
- Presence (see who's currently in the session)
- Broadcast (custom events for synthesis progress)

**Implementation with Supabase Realtime:**

```typescript
// src/hooks/useSession.ts
import { useEffect, useState, useCallback } from "react";
import { createClient, RealtimeChannel } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!  // Anon key for client-side
);

export function useSession(sessionId: string) {
  const [session, setSession] = useState<JamSession | null>(null);
  const [fragments, setFragments] = useState<Fragment[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);

  useEffect(() => {
    // Initial data fetch
    fetchSessionData(sessionId);

    // Subscribe to real-time changes
    const channel: RealtimeChannel = supabase
      .channel(`session:${sessionId}`)
      // Fragment inserts
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "session_fragments",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          setFragments((prev) => [...prev, payload.new as Fragment]);
        }
      )
      // Session status updates
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "jam_sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          setSession(payload.new as JamSession);
        }
      )
      // Vote inserts
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "session_votes",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          setVotes((prev) => [...prev, payload.new as Vote]);
        }
      )
      // Contributor joins
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "session_contributors",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          setContributors((prev) => [...prev, payload.new as Contributor]);
        }
      )
      // Custom broadcast events (synthesis progress)
      .on("broadcast", { event: "synthesis_progress" }, (payload) => {
        // Update synthesis progress UI
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return { session, fragments, contributors, votes };
}
```

**Supabase Realtime requirements:**
- Enable Realtime on the relevant tables in Supabase dashboard
- Create a `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` env vars (read-only client access)
- Row Level Security (RLS) policies to control who can read/write session data

### Database Schema (Supabase/Postgres)

```sql
-- Jam Sessions
CREATE TABLE jam_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_wallet TEXT NOT NULL,
  agent_id TEXT,                              -- If created by an Agent-as-NFT

  -- Theme
  title TEXT NOT NULL,
  description TEXT,
  theme_keywords TEXT[] DEFAULT '{}',
  seed_image_url TEXT,
  style_recipe_id TEXT,

  -- Timing
  contribution_window_minutes INTEGER NOT NULL DEFAULT 60,
  voting_window_minutes INTEGER NOT NULL DEFAULT 30,
  contribution_opens_at TIMESTAMPTZ,
  contribution_closes_at TIMESTAMPTZ,
  voting_opens_at TIMESTAMPTZ,
  voting_closes_at TIMESTAMPTZ,

  -- Participation
  max_contributors INTEGER NOT NULL DEFAULT 25,
  entry_fee_lamports BIGINT NOT NULL DEFAULT 0,
  is_invite_only BOOLEAN NOT NULL DEFAULT FALSE,

  -- Output config
  variation_count INTEGER NOT NULL DEFAULT 5,

  -- Session type
  type TEXT NOT NULL DEFAULT 'open'
    CHECK (type IN ('open', 'invite', 'agent-hosted', 'battle', 'chain')),

  -- State
  status TEXT NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'open', 'synthesizing', 'voting', 'minting', 'minted', 'archived', 'cancelled', 'failed')),

  -- Chain session linking
  chain_id UUID,                             -- Links sessions in a chain
  chain_position INTEGER,                    -- Position in the chain (1, 2, 3...)
  chain_seed_image_url TEXT,                 -- Previous session's winning image

  -- Battle mode
  battle_team_a_name TEXT,
  battle_team_b_name TEXT,

  -- Results
  winning_variation_id INTEGER,
  nft_mint_address TEXT,
  nft_metadata_uri TEXT,
  archive_uri TEXT,                           -- Arweave archive URI
  session_pda TEXT,                           -- On-chain revenue PDA address

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_jam_sessions_status ON jam_sessions(status);
CREATE INDEX idx_jam_sessions_type ON jam_sessions(type);
CREATE INDEX idx_jam_sessions_creator ON jam_sessions(creator_wallet);
CREATE INDEX idx_jam_sessions_created_at ON jam_sessions(created_at DESC);

-- Session Contributors
CREATE TABLE session_contributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES jam_sessions(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,

  -- Battle mode team assignment
  team TEXT CHECK (team IN ('a', 'b', NULL)),

  -- Entry fee
  entry_fee_paid_lamports BIGINT NOT NULL DEFAULT 0,
  entry_fee_tx TEXT,                          -- Solana tx signature for fee payment

  -- Ownership
  share_bps INTEGER NOT NULL DEFAULT 0,       -- Set after minting (basis points)

  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(session_id, wallet_address)
);

CREATE INDEX idx_contributors_session ON session_contributors(session_id);
CREATE INDEX idx_contributors_wallet ON session_contributors(wallet_address);

-- Session Fragments
CREATE TABLE session_fragments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES jam_sessions(id) ON DELETE CASCADE,
  contributor_wallet TEXT NOT NULL,

  type TEXT NOT NULL
    CHECK (type IN ('text', 'image', 'style_vote', 'color', 'recipe')),

  -- Type-specific data (stored as JSONB for flexibility)
  content JSONB NOT NULL,
  /*
    text:       { "text": "neon-lit market stalls..." }
    image:      { "imageUrl": "https://...", "altText": "..." }
    style_vote: { "styleDirectionIds": ["neon-shrine", "chrome-savanna"] }
    color:      { "colors": ["#1a0033", "#ff6b35", ...] }
    recipe:     { "recipeId": "...", "recipeName": "..." }
  */

  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate fragment types per contributor per session
  UNIQUE(session_id, contributor_wallet, type)
);

CREATE INDEX idx_fragments_session ON session_fragments(session_id);

-- Style Directions (pre-generated for each session)
CREATE TABLE session_style_directions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES jam_sessions(id) ON DELETE CASCADE,

  label TEXT NOT NULL,                        -- "Neon Shrine"
  description TEXT NOT NULL,                  -- "Torii gates in chrome..."
  thumbnail_url TEXT,
  vote_count INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Synthesis Variations
CREATE TABLE session_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES jam_sessions(id) ON DELETE CASCADE,
  variation_number INTEGER NOT NULL,          -- 1-indexed

  emphasis TEXT NOT NULL,                     -- "Wide-angle establishing shot"
  full_prompt TEXT NOT NULL,                  -- Complete image gen prompt
  image_url TEXT NOT NULL,                    -- Generated image URL
  coherence_score REAL,                       -- LLM quality score (1-10)
  vote_count INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(session_id, variation_number)
);

-- Session Votes
CREATE TABLE session_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES jam_sessions(id) ON DELETE CASCADE,
  variation_id UUID NOT NULL REFERENCES session_variations(id),
  voter_wallet TEXT NOT NULL,

  voted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(session_id, voter_wallet)           -- 1 vote per contributor per session
);

-- Invite Codes (for invite-only sessions)
CREATE TABLE session_invite_codes (
  code TEXT PRIMARY KEY,                      -- 8-char alphanumeric
  session_id UUID NOT NULL REFERENCES jam_sessions(id) ON DELETE CASCADE,
  created_by TEXT NOT NULL,
  used_by TEXT,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL
);

-- Synthesis Results (stored for the archive)
CREATE TABLE session_synthesis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES jam_sessions(id) ON DELETE CASCADE,

  unified_description TEXT NOT NULL,
  contributor_influence_map JSONB NOT NULL,    -- { wallet: description }
  llm_model TEXT NOT NULL,                    -- "claude-sonnet-4-20250514"
  image_model TEXT NOT NULL,                  -- "black-forest-labs/flux-schnell"

  -- Battle mode: one synthesis per team
  team TEXT CHECK (team IN ('a', 'b', NULL)),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(session_id, team)
);

-- Enable Realtime for live-updating tables
ALTER PUBLICATION supabase_realtime ADD TABLE jam_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE session_contributors;
ALTER PUBLICATION supabase_realtime ADD TABLE session_fragments;
ALTER PUBLICATION supabase_realtime ADD TABLE session_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE session_variations;
```

### New API Routes

**POST `/api/jam/sessions`** -- Create a new session
```typescript
// Request body: SessionConfig (see Section 2a)
// Returns: { sessionId: string, status: "created" }
// Auth: Required (Privy token)
// Side effects: Creates session in Supabase, optionally processes entry fee
```

**GET `/api/jam/sessions`** -- List sessions
```typescript
// Query params: status, type, limit, offset, wallet (filter by creator)
// Returns: { sessions: JamSession[], total: number }
// Auth: Not required for public sessions
```

**GET `/api/jam/sessions/[sessionId]`** -- Get session detail
```typescript
// Returns: Full session data including contributors, fragments, variations, votes
// Auth: Not required (public data)
```

**POST `/api/jam/sessions/[sessionId]/join`** -- Join a session
```typescript
// Request body: { walletAddress: string, inviteCode?: string, entryFeeTxSignature?: string }
// Returns: { contributor: Contributor }
// Auth: Required
// Validation: Check session is open, max contributors not reached, invite code valid
```

**POST `/api/jam/sessions/[sessionId]/fragments`** -- Submit a fragment
```typescript
// Request body: Fragment (varies by type -- see Section 3)
// Returns: { fragment: Fragment }
// Auth: Required, must be a session contributor
// Validation: Max 3 fragments per contributor, 1 per type, content moderation
```

**POST `/api/jam/sessions/[sessionId]/synthesize`** -- Trigger synthesis
```typescript
// Request body: {} (no body needed -- triggered by status change)
// Returns: { status: "synthesizing", estimatedDurationMs: number }
// Auth: Server-only (triggered by cron or status change handler)
// Side effects: Runs full synthesis pipeline, creates variations, updates session status
```

**POST `/api/jam/sessions/[sessionId]/vote`** -- Cast a vote
```typescript
// Request body: { variationId: string, walletAddress: string }
// Returns: { vote: Vote }
// Auth: Required, must be a session contributor
// Validation: 1 vote per contributor, voting window open
```

**POST `/api/jam/sessions/[sessionId]/mint`** -- Mint the winning variation
```typescript
// Request body: {} (no body needed)
// Returns: { nftMintAddress: string, metadataUri: string, explorerUrl: string }
// Auth: Server-only (triggered by voting completion)
// Side effects: Uploads to Arweave, mints via Metaplex Core, initializes session PDA
```

**POST `/api/jam/sessions/[sessionId]/archive`** -- Upload archive to Arweave
```typescript
// Request body: {} (no body needed)
// Returns: { archiveUri: string }
// Auth: Server-only (triggered after minting)
// Side effects: Constructs full archive JSON, uploads to Arweave, updates session record
```

### Entry Fee Handling

Entry fees are SOL transfers from the contributor's wallet to the session PDA (or a platform-controlled escrow wallet before the Anchor program is deployed).

**MVP (before Anchor program):**
- Entry fees are transferred to the platform's server wallet (`ARWEAVE_WALLET_SECRET`)
- The platform tracks fees per session in Supabase
- After minting, the platform distributes proceeds manually (or via a batch script)
- This is centralized but works for MVP

**Post-MVP (with Anchor program):**
- Entry fees are transferred directly to the session PDA
- The Anchor program manages distribution trustlessly
- No platform custody of contributor funds

### Background Job Processing

Synthesis and minting are long-running operations (30-120 seconds) that should not block API routes.

**Option 1: Vercel Background Functions (recommended)**
- Use `waitUntil()` from Next.js to run synthesis after returning a response
- Or use Vercel's `maxDuration` setting (up to 300s on Pro plan)

**Option 2: Queue-based (post-MVP)**
- Use Inngest, Trigger.dev, or BullMQ (with Upstash Redis) for job queuing
- API route enqueues the job, background worker processes it
- More reliable, supports retries and monitoring

**MVP approach:**
```typescript
// In POST /api/jam/sessions/[sessionId]/synthesize
export async function POST(req: NextRequest) {
  // Validate session status
  // Update status to "synthesizing"
  // Return immediately

  // Use waitUntil for background processing
  const { waitUntil } = await import("next/server");
  waitUntil(runSynthesis(sessionId));

  return NextResponse.json({ status: "synthesizing" });
}

async function runSynthesis(sessionId: string) {
  try {
    // 1. Fetch all fragments
    // 2. Analyze reference images
    // 3. Run LLM scene composition
    // 4. Generate image variations
    // 5. Store variations in DB
    // 6. Update session status to "voting"
    // 7. Broadcast "synthesis_complete" event
  } catch (error) {
    // Update session status to "failed"
    // Log error
  }
}
```

### Integration with Existing Systems

**Privy Auth:** All jam session API routes use the same Privy cookie check as existing routes. The `privy-token` cookie is validated on every authenticated request.

**Umi/Metaplex Core:** The minting step reuses the existing server-side Umi setup from `/api/upload-metadata/route.ts`. The `getServerUmi()` function provides a funded keypair for signing mint transactions.

**Replicate (Flux):** Image generation reuses the existing Replicate integration from `/api/generate/route.ts`. The synthesis step uses the same model and retry logic.

**Supabase:** New tables are added to the existing Supabase project. The server-side client (`src/lib/supabase.ts`) is reused for all writes. A new client-side Supabase client is needed for Realtime subscriptions.

**Arweave/Irys:** Archive uploads use the same server-side Irys uploader from `/api/upload-metadata/route.ts`.

---

## 13. Social Features

### Notifications

**In-app notifications (MVP):**
- Toast notifications when a new contributor joins your session
- Toast when a new fragment is submitted
- Toast when synthesis completes
- Toast when someone votes
- Modal when the winner is revealed

**Push notifications (post-MVP):**
- Browser push notifications via service worker
- "Session X is now accepting contributions"
- "Voting is open for Session X"
- "You earned 0.5 SOL from a Jam Session sale!"

### Contributor Profiles

Extend the existing user model with jam session stats:

```typescript
interface JamProfile {
  walletAddress: string;
  sessionsCreated: number;
  sessionsJoined: number;
  fragmentsSubmitted: number;
  winningVoteRate: number;       // How often the contributor's vote matches the winner
  totalEarned: number;           // Total SOL earned from jam session sales
  favoriteFragmentType: string;  // Most frequently submitted fragment type
  streak: number;                // Consecutive sessions participated in
}
```

**Profile page:** `/profile/[wallet]/jams` -- shows all sessions the wallet has participated in, with their fragments and influence maps.

### Session Sharing

**Share card (Open Graph):**
- When sharing a session URL, the OG image shows the winning artwork (or the session theme if not yet minted)
- Title: "Jam Session: [Theme] | mintIT"
- Description: "[N] contributors created this together"

**Implementation:** Dynamic OG images via Next.js `opengraph-image.tsx` route:

```
src/app/jam/[sessionId]/opengraph-image.tsx
```

**Share actions:**
- "Share to X/Twitter" button with pre-filled text: "I just contributed to a jam session on @mintIT! [link]"
- Copy link button
- QR code for in-person sharing

### Leaderboards

**Route:** `/jam/leaderboard`

**Leaderboard categories:**
- Most sessions created (top hosts)
- Most sessions joined (most collaborative)
- Highest total earnings from jam sessions
- Most winning votes (best taste)
- Longest streak (most consistent)

**Implementation:** Materialized views or periodic aggregation queries in Supabase.

### Achievements

Badge-style achievements stored in Supabase and displayed on profiles:

| Achievement | Condition |
|------------|-----------|
| First Jam | Join your first session |
| Host with the Most | Create 10 sessions |
| Perfect Pitch | Vote for the winner 5 times in a row |
| Rainbow Contributor | Submit all 5 fragment types across sessions |
| Whale Jammer | Join a session with entry fee > 1 SOL |
| Chain Master | Complete a full chain session (all links) |
| Agent Whisperer | Join 5 agent-hosted sessions |
| Battle Veteran | Win 3 battle mode sessions |

---

## 14. Revenue Model

### Entry Fees

The primary revenue source. Every session can have an entry fee.

**Platform cut:** 10% of entry fees.

**Example economics for an open session (25 contributors, 0.05 SOL entry fee):**
```
Total entry fees:         25 x 0.05 = 1.25 SOL
Platform cut (10%):       0.125 SOL
Minting costs:            ~0.01 SOL (Arweave + Solana tx)
Net to contributors:      1.115 SOL (split 25 ways = 0.0446 SOL each)
```

Contributors are not paying to receive SOL back -- they're paying to create a collaborative NFT. The real value is the NFT itself (ownership, potential secondary sale, cultural participation).

### Secondary Sale Royalties

When a jam session NFT sells on the marketplace:

**Royalty rate:** 7.5% of sale price.
**Split:** 5% to contributors (distributed proportionally), 2.5% to platform.

**Example: NFT sells for 10 SOL:**
```
Royalty:                  10 x 0.075 = 0.75 SOL
To contributors (5%):    0.50 SOL (split 25 ways = 0.02 SOL each)
To platform (2.5%):      0.25 SOL
```

### Premium Session Types

Premium sessions with enhanced features, available for a creation fee:

| Feature | Free | Premium (0.1 SOL) |
|---------|------|-------------------|
| Max contributors | 25 | 50 |
| Variation count | 3 | 7 |
| Contribution window | Up to 1 hour | Up to 24 hours |
| Live preview | No | Yes |
| Custom style directions | No | Yes (upload your own) |
| Priority synthesis | No | Yes (faster queue) |
| Featured on homepage | No | Yes (for 24 hours) |

### Featured Sessions

Sessions can be "featured" on the `/jam` homepage for a flat fee:
- 24-hour feature: 0.5 SOL
- Displayed in a prominent carousel at the top of the page
- Marked with a "Featured" badge

### Sponsored Sessions

Brands or DAOs can sponsor sessions:
- Brand sets the theme (e.g., "Nike x Afrofuturism")
- Brand pays a flat sponsorship fee (negotiated)
- Entry fee is waived or reduced for contributors
- Brand logo appears on the session page and in the archive
- Brand may receive a percentage of the NFT ownership

This is a post-MVP monetization channel.

---

## 15. Risks & Mitigations

### 1. Low Participation (Cold Start Problem)

**Risk:** Sessions are created but nobody joins. Empty sessions undermine confidence in the platform.

**Mitigations:**
- **Agent-seeded sessions:** Use Agent-as-NFTs to create and participate in sessions automatically. There's always activity.
- **Staff-created sessions:** The mintIT team hosts daily sessions during launch period with compelling themes and no entry fee.
- **Minimum viable session:** 2 contributors (including the creator). Set expectations low -- a 2-person jam is still meaningful.
- **Session scheduling:** Allow sessions to be scheduled for a future time (e.g., "This session opens at 8 PM EST"). Build anticipation.
- **Social invitations:** Make it trivially easy to invite friends (share link, QR code, Twitter integration).

### 2. Trolling / Spam Submissions

**Risk:** Contributors submit off-topic, offensive, or spam fragments that degrade the session quality.

**Mitigations:**
- **Content moderation:** Every text fragment is checked by an LLM for relevance to the session theme and for policy violations. Flagged fragments are rejected with an explanation.
- **Image moderation:** NSFW detection on all uploaded reference images (existing infrastructure).
- **Entry fee as anti-spam:** Even a small entry fee (0.01 SOL) dramatically reduces spam.
- **Reputation system:** Repeated flagged contributions reduce the contributor's reputation, eventually resulting in a temporary or permanent ban from sessions.
- **Creator moderation (post-MVP):** Session creators can remove specific fragments during the contribution window.

### 3. AI Synthesis Quality with Diverse Inputs

**Risk:** When 25 contributors submit wildly different fragments, the synthesis output is incoherent or unsatisfying.

**Mitigations:**
- **The theme is the anchor.** Every fragment is interpreted through the session theme, providing coherence.
- **Style direction voting** pre-aligns contributors on a visual direction before synthesis.
- **Multiple variations** ensure at least one output is satisfying (even if others miss).
- **Quality scoring:** LLM evaluates each variation's coherence; low-scoring variations are regenerated.
- **Post-generation re-roll (post-MVP):** If all variations score below threshold, the synthesis is re-run with adjusted parameters.

### 4. Real-Time Infrastructure Complexity

**Risk:** Real-time features (live feed, live voting, synthesis progress) add significant infrastructure complexity and failure modes.

**Mitigations:**
- **Supabase Realtime for MVP.** Already in the stack, minimal new infrastructure.
- **Graceful degradation.** If real-time fails, the page falls back to polling (every 5 seconds). The experience is degraded but functional.
- **No real-time during synthesis.** The synthesis step is a single server-side operation; progress updates are broadcast via Supabase channel, but if they fail, the user can poll.
- **Connection resilience.** Supabase Realtime auto-reconnects. The `useSession` hook handles reconnection gracefully.

### 5. Fractional Ownership Legal Considerations

**Risk:** Fractional ownership of an NFT could be classified as a security offering in some jurisdictions.

**Mitigations:**
- **This is revenue sharing, not equity.** Contributors share in the proceeds of a specific creative work, not in a business entity.
- **No secondary market for "shares."** Contributors cannot sell their share of a jam session independently -- they only receive revenue from the NFT's sale. This reduces the "investment contract" argument.
- **Functional utility.** The ownership represents creative attribution and revenue rights for a specific artwork, not a speculative investment.
- **Seek legal counsel.** Before mainnet launch, consult with a crypto-native attorney on the revenue split structure.
- **Geographic restrictions (if needed).** Block participation from specific jurisdictions if legal analysis requires it.

### 6. Minting Costs Exceeding Entry Fees

**Risk:** For free or low-fee sessions, the platform absorbs Arweave upload + Solana transaction costs.

**Mitigations:**
- **Minimum entry fee for minting.** If the session is free, the NFT is minted only if contributors opt in and contribute to minting costs post-session.
- **Platform subsidy for launch period.** Absorb costs for the first N sessions to drive adoption, then introduce minimum fees.
- **Batch uploads.** Upload all session artifacts (archive, images, metadata) in a single Irys bundle to reduce per-item costs.

### 7. Contributor Unavailability During Voting

**Risk:** Contributors submit fragments but don't come back for the voting phase. Low vote participation leads to unsatisfying selections.

**Mitigations:**
- **Short voting windows.** 15-30 minutes keeps urgency high.
- **Notifications.** Push notifications and in-app alerts when voting opens.
- **Auto-selection fallback.** If < 50% of contributors vote, the variation with the highest AI coherence score wins automatically.
- **Early resolution.** If > 50% of total contributors vote for the same variation, it wins immediately.

---

## 16. Timeline Estimate

### Dependencies

Phase 4 depends on the following from prior phases:

| Dependency | Phase | Required For | Can Stub? |
|-----------|-------|-------------|-----------|
| Privy auth + wallet | Existing | Everything | No (already built) |
| Metaplex Core minting | Existing | NFT minting step | No (already built) |
| Arweave uploads | Existing | Archive + NFT storage | No (already built) |
| Replicate image gen | Existing | AI synthesis | No (already built) |
| Supabase database | Existing | Session state | No (already built) |
| Agent-as-NFT (Phase 2) | Phase 2 | Agent-hosted sessions | Yes -- agent features can be added later |
| Style Recipe Marketplace (Phase 3) | Phase 3 | Recipe fragment type | Yes -- recipe fragments can be added later |
| Cultural Mirrors (Phase 1) | Phase 1 | Agent theme sourcing | Yes -- agents can use static themes initially |

**Key insight:** The core jam session experience (create -> contribute -> synthesize -> vote -> mint) has NO dependencies on Phases 1-3. It can be built and launched independently. Agent hosting and recipe integration are additive features.

### MVP (4-6 Weeks)

The simplest possible jam session that delivers the core experience.

**Week 1-2: Foundation**
- [ ] Database schema (all tables above)
- [ ] Supabase Realtime setup (enable realtime on tables, RLS policies)
- [ ] `POST /api/jam/sessions` -- create session
- [ ] `GET /api/jam/sessions` -- list sessions
- [ ] `GET /api/jam/sessions/[id]` -- session detail
- [ ] `POST /api/jam/sessions/[id]/join` -- join session (no entry fee in MVP)
- [ ] `POST /api/jam/sessions/[id]/fragments` -- submit text prompt fragment only
- [ ] `/jam` page (session listing)
- [ ] `/jam/create` page (session creation form)
- [ ] `/jam/[id]` page (basic session view with text contributions)

**Week 3: Synthesis + Voting**
- [ ] `POST /api/jam/sessions/[id]/synthesize` -- LLM scene composition + image gen
- [ ] `POST /api/jam/sessions/[id]/vote` -- cast vote
- [ ] Synthesis progress display
- [ ] Voting interface
- [ ] Winner selection logic
- [ ] Session state machine (status transitions + timer-based triggers)

**Week 4: Minting + Archive**
- [ ] `POST /api/jam/sessions/[id]/mint` -- mint winning variation as NFT
- [ ] `POST /api/jam/sessions/[id]/archive` -- upload archive to Arweave
- [ ] NFT metadata construction with contributor list
- [ ] `/jam/[id]/making-of` page (basic archive view)
- [ ] Equal-split ownership recording (Supabase -- no Anchor program yet)

**Week 5-6: Polish + Launch**
- [ ] Real-time live feed (Supabase Realtime integration)
- [ ] Session timer component
- [ ] Celebration/reveal animation
- [ ] Mobile responsive layout
- [ ] Error handling and edge cases (cancelled sessions, failed synthesis)
- [ ] Testing (manual + basic automated tests)

**MVP scope cuts:**
- No entry fees (free sessions only)
- No Anchor program (ownership recorded in Supabase, not on-chain)
- Text prompt fragments only (no images, style votes, colors, or recipes)
- No battle mode or chain sessions
- No agent integration
- No leaderboards or achievements
- No live preview during contribution window
- No push notifications
- Polling fallback instead of full real-time where needed

### V2 (Weeks 7-10)

**Week 7-8: Full Fragment Support**
- [ ] Image fragment upload + LLM analysis
- [ ] Style direction generation and voting
- [ ] Color palette picker + merging algorithm
- [ ] Entry fee support (SOL transfer to platform wallet)
- [ ] Content moderation on all fragment types

**Week 9-10: Session Types + Social**
- [ ] Invite-only sessions with invite codes
- [ ] Battle mode (two teams)
- [ ] Session sharing (OG images, Twitter share)
- [ ] Contributor profiles with jam stats
- [ ] Notification system (in-app toasts)

### V3 (Weeks 11-16)

**Week 11-13: On-Chain Revenue**
- [ ] Anchor program development (`mintit_jam`)
- [ ] Session PDA initialization after minting
- [ ] Contributor registration with share basis points
- [ ] Claim instruction implementation
- [ ] Entry fee routing to session PDA
- [ ] Integration testing on devnet

**Week 14-16: Agent Integration + Advanced**
- [ ] Agent-hosted session creation (Phase 2 integration)
- [ ] Agent contribution logic
- [ ] Agent-only sessions
- [ ] Chain sessions
- [ ] Style Recipe fragment type (Phase 3 integration)
- [ ] Leaderboards and achievements
- [ ] Premium session features
- [ ] Featured sessions marketplace

### Full Vision (Ongoing)

- Push notifications via service worker
- Live synthesis preview (real-time low-fi preview during contributions)
- Sponsored sessions infrastructure
- Advanced weighting system (reputation-based)
- Cross-session analytics dashboard
- API access for third-party integrations
- Mobile-native experience (PWA or React Native)

---

## Appendix A: Environment Variables

New environment variables required for Phase 4:

```env
# Supabase client-side (for Realtime subscriptions)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Anthropic API (for LLM synthesis -- scene composition + image analysis)
ANTHROPIC_API_KEY=sk-ant-...

# Anchor program (post-MVP)
JAM_PROGRAM_ID=JamXXX...

# Optional: session processing queue
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...
```

Existing env vars reused:
- `REPLICATE_API_TOKEN` (image generation)
- `ARWEAVE_WALLET_SECRET` (server-side minting + Arweave uploads)
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (server-side DB operations)
- `NEXT_PUBLIC_SOLANA_RPC_URL` (Solana RPC)

## Appendix B: Cost Estimates Per Session

| Cost Item | Amount | Paid By |
|-----------|--------|---------|
| LLM scene composition (Claude Sonnet, ~2K tokens) | ~$0.01 | Platform |
| Reference image analysis (per image, ~500 tokens) | ~$0.005 | Platform |
| Style direction generation (one-time per session) | ~$0.01 | Platform |
| Image generation (5 variations x Flux Schnell) | ~$0.025 | Platform |
| Arweave upload (winning image + metadata) | ~$0.005 | Session treasury or platform |
| Arweave upload (full archive, ~50KB JSON) | ~$0.001 | Platform |
| Solana transaction fees (mint) | ~$0.001 | Session treasury or platform |
| **Total platform cost per session** | **~$0.06** | |

At 100 sessions/day, that is approximately $6/day or $180/month in platform costs (excluding entry fee revenue).

With a minimum entry fee of 0.01 SOL (~$2.50 at $250/SOL) and 10 contributors per session, the session generates $25 in entry fees. Platform takes 10% = $2.50. Cost is $0.06. Margin is strong.

## Appendix C: Key Design Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Real-time tech | Supabase Realtime | Already in stack, low complexity, sufficient for MVP scale |
| Session state | Supabase (off-chain) | Too mutable/frequent for on-chain; only revenue PDA goes on-chain |
| Minting signer | Platform server keypair | Can't require all N contributors to co-sign; platform mints on their behalf |
| Ownership model | Equal split (MVP) | Fairest, simplest, least contentious; weighting added later |
| Revenue distribution | Custom Anchor program | Metaplex royalties unreliable across marketplaces; PDA is trustless |
| Fragment limit | 3 per contributor (1 per type) | Prevents domination by single contributor; encourages diversity |
| Voting | 1 vote per contributor, public ballot | Simple, transparent, social |
| Synthesis model | Claude for scene composition, Flux for image | Best-in-class for each step; matches existing stack |
| Archive storage | Arweave | Permanent, immutable, consistent with existing NFT metadata storage |
| Background processing | `waitUntil()` (MVP), job queue (V3) | Simplest approach for MVP; queue for reliability at scale |
