# Implementation Plan

## What's Built (Current State)

### Completed

- [x] Privy auth (email, Google, Twitter, external wallets)
- [x] Privy-to-Umi signer bridge with chain switching
- [x] AI image generation via Replicate Flux with style presets
- [x] Reference image upload for style guidance
- [x] Sequential generation with 429 retry (rate-limit safe)
- [x] Server-side auth check on generate API
- [x] Input validation and rate limiting on API routes
- [x] Arweave storage via Irys (images + metadata)
- [x] Retry logic on all Arweave uploads (2 retries, exponential backoff)
- [x] Metaplex Core minting (createV1, avoids createV2 bug)
- [x] Explicit owner field on NFTs
- [x] Partial failure recovery (returns minted NFTs even if some fail)
- [x] Supabase/Postgres persistence for collections and NFTs
- [x] Three-layer data: database + localStorage + blockchain
- [x] On-chain asset fetching via fetchAssetsByOwner
- [x] Gallery with on-chain assets and mint history
- [x] Collection address display with copy + explorer link
- [x] Mobile navigation (hamburger menu)
- [x] Error boundaries and 404 page
- [x] Metaplex Core explorer links (core.metaplex.com)
- [x] User-friendly error messages

### Known Limitations

- Privy auth cookie check is presence-only (not JWT-verified)
- In-memory rate limiter resets on server restart
- No content moderation on generated images
- No pagination on gallery (fine for <100 NFTs)
- Replicate rate limits with <$5 credit (6 req/min, burst 1)

---

## Phase 1: Production Hardening

Priority: **High** — Required before public launch.

### Server-Side Auth Verification
- Install `@privy-io/server-auth`
- Add `PRIVY_APP_SECRET` to env vars
- Replace cookie presence check with full JWT verification on all API routes
- Extract wallet address from verified token (don't trust client-provided wallet)

### Redis Rate Limiting
- Replace in-memory rate limiter with Redis (Upstash serverless Redis)
- Rate limit per authenticated user, not just IP
- Persist across deploys and server restarts

### Content Moderation
- Add NSFW detection on generated images before showing to user
- Options: Replicate's NSFW classifier, Google Cloud Vision SafeSearch, or AWS Rekognition
- Block minting of flagged content
- Log flagged prompts for review

### Mainnet Readiness
- Switchable devnet/mainnet via env var (already supports this)
- Cost estimation UI before minting (show SOL cost for Arweave + mint)
- Mainnet RPC (Helius or Triton for DAS support)
- Confirm wallet has enough SOL before starting

### Deployment
- Deploy to Vercel (zero-config for Next.js)
- Set all env vars in Vercel dashboard (not in repo)
- Configure custom domain
- Add Vercel Analytics for performance monitoring

---

## Phase 2: UX Polish

Priority: **Medium** — Makes the app feel production-grade.

### Loading States
- Skeleton loaders for gallery page
- Shimmer placeholders for image cards
- Progress bar (not just spinner) during mint flow

### Image Generation UX
- Show generation progress per-image (not just "Generating...")
- Allow cancellation mid-generation
- Image zoom/fullscreen preview before minting
- Drag-to-reorder selected images

### Mint Flow UX
- Cost breakdown before minting (Arweave storage + Solana tx fees)
- Transaction hash link during minting (not just after)
- Cancel/abort minting
- "Retry failed" button for partially minted collections

### Gallery Polish
- Pagination (or infinite scroll) for large collections
- Search/filter by collection name
- Sort by date, name, or collection size
- Share collection link (public gallery page)

### Accessibility
- ARIA labels on all interactive elements
- Keyboard navigation support
- Screen reader testing
- Color contrast audit

---

## Phase 3: Features

Priority: **Medium** — Differentiators and growth drivers.

### Social Sharing
- Share minted NFT to Twitter/X with image preview
- Open Graph meta tags for collection links
- Public collection page (shareable URL without auth)

### Collection Management
- Edit collection metadata after minting (update authority)
- Transfer NFTs to other wallets
- Burn NFTs (remove from collection)
- View transaction history per collection

### Advanced Generation
- Multiple AI models (Flux Pro, DALL-E, Midjourney API)
- Batch prompt variations (auto-generate prompt tweaks)
- Style transfer from reference image
- Outpainting / image extension
- Animation / video NFT support

### Marketplace Integration
- List NFTs on Magic Eden or Tensor
- Set floor price and royalties
- Secondary sales tracking

### Analytics Dashboard
- Total mints, collections, unique users
- Popular styles and prompts
- Revenue tracking (if marketplace fees)
- Generation success/failure rates

---

## Phase 4: Scale & Monetization

Priority: **Low** — Growth-stage features.

### User Accounts
- Profile page with bio, avatar, social links
- Follow other creators
- Activity feed (new mints from followed creators)

### Monetization
- Freemium model: X free generations/month, pay for more
- Stripe integration for credit purchases
- Revenue share on secondary sales (royalties)
- Premium features: higher resolution, priority generation, exclusive models

### Infrastructure
- Edge deployment (Vercel Edge Functions)
- CDN for Arweave images (CloudFront or Cloudflare)
- Database read replicas for gallery performance
- Background job queue for generation (don't block API routes)

### Multi-Chain
- Ethereum / Base / Polygon support
- Cross-chain collection viewing
- Chain-agnostic gallery

---

## Feature Ideas to Make It More Enticing

### 1. AI Remix
Let users take any existing NFT image and remix it with a new prompt. "Take this forest creature and make it cyberpunk." Generates variations while keeping the core composition.

### 2. Collection Themes
Pre-built themes with coordinated prompts: "PFP Collection" auto-generates profile-picture-style portraits. "Generative Art" creates abstract algorithmic pieces. "Game Assets" generates items, characters, backgrounds.

### 3. Collaborative Collections
Multiple wallets can contribute images to a single collection. Each contributor owns their minted NFTs, but the collection is shared. Good for DAOs and communities.

### 4. Mint Parties
Real-time events where users join a room, vote on prompts, and mint together. Timer-based drops with limited editions.

### 5. AI Art Battles
Two users submit prompts, AI generates both, community votes on the winner. Winner gets a limited-edition NFT. Gamification drives engagement.

### 6. Dynamic NFTs
NFTs whose artwork evolves based on on-chain events. Hold for 30 days and the art upgrades. Trade it and the art changes. Uses Metaplex Core's plugin system.

### 7. Prompt Marketplace
Users can sell their best prompts as "recipes." Buy a recipe, generate with it, mint. Prompt creators earn royalties on each use.

### 8. Physical Prints
Order physical prints of your NFT artwork. Integration with a print-on-demand service (Printful, Gelato). QR code on the print links to on-chain proof.

### 9. Airdrop Tool
Select NFT holders from any collection and airdrop new NFTs to them. Use case: reward loyal holders with new art from the same creator.

### 10. API Access
Developer API for programmatic generation and minting. SDKs for JavaScript, Python. Enable other apps to build on MintAI's infrastructure.
