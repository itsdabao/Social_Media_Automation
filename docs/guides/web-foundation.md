# Part 3 — Next.js dashboard and API connection

Verification statements below record the original implementation checkpoint. Later local CI checks passed; current remote CI status and production/browser verification require separate evidence.

Status: `READY_FOR_USER_REVIEW` on 16 November 2026.

This increment adds a Vietnamese dashboard that checks the existing NestJS health endpoint. It shows checking, connected, or unavailable status, with a button to check again. Authentication, publishing, persistence, and worker execution remain in their owning increments.

## Start locally

Use Node.js 24.14.0 and npm 11.21.1. Install dependencies from the repository root with `npm ci` on a clean checkout. Then use two terminals at the root.

```powershell
# Terminal 1
npm.cmd run start:api
```

```powershell
# Terminal 2
npm.cmd run dev:web
```

Open `http://127.0.0.1:3000`. The page initially shows `Đang kiểm tra kết nối…`, then `Đã kết nối API` when the API replies successfully. Stop the API and click `Kiểm tra lại` to see `Không thể kết nối API`. Start the API again and check again to recover.

The default API address is `http://127.0.0.1:3001`. For a different origin, copy `apps/web/.env.example` to a new private `apps/web/.env.local`, set `API_BASE_URL`, and restart the web process. Next.js loads its workspace environment files. Existing process environment values take priority. The origin must use HTTP or HTTPS and contain no credentials, path prefix, query, or fragment. This server-side value is read by the Next route handler.

The web dev command binds to loopback on port 3000. It builds the shared contracts first. Production build/start scripts exist as `npm run build:web` and `npm run start:web`; a production build was not run in this increment.

## Follow one request

```text
Browser opens the dashboard
  → page.tsx renders ApiConnectionPanel
  → useApiConnection manages status and calls requestApiHealth()
  → browser requests GET /api/health on the Next.js origin
  → Next route calls checkApiHealth(API_BASE_URL)
  → readApiHealthEndpoint validates the server configuration
  → server requests GET /health from NestJS
  → validate the shared health contract
  → route maps the health-check result to an HTTP response
  → render connected or unavailable
```

The browser and its route handler share an origin. The Nest API URL stays in server configuration, and this path works with the existing API's CORS settings. The handler performs transport validation and forwards a fixed health check. Business decisions continue to belong to backend application operations.

Both requests disable caching. The server request has a three-second deadline and rejects redirects. The browser request has a six-second deadline and is cancelled when the component unmounts or a newer check replaces it. An aborted older request cannot update the new check's state. The button is disabled during a check.

The handler forwards only validated `status` and `service` fields. Unexpected payloads, malformed JSON, non-success HTTP statuses, network errors, and timeouts return HTTP 502 with `api_unavailable`. Invalid API-origin configuration returns HTTP 503 with `invalid_api_configuration`. The UI displays a safe connection error and a retry action.

This health check reports HTTP liveness. Database, Temporal, and MinIO readiness will be added alongside those connections.

## Source map

| Responsibility                                                   | File                                                                                              |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| HTML language, metadata, global styles                           | [`layout.tsx`](../../apps/web/src/app/layout.tsx)                                                 |
| Dashboard entry                                                  | [`page.tsx`](../../apps/web/src/app/page.tsx)                                                     |
| Render connection status and the retry button                    | [`api-connection-panel.tsx`](../../apps/web/src/features/api-connection/api-connection-panel.tsx) |
| Connection state, initial check, retry, cancellation             | [`use-api-connection.ts`](../../apps/web/src/features/api-connection/use-api-connection.ts)       |
| Browser request and response validation                          | [`request-api-health.ts`](../../apps/web/src/features/api-connection/request-api-health.ts)       |
| Next HTTP entry point                                            | [`route.ts`](../../apps/web/src/app/api/health/route.ts)                                          |
| Validate the configured API origin                               | [`api-health-config.ts`](../../apps/web/src/features/api-connection/server/api-health-config.ts)  |
| Call the upstream API and return an explicit health-check result | [`api-health.ts`](../../apps/web/src/features/api-connection/server/api-health.ts)                |
| Shared public response type and runtime validator                | [`health.ts`](../../packages/contracts/src/health/health.ts)                                      |

The API controller now imports `ApiHealthResponse` from `@social-media/contracts/health`. The web uses its runtime validator. The package's explicit export points at TypeScript output in `packages/contracts/dist/`; build/start/check commands build that package when required. Its source has no framework or vendor imports.

The frontend uses explicit `.ts`/`.tsx` source imports so Turbopack resolves the actual source files. The web test compiler uses TypeScript's `rewriteRelativeImportExtensions` to produce runnable Node ESM. Backend source retains the `.js` import convention.

Next generates `next-env.d.ts` and `.next/types/` using `next typegen`, `next dev`, or `next build`. Those artifacts are ignored and should be regenerated with those commands. `next.config.mjs` disables automatic generation of nested agent instruction files, keeping the repository's maintained instructions authoritative.

## Verification

```powershell
npm.cmd run check:contracts
npm.cmd run check:web
npm.cmd run check:api
```

The web gate runs Next route type generation, strict TypeScript, typed ESLint, and focused Node tests. CI now includes contracts and web verification. ESLint rejects imports of backend internals/frameworks in web and imports of application/server frameworks in public contracts. These checks run against real source.

Local evidence:

- One contract validation test passed.
- Nine web tests passed for healthy/unavailable recovery, cancellation propagation, response validation, sanitization, invalid configuration, network failures, timeouts, and the route's public status/body/cache-header mapping.
- Eight existing API tests passed after moving its public response type to the shared package.
- The actual Next dev server served the dashboard over HTTP. Its route returned HTTP 200 through a real NestJS process, HTTP 502 after stopping that process, and HTTP 200 after restarting it. Temporary servers were stopped after verification.

Browser interaction and visual checks, production builds, clean-install replay, the full repository CI gate, and live social-provider tests were not run. The on-screen state transitions and responsive layout remain for manual review using the steps above.
