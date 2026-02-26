# Repository Guidelines

## Project Structure & Module Organization
Core app code lives in `src/` using Next.js App Router.

- `src/app/`: routes, pages, and API handlers (`src/app/api/**/route.ts`)
- `src/components/`: UI grouped by feature (`agent/`, `mirrors/`, `marketplace/`, `layout/`)
- `src/lib/`: business logic and integrations (`agent/`, `mirrors/`, `solana/`, `supabase.ts`)
- `src/hooks/`: reusable React hooks
- `src/types/`: shared TypeScript types and schemas
- `public/`: static assets (images, fonts, SVGs)
- `docs/`: product and implementation notes

Prefer feature-local organization (for example, keep mirror-related utilities under `src/lib/mirrors/`).

## Build, Test, and Development Commands
- `npm run dev`: start local development server at `http://localhost:3000`
- `npm run build`: production build (validates app/router compilation)
- `npm run start`: run the built production server
- `npm run lint`: run ESLint checks

Typical flow: `npm run lint && npm run build` before opening a PR.

## Coding Style & Naming Conventions
- Language: TypeScript + React function components.
- Indentation: 2 spaces; keep imports grouped and sorted logically.
- Components: `PascalCase.tsx` (e.g., `AgentCard.tsx`).
- Hooks/utilities: `camelCase.ts` with `use*` prefix for hooks (e.g., `useMirrorTimeline.ts`).
- Route handlers: Next.js convention `route.ts` under feature folders.
- Styling: Tailwind CSS v4 in `globals.css`; keep utility usage readable and colocated with components.

Run `npm run lint` to enforce style and catch common issues.

## Testing Guidelines
There is currently no dedicated test runner configured (`npm test` is not defined). For now:

- Treat `npm run lint` and `npm run build` as required validation.
- For new logic-heavy modules, add tests with your chosen framework (recommended: Vitest + React Testing Library) in `src/**/__tests__/` or alongside files as `*.test.ts(x)`.
- Name tests by behavior (e.g., `mintNFT.validatesMetadata.test.ts`).

## Commit & Pull Request Guidelines
Recent history follows mostly Conventional Commit prefixes:
`feat:`, `fix:`, `style:`, `chore:`.

- Keep commit subject lines imperative and concise (<= 72 chars).
- One logical change per commit when possible.
- PRs should include: summary, scope, manual test steps, linked issue (if any), and screenshots/GIFs for UI changes.
- Note any env/config updates explicitly (e.g., new keys in `.env.local` or `.env.example`).

## Security & Configuration Tips
- Never commit secrets; use `.env.local` and keep `.env.example` as the template.
- This project uses Solana/authority key material and Supabase service keys; treat all private keys as sensitive.
- If changing on-chain or marketplace flows, document risk and rollback steps in the PR.
