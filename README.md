# Social Media Automation

Internal social publishing application under development.

## Current checkpoint

| Area                    | Current state                                                                                                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repository              | Five npm workspaces, a shared lockfile, strict TypeScript profiles, Git hooks, and Linux/Windows CI are configured.                                                                               |
| API                     | NestJS startup, configuration, module wiring, and a public `GET /health` liveness endpoint exist.                                                                                                 |
| Web connection          | The dashboard calls Next.js `GET /api/health`, which calls NestJS `GET /health`. The feature handles timeouts, invalid responses, cancellation, and retry.                                        |
| Public interfaces       | API and web share the health response interface and runtime validator through `packages/contracts`.                                                                                               |
| Local database          | Docker Compose defines PostgreSQL 18.7 on `127.0.0.1:25432` with a named volume.                                                                                                                  |
| Prisma                  | CLI, client, and PostgreSQL adapter are pinned to 7.10.1. Client generation has been verified. A manual `SELECT 1` connection script exists; a successful database connection remains unverified. |
| Application persistence | Models, migrations, repository interfaces and implementations, application use cases, and API database wiring are pending.                                                                        |
| OpenAPI                 | Swagger/OpenAPI setup and a JSON specification endpoint or file are pending.                                                                                                                      |
| Publishing              | Caller identity, MinIO, Temporal, a running worker, and live provider publishing are pending.                                                                                                     |

The current health response reports API HTTP liveness. Database readiness and a web-to-API-to-database operation remain pending. CI covers tooling, compiler profiles, contracts, API, and web checks. Backend lint/type checks, database integration, worker verification, browser tests, production builds, and live provider verification remain outside the current gate.

## Run the current application

Use Node.js 24.14.0 and npm 11.21.1. From the repository root:

```powershell
npm.cmd ci
npm.cmd run start:api
```

In a second terminal:

```powershell
npm.cmd run dev:web
```

Open http://127.0.0.1:3000. The API health endpoint is http://127.0.0.1:3001/health. Both commands run without PostgreSQL. On other shells, use `npm` in place of `npm.cmd`.

## Local PostgreSQL and Prisma

Start Docker and use the root [.env.example](.env.example) as a template for your private root `.env`. Set `POSTGRES_PASSWORD` and the matching password in `DATABASE_URL`. Run these commands from the repository root after installing the npm dependencies:

```powershell
docker compose --env-file .env -f infra/local/compose.yaml up -d
npm.cmd exec --workspace @social-media/backend -- prisma generate --config prisma7.config.ts
```

The second command generates the client in `packages/backend/generated/prisma/`. Generation reads the schema and does not require a database connection. The generated code is ignored by Git.

The schema currently declares the generator and PostgreSQL datasource. The manual connection script is `packages/backend/database/check-connection.ts`; it reads `DATABASE_URL` from the process environment and disconnects after its query. The API currently starts independently of that script. Prisma CLI datasource URL configuration and the first migration will be added with the persistence step.

## Read next

1. [API guide](docs/guides/api-foundation.md): startup, configuration, and the request path.
2. [Web guide](docs/guides/web-foundation.md): dashboard state and the web-to-API connection.
3. [Development workflow](docs/guides/development-workflow.md): checks, Git hooks, and CI.

## Repository map

Shared TypeScript profiles live in `config/typescript/`. Workspace tsconfigs extend those profiles.

| Path                       | Current role                                                |
| -------------------------- | ----------------------------------------------------------- |
| `apps/api/`                | NestJS health API.                                          |
| `apps/web/`                | Next.js API connection screen.                              |
| `packages/contracts/`      | Shared health response and runtime validator.               |
| `apps/worker/`             | Reserved worker workspace.                                  |
| `packages/backend/`        | Prisma CLI configuration and database schema.               |
| `infra/`                   | Local PostgreSQL Compose configuration.                     |
| `scripts/`, `tests/`       | Repository automation and focused verification.             |
| `docs/`                    | API, web, and development workflow guides.                  |
| `reference/`               | Ignored external checkouts, including Postiz.               |
| `.local/`, `.task-checks/` | Ignored private/local files and disposable check artifacts. |

Use npm workspaces and one root `package-lock.json`. Project rules are in [AGENTS.md](AGENTS.md). Reference code, real environment files, credentials, dependencies, and generated output stay outside ordinary Git staging.
