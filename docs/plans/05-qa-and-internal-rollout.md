# Stage 5: QA and internal rollout

Delivery status: not started.
Source parent: `05 — QA & Internal Rollout`. Source stage: `5 — Rollout`. Parent priority: P1.
Dependencies: [Stage 2](02-content-and-publishing.md) and the [Stage 3](03-engagement-and-ai.md)/[Stage 4](04-analytics-and-growth.md) features explicitly included in the release. Platform/account access and production hosting decisions are required for their corresponding validation/deployment steps.

## Outcome

The agreed internal release has demonstrated workflow behavior, restricted access, operational visibility, recovery procedures, and a supported-account/feature inventory. Operators know what to do when publishing is delayed, rejected, or uncertain.

## Scope and task traceability

| Task                            | Planned result                                                                                                                     |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| T19 — Test end-to-end workflows | Evidence for the complete agreed release, including authorization, cancellation/recovery, external approval, and failure handling. |
| T20 — Add security & monitoring | Validate controls introduced in Stages 1–4 and add production monitoring, alerting, restore, and upgrade procedures.               |
| T21 — Prepare internal rollout  | Supported company accounts, team onboarding, known limitations, operating ownership, and release readiness record.                 |

The source leaves T20's child priority blank. Security and visibility already belong to every earlier implementation step; they are not postponed until this stage.

## Ordered work packages

- [ ] **5.1 Freeze a bounded release acceptance matrix.** List each platform, account type, destination, format, operation, and evidence status. Identify mandatory versus explicitly deferred features, including Groups, inbox/AI, and optional analytics reports. Assign an internal owner for each unresolved dependency and incident response. A required capability cannot be silently omitted to make a release pass.
- [ ] **5.2 Run representative end-to-end journeys.** Cover sign-in/access, account connect/reconnect, content upload/version/variant, immediate/scheduled publication, independent destination outcomes, history, and cancellation/rescheduling. Include Groups moderation, inbox/manual/AI replies, and analytics when in release scope. Use disposable local environments and fakes for fault coverage; separate authorized real-account evidence.
- [ ] **5.3 Exercise failures and recovery.** Interrupt API/worker/Temporal/database availability, restart after provider acceptance, redeliver events, rotate/revoke a grant, and recover overdue outbox work. Prove that stale revisions and duplicate attempts cannot overwrite newer evidence. Uncertain provider outcomes require reconciliation and remain visible to operators.
- [ ] **5.4 Review access and secret boundaries.** Check UI/HTTP/MCP/worker authorization parity, organization/identity isolation, webhook verification, media access, OAuth state/PKCE as applicable, token encryption/key rotation, redaction, and browser-session isolation. Confirm deployment rejects local test identity and debug exposure.
- [ ] **5.5 Define and prepare the self-hosted topology.** Select hosting and availability/RPO/RTO targets, capacity, TLS/network access, private admin UI access, secrets injection, and production configuration. Run Temporal with PostgreSQL persistence/Visibility databases, separate app PostgreSQL, application workers/API/web, and MinIO. Specify component redundancy if availability targets require it. Select reverse proxy/load balancing based on the actual topology. Elasticsearch, Redis, BullMQ, and Kafka are not part of the selected design.
- [ ] **5.6 Implement monitoring and procedures.** Monitor API/worker health, task/outbox backlog and oldest age, schedule lateness, workflow/activity failures, unconfirmed publications, provider auth/rate errors, database capacity, and object-store availability. Set meaningful thresholds and action owners. Write incident steps for paused publishing, revoked grants, pending approval, and uncertain results.
- [ ] **5.7 Prove backups, restore, and upgrades.** Cover application PostgreSQL, Temporal persistence/Visibility, MinIO objects, required configuration, and protected key recovery. Perform a restore exercise in an isolated environment and record achieved recovery times. Pause/reconcile restored executions against external effects before any resend. Plan database migration compatibility and Temporal workflow versioning/worker deployment so running workflows remain valid.
- [ ] **5.8 Prepare the pilot and release evidence.** Document setup, supported accounts/features, publishing/approval behavior, known limitations, recovery contacts, and user onboarding. Record migration/rollback and workflow-safe rollback constraints. Run a limited internal pilot only after deployment and external-action authorization. Collect issues before broadening access.

## File destinations

| Concern                                                      | Location                                                                                    |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Cross-application acceptance journeys                        | `tests/e2e/`.                                                                               |
| Workflow/recovery/adapter tests                              | Owning app/package test directories established in the workspace layout.                    |
| Real application/migration/architecture CI gates             | `.github/workflows/`, root/workspace package scripts, and focused tooling under `scripts/`. |
| Hosting-specific definitions                                 | A named directory under `infra/` after the hosting decision.                                |
| Monitoring configuration                                     | `infra/services/<selected-component>/` with owning application instrumentation.             |
| Startup, operations, incident, restore, upgrade, user guides | `docs/guides/`.                                                                             |
| Hosting/availability/versioning decisions                    | `docs/decisions/`.                                                                          |
| Release scope, evidence, pilot results, unresolved issues    | `docs/plans/internal-release-readiness.md` when a real release candidate exists.            |
| Safe smoke-check automation                                  | `scripts/`, with runtime private configuration excluded from Git.                           |

## Verification and release evidence

For each executed check record the command/scenario, application revision, environment, time, relevant identifiers, expected/observed result, and remaining limitation. Focus checks on the owning behavior; a release-wide suite is planned work requiring the authorization described in AGENTS.md. Do not use shared databases or real social accounts in ordinary automated CI.

A source adapter, successful fake test, clean build, and confirmed live publication are different evidence types. Preserve that distinction in the release record. Do not mark planned work complete from this document's existence.

## Exit conditions

- [ ] All required release journeys pass or have an explicit accepted scope decision.
- [ ] Security and authorization checks cover HTTP, MCP, activities, media, webhooks, and any browser executor.
- [ ] Live capability evidence matches the actual company identities/destinations and granted permissions.
- [ ] Operators can find an execution's state, attempt history, errors, evidence, and next action using persisted IDs.
- [ ] Alerts and response ownership are defined and exercised for material failure cases.
- [ ] Backup/restore is demonstrated in isolation, including post-restore reconciliation of possible external side effects.
- [ ] Availability/recovery targets, production configuration, migrations, upgrade/versioning, and rollback constraints are recorded.
- [ ] Team setup/user guidance and supported-platform limitations are reviewed for the pilot.
- [ ] GitHub CI is verified remotely and required checks are configured once commit/push and repository changes are authorized.
- [ ] Deployment, shared migration, and external publication actions receive their required explicit authorization before execution.

Demonstration: an operator diagnoses a delayed/uncertain publication, follows the recovery procedure, and shows the corresponding audit trail without triggering a duplicate post.
