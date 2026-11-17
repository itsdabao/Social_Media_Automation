# Web application

The `@social-media/web` workspace runs the Next.js dashboard. From the root, run `npm run dev:web` and open `http://127.0.0.1:3000`. Start the NestJS API in another terminal with `npm run start:api`. See the [Part 3 guide](../../docs/guides/web-foundation.md) for the file trace, configuration, and manual connected/unavailable/recovery scenario.

Use `src/app/` for routes and layouts; `src/features/<feature>/` for feature components, client calls, hooks, and UI state; `src/components/ui/` for shared UI primitives; and `src/lib/` for small browser/framework helpers.

Public request and response schemas come from `packages/contracts`. Credentials, persistence, provider calls, and permission decisions stay on the server. A future Next.js server handler should perform transport/session work and call the API rather than duplicate application operations.

Focused tests live beside feature source. `npm run check:web` runs strict typing, typed lint, and feature tests. Set the server-only `API_BASE_URL` in private `.env.local` if the API origin differs from `.env.example`. The Next route handler calls the fixed API health endpoint and returns validated public fields.
