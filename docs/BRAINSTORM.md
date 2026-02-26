# mintIT — Feature Brainstorm & Implementation Plans

## The Thesis

NFTs were supposed to be "the intersection of culture and crypto." That intersection stalled because:
- Most NFT projects were speculative PFPs with no cultural depth
- Fashion, food, music — the *real* drivers of culture — are hard to represent digitally
- The "AI + NFT" space is mostly just Midjourney outputs minted on-chain (no moat, no soul)

**The opportunity**: Whoever corners CULTURE in the AI agent economy wins. Not culture as a buzzword — culture as the living, breathing, evolving thing that fashion, food, art, and music represent.

**What's actually working right now** (from market research):
- Botto (community-governed AI artist) → $5M+ in auction revenue
- Parallel Colony (autonomous AI agents as NFTs on Solana) → agents that learn and evolve
- fxhash (collector-as-co-creator) → artist sets algorithm, collector shapes output
- Virtuals Protocol (agent launchpad) → 17,000+ agents, $39.5M protocol revenue
- Sound.xyz (music NFTs) → direct artist-fan economics

**What's NOT working**:
- Static AI-generated PFP collections (no moat)
- Brand-led experiments without community (RTFKT shut down)
- Raw prompt marketplaces (prompts are too easily copied)
- Fully autonomous AI traders without guardrails


## Ideas Deep Dive

### 1. Prompt Marketplace + Agent Remix

**Core concept**: Prompts become tradeable assets. An AI agent autonomously remixes top-selling prompts into hybrid creations.

**The problem with raw prompts**: PromptBase (Web2) dominates with 260K+ prompts at $1.99-$9.99. But prompts are infinitely copyable and lose value as AI models improve. PromptSea tried on-chain prompts on Polygon — modest traction at best. There's no moat in a text string.

**How to make it work — go beyond prompts to "Creative DNA"**:

Instead of selling raw prompts, sell **Style Recipes** — a bundle of:
- The prompt text
- Style parameters (model settings, seed ranges, negative prompts)
- A reference image or mood board
- Post-processing instructions
- The AI agent's "interpretation notes"

This is much harder to replicate than a raw prompt. It's like selling a chef's full recipe vs. just the ingredient list.

**The Agent Remix angle**:
- An autonomous "Curator Agent" monitors the marketplace weekly
- Identifies trending Style Recipes (top sellers, most remixed, highest-rated)
- Cross-pollinates them: takes elements from Recipe A + Recipe B → generates hybrid
- Auto-mints the hybrids as a "Curator's Collection"
- Revenue splits: original Recipe creators get royalties on the hybrid

**Revenue model**:
- Style Recipe listing fee (small, like 0.01 SOL)
- 10-15% platform commission on Recipe sales
- Recipe creators earn royalties when their Recipe is used to mint
- Curator Agent hybrids generate revenue that flows back to original creators

**Connection to other ideas**: This feeds directly into Collaborative Canvas (recipes as building blocks) and Agent-as-NFT (the Curator Agent itself could be an NFT).

---

### 2. Agent-as-NFT (Dynamic Metadata)

**Core concept**: The NFT IS an AI agent. Mint it, and you own a living entity that evolves based on interactions — chat with it, trade it, hold it long-term, and it grows.

**What exists today**:
- Parallel Colony: AI agents as game characters on Solana. Agents have autonomous decision-making, personalities that evolve. Uses Token Bound Accounts (ERC-6551 equivalent) so each NFT is its own wallet.
- Virtuals Protocol: Agent launchpad where agents like AIXBT (market intelligence, 460K followers) operate autonomously.
- ElizaOS: The open-source framework powering most Solana AI agents.

**What's missing** (the gap mintIT can fill):
Nobody is doing **CREATIVE agents** — agents whose primary function is to create, not trade. The entire DeFAI space is about trading/staking/yield. What about agents that create art, curate culture, develop aesthetic taste?

**The mintIT Agent-as-NFT**:

Each agent NFT has:
1. **Personality Config** (stored in Metaplex Core plugin or Arweave)
   - Aesthetic preferences (color palettes, styles, themes)
   - Creative influences (references to art movements, artists, cultural moments)
   - Communication style (how it talks when you chat with it)
   - Goals (e.g., "become the premier cyberpunk artist" or "document West African fashion")

2. **Memory** (on-chain state via Metaplex Core plugins)
   - Every artwork it creates
   - Every interaction with its owner
   - Market feedback (what sold, what didn't, what got engagement)
   - Cultural data it's been exposed to

3. **Capabilities**
   - Generate art based on its personality + owner's guidance
   - Curate collections from the marketplace
   - Remix other agents' work (with permission/royalties)
   - Chat with owner and other agents
   - Auto-mint and list creations

4. **Evolution mechanics**
   - **Time-held**: Agents that are held longer develop deeper personalities
   - **Interaction count**: More chats = more refined taste
   - **Market success**: If its creations sell well, it gains "reputation" (on-chain score)
   - **Social**: Agents that interact with other agents develop collaborative traits

**Tech stack**:
- Metaplex Core for NFT + plugins for state storage
- ElizaOS or custom agent framework for personality/chat
- Solana Agent Kit for on-chain actions (minting, listing, trading)
- Arweave for permanent personality config + artwork storage
- Serverless API (Vercel Edge) for agent logic + LLM calls

**Connection to other ideas**: This is the backbone. The Agent Remix from Idea #1 is powered by these agents. The Aging NFT from Idea #3 is what these agents produce. The Collaborative Canvas from Idea #4 is how these agents interact with each other.

---

### 3. Aging / Living NFTs

**Core concept**: NFTs that change over time based on real-world data. The Dubai example — an NFT of Dubai that morphs as the city evolves.

**What exists**:
- Async Art pioneered "layers" controlled by different owners (but has stalled)
- Botto's art evolves based on community votes
- Doodles DreamNet creates evolving AI narratives

**The mintIT approach — "Cultural Mirrors"**:

An NFT that is a living reflection of a place, a moment, or a cultural movement. Not static art — a breathing, changing piece that tracks reality.

**How it works**:

1. **Data feeds** (the "senses" of the NFT):
   - Weather APIs (temperature, conditions, time of day)
   - News/trend APIs (headlines, trending topics, cultural events)
   - On-chain data (SOL price, NFT market volume, holder activity)
   - Social sentiment (X/Twitter trends for a given topic)
   - Calendar events (holidays, fashion weeks, festivals)

2. **AI interpretation layer**:
   - The data feeds into an LLM that generates a "mood" and "scene description"
   - This description feeds into the image generation model
   - The NFT's visual updates at a set cadence (daily, weekly, or on-trigger)

3. **Example — "Dubai Mirror"**:
   - Morning: Sunrise palette, construction cranes in the skyline, gold accents
   - During a heatwave: Shimmering, distorted, mirage effects
   - During Art Dubai week: Galleries and installations appear in the scene
   - When crypto market crashes: The luxury towers go dark, neon dims
   - When SOL pumps: Gold and purple aurora in the sky
   - Ramadan: Crescent moons, lanterns, warm amber tones

4. **Example — "Lagos Pulse"**:
   - Afrobeats trending globally: Musical visual elements, vibrant colors
   - Rainy season: Water reflections, moody atmospheric rendering
   - Tech week: Circuit patterns, startup energy
   - Fashion week: Ankara patterns, fabric textures woven into architecture

**The cultural angle**: These aren't just "generative art." They're living cultural documents. Owning a "Lagos Pulse" NFT means owning a piece of Lagos's cultural story as it unfolds. This is how you digitize culture — not by taking a photo, but by creating a living mirror.

**Tech stack**:
- Cron job (Vercel Cron or similar) to fetch data feeds on schedule
- LLM (Claude/GPT) to interpret data → generate scene description
- Image generation API (Flux/DALL-E) to render updated visual
- Arweave for storing each "frame" permanently (the NFT builds a timeline)
- Metaplex Core mutable metadata to update the NFT URI
- Optional: on-chain oracle for SOL price / market data

**Revenue model**:
- Mint fee for the initial NFT
- Optional "premium feeds" (exclusive data sources, higher update frequency)
- The historical frames become a permanent archive — could be exhibited or sold as a collection

**Connection to other ideas**: An Agent-as-NFT (Idea #2) could be the entity that CREATES these cultural mirrors. The agent watches the data, interprets it through its personality, and renders its version of the cultural moment.

---

### 4. Collaborative Canvas

**Core concept**: Multiple wallets contribute prompt fragments to a single piece. Each contributor gets fractional ownership. AI synthesizes all inputs.

**What the research shows**:
- Async Art's "layer" model has stalled — too complex, not enough payoff
- fxhash's "collector-as-co-creator" model works — artist sets the algorithm, collector shapes parameters
- Botto's "community votes on AI output" model works — collective curation, not collective creation

**The mintIT approach — "Cultural Jam Sessions"**:

Instead of an "exquisite corpse" (each person adds a piece), model it after a music jam session — everyone contributes to the same moment, and the AI is the session musician that synthesizes it all.

**How it works**:

1. **A "Session" is opened** by a creator (or an Agent — see Idea #2)
   - Theme is set: "Afrofuturism meets Tokyo street style"
   - Duration: 24 hours
   - Max contributors: 10-50
   - Entry fee: 0.01-0.1 SOL (goes into the session treasury)

2. **Contributors submit "fragments"**:
   - Text prompts ("neon-lit market stalls", "holographic ankara fabric")
   - Reference images (upload an image that captures a mood)
   - Style votes (from a palette of visual directions)
   - Color palettes (pick dominant colors)

3. **The AI synthesizes**:
   - All fragments are fed to the LLM as context
   - LLM generates a unified scene description that weaves them together
   - Image model renders the final piece
   - Multiple variations are generated, and contributors vote on the best

4. **Minting + ownership**:
   - The winning variation is minted as an NFT
   - Each contributor gets a proportional share of the NFT (via Metaplex Core royalties or a simple revenue split contract)
   - All contributor wallets are recorded on-chain
   - Secondary sales distribute revenue proportionally

5. **The "Jam" archive**:
   - Every fragment, the synthesis process, and the final result are stored on Arweave
   - This creates a transparent, permanent record of collaborative creation
   - The process itself becomes part of the art's provenance

**What makes this different from Async Art**:
- Time-limited (creates urgency, like a drop)
- AI does the hard work of synthesis (no artistic skill required from participants)
- Fractional ownership is built in from the start
- It's social — you're jamming with other people, not silently editing a layer

**Connection to other ideas**: Sessions could be hosted by Agent-as-NFTs (Idea #2), which set the theme based on what their Cultural Mirror (Idea #3) is showing. Style Recipes from the Prompt Marketplace (Idea #1) could be used as session "instruments."

---

## The Unified Vision: How Everything Connects

```
                    ┌─────────────────────┐
                    │   Style Recipes      │
                    │   (Prompt Market)    │
                    │   Idea #1            │
                    └────────┬────────────┘
                             │ feeds into
                             ▼
┌──────────────┐    ┌─────────────────────┐    ┌──────────────┐
│  Cultural    │◄───│   Agent-as-NFT      │───►│ Collaborative│
│  Mirrors     │    │   (The Creator)     │    │ Canvas       │
│  Idea #3     │    │   Idea #2           │    │ Idea #4      │
└──────────────┘    └─────────────────────┘    └──────────────┘
       │                     │                        │
       │            hosts sessions              contributes to
       │            curates recipes              joint creations
       │                     │                        │
       └─────────────────────┼────────────────────────┘
                             │
                             ▼
                    ┌─────────────────────┐
                    │   mintIT Platform    │
                    │   (What exists now)  │
                    │   AI Gen → Mint → Market
                    └─────────────────────┘
```

**The Agent-as-NFT is the centerpiece.** Everything else is a capability of the agent or an input to it:

1. **Style Recipes** are the agent's toolkit — its learned techniques and creative methods
2. **Cultural Mirrors** are the agent's artistic output — living, evolving pieces that reflect reality
3. **Collaborative Canvas** is the agent's social life — it hosts jam sessions with humans and other agents
4. **The Marketplace** is where it all trades

**The culture play**: mintIT doesn't just let you make AI art. It lets you own a piece of an AI creative entity that watches culture, interprets culture, and creates culture. The NFT isn't a JPEG. It's a living cultural participant.

---

## Implementation Priority

Based on feasibility, impact, and how they build on each other:

### Phase 1: Aging/Living NFTs (Cultural Mirrors)
**Why first**: Builds directly on existing infrastructure (AI generation + Metaplex Core mutable metadata). Dramatic visual impact. Easy to demo and market. Doesn't require complex on-chain programs.

**Scope**: Pick 3-5 "mirrors" (cities, cultural scenes). Set up data feeds + cron-based regeneration. Update NFT metadata on schedule.

### Phase 2: Agent-as-NFT
**Why second**: This is the big differentiator but requires more infrastructure. Phase 1 proves the "living art" concept; Phase 2 adds the intelligent entity behind it.

**Scope**: Agent personality config, basic chat, art generation based on personality, on-chain state via Metaplex plugins.

### Phase 3: Style Recipe Marketplace
**Why third**: Needs a critical mass of creators and agents to be valuable. Phase 2 creates the agents that will be the power users of the recipe marketplace.

**Scope**: Recipe format spec, listing/buying flow, royalty tracking, agent remix feature.

### Phase 4: Collaborative Canvas (Jam Sessions)
**Why last**: Most socially complex. Needs active users. But by Phase 4, you have agents that can host sessions, cultural mirrors that set themes, and a recipe marketplace that provides creative tools.

**Scope**: Session creation, fragment submission, AI synthesis, fractional minting, revenue splits.

---

## Open Questions

1. **On-chain vs. off-chain agent state**: Storing full agent memory on-chain is expensive. Arweave for permanent storage + on-chain hash for verification? Or Metaplex Core plugins for lightweight state?

2. **Agent framework**: Build custom on ElizaOS? Use Solana Agent Kit directly? Or build from scratch with our own personality/memory system?

3. **Data feeds for Cultural Mirrors**: Which APIs? Free vs. paid? How to handle rate limits for hundreds of NFTs updating simultaneously?

4. **Fractional ownership for Collaborative Canvas**: Use Metaplex Core royalties, or build a custom revenue-split program in Anchor?

5. **Token economics**: Should there be a platform token? Or keep it SOL-denominated? Token fatigue is real — maybe $mintIT only if there's genuine utility.

6. **The cultural curation question**: Who decides which "mirrors" to create? The team? The community? The agents themselves?
