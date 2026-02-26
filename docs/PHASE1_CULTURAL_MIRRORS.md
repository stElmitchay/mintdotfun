# Phase 1: Cultural Mirrors (Aging/Living NFTs) — Implementation Plan

**Status**: Pre-development
**Estimated total duration**: 10-12 weeks
**Last updated**: 2026-02-25

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [Architecture Overview](#2-architecture-overview)
3. [Data Feed Layer](#3-data-feed-layer)
4. [AI Interpretation Pipeline](#4-ai-interpretation-pipeline)
5. [Image Generation](#5-image-generation)
6. [On-Chain Integration](#6-on-chain-integration)
7. [Mirror Types](#7-mirror-types)
8. [Minting Flow](#8-minting-flow)
9. [The Timeline / Archive](#9-the-timeline--archive)
10. [Technical Implementation](#10-technical-implementation)
11. [Revenue Model](#11-revenue-model)
12. [Risks & Mitigations](#12-risks--mitigations)
13. [Success Metrics](#13-success-metrics)
14. [Timeline Estimate](#14-timeline-estimate)

---

## 1. Product Vision

### What the user sees

A Cultural Mirror is an NFT that is alive. When you open it today, it looks different than it did yesterday — and different from how it will look tomorrow. It is a living, breathing digital artwork that reflects the real-world cultural pulse of a specific place, scene, or movement.

You mint a "Dubai Mirror." On a scorching July day, the artwork shimmers with heat distortion, mirage effects bleeding into the skyline, gold tones dominating. When Art Dubai opens, gallery facades materialize in the scene, installations emerge in the foreground. During Ramadan, crescent lanterns glow warm amber against a twilight sky. When SOL crashes 40%, the luxury towers go dark — neon signage flickers, the scene desaturates. When it recovers, aurora borealis in purple and gold sweeps across the sky.

Each state is permanently archived on Arweave. Over weeks and months, your NFT accumulates a visual history — a timeline of cultural moments encoded as art. The NFT you own today is the latest frame. But you can browse every previous frame, watch the evolution, see the story unfold.

### What makes this different from static AI art

| Static AI NFT | Cultural Mirror |
|---|---|
| One image, forever | New image every update cycle |
| Disconnected from reality | Fed by real-world data streams |
| Value = aesthetic appeal only | Value = aesthetic + cultural record + rarity of specific moments |
| No reason to revisit | Reason to check daily — what does it look like now? |
| Fungible (anyone can prompt the same thing) | Non-fungible in time (no one else owns _that_ moment of _that_ mirror) |
| Dead after mint | Accumulates value as its timeline grows |

### Core emotional hook

"I own a living piece of Dubai's cultural story." Not a photo. Not a rendering. A mirror that watches the city and paints what it sees, every single day, forever.

### Target user profiles

1. **Cultural collectors**: People who connect with specific cities, scenes, or movements. Expats, travelers, cultural enthusiasts. They want to own a piece of the culture they love.
2. **Data art enthusiasts**: People fascinated by the intersection of data visualization and generative art. They appreciate the system, not just the output.
3. **Long-term holders**: People who understand that the NFT becomes more valuable over time as its archive grows. A Mirror with 365 frames is categorically different from one with 7.
4. **Speculators on cultural moments**: A Mirror that captured the exact day of a historic event (a market crash, a cultural festival, a political shift) has a specific frame that is historically significant.

---

## 2. Architecture Overview

### System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CRON SCHEDULER                               │
│                   (Vercel Cron / GitHub Actions)                     │
│         Triggers update cycle per mirror on its cadence             │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ HTTP POST /api/mirrors/update
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     DATA AGGREGATION LAYER                          │
│                   (Server-side, Next.js API route)                  │
│                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌─────────┐ │
│  │ Weather  │ │  News /  │ │ On-chain  │ │  Social  │ │Calendar │ │
│  │   API    │ │ Trends   │ │   Data    │ │Sentiment │ │ Events  │ │
│  └────┬─────┘ └────┬─────┘ └─────┬─────┘ └────┬─────┘ └────┬────┘ │
│       └─────────────┴─────────────┴────────────┴────────────┘      │
│                            │                                        │
│                   Structured data blob                              │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    AI INTERPRETATION LAYER                           │
│                      (Server-side LLM call)                         │
│                                                                     │
│  Input: data blob + mirror config + previous frame description      │
│  Output: scene description + style directives + continuity notes    │
│                                                                     │
│  Model: Claude 3.5 Sonnet (primary) / GPT-4o-mini (fallback)       │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    IMAGE GENERATION LAYER                            │
│                    (Server-side Replicate call)                      │
│                                                                     │
│  Input: scene description + style prompt + previous frame (img2img) │
│  Output: 1024x1024 WebP image                                      │
│                                                                     │
│  Model: Flux Schnell (dev) → Flux Pro (production)                  │
│  Fallback: SDXL via Replicate                                       │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    STORAGE + ON-CHAIN UPDATE                        │
│                      (Server-side)                                  │
│                                                                     │
│  1. Upload new image to Arweave via Irys                            │
│  2. Upload new metadata JSON to Arweave (includes frame history)    │
│  3. Store frame record in Supabase (timeline DB)                    │
│  4. Update Metaplex Core asset URI via update authority keypair     │
│  5. Emit event / webhook for frontend notification                  │
└─────────────────────────────────────────────────────────────────────┘
```

### Client vs. Server vs. Cron

| Layer | Runs on | Triggered by |
|---|---|---|
| Minting a new Mirror | Client (wallet signs tx) + Server (Arweave upload) | User action |
| Data feed aggregation | Server (API route) | Cron scheduler |
| LLM interpretation | Server (API route) | Cron scheduler |
| Image generation | Server (Replicate API) | Cron scheduler |
| Arweave upload (new frame) | Server (Irys uploader) | Cron scheduler |
| On-chain metadata update | Server (update authority keypair) | Cron scheduler |
| Timeline browsing | Client (reads Supabase + Arweave) | User action |
| Mirror detail page | Client (reads on-chain + Supabase) | User action |

Key principle: **The user signs exactly one transaction — when they mint.** Every subsequent update is performed server-side by the update authority keypair. The user never signs anything for updates.

---

## 3. Data Feed Layer

### API Selection

#### Weather — OpenWeatherMap

- **Endpoint**: `api.openweathermap.org/data/2.5/weather`
- **Free tier**: 1,000 calls/day, current weather only
- **Paid tier** ($40/month "Professional"): 1,000,000 calls/month, forecasts, historical
- **Data used**: temperature, humidity, weather condition (clear/clouds/rain/storm/snow), wind speed, sunrise/sunset times, visibility
- **Rate limit**: 60 calls/min (free), 3,000 calls/min (paid)
- **Fallback**: WeatherAPI.com (free tier: 1M calls/month, but less reliable)

For 5 mirrors updating daily, we need 5 calls/day. Free tier is more than sufficient for MVP.

#### News & Trends — NewsAPI + Google Trends (unofficial)

- **NewsAPI** (`newsapi.org`)
  - **Free tier**: 100 requests/day, articles up to 1 month old, dev use only
  - **Business tier** ($449/month): 250,000 requests/month, real-time, commercial use
  - **Data used**: top headlines for a region/topic, article titles and descriptions
  - **MVP approach**: Free tier (100 req/day is enough for 5 mirrors)
  - **Production approach**: Business tier or switch to Bing News Search API ($10/1,000 calls)

- **Google Trends** (unofficial via `google-trends-api` npm package)
  - **Cost**: Free (scrapes Google Trends)
  - **Risk**: No SLA, can break if Google changes their frontend
  - **Data used**: trending searches for a specific region
  - **Fallback**: X/Twitter trending topics via the API

- **Alternative for production**: NewsCatcher API ($0.001/call), or a curated RSS feed aggregator

#### On-Chain Data — Solana RPC + CoinGecko

- **Solana RPC** (Helius)
  - **Free tier**: 100,000 credits/day (about 10K RPC calls)
  - **Data used**: SOL price, NFT market volume (via DAS API), Solana TPS, recent notable transactions
  - **Rate limit**: 50 req/sec (free)

- **CoinGecko** (`api.coingecko.com`)
  - **Free tier**: 30 calls/min, no API key required
  - **Demo tier** ($0): 30 calls/min with API key, 10,000 calls/month
  - **Data used**: SOL price, 24h change, market cap, trading volume, trending coins
  - **Rate limit**: 30 calls/min (free)

For 5 mirrors, we need ~5 calls/day to CoinGecko. Free tier is sufficient.

#### Social Sentiment — X/Twitter API

- **X API Free tier**: 1 app, read-only, 100 tweets/month search (effectively useless)
- **X API Basic** ($200/month): 10,000 tweets/month read, limited search
- **X API Pro** ($5,000/month): Full search, analytics
- **MVP approach**: Skip direct X API. Instead, use a sentiment proxy:
  - **LunarCrush** (`lunarcrush.com`): Social intelligence for crypto. Free tier gives basic sentiment scores. Their API provides social volume, sentiment, and trending topics for crypto assets.
  - **Alternative**: Use Google Trends as a proxy for social buzz.
- **Production approach**: X API Basic ($200/month) + sentiment analysis via Claude on the fetched tweets.

#### Calendar Events — Manual + Public APIs

- **Calendarific** (`calendarific.com`)
  - **Free tier**: 1,000 calls/month, public holidays for 230+ countries
  - **Data used**: national holidays, religious observances, cultural events
  - **Rate limit**: 100 calls/min

- **PredictHQ** (`predicthq.com`)
  - **Free tier**: 500 events/day
  - **Data used**: concerts, festivals, sports events, conferences
  - **Rate limit**: 10 req/sec (free)

- **Manual calendar overlay**: For each mirror type, maintain a curated JSON of known recurring cultural events (Fashion Week dates, Art Week dates, Ramadan dates, etc.). This is the most reliable approach for cultural events that the APIs miss.

### Data Feed Configuration Per Mirror

Each mirror type has a `DataFeedConfig` that specifies which APIs to call and how to weight the results:

```typescript
interface DataFeedConfig {
  mirrorType: string;
  location: { lat: number; lon: number; city: string; country: string };
  weatherEnabled: boolean;
  newsKeywords: string[];          // e.g., ["Dubai", "UAE", "Emirates"]
  newsRegion: string;              // e.g., "ae" (ISO 3166)
  onChainEnabled: boolean;
  socialKeywords: string[];        // e.g., ["Dubai", "DIFC", "Burj"]
  calendarCountry: string;         // e.g., "AE"
  customEvents: CalendarEvent[];   // manually curated recurring events
  dataWeights: {
    weather: number;     // 0-1, how much weather influences the scene
    news: number;
    onChain: number;
    social: number;
    calendar: number;
  };
}
```

### Fallback Strategy

Every data feed has a three-tier fallback:

1. **Primary API call** — the main source
2. **Cache hit** — if the primary fails, use the last successful response (cached in Supabase with a TTL of 24 hours)
3. **Static default** — if both fail, use a hardcoded "neutral" data object for that feed (e.g., clear weather, no special events, flat market)

The system must never fail to generate a frame because a data API is down. Degraded data is acceptable; no frame is not.

---

## 4. AI Interpretation Pipeline

### Overview

Raw data from the feed layer is meaningless to an image generator. The interpretation pipeline transforms structured data into a rich scene description that the image model can render. This is the creative core of the system.

### The Interpretation Prompt

The LLM receives a structured prompt with four sections:

```
SYSTEM: You are the creative director for a Cultural Mirror NFT — a living
artwork that reflects the cultural pulse of {mirror.city}. Your job is to
translate raw data about the city into a vivid scene description that an
image generation model will render.

STYLE IDENTITY:
{mirror.baseStyleDescription}
{mirror.colorPaletteGuidelines}
{mirror.architecturalElements}
{mirror.culturalMotifs}

PREVIOUS FRAME:
Description: {previousFrame.sceneDescription}
Key visual elements: {previousFrame.keyElements}
Dominant colors: {previousFrame.dominantColors}
Mood: {previousFrame.mood}

CURRENT DATA:
Weather: {formattedWeatherData}
News & Trends: {formattedNewsData}
On-Chain: {formattedChainData}
Social Buzz: {formattedSocialData}
Calendar: {formattedCalendarData}

INSTRUCTIONS:
1. Analyze the data and identify the 2-3 most visually interesting signals.
2. Determine how these signals should manifest in the scene.
3. Write a scene description (150-250 words) that the image model will render.
4. Ensure VISUAL CONTINUITY with the previous frame:
   - The same architectural landmarks should be recognizable
   - Changes should feel like evolution, not random replacement
   - At least 60% of the visual composition should be consistent
5. Output the following JSON:

{
  "sceneDescription": "...",
  "imagePrompt": "...",       // optimized for the image model, ~100 words
  "mood": "...",              // one-word mood
  "dominantColors": [...],    // 3-5 hex codes
  "keyElements": [...],       // list of visual elements present
  "dataSignals": [...],       // which data points influenced this frame
  "continuityNotes": "...",   // what was kept from the previous frame and why
  "changeNotes": "..."        // what changed and why
}
```

### Visual Continuity Strategy

The biggest risk is the NFT looking like random, unrelated images from day to day. Continuity is maintained through:

1. **Base style identity**: Each mirror has a fixed style description that is always included in the prompt. This anchors the visual language (e.g., "Art deco illustration style with geometric patterns, warm metallics, and strong vertical lines reflecting Dubai's skyline architecture").

2. **Previous frame context**: The LLM always receives the previous frame's description and key elements. It is instructed to evolve from that state, not start from scratch.

3. **Architectural anchors**: Each mirror has 3-5 fixed visual elements that must always appear (e.g., for Dubai: Burj Khalifa silhouette, water reflection, desert horizon). These are non-negotiable landmarks.

4. **Mood transitions**: The system enforces smooth mood transitions. If yesterday's mood was "serene" and today's data suggests "chaotic," the LLM is instructed to render "tension building" rather than jumping straight to chaos.

5. **Image-to-image generation**: The previous frame is used as a reference image in the generation step (see Section 5). This creates visual overlap at the pixel level, not just the semantic level.

### LLM Selection

- **Production (full mode)**: Claude Sonnet via Anthropic API
  - Cost: $3/M input tokens, $15/M output tokens
  - Estimated per-frame: ~2,000 input tokens + ~500 output tokens = $0.0135/frame
  - For 5 mirrors updating daily: $0.0675/day = ~$2/month
  - Best cultural interpretation quality — understands nuance, events, mood transitions

- **Development / free tier**: Google Gemini Flash via Google AI
  - Cost: Free tier (15 RPM, 1M tokens/day — more than enough for mirror updates)
  - Good structured JSON output, solid creative interpretation
  - Currently used in the codebase to allow zero-cost development and testing

- **Why not a smaller model**: The interpretation requires cultural knowledge, creative writing, and structured JSON output. Smaller models hallucinate cultural details and produce less vivid scene descriptions.

---

## 5. Image Generation

### Model Selection

#### Development / MVP: Flux Schnell via Replicate

- Already integrated in the codebase (`src/app/api/generate/route.ts`)
- Model: `black-forest-labs/flux-schnell`
- Cost: ~$0.003/image via Replicate
- Speed: ~2-4 seconds per image
- Quality: Good for 1024x1024, sufficient for daily updates
- Supports img2img via `image` + `prompt_strength` parameters (already implemented)

#### Production: Flux Pro via Replicate

- Model: `black-forest-labs/flux-1.1-pro`
- Cost: ~$0.04/image
- Quality: Significantly better detail, coherence, and style adherence
- For 5 mirrors daily: $0.20/day = ~$6/month

#### Fallback: SDXL via Replicate

- Model: `stability-ai/sdxl`
- Cost: ~$0.002/image
- Useful if Flux is down or rate-limited

### Style Consistency Strategy

#### 1. Style prompt suffix

Each mirror has a fixed style suffix appended to every generation prompt. This is separate from the scene description and ensures the artistic style remains constant even as the content changes.

```typescript
interface MirrorStyle {
  basePrompt: string;     // Always appended, e.g., "art deco illustration, geometric patterns..."
  negativePrompt: string; // What to avoid, e.g., "photographic, realistic, 3D render..."
  aspectRatio: "1:1";     // Fixed for all mirrors
  outputFormat: "webp";
  outputQuality: 90;
  guidanceScale: number;  // Per-mirror (controls how literally the prompt is followed)
}
```

#### 2. Image-to-image transitions

Every frame after the first uses the previous frame as a reference image:

```typescript
const input: Record<string, unknown> = {
  prompt: interpretedScene.imagePrompt + ", " + mirror.style.basePrompt,
  image: previousFrameUrl,         // the last frame as reference
  prompt_strength: 0.65,           // 0.65 = 65% prompt, 35% reference image
  num_outputs: 1,
  aspect_ratio: "1:1",
  output_format: "webp",
  output_quality: 90,
};
```

The `prompt_strength` parameter is critical:
- **0.5**: Very conservative — frames will look very similar, slow evolution
- **0.65**: Balanced — noticeable daily changes while maintaining composition (recommended default)
- **0.8**: Aggressive — significant visual changes, looser continuity
- This value can be tuned per mirror or even dynamically based on how dramatically the data changed

#### 3. Seed management

We do NOT use fixed seeds. Fixed seeds + slight prompt changes produce nearly identical images (the model "locks in" to a composition). Instead, we rely on img2img for continuity and let the seed be random. This allows natural variation within the continuity constraints.

#### 4. First frame generation

The very first frame has no reference image. For the initial frame:
- Generate 4 variations
- Have the LLM score them against the mirror's style identity
- Pick the best one as the "genesis frame"
- This becomes the foundation for all future img2img evolution

### Cost Projection

| Mirrors | Cadence | Flux Schnell/mo | Flux Pro/mo |
|---------|---------|-----------------|-------------|
| 5 | Daily | $0.45 | $6.00 |
| 5 | 2x Daily | $0.90 | $12.00 |
| 20 | Daily | $1.80 | $24.00 |
| 100 | Daily | $9.00 | $120.00 |
| 100 | 2x Daily | $18.00 | $240.00 |

---

## 6. On-Chain Integration

### Metaplex Core Mutable Metadata

Metaplex Core assets have a `uri` field that points to a JSON metadata file. This URI can be updated by the **update authority**. This is the mechanism we use to make mirrors "live" — we update the URI to point to the latest frame's metadata.

#### Update Authority Architecture

When a Mirror NFT is minted, the **update authority** is set to a platform-controlled keypair — NOT the user's wallet. This is essential because:

1. The user should never need to sign transactions for automatic updates
2. The cron job needs to update metadata programmatically
3. The user still OWNS the NFT (they are the `owner`), they just don't control the metadata

```typescript
// At mint time:
const builder = createV2(umi, {
  asset: assetSigner,
  owner: umi.identity.publicKey,       // User's wallet — they own it
  updateAuthority: mirrorAuthorityPubkey, // Platform keypair — we update it
  name: mirrorConfig.name,
  uri: genesisMetadataUri,
  plugins: none(),
  externalPluginAdapters: none(),
});
```

#### Update Authority Keypair Management

- **Environment variable**: `MIRROR_AUTHORITY_SECRET` — a JSON byte array of the keypair's secret key
- This is the same pattern as `ARWEAVE_WALLET_SECRET` and `MARKETPLACE_AUTHORITY_SECRET` already in the codebase
- The keypair must be funded with SOL to pay for update transactions
- Each `updateV1` transaction costs ~0.000005 SOL (5,000 lamports) — negligible
- For 5 mirrors daily: 0.000025 SOL/day = ~0.0008 SOL/month

#### On-Chain Update Transaction

```typescript
import { updateV1 } from "@metaplex-foundation/mpl-core";

const builder = updateV1(umi, {
  asset: publicKey(mirrorMintAddress),
  newUri: newMetadataUri,        // Points to the latest frame's Arweave metadata
  newName: undefined,            // Keep existing name
});

// Sign with the mirror authority keypair (no user wallet involved)
const blockhash = await umi.rpc.getLatestBlockhash({ commitment: "finalized" });
const builtTx = builder.setBlockhash(blockhash).build(umi);
const signedTx = await umi.identity.signTransaction(builtTx);
const sig = await umi.rpc.sendTransaction(signedTx);
await umi.rpc.confirmTransaction(sig, {
  commitment: "confirmed",
  strategy: { type: "blockhash", ...blockhash },
});
```

### Arweave Storage Strategy

Each frame produces two Arweave uploads:

1. **Image file**: The generated WebP image (~200-500KB)
2. **Metadata JSON**: Standard Metaplex metadata format, with extensions for mirror data

The metadata JSON for a Cultural Mirror frame:

```json
{
  "name": "Dubai Mirror — Frame #47",
  "description": "A Cultural Mirror reflecting Dubai's cultural pulse. Frame generated on 2026-03-15. Weather: 38C clear skies. Trending: Art Dubai 2026 opening. SOL: $245 (+12%).",
  "image": "https://arweave.net/IMAGE_TX_ID",
  "attributes": [
    { "trait_type": "Mirror Type", "value": "Dubai Mirror" },
    { "trait_type": "Frame Number", "value": "47" },
    { "trait_type": "Generation", "value": "AI" },
    { "trait_type": "Mood", "value": "Vibrant" },
    { "trait_type": "Weather", "value": "Clear, 38C" },
    { "trait_type": "Data Signals", "value": "Art Dubai, SOL Rally, Summer Heat" },
    { "trait_type": "Update Cadence", "value": "Daily" }
  ],
  "properties": {
    "category": "image",
    "files": [{ "uri": "https://arweave.net/IMAGE_TX_ID", "type": "image/webp" }],
    "creators": [{ "address": "OWNER_WALLET", "share": 100 }],
    "mirror": {
      "type": "dubai",
      "frameNumber": 47,
      "generatedAt": "2026-03-15T06:00:00Z",
      "dataSnapshot": { ... },
      "sceneDescription": "...",
      "previousFrameUri": "https://arweave.net/PREV_METADATA_TX_ID"
    }
  }
}
```

Each frame's metadata includes a `previousFrameUri` pointer, creating a linked list on Arweave. This means the entire history is navigable from the latest frame alone — no database required for archival integrity.

### Arweave Cost Projection

- Image upload: ~300KB average = ~$0.0003 per image (Irys pricing)
- Metadata upload: ~2KB = negligible
- For 5 mirrors daily: ~$0.045/month
- For 100 mirrors daily: ~$0.90/month

Arweave storage is essentially free at this scale.

---

## 7. Mirror Types

### Mirror 1: Dubai Mirror

**Tagline**: "The pulse of the desert metropolis"

**Data sources**:
- Weather: OpenWeatherMap (Dubai, AE — lat 25.2048, lon 55.2708)
- News: NewsAPI keywords ["Dubai", "UAE", "Emirates", "DIFC", "Expo City"]
- On-chain: SOL price, Solana NFT market volume
- Calendar: UAE public holidays, Ramadan dates, Art Dubai, Dubai Design Week, Dubai Shopping Festival, F1 Abu Dhabi GP
- Social: Google Trends for "Dubai"

**Visual style**: Art deco meets futurism. Geometric patterns, metallic gold and copper tones, strong vertical lines reflecting the skyline. Burj Khalifa is always present as an anchor. Water reflection of the Creek/Marina at the bottom.

**Architectural anchors**: Burj Khalifa, Museum of the Future (the ring), Dubai Frame, water/marina foreground

**Update cadence**: Daily at 06:00 UTC (10:00 AM Dubai time)

**Target audience**: Expats, travelers who love Dubai, Gulf region crypto community, luxury/architecture enthusiasts

---

### Mirror 2: Lagos Pulse

**Tagline**: "The heartbeat of Africa's creative capital"

**Data sources**:
- Weather: OpenWeatherMap (Lagos, NG — lat 6.5244, lon 3.3792)
- News: NewsAPI keywords ["Lagos", "Nigeria", "Afrobeats", "Nollywood", "Nigerian tech"]
- On-chain: SOL price, trending Solana NFT collections
- Calendar: Nigerian holidays, Lagos Fashion Week, Lagos Biennial, Felabration, Tech conferences (AfricArena, Techpoint Build)
- Social: Google Trends for "Lagos" + "Afrobeats"

**Visual style**: Vibrant maximalism. Ankara/Adire textile patterns woven into architectural forms. Bold yellows, greens, and reds. Energy of the Third Mainland Bridge. Market stalls and tech hubs coexisting. Afrofuturist elements.

**Architectural anchors**: Third Mainland Bridge, Lagos Island skyline, Lekki Toll Gate, bustling market/street scene in foreground

**Update cadence**: Daily at 07:00 UTC (8:00 AM Lagos time)

**Target audience**: African diaspora, Afrobeats/Nollywood fans, African tech community, contemporary African art collectors

---

### Mirror 3: Tokyo Neon

**Tagline**: "Where tradition dissolves into electric light"

**Data sources**:
- Weather: OpenWeatherMap (Tokyo, JP — lat 35.6762, lon 139.6503)
- News: NewsAPI keywords ["Tokyo", "Japan", "anime", "Japanese tech", "Nintendo", "Sony"]
- On-chain: SOL price, trending anime/gaming NFTs
- Calendar: Japanese holidays, cherry blossom forecast (custom API: `jma.go.jp` sakura front), Tokyo Game Show, Comiket, New Year
- Social: Google Trends for "Tokyo" + "anime"

**Visual style**: Cyberpunk ukiyo-e fusion. Neon-drenched Shibuya/Shinjuku cityscape rendered with woodblock-print texture and flat color planes. Rain is a frequent motif. Kanji signage. Cherry blossoms when in season.

**Architectural anchors**: Shibuya Crossing, Tokyo Tower/Skytree in background, dense neon signage, train tracks/Yamanote Line

**Update cadence**: Daily at 00:00 UTC (9:00 AM Tokyo time)

**Target audience**: Anime/manga community, Japan enthusiasts, cyberpunk aesthetic collectors, gaming community

---

### Mirror 4: Solana Pulse

**Tagline**: "The on-chain heartbeat, visualized"

**Data sources**:
- Weather: None (this is a data-native mirror)
- News: NewsAPI keywords ["Solana", "SOL", "DeFi", "Solana NFT", "Metaplex"]
- On-chain (PRIMARY data source):
  - SOL price and 24h change
  - Solana TPS (transactions per second)
  - Total NFT mints in last 24h
  - Top trending NFT collection
  - DEX volume (Jupiter/Raydium aggregate)
  - Staking yield
- Calendar: Solana Breakpoint conference, Solana Hacker Houses, major protocol launches
- Social: Google Trends for "Solana"

**Visual style**: Abstract data visualization meets generative art. Flowing particle systems, network graphs, energy fields. Purple and green (Solana brand colors) as the base palette. When markets are bullish, the composition expands and brightens. When bearish, it contracts and darkens.

**Architectural anchors**: Central "node" representing the Solana network, radiating connection lines, particle flows representing transactions, a price chart subtly woven into the landscape

**Update cadence**: Every 12 hours (00:00 UTC and 12:00 UTC) — crypto markets move fast

**Target audience**: Solana community, DeFi/NFT traders, crypto data enthusiasts, Solana ecosystem builders

---

### Mirror 5: New York Rhythm

**Tagline**: "The city that never sleeps, and neither does its mirror"

**Data sources**:
- Weather: OpenWeatherMap (New York, US — lat 40.7128, lon -74.0060)
- News: NewsAPI keywords ["New York", "NYC", "Manhattan", "Brooklyn", "Wall Street", "Broadway"]
- On-chain: SOL price, US market sentiment (S&P 500 correlation via CoinGecko)
- Calendar: US holidays, Met Gala, Fashion Week, Tribeca Film Festival, New Year's Eve, Broadway openings
- Social: Google Trends for "NYC"

**Visual style**: Noir illustration meets street art. High-contrast black and white base with selective color pops (yellow cabs, red neon, blue sky). Gritty, editorial, cinematic. Steam rising from manhole covers. Reflections on wet pavement.

**Architectural anchors**: Empire State Building or One World Trade in skyline, taxi in foreground, steam/smoke atmosphere, bridge element (Brooklyn Bridge)

**Update cadence**: Daily at 12:00 UTC (7:00 AM EST)

**Target audience**: NYC residents/expats, street art collectors, noir/cinematic aesthetic enthusiasts, finance-meets-culture crowd

---

## 8. Minting Flow

### User Journey

1. **Browse mirrors**: User visits `/mirrors` — sees all available mirror types with their current live state (latest frame) and a preview animation showing the last 5 frames crossfading.

2. **Select a mirror**: User taps on a mirror type (e.g., "Dubai Mirror"). They land on `/mirrors/dubai` which shows:
   - The current live frame (full resolution)
   - A timeline strip at the bottom showing recent frames
   - Mirror stats (total frames, holders count, update cadence)
   - Description of what data feeds drive this mirror
   - "Mint This Mirror" CTA

3. **Mint**: User clicks "Mint This Mirror." A modal appears (similar to existing `MintPanel`):
   - Preview of the current frame
   - Auto-generated name: "Dubai Mirror #[next_number]"
   - Description explaining what a Cultural Mirror is
   - Price displayed clearly
   - "Mint" button

4. **Transaction**: Single wallet approval (same flow as current `mintSingleNFT`):
   - Server uploads genesis frame + metadata to Arweave
   - Client signs one Solana transaction
   - NFT is minted with update authority set to the mirror authority keypair
   - Mirror is registered in Supabase as "active" for the cron updater

5. **Confirmation**: Success screen shows:
   - The minted Mirror with its genesis frame
   - "Your mirror will update daily. Check back tomorrow for its first evolution."
   - Link to the Mirror detail page
   - Share button (Twitter/X card with the genesis frame)

### UI Components Needed

- `/mirrors` — Mirror marketplace/browser page
- `/mirrors/[type]` — Individual mirror type detail page with live preview
- `/mirrors/[type]/[address]` — Owned mirror detail page with full timeline
- `MirrorCard` — Card component for the marketplace grid
- `MirrorTimeline` — Horizontal timeline strip showing frame history
- `MirrorMintModal` — Minting modal (extends existing MintPanel pattern)
- `FrameViewer` — Full-screen frame viewer with metadata overlay

### UI Mockup — Mirror Card

```
┌──────────────────────────────┐
│                              │
│   [Current Frame Image]      │
│   (crossfades last 5 frames) │
│                              │
├──────────────────────────────┤
│ Dubai Mirror                 │
│ Frame #47 · Updated 3h ago   │
│                              │
│ 38C Clear · Art Dubai Week   │
│                              │
│ ┌────────┐  12 holders       │
│ │ 0.5 SOL│  47 frames        │
│ └────────┘                   │
└──────────────────────────────┘
```

---

## 9. The Timeline / Archive

### How it works

Every frame ever generated for every Mirror is permanently stored on Arweave and indexed in Supabase. This creates two layers of persistence:

1. **Arweave** (permanent, decentralized): The image and metadata exist forever, even if mintIT disappears. The linked-list structure (each frame points to the previous) means the entire history is navigable from the chain alone.

2. **Supabase** (fast, queryable): Enables efficient timeline browsing, filtering by date, searching by data signals, and aggregating statistics.

### Timeline UI

The Mirror detail page (`/mirrors/[type]/[address]`) features a scrollable timeline:

```
┌─────────────────────────────────────────────────────┐
│ Dubai Mirror #3 — Owned by 7kR3...mN4x              │
│ 47 frames · Updated daily since 2026-03-01           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [ CURRENT FRAME — Full Resolution ]                │
│                                                     │
│  Mood: Vibrant                                      │
│  Data: Art Dubai opening, 38C clear, SOL +12%       │
│  Generated: 2026-04-16 06:00 UTC                    │
│                                                     │
├─────────────────────────────────────────────────────┤
│ Timeline                                  [▶ Play]  │
│                                                     │
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐  │
│ │#47│ │#46│ │#45│ │#44│ │#43│ │#42│ │#41│ │#40│  │
│ │   │ │   │ │   │ │   │ │   │ │   │ │   │ │   │  │
│ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘  │
│  Today  -1d   -2d   -3d   -4d   -5d   -6d   -7d   │
│                                          [→ More]   │
└─────────────────────────────────────────────────────┘
```

### Playback Feature

Users can click "Play" to watch their Mirror's evolution as a timelapse:
- Crossfade between frames at 1-2 second intervals
- Metadata overlay shows the date and data signals for each frame
- Can be exported as a short video or GIF for sharing
- This is a powerful sharing/marketing feature: "Watch my Dubai Mirror evolve over 30 days"

### Frame Detail View

Clicking any frame in the timeline opens a full detail view:

```
┌─────────────────────────────────────────────────────┐
│ Frame #44 — 2026-04-13                              │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [ Full Resolution Frame Image ]                    │
│                                                     │
├─────────────────────────────────────────────────────┤
│ Scene Description:                                  │
│ "A sandstorm sweeps across the Dubai skyline,       │
│ reducing the Burj Khalifa to a golden silhouette.   │
│ Construction cranes emerge from the haze like..."   │
│                                                     │
│ Data Signals:                                       │
│ • Weather: Sandstorm warning, visibility <1km       │
│ • News: DIFC Quarter 1 results published            │
│ • SOL: $218 (-3% day)                               │
│ • Calendar: None                                    │
│                                                     │
│ Mood: Ominous                                       │
│ Dominant Colors: ■ ■ ■ ■ ■                          │
│                                                     │
│ [View on Arweave] [Share Frame] [← Prev] [Next →]   │
└─────────────────────────────────────────────────────┘
```

### Public Gallery of Notable Frames

A curated section on the homepage: "Notable Moments" — frames that captured significant cultural events:

- "The frame from the day SOL hit $300"
- "The frame during the Dubai sandstorm of April 2026"
- "The frame when Afrobeats won Album of the Year"

These become cultural artifacts. The Mirror didn't just capture the event — it interpreted it through its unique lens.

---

## 10. Technical Implementation

### New Files to Create

#### API Routes

**`src/app/api/mirrors/update/route.ts`** — The core update endpoint. Called by the cron scheduler.

```typescript
// POST /api/mirrors/update
// Headers: { Authorization: "Bearer CRON_SECRET" }
// Body: { mirrorType: "dubai" } or no body to update all due mirrors
//
// Flow:
// 1. Query Supabase for all active mirrors of the given type
// 2. Fetch data feeds for the mirror type
// 3. Call LLM interpretation
// 4. Generate new image
// 5. Upload image + metadata to Arweave
// 6. Update on-chain metadata for each mirror NFT of this type
// 7. Store frame record in Supabase
```

**`src/app/api/mirrors/mint/route.ts`** — Server-side portion of the mint flow. Handles Arweave upload and returns the metadata URI + mirror authority pubkey.

```typescript
// POST /api/mirrors/mint
// Body: { mirrorType: "dubai", ownerAddress: "..." }
// Response: { metadataUri, imageUri, mirrorAuthorityPubkey, name, frameNumber }
```

**`src/app/api/mirrors/timeline/route.ts`** — Returns the frame history for a specific mirror NFT.

```typescript
// GET /api/mirrors/timeline?mint=ADDRESS&limit=20&offset=0
// Response: { frames: [...], total: 47 }
```

**`src/app/api/mirrors/types/route.ts`** — Returns all available mirror types with their current state.

```typescript
// GET /api/mirrors/types
// Response: { mirrors: [{ type, name, currentFrameUrl, frameCount, holders, ... }] }
```

#### Core Library Files

**`src/lib/mirrors/types.ts`** — Type definitions for the mirror system.

```typescript
export interface MirrorType {
  id: string;
  name: string;
  tagline: string;
  description: string;
  dataFeedConfig: DataFeedConfig;
  style: MirrorStyle;
  updateCadence: "daily" | "twice-daily" | "weekly";
  updateTimeUtc: string;       // "06:00" or "00:00,12:00"
  mintPrice: number;           // in SOL
  maxSupply: number | null;    // null = unlimited
}

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
  dataSnapshot: Record<string, unknown>;
  generatedAt: string;
  previousFrameUri: string | null;
}

export interface ActiveMirror {
  mintAddress: string;
  mirrorType: string;
  ownerWallet: string;
  currentFrameNumber: number;
  currentMetadataUri: string;
  mintedAt: string;
  isActive: boolean;
}
```

**`src/lib/mirrors/config.ts`** — Mirror type configurations for all 5 initial mirrors.

**`src/lib/mirrors/dataFeeds.ts`** — Data feed fetching logic.

```typescript
export async function fetchMirrorData(config: DataFeedConfig): Promise<DataSnapshot> {
  const [weather, news, chain, social, calendar] = await Promise.allSettled([
    fetchWeather(config),
    fetchNews(config),
    fetchOnChainData(config),
    fetchSocialSentiment(config),
    fetchCalendarEvents(config),
  ]);
  // Merge results, using cached fallbacks for any failures
  return mergeDataSources(weather, news, chain, social, calendar, config);
}
```

**`src/lib/mirrors/interpreter.ts`** — LLM interpretation pipeline.

```typescript
export async function interpretData(
  mirrorConfig: MirrorType,
  dataSnapshot: DataSnapshot,
  previousFrame: MirrorFrame | null
): Promise<InterpretedScene> {
  // Build prompt, call Claude, parse JSON response
}
```

**`src/lib/mirrors/generator.ts`** — Image generation for mirror frames.

```typescript
export async function generateFrame(
  scene: InterpretedScene,
  mirrorStyle: MirrorStyle,
  previousFrameUrl: string | null
): Promise<Uint8Array> {
  // Call Replicate Flux with img2img if previous frame exists
}
```

**`src/lib/mirrors/updater.ts`** — Orchestrates the full update pipeline.

```typescript
export async function updateMirror(mirrorType: string): Promise<void> {
  // 1. Load mirror config
  // 2. Fetch data
  // 3. Interpret data
  // 4. Generate image
  // 5. Upload to Arweave
  // 6. Update all active mirror NFTs of this type on-chain
  // 7. Store frame in Supabase
}
```

**`src/lib/mirrors/mintMirror.ts`** — Client-side mirror minting (extends existing mintNFT pattern).

```typescript
export async function mintMirrorNFT(
  umi: Umi,
  mirrorType: string,
  onProgress?: (progress: MintProgress) => void
): Promise<MintResult> {
  // 1. Call /api/mirrors/mint to get metadataUri + mirrorAuthorityPubkey
  // 2. Build createV2 with updateAuthority = mirrorAuthorityPubkey
  // 3. Sign and send (same pattern as mintSingleNFT)
  // 4. Register the mint in Supabase via API call
}
```

#### Page Components

**`src/app/mirrors/page.tsx`** — Mirror marketplace/browser.

**`src/app/mirrors/[type]/page.tsx`** — Mirror type detail page (live preview, mint CTA).

**`src/app/mirrors/[type]/[address]/page.tsx`** — Owned mirror detail page with timeline.

**`src/components/mirrors/MirrorCard.tsx`** — Card component for the marketplace grid.

**`src/components/mirrors/MirrorTimeline.tsx`** — Horizontal scrollable timeline of frames.

**`src/components/mirrors/MirrorMintModal.tsx`** — Minting modal for mirrors.

**`src/components/mirrors/FrameViewer.tsx`** — Full-screen frame viewer with metadata.

**`src/components/mirrors/FramePlayback.tsx`** — Timelapse playback component.

#### Hooks

**`src/hooks/useMirrorTimeline.ts`** — Fetches and caches timeline data for a mirror.

**`src/hooks/useMirrorTypes.ts`** — Fetches available mirror types and their current state.

### Modifications to Existing Files

**`src/types/index.ts`** — Add mirror-related type exports.

**`src/lib/supabase.ts`** — Add `MirrorRow`, `MirrorFrameRow`, and `ActiveMirrorRow` type definitions.

**`src/components/layout/Header.tsx`** — Add "Mirrors" navigation link.

**`src/app/page.tsx`** — Add a "Cultural Mirrors" section to the homepage showcasing live mirrors.

### Database Schema (Supabase)

#### `mirror_types` table

```sql
CREATE TABLE mirror_types (
  id TEXT PRIMARY KEY,                    -- "dubai", "lagos", etc.
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  config JSONB NOT NULL,                  -- Full MirrorType config
  current_frame_number INT DEFAULT 0,
  current_frame_image_uri TEXT,
  current_frame_metadata_uri TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `mirror_frames` table

```sql
CREATE TABLE mirror_frames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mirror_type TEXT NOT NULL REFERENCES mirror_types(id),
  frame_number INT NOT NULL,
  image_uri TEXT NOT NULL,
  metadata_uri TEXT NOT NULL,
  scene_description TEXT,
  mood TEXT,
  dominant_colors TEXT[],
  key_elements TEXT[],
  data_signals TEXT[],
  data_snapshot JSONB,
  generated_at TIMESTAMPTZ NOT NULL,
  previous_frame_id UUID REFERENCES mirror_frames(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(mirror_type, frame_number)
);

CREATE INDEX idx_mirror_frames_type_number ON mirror_frames(mirror_type, frame_number DESC);
```

#### `active_mirrors` table

```sql
CREATE TABLE active_mirrors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mint_address TEXT NOT NULL UNIQUE,
  mirror_type TEXT NOT NULL REFERENCES mirror_types(id),
  owner_wallet TEXT NOT NULL,
  current_frame_number INT DEFAULT 0,
  current_metadata_uri TEXT,
  is_active BOOLEAN DEFAULT true,
  minted_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated_at TIMESTAMPTZ
);

CREATE INDEX idx_active_mirrors_type ON active_mirrors(mirror_type) WHERE is_active = true;
CREATE INDEX idx_active_mirrors_owner ON active_mirrors(owner_wallet);
```

### Cron Job Setup

#### Vercel Cron (recommended for MVP)

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/mirrors/update?type=tokyo",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/mirrors/update?type=dubai",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/mirrors/update?type=lagos",
      "schedule": "0 7 * * *"
    },
    {
      "path": "/api/mirrors/update?type=solana",
      "schedule": "0 0,12 * * *"
    },
    {
      "path": "/api/mirrors/update?type=newyork",
      "schedule": "0 12 * * *"
    }
  ]
}
```

Vercel Cron free tier supports up to 2 cron jobs with daily frequency. Pro plan ($20/month) supports up to 40 cron jobs. We need 6 invocations/day across 5 mirrors.

#### Alternative: GitHub Actions (free)

If Vercel Cron limits are hit, a GitHub Actions workflow can trigger the update endpoint:

```yaml
name: Mirror Updates
on:
  schedule:
    - cron: '0 0 * * *'   # Tokyo
    - cron: '0 6 * * *'   # Dubai
    - cron: '0 7 * * *'   # Lagos
    - cron: '0 0,12 * * *' # Solana
    - cron: '0 12 * * *'  # New York
```

### Environment Variables Required

```bash
# Existing (already in .env)
REPLICATE_API_TOKEN=...
ARWEAVE_WALLET_SECRET=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SOLANA_RPC_URL=...

# New for Cultural Mirrors
MIRROR_AUTHORITY_SECRET=...          # JSON byte array of the update authority keypair
ANTHROPIC_API_KEY=...                # For Claude interpretation
OPENWEATHERMAP_API_KEY=...           # Weather data
NEWSAPI_KEY=...                      # News headlines
COINGECKO_API_KEY=...                # On-chain market data (optional, free tier works without)
CRON_SECRET=...                      # Bearer token to authenticate cron requests
CALENDARIFIC_API_KEY=...             # Calendar events
```

---

## 11. Revenue Model

### Mint Pricing

| Mirror Tier | Price (SOL) | Supply | Target |
|---|---|---|---|
| Standard mirrors (Dubai, Lagos, NYC, Tokyo) | 0.5 SOL | 100 per type | Accessible entry point |
| Data-native mirrors (Solana Pulse) | 0.25 SOL | 200 | Lower price for crypto-native audience |
| Limited edition / seasonal mirrors | 1.0 SOL | 25 | Scarcity premium |
| Genesis mirrors (first 10 of each type) | 1.0 SOL | 10 per type | Early adopter premium |

At MVP prices (0.5 SOL * 100 mirrors per type * 4 city mirrors + 0.25 SOL * 200 Solana mirrors):
- Conservative (50% sell-through): ~$15,000 at SOL=$150
- Optimistic (80% sell-through): ~$24,000

### Ongoing Revenue

#### Premium Tiers

- **Mirror+** ($5/month or 0.05 SOL/month): Twice-daily updates, higher resolution images (2048x2048), exclusive data feeds (social sentiment from X API), priority rendering
- **Mirror Pro** ($15/month or 0.15 SOL/month): Custom data feeds (user picks additional keywords), 4x daily updates, video frame generation (short animations), API access to their mirror's data

#### Secondary Royalties

- Set 5% royalty on all mirror NFTs via Metaplex Core
- As mirrors accumulate frames, older mirrors with longer histories become more valuable on secondary markets
- A 1-year-old Dubai Mirror with 365 frames is fundamentally different from a freshly minted one

#### Frame Prints

- Physical prints of specific frames: $29-$79 via print-on-demand integration
- "Notable moment" frames (the one from the day SOL hit all-time high) could command premium prices

### Cost Structure (Monthly, at 5 Mirrors)

| Item | Cost/month |
|---|---|
| Replicate (Flux Pro, 5 mirrors daily) | $6 |
| Anthropic API (Claude interpretation) | $2 |
| Arweave storage (Irys) | <$1 |
| Solana transactions (metadata updates) | <$1 |
| Vercel Pro (cron jobs + hosting) | $20 |
| API keys (OpenWeatherMap free, NewsAPI free, CoinGecko free) | $0 |
| **Total** | **~$30/month** |

At scale (100 mirrors, all types):

| Item | Cost/month |
|---|---|
| Replicate (Flux Pro) | $120 |
| Anthropic API | $40 |
| Arweave storage | $1 |
| Solana transactions | $1 |
| Vercel Pro | $20 |
| NewsAPI Business (for commercial use) | $449 |
| **Total** | **~$630/month** |

Even at scale, the infrastructure cost is low. The biggest cost driver is NewsAPI at the commercial tier. For MVP, the free tier is fine.

---

## 12. Risks & Mitigations

### API Cost Escalation

**Risk**: If mirrors become popular and we scale to hundreds of types, API costs grow linearly.

**Mitigation**:
- Each mirror TYPE generates one frame per cycle, shared across all holders of that type. 100 Dubai Mirror holders all get the same frame update — the cost is per-type, not per-holder.
- At 50 mirror types updating daily, costs are ~$200/month for image generation + interpretation. Well within margins.

### Image Generation Quality Consistency

**Risk**: Flux occasionally produces low-quality or incoherent images, especially with complex scene descriptions.

**Mitigation**:
- Generate 2 images per cycle, use a lightweight quality check (LLM evaluates: "Does this image match the scene description and style identity? Score 1-10."). Pick the higher-scoring one.
- If both score below 6, fall back to a simpler prompt (drop complex elements, keep core composition).
- Cost impact: doubles image gen cost from ~$6/month to ~$12/month. Worth it.

### Visual Continuity Degradation

**Risk**: Over many frames, the img2img chain drifts from the original style. "Semantic decay" — each frame introduces small deviations that compound.

**Mitigation**:
- **Anchor resets**: Every 30 frames, generate one frame from scratch (no img2img reference) using the base style identity + current data. This "resets" the visual foundation.
- **Style drift detection**: The LLM interpretation step compares the previous frame's key elements against the mirror's required architectural anchors. If anchors are missing, it explicitly prompts for their inclusion.
- **A/B testing during development**: Generate 100 consecutive frames for one mirror type and review the visual coherence. Tune prompt_strength and anchor logic before launch.

### Data Feed Downtime

**Risk**: An API goes down exactly when the cron fires.

**Mitigation**: Three-tier fallback (primary API, cached response from Supabase, static defaults). The system has never seen 100% data failure in practice because feeds are independent — weather going down doesn't affect news. Even with degraded data, the mirror still generates a valid frame.

### Arweave / Irys Downtime

**Risk**: Cannot upload new frame to Arweave.

**Mitigation**:
- Retry logic (already implemented in `src/app/api/upload-metadata/route.ts` with `withRetry`).
- If all retries fail, store the frame locally (Supabase storage) and queue a deferred Arweave upload. Update the on-chain URI to point to a temporary HTTPS URL, then update again when Arweave upload succeeds.
- This has been extremely rare in practice (Irys has 99.9%+ uptime).

### On-Chain Update Transaction Failure

**Risk**: The metadata update transaction fails (congestion, invalid blockhash, etc.).

**Mitigation**:
- Use `commitment: "finalized"` for blockhash (already proven in the existing codebase to avoid "blockhash not found" issues).
- Retry up to 3 times with exponential backoff.
- If all retries fail, the frame is still stored in Supabase and Arweave — it just doesn't appear on-chain yet. Queue a retry for the next cycle.
- Alert the team via logging/monitoring.

### Metadata Update Frequency Limits

**Risk**: Solana has no protocol-level rate limit on metadata updates, but excessive updates could be flagged by RPC providers or marketplace indexers.

**Mitigation**: Daily cadence (1 update/day per NFT) is well within reasonable bounds. Even the most aggressive mirror (Solana Pulse at 2x daily) is trivial. Marketplaces like Magic Eden and Tensor re-index metadata regularly and handle mutable metadata natively.

### Update Authority Centralization

**Risk**: Platform controls the update authority, which means the platform could theoretically modify any mirror's metadata arbitrarily. Users must trust the platform.

**Mitigation**:
- Be transparent: clearly document that the platform holds update authority and explain why (automated updates require it).
- Publish the update authority's public key so anyone can verify which account updated the metadata.
- Every frame is archived on Arweave with a linked-list structure — the history is immutable even if a single frame is changed.
- Long-term: explore a multi-sig update authority or a Solana program that constrains updates to only accept new frames (not arbitrary modifications).

### LLM Hallucination / Inappropriate Content

**Risk**: The LLM interprets data incorrectly or generates an inappropriate scene description that leads to an offensive image.

**Mitigation**:
- The LLM prompt is tightly structured with specific output format — it's not free-form creative writing.
- The image generation prompt includes the same negative prompt constraints we already use.
- Add a content safety check: before uploading to Arweave, run the generated image through a lightweight NSFW classifier (Replicate has `nsfw-image-detection` models, ~$0.001/check).
- If flagged, regenerate with a simpler, safer prompt.

---

## 13. Success Metrics

### Launch KPIs (First 30 Days)

| Metric | Target | Measurement |
|---|---|---|
| Total mirrors minted | 50+ | Supabase `active_mirrors` count |
| Unique minting wallets | 30+ | Distinct `owner_wallet` in Supabase |
| Update success rate | 99%+ | Frames generated / frames scheduled |
| Average daily active viewers (Mirror pages) | 100+ | Vercel Analytics |
| Social shares (tweets with mirror frame) | 20+ | Manual tracking + UTM links |
| Secondary sales | 5+ | On-chain tracking |
| Frame quality score (internal) | 7+/10 avg | LLM quality evaluation per frame |

### Product-Market Fit Signals

| Signal | What it means | How to measure |
|---|---|---|
| Users check their mirror daily | The "alive" concept works | Unique visitors to `/mirrors/[type]/[address]` per day |
| Users share specific frames | Individual frames have cultural value | Social share button clicks, Twitter mentions |
| Secondary market activity | Mirrors have resale value | Marketplace listing count and volume |
| Requests for new mirror types | Demand exceeds supply | Support/community channel requests |
| Holders requesting premium tiers | Willingness to pay for more | Conversion rate on premium upsell |
| Frame #1 vs Frame #100 price differential | Longer history = more value | Secondary market price comparison |

### Technical Health Metrics

| Metric | Target | Alert Threshold |
|---|---|---|
| Update latency (cron fire → on-chain update) | <60 seconds | >120 seconds |
| Image generation success rate | 99%+ | <95% |
| Arweave upload success rate | 99%+ | <95% |
| On-chain update success rate | 99%+ | <95% |
| LLM interpretation latency | <10 seconds | >20 seconds |
| Monthly infrastructure cost per mirror type | <$10 | >$20 |

---

## 14. Timeline Estimate

### Week 1-2: Foundation

**Goal**: Core infrastructure, no UI.

- [ ] Set up `MIRROR_AUTHORITY_SECRET` keypair and fund it
- [ ] Create Supabase tables (`mirror_types`, `mirror_frames`, `active_mirrors`)
- [ ] Implement `src/lib/mirrors/types.ts` — all TypeScript types
- [ ] Implement `src/lib/mirrors/config.ts` — all 5 mirror type configurations
- [ ] Implement `src/lib/mirrors/dataFeeds.ts` — all 5 data feed integrations with fallbacks
- [ ] Write integration tests for each data feed (mock API responses)
- [ ] Implement `src/lib/mirrors/interpreter.ts` — LLM interpretation pipeline
- [ ] Test interpretation with sample data for each mirror type

**Team allocation**: 2 backend devs

### Week 3-4: Generation + Storage Pipeline

**Goal**: End-to-end frame generation, no UI, no cron.

- [ ] Implement `src/lib/mirrors/generator.ts` — image generation with img2img
- [ ] Implement Arweave upload for mirror frames (extend existing upload-metadata pattern)
- [ ] Implement on-chain metadata update (`updateV1` with mirror authority)
- [ ] Implement `src/lib/mirrors/updater.ts` — full orchestration pipeline
- [ ] Implement `src/app/api/mirrors/update/route.ts` — the update endpoint
- [ ] Manually trigger updates for all 5 mirror types and verify end-to-end
- [ ] Generate 10+ consecutive frames for one mirror type, review visual coherence
- [ ] Tune `prompt_strength`, style prompts, and architectural anchors based on results

**Team allocation**: 2 backend devs, 1 dev on prompt engineering/tuning

### Week 5-6: Minting Flow

**Goal**: Users can mint mirrors.

- [ ] Implement `src/app/api/mirrors/mint/route.ts` — server-side mint support
- [ ] Implement `src/lib/mirrors/mintMirror.ts` — client-side mint function
- [ ] Implement `src/app/api/mirrors/types/route.ts` — mirror type listing endpoint
- [ ] Implement `src/app/api/mirrors/timeline/route.ts` — timeline endpoint
- [ ] Build `src/app/mirrors/page.tsx` — Mirror marketplace page
- [ ] Build `src/components/mirrors/MirrorCard.tsx` — card with crossfade preview
- [ ] Build `src/components/mirrors/MirrorMintModal.tsx` — minting modal
- [ ] End-to-end test: mint a mirror from the UI, verify it appears on-chain with correct update authority

**Team allocation**: 1 backend dev (APIs), 2 frontend devs (UI), 1 dev on mint flow integration

### Week 7-8: Timeline + Detail Pages

**Goal**: Users can browse their mirror's history.

- [ ] Build `src/app/mirrors/[type]/page.tsx` — mirror type detail with live preview
- [ ] Build `src/app/mirrors/[type]/[address]/page.tsx` — owned mirror with timeline
- [ ] Build `src/components/mirrors/MirrorTimeline.tsx` — horizontal timeline strip
- [ ] Build `src/components/mirrors/FrameViewer.tsx` — full-screen frame detail
- [ ] Build `src/components/mirrors/FramePlayback.tsx` — timelapse playback
- [ ] Implement `src/hooks/useMirrorTimeline.ts` — timeline data fetching
- [ ] Implement `src/hooks/useMirrorTypes.ts` — mirror type data fetching
- [ ] Update `src/components/layout/Header.tsx` — add Mirrors navigation
- [ ] Update `src/app/page.tsx` — add Cultural Mirrors section to homepage

**Team allocation**: 3 frontend devs, 1 backend dev (API support)

### Week 9-10: Cron + Production Hardening

**Goal**: Mirrors update automatically, reliably.

- [ ] Set up Vercel Cron jobs for all 5 mirror types
- [ ] Implement cron authentication (`CRON_SECRET` bearer token verification)
- [ ] Add retry logic and error handling to the update pipeline
- [ ] Add quality check (generate 2 images, LLM picks best)
- [ ] Add content safety check (NSFW classifier)
- [ ] Add monitoring/alerting (log update success/failure, frame quality scores)
- [ ] Stress test: run 50 updates in sequence, verify no failures or degradation
- [ ] Performance optimization: cache data feed responses, optimize DB queries

**Team allocation**: 2 backend devs, 1 frontend dev (polish), 1 dev on testing/QA

### Week 11-12: Polish, Testing, Launch Prep

**Goal**: Ready for public launch.

- [ ] Mobile responsiveness pass on all mirror pages
- [ ] Social share functionality (Twitter/X card with frame image + metadata)
- [ ] Open Graph meta tags for mirror pages (so shared links show preview)
- [ ] Error states and empty states for all mirror UI components
- [ ] Loading states (skeleton loaders for timeline, shimmer for frame images)
- [ ] Copy/UX writing pass — all descriptions, tooltips, empty states
- [ ] Manual QA of full user journey: browse → mint → view → share
- [ ] Run all 5 mirrors for 7+ days on production cron to verify stability
- [ ] Write launch blog post / Twitter thread explaining Cultural Mirrors
- [ ] Prepare marketing assets (timelapse GIFs from the 7-day test run)

**Team allocation**: Full team, all hands on polish and QA

### MVP vs. Full Vision

| Feature | MVP (Week 12) | Full Vision (Post-launch) |
|---|---|---|
| Mirror types | 5 | 20+ (community-proposed) |
| Update cadence | Daily / 2x daily | Configurable (hourly for premium) |
| Image resolution | 1024x1024 | 2048x2048 (premium) |
| Timeline playback | Basic crossfade | Video export, GIF creation |
| Data feeds | 5 APIs | 10+ (social media, finance, sports) |
| Frame quality | Single generation | Multi-candidate + LLM selection |
| Premium tiers | None | Mirror+ and Mirror Pro subscriptions |
| Community mirrors | No | User-proposed mirror types via governance |
| Agent integration | No | Agents as mirror curators (Phase 2 crossover) |
| Physical prints | No | Print-on-demand integration |
| Custom mirrors | No | User defines their own data feeds + style |

---

## Appendix A: Key Technical Decisions

### Why Metaplex Core (not Token Metadata)?

Metaplex Core is already the standard in this codebase. Its `updateV1` instruction is simpler than Token Metadata's `updateV2`, and the asset model (single account) is cheaper on-chain than Token Metadata (4+ accounts per NFT). Core also natively supports mutable metadata without needing the Collection Certified pattern.

### Why a shared update authority (not per-mirror)?

A single `MIRROR_AUTHORITY_SECRET` keypair manages all mirror updates. This simplifies key management (one key to fund and rotate) and reduces transaction costs (no per-mirror key derivation). The tradeoff is centralization, which is acceptable for Phase 1 and can be addressed later with a program-based update authority.

### Why Supabase for the timeline (not just Arweave)?

Arweave is the permanent record, but it is not queryable. You cannot efficiently answer "give me frames 20-30 for Dubai Mirror" from Arweave alone — you would need to follow the linked list from the latest frame backward. Supabase provides fast, indexed queries for the UI while Arweave ensures permanence and decentralization.

### Why daily cadence as default?

- Cost-effective ($0.04/frame with Flux Pro)
- Enough change to feel "alive" without overwhelming
- Matches the rhythm of most cultural data (weather changes daily, news cycles are daily)
- Twice-daily for Solana Pulse because crypto markets move in hours, not days
- Hourly or faster would increase costs 24-48x and produce diminishing returns (the city doesn't change visually every hour)

### Why Claude 3.5 Sonnet for interpretation?

The interpretation step requires cultural knowledge (understanding what "Art Dubai" means, how Ramadan affects the visual mood) and creative writing (translating data into a vivid scene description). Sonnet is the best balance of quality and cost for this task. Haiku is too terse; Opus is overkill for a structured prompt with a clear output format.

---

## Appendix B: Example Update Cycle (Dubai Mirror)

**Trigger**: Vercel Cron fires at 06:00 UTC

**Step 1: Data fetch** (2-3 seconds)
```json
{
  "weather": { "temp": 38, "condition": "clear", "humidity": 25, "wind": 12 },
  "news": [
    { "title": "Art Dubai 2026 Opens with Record 120 Galleries", "source": "Gulf News" },
    { "title": "Dubai Creek Tower Construction Resumes", "source": "Arabian Business" }
  ],
  "onChain": { "solPrice": 245, "solChange24h": 12.3, "nftVolume24h": 15000 },
  "social": { "trendingTopics": ["Art Dubai", "Dubai Summer Deals"] },
  "calendar": [{ "event": "Art Dubai 2026", "type": "cultural", "startDate": "2026-04-14" }]
}
```

**Step 2: LLM interpretation** (3-5 seconds)
```json
{
  "sceneDescription": "The Dubai skyline blazes under a merciless 38-degree sun, but the city pulses with creative energy. Art Dubai has opened, and gallery facades materialize along the waterfront — geometric installations in chrome and glass catch the afternoon light, casting prismatic reflections across the marina. The Burj Khalifa presides over the scene, its spire wrapped in a subtle aurora of purple and gold (SOL is rallying, +12%). Construction cranes around Dubai Creek Tower frame the right side of the composition, hints of progress in steel and concrete. The sky is crystalline blue, heat shimmer distorting the horizon where desert meets development.",
  "imagePrompt": "Art deco illustration of Dubai skyline, 38 degree clear day, art gallery installations along waterfront, chrome geometric sculptures reflecting sunlight, Burj Khalifa center with gold and purple aurora at spire, construction cranes at Dubai Creek Tower on right, crystalline blue sky with heat shimmer at horizon, warm gold and copper metallic tones, geometric patterns, strong vertical lines",
  "mood": "Vibrant",
  "dominantColors": ["#C8963E", "#1E3A5F", "#87CEEB", "#D4A574", "#4A0E8F"],
  "keyElements": ["Burj Khalifa", "art gallery installations", "construction cranes", "marina reflection", "heat shimmer"],
  "dataSignals": ["Art Dubai opening", "38C clear weather", "SOL +12%", "Dubai Creek Tower construction"],
  "continuityNotes": "Maintained Burj Khalifa center composition, marina foreground, and geometric art deco style from previous frame. Desert horizon remains on the right.",
  "changeNotes": "Added art gallery installations along waterfront (Art Dubai data signal). Added purple/gold aurora at Burj Khalifa spire (SOL rally signal). Added construction cranes for Creek Tower (news signal)."
}
```

**Step 3: Image generation** (3-5 seconds)
- Flux Pro generates a 1024x1024 WebP using the image prompt + style suffix + previous frame as img2img reference at 0.65 prompt strength.

**Step 4: Upload + update** (5-10 seconds)
- Image uploaded to Arweave via Irys: `ar://abc123...`
- Metadata JSON uploaded to Arweave: `ar://def456...`
- Frame stored in Supabase `mirror_frames` table
- `updateV1` transaction sent for each active Dubai Mirror NFT
- `mirror_types.current_frame_*` fields updated

**Total time**: ~15-25 seconds per mirror type

**Total cost**: ~$0.06 (Flux Pro $0.04 + Claude $0.013 + Arweave negligible + Solana negligible)
