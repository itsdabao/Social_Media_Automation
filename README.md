# Social Media Automation

Internal social publishing application using TypeScript, Next.js/React, NestJS, self-hosted Temporal, PostgreSQL, and MinIO.

The workspace has five npm packages, strict TypeScript profiles, a runnable NestJS API, and a Next.js dashboard that checks its health. Local PostgreSQL, Temporal, and MinIO run through Docker Compose. Worker startup, application database access, and caller identity remain pending.

## Start here

- [Workspace layout](docs/workspace-layout.md): where each kind of file belongs, with concrete examples.
- [Documentation index](docs/README.md): design, plans, guides, and source reviews.
- [Architecture](docs/architecture/architecture-design.md): system responsibilities and publishing behavior.
- [Technical plan](docs/plans/technical-plan.md): selected stack, open choices, and implementation scope.
- [Five-stage roadmap](docs/plans/README.md): ordered implementation plans, task coverage, checkpoints, and completion criteria.
- [Development workflow](docs/guides/development-workflow.md): current tooling and CI.
- [Workspace foundation](docs/guides/workspace-foundation.md): Part 1 setup, file reading order, and verification.
- [API foundation](docs/guides/api-foundation.md): Part 2 startup commands, configuration, and request flow.
- [Web foundation](docs/guides/web-foundation.md): Part 3 dashboard, API connection, and retry flow.
- [Local development](docs/guides/local-development.md): Part A infrastructure startup, ports, persistence, and isolated verification.
- [AGENTS.md](AGENTS.md): complete, self-contained project rules.

## Directory ownership

| Path                  | Contents                                                                            |
| --------------------- | ----------------------------------------------------------------------------------- |
| `apps/web/`           | Next.js dashboard and UI-only behavior.                                             |
| `apps/api/`           | NestJS HTTP, MCP, OAuth callback, and webhook entry points.                         |
| `apps/worker/`        | Temporal workflows, activity handlers, outbox dispatch process, and worker startup. |
| `packages/backend/`   | Business modules, application operations, ports, and concrete adapters.             |
| `packages/contracts/` | Public HTTP/MCP schemas and transport types.                                        |
| `infra/`              | Compose files, service configuration, and later deployment definitions.             |
| `scripts/`            | Repository automation and developer commands.                                       |
| `tests/`              | Repository tooling tests and later tests spanning applications.                     |
| `docs/`               | Maintained project documentation in English.                                        |
| `reference/`          | Ignored third-party checkouts, including Postiz.                                    |
| `.local/`             | Ignored local logs, temporary files, and development exports.                       |
| `.secrets/`           | Ignored private local configuration and credentials.                                |

## Tooling available today

Use Node.js 24.14.0 and npm 11.21.1. Run commands from this repository root:

```sh
npm ci
npm run format:check
```

In PowerShell, use `npm.cmd` when execution policy blocks `npm.ps1`. The root owns the only application lockfile. Run `npm run start:api` and `npm run dev:web` in separate terminals, then open `http://127.0.0.1:3000`. See the [web guide](docs/guides/web-foundation.md) for the request trace, configuration, and focused checks.

Use npm across all application workspaces and CI, with one root `package-lock.json`. References to pnpm in Postiz research describe that upstream repository; our application uses npm.
