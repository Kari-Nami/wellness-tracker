# Wellness Tracker frontend

Independent React + Vite application. Use Node 24, `npm ci`, then `npm run dev`. Copy `.env.example` to `.env.local` when changing the public prefix or backend proxy target. Product routes are placeholders for the next frontend phase.

Run `npm run check` and `npm run build`. The API client validates responses and derives its prefix from Vite BASE_URL. No browser JWT storage or MongoDB credentials.

See the workspace `docs/api-contract.md` and `docs/developer-handoffs.md` before integration. `src/types/contracts.ts` is a generated copy, not the schema source. This application can build from its own directory without parent packages. Copy the relevant reference docs when extracting it into a separate repository.
