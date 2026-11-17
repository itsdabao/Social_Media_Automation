# Stage 1: Discovery, feasibility, and runnable foundation

Foundation implementation: Part 1 provides npm workspaces and TypeScript profiles. Part 2 adds NestJS startup and health. Part 3 (Next.js dashboard, shared health contract, and API connection) is ready for user review. Part A adds isolated local PostgreSQL, Temporal, and MinIO with verified persistence across container recreation. See the [workspace](../guides/workspace-foundation.md), [API](../guides/api-foundation.md), [web](../guides/web-foundation.md), and [local development](../guides/local-development.md) guides. Worker startup, application persistence, identity, and account-access verification remain pending.
Source parent: `01 — Discovery & Feasibility`. Source stage: `0–2 — Discovery`. Parent priority: P0.
Dependencies: existing repository/tooling. Next: [Stage 2](02-content-and-publishing.md).

## Outcome

A developer can start our own web, API, worker, and required local dependencies, understand their boundaries, and see exactly which provider capabilities remain unverified. External access research continues without blocking local implementation.

## Scope and task traceability

| Task                                                                | Planned result                                                                                                                   |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| T01 — Confirm requirements & MVP scope                              | A bounded initial release, sample user journey, required identities/destinations, and explicit acceptance conditions.            |
| T02 — Research platform APIs                                        | Capability matrix for Facebook, LinkedIn, Instagram, Threads, X, TikTok, Reddit, Bluesky, Medium, and Substack.                  |
| T03 — Validate Facebook Groups posting, Page/LinkedIn description   | Separate Page and LinkedIn Company/Personal evidence for connection, publishing/read-back, comments/replies, and metrics.        |
| T04 — Validate Facebook Groups posting, external Groups description | Feasibility evidence for create/share, Page/Profile eligibility, external Group approval, and assisted alternatives.             |
| Foundation work added to make the tracker executable                | Version/persistence decisions, npm workspace scaffolding, local services, server identity boundary, and application check setup. |

Use the existing [Postiz source trace](../references/postiz/deep-dive.md) and [platform capability baseline](../references/platform-capabilities.md). API-based publishing has concrete reference implementations for nine requested platform families. T02's remaining work is operation-specific access/compatibility verification, plus unresolved gaps such as Substack and external Groups. This research can proceed alongside the runnable foundation.

## Completed discovery baseline

- [x] Trace the composer/API/persistence/Temporal/provider publishing flow in Postiz.
- [x] Inventory registered publishing adapters across the ten requested platform families and distinguish the Substack gap.
- [x] Record the difference between Facebook Page publishing and external Group/Profile feasibility.

These checks complete the reference baseline, not implementation of our application or live verification of our accounts.

## Ordered work packages

- [ ] **1.1 Define the first user journey.** Use Facebook Page as the proposed first real connector and identify an authorized test Page/developer app; record a substitution if another supported destination has usable access first. Specify who can schedule/cancel, what content is supported, what confirms publication, and how uncertainty is displayed. Separate internal approval from platform moderation. Record which Group and multi-platform behaviors are release requirements.
- [ ] **1.2 Resolve implementation prerequisites.** Pin compatible TypeScript/Next.js/React/NestJS/Temporal SDK/schema-library versions for the established Node/npm toolchain using official compatibility sources at implementation time. Evaluate Prisma against `pg` or another supported PostgreSQL access layer for transactions, outbox claims, locks, uniqueness, and migrations; record the selected approach. Define local sign-in and company identity-provider integration, environment loading, and token-encryption key handling. Local-only test identity must fail closed outside explicit development configuration.
- [ ] **1.3 Scaffold actual workspaces.** Register `apps/*` and `packages/*` as npm workspaces with one root `package-lock.json`. Configure generators and install commands to use npm; avoid nested app lockfiles. Add real package manifests, strict TypeScript settings, deliberate package exports, Next routes, Nest API/worker entry points, and composition roots. Preserve domain/application independence from frameworks. Add actual application lint/type checks and package build commands as source appears, with architecture checks for the agreed import boundaries.
- [x] **1.4 Implement isolated local infrastructure.** Compose project, named volumes, private runtime environment, health checks, and documented loopback ports are implemented. Application PostgreSQL is isolated from Temporal persistence/Visibility databases, and MinIO has its own volume. The focused disposable-project test passed on 17 November 2026, including data preservation after container recreation and repeated schema/namespace initialization. See the [local guide](../guides/local-development.md). Application database tooling and worker integration remain separate work.
- [ ] **1.5 Establish operating visibility.** Add validated runtime configuration, process readiness/liveness, correlation IDs, structured redacted logs, and initial scoped caller handling. A ready worker must have an actual Temporal connection/worker registration; a static HTTP success is insufficient. Add graceful shutdown and a startup guide describing each process.
- [ ] **1.6 Extend the established capability baseline.** Start with the selected connector's Postiz adapter and verify its current official endpoints, identity/account type, auth/scopes, review/access requirements, cost/rate constraints, and media restrictions. Record check date and evidence status. Extend to additional connectors as they enter implementation. Research Substack and external Groups separately. Publishing, comments, replies, and metrics get separate entries; a new all-platform investigation is not a prerequisite for scaffolding.
- [ ] **1.7 Run bounded authorized PoCs.** Exercise T03 and T04 only with the required credentials and authorization for any external write. Record requested scopes, selected identity, destination, sanitized result, read-back/approval evidence, and limitations. If access is unavailable, document the exact prerequisite and keep the corresponding capability pending. Record the Group execution decision before implementing its executor.

## File destinations

| Artifact                                           | Location                                                                                      |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| npm workspaces, shared TypeScript/tooling settings | Root manifest, lockfile, and root configuration files.                                        |
| Framework entry points and wiring                  | `apps/{web,api,worker}/`, with Nest composition under `src/composition/`.                     |
| Scoped identity use cases and adapters             | `packages/backend/src/modules/identity/`.                                                     |
| Real public contract exports                       | `packages/contracts/src/`, added with the first boundary they serve.                          |
| Compose and environment template                   | `infra/local/compose.yaml`, `infra/local/.env.example`.                                       |
| Service-specific initialization                    | `infra/services/{postgres,temporal,minio}/`.                                                  |
| Dependency/database/identity decisions             | Numbered records in `docs/decisions/`.                                                        |
| Startup instructions                               | `docs/guides/local-development.md`.                                                           |
| Capability matrix, Page/LinkedIn PoC, Group PoC    | `docs/references/platform-capabilities.md`, `page-linkedin-poc.md`, `facebook-groups-poc.md`. |
| Private credentials or session state               | Ignored environment files or `.secrets/`.                                                     |

These are planned files; create them with concrete configuration or evidence rather than empty placeholders.

## Focused verification

Check clean workspace installation, package resolution, strict compiler configuration, expected entry-point startup, service readiness, process shutdown, and rejected imports across protected boundaries. Exercise malformed/missing environment configuration, rejected unauthenticated or cross-scope requests, and production rejection of local test identity. Use disposable data. Keep PoC evidence separate from application automated tests.

## Exit conditions and handoff

- [ ] A documented local command sequence starts our own processes and dependencies.
- [ ] Database-access and application dependency choices are recorded and the local identity boundary is explicit.
- [ ] Real application checks exist for scaffolded source; existing hook checks remain intact.
- [ ] One correlation ID can be followed through a basic authorized API operation and its redacted log.
- [x] All ten platform families appear in the source-derived capability baseline, including unresolved access and missing reference support.
- [ ] Page/LinkedIn and external Group investigations are separately identified; pending live evidence has explicit prerequisites and owners to assign.

Stage 2's local provider-fake work may start after 1.1–1.5 even while external PoCs are pending. A real provider adapter proceeds only on its relevant evidence/access, and Group implementation awaits the separate feasibility decision. Production sizing and complete provider coverage do not gate local scaffolding.

Demonstration: start the local stack, open the dashboard shell, inspect API/worker readiness, and explain which process owns each responsibility.
