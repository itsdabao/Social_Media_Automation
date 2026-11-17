# Stage 2: Content and publishing

Delivery status: not started.
Source parent: `02 — Content & Publishing`. Source stage: `3 — Core MVP`. Parent priority: P0.
Dependencies: [Stage 1 foundation](01-discovery-and-foundation.md). Next: [Stage 3](03-engagement-and-ai.md) and [Stage 4](04-analytics-and-growth.md).

## Outcome

A user can prepare content, select eligible identities/destinations, publish now or later, and understand every destination's outcome. The first real provider milestone covers one authorized test account with image/caption, confirmation or visible uncertainty, and persisted history.

## Scope and task traceability

| Task                                         | Planned result                                                                                                       |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| T05 — Connect social accounts                | Scoped connection, identity discovery, encrypted grants, expiry/reconnection, and revocation handling.               |
| T06 — Build content library                  | Reusable captions/posts plus controlled image/video storage, previews, and lifecycle rules.                          |
| T07 — Build post composer                    | Master content, immutable versions, destination-specific variants, validation, and approval invalidation on edits.   |
| T08 — Manage publishing destinations         | Multi-destination selection with automated, assisted/manual, unavailable, and unverified capabilities made explicit. |
| T09 — Implement publishing & scheduling      | Immediate/scheduled Temporal execution through a transactional outbox, bounded retries, and reconciliation.          |
| T10 — Add Facebook Groups publishing flow    | Approved create/share workflow after the dedicated PoC.                                                              |
| T11 — Implement Facebook Groups distribution | Eligible Page/Profile execution and independently evidenced submission/approval/publication outcomes.                |
| T12 — Track publishing history               | Destination-level timeline, attempts, stage/error details, and confirmation evidence.                                |

T10/T11 share the Group implementation below. They retain separate exit checks and do not establish Group support through Page publishing alone.

The [reference capability inventory](../references/platform-capabilities.md) is already established. Start local implementation without repeating it. Use Facebook Page as the proposed first real connector, subject to usable authorized access, and verify only the relevant operation/account prerequisites before its live milestone.

## Ordered work packages

- [ ] **2.1 Define publication data and contracts.** Model content/version, destination variant, publication per destination, schedule revision, attempt, history event, confirmation evidence, and outbox entry. Add uniqueness and ownership constraints. Record UTC execution time with the chosen IANA timezone. Add idempotency keys for repeated API/MCP scheduling requests and stable workflow IDs for dispatch.
- [ ] **2.2 Build the local publishing checkpoint.** Implement one authorized text-only schedule request, the atomic publication/outbox transaction, dispatcher claim/retry, a Temporal timer/workflow, and an activity calling a deterministic provider fake. Persist product-facing states/events and expose a minimal create/history UI. Fake outcomes must cover success, rejection, pending processing, and uncertain acceptance.
- [ ] **2.3 Prove recovery before a real provider.** Exercise Temporal unavailability after DB commit, dispatcher crash after workflow start, duplicated requests/activity delivery, worker restart, schedule edits, cancellation, and stale execution completion. Recheck ownership, revision, capabilities, and cancellation before mutations. Unknown outcomes enter reconciliation rather than blind resubmission.
- [ ] **2.4 Connect one real account.** Implement provider auth/state/PKCE where applicable, server-side token storage/encryption, refresh concurrency control, identity/destination discovery, and reconnect/revoke behavior. Distinguish internal user, authorization grant, publishing identity, and external destination. Grant checks apply to each operation.
- [ ] **2.5 Add library and composer media.** Implement controlled MinIO upload/download, ownership/size/type validation, media metadata and processing states, previews, and content reuse. Support image/caption first. Specify deletion/reference retention, extraction outputs where required, and provider access to media URLs for the required lifetime. Expand video formats and destination-specific settings incrementally using verified limits.
- [ ] **2.6 Complete one real publication path.** Prepare/submit media, support asynchronous provider processing with read-only checks and safe finalization, then store release IDs/URLs and confirmation evidence. Expose immediate and scheduled image/caption actions. Distinguish internal approval from provider acceptance and external moderation.
- [ ] **2.7 Complete shared entry points and history.** HTTP and minimal authenticated MCP list/create/schedule/status tools invoke the same use cases. UI shows destination, content version, scheduled/executed times, current stage, attempts, workflow/correlation IDs, redacted error, evidence, and next action. Editing or cancelling preserves the historical record.
- [ ] **2.8 Expand destinations deliberately.** Add supported provider families one at a time using the capability matrix and an adapter acceptance checklist. Offer per-destination variants and results; partial failure in a batch must be visible. Implement manual/assisted routes where agreed instead of claiming unverified automation.
- [ ] **2.9 Implement the approved Group executor.** Apply the Stage 1 decision for create/share and Page/Profile eligibility. Restrict assigned work and browser/session access, record the exact approved content/action, preserve pending external approval, and surface uncertain results for verification. Handle cancellation and recovery with the same history semantics.

## Publication state and evidence

Use `scheduled`, `submitting`, `submitted_unverified`, `pending_approval`, `published_confirmed`, `rejected`, `failed`, and `cancelled`. Draft/content lifecycle and internal approval are separate records. A transport timeout is not proof of rejection, a notification failure is not permission to republish, and a provider post ID alone needs provider-specific interpretation.

Outbox dispatch records start intent in the same PostgreSQL transaction as the publication. Temporal history records orchestration; PostgreSQL contains the status/history used by the product. Persist reconciliation progress and safe operation keys so restart/replay does not repeat accepted external effects.

## File destinations

| Concern                                             | Location                                                                                |
| --------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Publication rules, operations, ports, adapters      | `packages/backend/src/modules/publishing/{domain,application,infrastructure}/`.         |
| Connection/grant/identity adapters                  | `packages/backend/src/modules/connections/`.                                            |
| Content versions/library and media storage          | `packages/backend/src/modules/content/`, `modules/media/`.                              |
| Schema, constraints, migrations, safe seeds         | `packages/backend/database/`.                                                           |
| HTTP/MCP/webhook boundaries                         | `apps/api/src/presentation/{http,mcp,webhooks}/`, grouped by feature/provider.          |
| Outbox host, publishing workflow, activity handlers | `apps/worker/src/{dispatchers,workflows/publishing,activities/publishing}/`.            |
| Public schemas                                      | `packages/contracts/src/{publishing,connections,content,media}/`.                       |
| Composer/library/connections/history UI             | `apps/web/src/features/{publishing,content,connections}/` with routes under `src/app/`. |
| MinIO configuration                                 | `infra/services/minio/`, `infra/local/`.                                                |
| Group decision and live evidence                    | `docs/decisions/`, `docs/references/facebook-groups-poc.md`.                            |

Use the existing [Postiz deep dive](../references/postiz/deep-dive.md) to follow composer → controller → service → repository → workflow → activity → provider. Adapt pending/status/finalize and shared-service patterns. Preserve our stronger dispatch and publication-state model.

## Focused verification

Test application rules and scoped access in their owning layer; PostgreSQL transaction/claim/concurrency behavior with disposable databases; workflow timers/replay and fake-provider recovery; and public HTTP/MCP contract parity. Check media access boundaries and token/log redaction. Live tests require configured authorized test destinations and explicit permission for external publication.

## Exit conditions

- [ ] Checkpoint A: one text-only local scheduled post runs through API, PostgreSQL/outbox, Temporal, provider fake, and UI history.
- [ ] Checkpoint B: duplicate delivery, restart, cancellation/reschedule, and unknown-result scenarios preserve correct state without blind repeats.
- [ ] Checkpoint C: one authorized real account completes immediate and scheduled image/caption publication with confirmation evidence or honest uncertainty.
- [ ] Content can be reused and customized per eligible destination; saved publications retain exact content versions.
- [ ] HTTP and MCP apply the same permissions, validation, and idempotency behavior.
- [ ] Multi-destination history preserves independent outcomes, including partial success.
- [ ] T10 workflow control and T11 Group outcome checks pass for the approved execution approach, or a concrete feasibility/scope decision remains visibly unresolved.
- [ ] Every claimed live connector has operation-specific evidence; release scope does not silently include unverified platforms.

Stage 3/4 may start once their identity, publication, and capability prerequisites are met. Release acceptance still requires every promised Stage 2 capability or an explicit scope decision.
