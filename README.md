# mintIT

Mint autonomous AI creative agents as NFTs on Solana. Each agent has a unique personality, generates art, holds conversations with semantic memory, and executes on-chain actions — trading tokens, minting NFTs, checking balances — all through natural language.

Built with Next.js, Metaplex Core, Solana Agent Kit, and the Vercel AI SDK.

## What it does

### AI Agents (core feature)

Agents are NFTs with brains. You mint an agent by choosing a name, archetype, and personality tuning — the system generates a full personality profile, creates an avatar, and mints it on Solana. Once created, your agent:

- **Converses** with a personality shaped by its archetype (visionary, chronicler, provocateur, harmonist, mystic, technologist, naturalist, urbanist)
- **Remembers** past conversations via vector embeddings (pgvector cosine similarity search)
- **Creates art** using its own aesthetic preferences (Replicate Flux)
- **Executes Solana transactions** autonomously — check balances, swap tokens via Jupiter, fetch prices, mint NFTs, query Magic Eden collections, stake SOL, and more (23 curated tools from Solana Agent Kit)
- **Evolves** over time — gains XP from interactions, creations, and sales; levels up from 1 to 20

The agent's personality, avatar, and metadata all live on Arweave. The NFT itself is a Metaplex Core asset on Solana.

### AI Art NFTs

Describe what you want, pick an art style, and mint 1-of-1 NFTs. Image generation powered by Replicate Flux, metadata stored on Arweave via Irys.

### Cultural Mirrors

Living NFTs that evolve based on real-world data feeds (weather, news, market prices, cultural events). Their visuals update automatically via a cron-triggered pipeline.

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) |
| Auth | Privy (embedded Solana wallet) |
| Blockchain | Solana (devnet), Metaplex Core |
| Storage | Arweave via Irys |
| Database | Supabase (Postgres + pgvector) |
| AI Chat | Vercel AI SDK + Google Gemini Flash |
| Image Gen | Replicate (Flux Schnell) |
| Embeddings | Google text-embedding-004 (768 dims) |
| Agent Tools | Solana Agent Kit (NFT + Token plugins) |
| Styling | Tailwind CSS 4 + Framer Motion |

## Project Structure

```
src/
  app/
    page.tsx                    # Homepage (parallax frames)
    create-agent/               # Agent creation wizard
    agents/                     # Agent gallery
    agent/[id]/                 # Agent chat page
    create/                     # AI art creation wizard
    mirrors/                    # Cultural Mirrors gallery
    nft/[mintAddress]/          # NFT detail page
    gallery/                    # NFT gallery
    api/
      agent/
        mint/                   # Agent personality + avatar + Arweave upload
        register/               # Post-mint agent DB registration
        [agentId]/              # Agent detail + chat streaming
      agents/                   # Agent listing
      generate/                 # Image generation endpoint
      upload-metadata/          # Server-side Arweave uploads
      mint/                     # NFT mint preparation
      mirrors/                  # Mirror CRUD + data feeds + updates
      marketplace/              # Listing/delisting
      collections/              # Collection queries
  lib/
    agent/                      # Agent system (personality, memory, tools, prompts)
      personality.ts            # Archetype defaults + bio generation
      systemPrompt.ts           # LLM system prompt builder
      solanaKit.ts              # Solana Agent Kit with curated tool allowlist
      memory.ts                 # Semantic memory (store + recall)
      embeddings.ts             # Vector embedding generation
      tools/                    # Custom tools (generateArt, searchMemory)
      agentAuthority.ts         # Server-side agent keypair
      db.ts                     # Agent CRUD + evolution snapshots
      storage.ts                # Arweave uploads for agent data
      avatarGenerator.ts        # Replicate Flux avatar generation
    mirrors/                    # Mirror system (data feeds, interpreter, authority)
    solana/                     # Mint logic, Privy signer bridge, marketplace
    supabase.ts                 # Database client
  hooks/
    useUmi.ts                   # Umi instance with Privy wallet
    useAgents.ts                # Agent listing hook
    useWhimsicalWord.ts         # Loading state word rotation
  components/
    agent/                      # Chat UI, tool result cards, profile sidebar
    create/                     # Mint panel
    layout/                     # Header, footer, shell
    providers/                  # Privy + theme providers
  types/
    agent.ts                    # Agent type system + Zod schemas
    index.ts                    # NFT types
```

## Setup

### Prerequisites

- Node.js 18+
- Solana CLI (`solana-keygen` for generating keypairs)

### 1. Install dependencies

```bash
npm install
```

### 2. Generate Solana keypairs

You need three keypairs (JSON byte arrays). Generate each with:

```bash
solana-keygen new --outfile <name>.json --no-bip39-passphrase
```

Fund them on devnet at https://faucet.solana.com (paste the public key, request 2 SOL each):

| Keypair | Purpose |
|---|---|
| `agent-authority.json` | Agent NFT update authority + Solana Agent Kit wallet |
| `arweave-wallet.json` | Signs server-side Arweave/Irys metadata uploads |
| `marketplace-authority.json` | Marketplace listing/delisting authority |

### 3. Set up external services

| Service | Sign up | What you need |
|---|---|---|
| [Privy](https://privy.io) | Dashboard | App ID |
| [Replicate](https://replicate.com) | API tokens page | API token |
| [Google AI Studio](https://aistudio.google.com/apikey) | API keys page | API key (covers Gemini chat + embeddings) |
| [Supabase](https://supabase.com) | New project | Project URL + service role key |

In your Supabase project, enable the `vector` extension and create the agents table schema (see `src/lib/agent/db.ts` for the expected structure).

### 4. Configure environment

Create `.env.local`:

```bash
# Auth
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id

# Solana
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet

# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI
REPLICATE_API_TOKEN=your_replicate_token
GEMINI_API_KEY=your_google_ai_key
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_key  # same key, read by AI SDK

# Keypairs (paste contents of each .json file)
AGENT_AUTHORITY_SECRET=[1,2,3,...,64]
ARWEAVE_WALLET_SECRET=[1,2,3,...,64]
MARKETPLACE_AUTHORITY_SECRET=[1,2,3,...,64]

# Optional: Cultural Mirrors data feeds
OPENWEATHERMAP_API_KEY=
NEWSAPI_KEY=
CALENDARIFIC_API_KEY=

# Optional: Cron endpoint auth
CRON_SECRET=any_random_secret
```

### 5. Run

```bash
npm run dev
```

Open http://localhost:3000.

## Key Flows

### Create an AI Agent

1. Connect wallet → `/create-agent`
2. Name your agent → choose archetype (visionary, chronicler, provocateur, harmonist, mystic, technologist, naturalist, urbanist)
3. Adjust personality sliders (complexity, abstraction, darkness, temperature)
4. System generates personality (Gemini), creates avatar (Flux), uploads to Arweave, mints NFT (1 wallet approval), registers in database
5. Redirects to chat with your new agent

### Chat with an Agent

- `/agent/[id]` — streaming conversation with personality-driven responses
- Agent can generate art, search its memory, and use 23 Solana tools (check balances, fetch prices, swap tokens, mint NFTs, query marketplaces)
- Tool results render as rich cards (balance cards, price tickers, transaction links with Solscan, NFT previews, collection stats)

### Mint an NFT

1. Connect wallet → `/create`
2. Describe your artwork → pick style → adjust settings → generate
3. Select favorite → name it → mint (1 wallet approval)
4. Image + metadata uploaded to Arweave, NFT minted via Metaplex Core

## Architecture Notes

- **Agents are NFTs**: Each agent is a Metaplex Core asset. The personality JSON, avatar image, and metadata all live on Arweave. The agent authority keypair is set as `updateAuthority` so the server can evolve the agent over time.
- **Single wallet approval**: All Arweave uploads happen server-side with dedicated keypairs. The user only signs one Solana transaction per mint.
- **Agent memory**: Conversations are stored as vector embeddings (pgvector) and retrieved via cosine similarity for context-aware responses.
- **Tool safety**: 42 Solana Agent Kit tools are filtered to 23 curated safe ones. Dangerous operations (burn, close accounts, launch pumpfun, etc.) are excluded. Transactional tools require the agent to explain its intent before executing.
- **Personality system**: 8 archetypes with distinct aesthetic defaults, voice tones, influences, and goals. Personality sliders let users fine-tune within each archetype's range. Bios are generated by Gemini in the agent's own voice.
- **Metaplex Core SDK fix**: Uses `createV2` with `plugins: none()` and `externalPluginAdapters: none()` to avoid a serialization bug where empty `[]` causes on-chain panic.

## License

MIT
