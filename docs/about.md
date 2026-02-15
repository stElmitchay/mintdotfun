# MintAI — AI-Powered NFT Collection Creator

## What It Is

MintAI is a web application that lets users describe a vision in words, have AI generate artwork from that description, and mint the artwork as NFTs directly on Solana — all in one flow. No design skills, no command-line tools, no separate wallet apps needed.

**Live stack:** Next.js 16 + React 19 + Solana (Metaplex Core) + Replicate (Flux AI) + Arweave (Irys) + Supabase (Postgres)

## The Problem It Solves

Creating an NFT collection today requires:
1. Hiring an artist or learning design tools
2. Understanding Solana CLI tools or writing code
3. Managing wallets, metadata standards, and storage
4. Deploying and minting manually

MintAI reduces this to: **describe → generate → mint**. One flow, one app, under 5 minutes.

## Core Flow

```
User signs in (email, Google, Twitter, or wallet)
  │
  ▼
Describes their collection in natural language
  │ "Mystical forest creatures with bioluminescent features"
  ▼
AI generates artwork (Flux model via Replicate)
  │ 1–10 images, multiple style presets
  ▼
User selects which images to mint
  │
  ▼
Images + metadata uploaded to Arweave (permanent storage)
  │ via Irys bundler
  ▼
Collection + NFTs minted on Solana (Metaplex Core)
  │ User's wallet signs each transaction
  ▼
NFTs appear in wallet + gallery
  │ On-chain ownership, Arweave-hosted assets
  ▼
Persisted to Supabase (cross-device gallery)
```

## What We've Built

### Authentication & Wallet
- **Privy** handles login (email, Google, Twitter, external Solana wallets)
- Embedded Solana wallet for email/social users (no Phantom needed)
- Custom Umi signer bridge (`privySigner.ts`) connects Privy wallets to Metaplex SDK
- Automatic chain switching to devnet/mainnet

### AI Image Generation
- **Replicate API** running the **Flux Schnell** model by Black Forest Labs
- 7 style presets (anime, pixel art, oil painting, cyberpunk, watercolor, 3D render)
- Optional reference image upload for style guidance
- Sequential generation with 429 retry logic (handles rate-limited accounts)
- Server-side auth check prevents unauthenticated API abuse

### On-Chain Minting (Solana)
- **Metaplex Core (mpl-core)** — single-account NFT standard
- Uses `createV1` instruction (avoids the `createV2` empty-plugin panic bug in mpl-core v1.7.0)
- Explicit `owner` field ensures wallet ownership is unambiguous
- Collection creation + individual NFT minting in one flow
- Partial failure recovery: if NFT #3 fails, #1 and #2 are still returned and persisted
- Confirmation strategy: `{ commitment: "confirmed" }` on all transactions

### Permanent Storage (Arweave)
- Images uploaded to **Arweave** via **Irys** bundler
- Metadata JSON uploaded to Arweave with permanent URLs
- Retry logic (2 retries with exponential backoff) on all uploads
- NFT `uri` field points to `https://gateway.irys.xyz/{txId}` — standard format that wallets (Phantom, Solflare) can resolve

### Database Persistence (Supabase/Postgres)
- Collections and NFTs saved to Postgres after minting
- API routes with auth check and input validation
- `useCollections` hook: fetches from Supabase, falls back to localStorage
- Three-layer data strategy: Supabase (primary) → localStorage (cache) → blockchain (ground truth)

### Gallery
- **On-chain section**: Fetches owned mpl-core assets directly from Solana via `fetchAssetsByOwner`
- **Mint history section**: Loads from Supabase with collection grouping
- Resolves both Arweave URIs and legacy data URIs for image display
- Explorer links to `core.metaplex.com` for each NFT and collection

### UX & Resilience
- Mobile hamburger navigation
- Error boundaries (page-level and global)
- Custom 404 page
- Collection address shown post-mint with copy button + explorer link
- Distinct upload/mint progress phases in UI
- User-friendly error messages (insufficient SOL, rejected transaction, rate limiting)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  Next.js 16 (App Router) + React 19 + Tailwind v4           │
│                                                              │
│  Pages: / (landing), /create, /gallery                       │
│  Hooks: useUmi, useOwnedAssets, useCollections,              │
│         useLocalStorage                                      │
│  Components: Header, MintPanel, PrivyProvider                │
└──────────┬──────────────────────┬───────────────────────────┘
           │                      │
    API Routes              Client-side SDK
           │                      │
    ┌──────▼──────┐       ┌───────▼────────┐
    │  /api/      │       │  Solana RPC     │
    │  generate   │       │  (devnet)       │
    │  collections│       │                 │
    └──────┬──────┘       │  Metaplex Core  │
           │              │  Irys/Arweave   │
    ┌──────▼──────┐       └────────────────┘
    │  Replicate  │
    │  (Flux AI)  │       ┌────────────────┐
    └─────────────┘       │  Supabase      │
                          │  (Postgres)    │
                          └────────────────┘
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 16 (Turbopack) | App router, API routes, SSR |
| UI | React 19 + Tailwind v4 | Components and styling |
| Auth | Privy | Email/social/wallet login |
| AI | Replicate (Flux Schnell) | Image generation |
| Blockchain | Solana + Metaplex Core | NFT minting |
| Storage | Arweave via Irys | Permanent image/metadata |
| Database | Supabase (Postgres) | Collection persistence |
| Icons | Lucide React | UI icons |

## Environment Variables

| Variable | Scope | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_PRIVY_APP_ID` | Client | Privy authentication |
| `REPLICATE_API_TOKEN` | Server | AI image generation |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | Client | Solana RPC endpoint |
| `NEXT_PUBLIC_SOLANA_NETWORK` | Client | `devnet` or `mainnet-beta` |
| `SUPABASE_URL` | Server | Postgres database |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Postgres auth (secret) |
