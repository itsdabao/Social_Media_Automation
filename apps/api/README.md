# API application

The `@social-media/api` workspace runs a NestJS HTTP server. From the repository root, run `npm run start:api`, then request `GET http://127.0.0.1:3001/health`. Run `npm run check:api` for API-only lint, TypeScript, and tests. See the [Part 2 guide](../../docs/guides/api-foundation.md) for configuration, startup, shutdown, and a file-by-file trace.

Use `src/main.ts` for startup, `src/composition/` for Nest modules and dependency wiring, and `src/presentation/http/`, `mcp/`, and `webhooks/` for transport handlers grouped by feature/provider.

Handlers validate public contracts, identify the caller, call backend application operations, and translate results. HTTP, MCP, and webhook handlers do not own publishing rules or direct database/provider calls.

API integration tests live in `tests/integration/`; unit tests live beside source. Optional settings are documented in `.env.example`. The start command loads this workspace's private `.env`, and existing shell settings take priority. Health currently reports HTTP liveness. Required-dependency readiness and authenticated business endpoints will be added with their owning implementations.
