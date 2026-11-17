# Documentation index

Maintained documents are written in English. Source reviews describe the inspected code; architecture and plan documents describe our application.

Start delivery work from the [five-stage roadmap](plans/README.md). It maps all supplied tracker tasks to implementation stages and identifies the first runnable checkpoint.

The [platform capability baseline](references/platform-capabilities.md) records the publishing adapters already established through Postiz and the remaining account-access/research gaps.

The [Part 1 foundation guide](guides/workspace-foundation.md) explains the installed npm workspaces, dependency ownership, strict TypeScript profiles, and the next implementation checkpoint.

The [Part 2 API guide](guides/api-foundation.md) explains the runnable NestJS entry point, health endpoint, environment loading, and focused API checks.

The [Part 3 web guide](guides/web-foundation.md) traces the Next.js dashboard, same-origin health route, shared response contract, and retry behavior.

| Document                                                                         | Purpose                                                                                       |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| [Workspace layout](workspace-layout.md)                                          | Directory ownership, import boundaries, placement examples, tests, and generated/local files. |
| [Architecture](architecture/architecture-design.md)                              | System design, domain behavior, provider boundaries, and recovery.                            |
| [Technical plan](plans/technical-plan.md)                                        | Selected technology, open decisions, feasibility, and delivery scope.                         |
| [Development workflow](guides/development-workflow.md)                           | Local checks, hooks, and GitHub CI.                                                           |
| [Local development](guides/local-development.md)                                 | Part A PostgreSQL, Temporal, and MinIO startup and focused verification.                      |
| [Postiz deep dive](references/postiz/deep-dive.md)                               | Composer-to-provider source trace and reading order.                                          |
| [Postiz reference review](references/postiz/reference-review.md)                 | Provider coverage, MCP, persistence, storage, and observed limitations.                       |
| [Postiz local preview](references/postiz/local-preview.md)                       | Running the separate reference preview.                                                       |
| [Celesnity conventions reference](references/celesnity-conventions-reference.md) | Background comparison with the team's other projects.                                         |
| [Workspace decision](decisions/0001-workspace-layout.md)                         | Why the current repository boundaries were selected.                                          |
| [Local service versions](decisions/0002-local-service-versions.md)               | Pinned service versions, MinIO source build, and database isolation.                          |

Use `architecture/` for current system design, `plans/` for scoped implementation plans, `guides/` for runnable procedures, `references/` for external source research, and `decisions/` for numbered architecture decisions with rationale. Keep current facts in their owning document and link to them from other documents.
