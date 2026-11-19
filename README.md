# Social Media Automation

Internal social publishing application under development.

## Current checkpoint

| Area                    | Current state                                                                                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repository              | Five npm workspaces, a shared lockfile, strict TypeScript profiles, Git hooks, and Linux/Windows CI are configured.                                                       |
| API                     | NestJS serves `GET /health` for HTTP liveness and `GET /ready` for database readiness.                                                                                    |
| Web connection          | The dashboard calls Next.js `GET /api/health`, which calls NestJS `GET /health`. The feature handles timeouts, invalid responses, cancellation, and retry.                |
| Public interfaces       | API and web share the health response through `packages/contracts`. The readiness controller uses a `DatabaseReadiness` interface wired to the database provider by Nest. |
| Local database          | Docker Compose defines PostgreSQL 18.7 on `127.0.0.1:25432` with a named volume.                                                                                          |
| Prisma                  | CLI, client, and PostgreSQL adapter are pinned to 7.10.1. `GET /ready` runs `SELECT 1` through the API's shared Prisma Client.                                            |
| Application persistence | The initial migration creates users, sessions, and post drafts. The backend repository scopes draft operations to the owner.                                              |
| Local authentication    | A seeded account can sign in at `/login`. PostgreSQL stores sessions, and sign-out revokes the current session.                                                           |
| OpenAPI                 | `GET /openapi.json` describes the health, readiness, and local authentication routes.                                                                                     |
| Publishing              | Caller identity, MinIO, Temporal, a running worker, and live provider publishing are pending.                                                                             |

The dashboard reports HTTP liveness. The database readiness endpoint is called directly on the API. CI covers tooling, compiler profiles, contracts, API, and web checks. Automated API checks use a stub for the database readiness result. Live database checks, worker verification, browser tests, production builds, and live provider verification remain outside the current gate.

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

Open http://127.0.0.1:3000/login to sign in with the seeded account. If you run the web app at a different origin, set `WEB_AUTH_ORIGIN` in `apps/web/.env.local` to its browser origin, including the scheme and any port. The API and web can start without PostgreSQL, and sign-in requires PostgreSQL. On other shells, use `npm` in place of `npm.cmd`.

```powershell
curl.exe -i http://127.0.0.1:3001/health
curl.exe -i http://127.0.0.1:3001/ready
curl.exe -i http://127.0.0.1:3001/openapi.json
```

## Local PostgreSQL and Prisma

Start Docker and use the root [.env.example](.env.example) as a template for your private root `.env`. Set `POSTGRES_PASSWORD` and the matching password in `DATABASE_URL`. Run these commands from the repository root after installing the npm dependencies:

```powershell
docker compose --env-file .env -f infra/local/compose.yaml up -d
docker compose --env-file .env -f infra/local/compose.yaml ps
```

The API build generates the Prisma Client in `packages/backend/generated/prisma/` before compiling the backend package. To check the same PostgreSQL connection from a terminal after generation, run `node --env-file=.env packages/backend/database/check-connection.ts` from the root.

The API reads `DATABASE_URL` from the process environment. `/ready` returns HTTP 200 when PostgreSQL answers and HTTP 503 when the connection is unavailable or `DATABASE_URL` is missing. To apply the committed migrations to the local PostgreSQL database, run the following from the repository root.

```powershell
node --env-file=.env .\node_modules\prisma\build\index.js migrate deploy --config packages/backend/prisma7.config.ts
```

## Seed a local account

After applying the migrations, set `LOCAL_AUTH_EMAIL` and `LOCAL_AUTH_PASSWORD` in the private root `.env` using credentials reserved for local development. Run the following from the repository root. The script loads `.env`, lowercases the email, and stores a salted scrypt hash in `User.passwordHash`. A second run with the same email preserves the existing password.

```powershell
npm.cmd run seed:local-user --workspace @social-media/backend
```

Run `npm.cmd run test:password --workspace @social-media/backend` and `npm.cmd run test:session --workspace @social-media/backend` to check password verification and session behavior without a database. After sign-in, refresh the dashboard to check the session cookie, then sign out to revoke that session.

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
