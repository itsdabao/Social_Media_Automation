# Part 2 — NestJS API startup and health

The API separates startup, configuration, Nest module wiring, and HTTP presentation. This guide covers the HTTP liveness endpoint, the PostgreSQL readiness check, and the OpenAPI JSON document.

## Run locally

Use Node.js 24.14.0 and npm 11.21.1. Run from the repository root after installing dependencies.

```sh
npm run start:api
```

This compiles the API to `apps/api/dist/` and starts the emitted JavaScript. The default URL is `http://127.0.0.1:3001`. The command runs once; restart it after source changes.

In another PowerShell terminal:

```powershell
Invoke-RestMethod http://127.0.0.1:3001/health
curl.exe -i http://127.0.0.1:3001/ready
Invoke-RestMethod http://127.0.0.1:3001/openapi.json
```

`/health` returns HTTP 200 with this body and a `Cache-Control: no-store` header.

```json
{
  "status": "ok",
  "service": "api"
}
```

Liveness confirms that this API process can serve HTTP. Readiness confirms that the API can query PostgreSQL using `SELECT 1`. `/ready` returns HTTP 200 with `{"status":"ready"}` or HTTP 503 with `{"error":{"code":"database_unavailable"}}`. Start PostgreSQL using the [local Compose instructions](../../README.md#local-postgresql-and-prisma) to try the successful response. `/openapi.json` describes the HTTP requests and responses for both checks.

## Environment loading

Use the [root environment template](../../.env.example) and set local values in the private root `.env`. npm runs the start script from `apps/api`, so Node loads the root file using `--env-file-if-exists=../../.env`. Existing process environment values take priority. A missing file uses the HTTP defaults. Supply `DATABASE_URL` to enable the database readiness check.

| Variable   | Default     | Accepted values                      |
| ---------- | ----------- | ------------------------------------ |
| `API_HOST` | `127.0.0.1` | IPv4 or IPv6 address                 |
| `API_PORT` | `3001`      | Whole decimal number from 0 to 65535 |

Port `0` asks the operating system to allocate a free port, which the tests use. The startup event contains the actual URL. Empty or malformed values fail validation before the listener opens. The loopback default keeps local startup on the developer's machine. A container setup can explicitly choose its bind address in the infrastructure increment.

Startup emits a JSON event such as `{"event":"api.started","url":"http://127.0.0.1:3001"}`. Invalid configuration exits with code 1 and event `api.startup_failed` with code `invalid_configuration`. Other startup failures, such as an occupied port, use code `startup_failed`. Logs omit supplied environment values and raw framework exceptions.

Stop an interactive process with Ctrl+C. The API enables Nest shutdown hooks for SIGINT and SIGTERM and closes resources if listening fails. The tests verify that `app.close()` releases the HTTP listener. Windows signal behavior differs from POSIX, and Linux signal-driven graceful shutdown has not been exercised locally. See [Nest lifecycle documentation](https://docs.nestjs.com/fundamentals/lifecycle-events).

## Trace the code

Startup follows this order:

```text
main.ts
  → readApiConfig(process.env)
  → createApi()
      → NestFactory.create(AppModule)
      → create DatabaseConnection from DATABASE_URL when configured
      → register HTTP controllers
      → enable shutdown hooks
  → application.listen(apiConfig.port, apiConfig.host)
```

An HTTP request then follows a separate path:

```text
GET /health
  → Nest routes the request
  → HealthController.getHealth()
  → HTTP 200 with the health response

GET /ready
  → ReadinessController asks the DatabaseReadiness interface
  → DatabaseConnection calls pingDatabase() through Prisma
  → PostgreSQL runs SELECT 1
  → HTTP 200 on success or HTTP 503 when unavailable
```

| Behavior                                                                            | Source                                                                                                  |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Process startup, listening, safe failure logs                                       | [`main.ts`](../../apps/api/src/main.ts)                                                                 |
| Parse and validate runtime settings                                                 | [`api-config.ts`](../../apps/api/src/configuration/api-config.ts)                                       |
| Construct the Nest application and register shutdown hooks                          | [`create-api.ts`](../../apps/api/src/bootstrap/create-api.ts)                                           |
| Declare the controllers owned by the API                                            | [`app.module.ts`](../../apps/api/src/modules/app.module.ts)                                             |
| Handle `GET /health`                                                                | [`health.controller.ts`](../../apps/api/src/presentation/http/health/health.controller.ts)              |
| Wire the readiness interface to a shared Prisma Client and close it during shutdown | [`database.module.ts`](../../apps/api/src/modules/database.module.ts)                                   |
| Run the PostgreSQL probe                                                            | [`create-prisma-client.ts`](../../packages/backend/src/infrastructure/database/create-prisma-client.ts) |
| Map database readiness to an HTTP response                                          | [`readiness.controller.ts`](../../apps/api/src/presentation/http/health/readiness.controller.ts)        |
| Serve the OpenAPI JSON document                                                     | [`openapi.controller.ts`](../../apps/api/src/presentation/http/openapi/openapi.controller.ts)           |

`@Module` declares the components Nest wires together. `@Controller("health")` supplies the route prefix, and `@Get()` selects the HTTP method. `main.ts` owns process startup, while the controller owns the HTTP response.

The API compiler configuration extends the shared Node profile and enables Nest's decorator support. Production output excludes `*.test.ts`. The test configuration emits source and tests to ignored `apps/api/.local/tests/`.

Configuration defaults and port bounds have named constants. Port validation accepts canonical decimal strings and rejects whitespace, including trailing newlines. The entry point coordinates startup; bootstrap constructs the Nest application; configuration parses runtime settings; modules register dependencies; and the health controller owns the HTTP response.

## Checks and evidence

```sh
npm run check:api
```

The command runs API-only typed ESLint, strict TypeScript, and the focused tests. CI and the existing pre-push gate invoke it. Root `npm run lint` continues to check repository tooling. The TypeScript ESLint dependency is pinned to `8.73.0`.

The API checks cover:

- Configuration defaults, accepted addresses/boundary ports, invalid hosts, and malformed ports.
- Real HTTP health response and listener closure.
- Actual entry-point startup with an isolated `.env` and an operating-system-assigned port.
- Startup failure with invalid configuration, without disclosing the supplied value.
- Occupied-port failure and process exit.
- Readiness success, unavailability, and independence from HTTP liveness using a stubbed database result.
- The OpenAPI document and its operational responses.

Configuration tests live beside [`api-config.ts`](../../apps/api/src/configuration/api-config.test.ts). Process/HTTP tests live in [`tests/integration/health.test.ts`](../../apps/api/tests/integration/health.test.ts). They use loopback and disposable files under `.local/`, with no database or social accounts.

The full repository CI gate, standalone production build, clean-install replay, browser checks, and live provider tests have not been run for this increment. Remote CI execution awaits an authorized push.
