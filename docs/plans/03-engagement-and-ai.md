# Stage 3: Engagement and AI

Delivery status: not started.
Source parent: `03 — Engagement & AI`. Source stage: `4 — Engagement`. Parent priority: P1.
Dependencies: [Stage 2](02-content-and-publishing.md) scoped identities, delivery reliability, and verified comment/reply capabilities.

## Outcome

A user can inspect supported conversations, send a manual reply, review an AI-generated draft, and optionally enable an explicitly configured automatic-reply policy. The content assistant helps prepare content using the same application boundaries.

## Scope and task traceability

| Task                               | Source priority | Planned result                                                                                         |
| ---------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------ |
| T13 — Sync comments & engagement   | P1              | Verified webhook/poll ingestion with durable progress and deduplication.                               |
| T14 — Build unified comment inbox  | P1              | Scoped threads, filtering, readable context, and manual replies where permitted.                       |
| T15 — Add AI auto-reply & approval | P1              | Brand/prompt policies, draft generation, approvals, opt-in automatic mode, and safe outbound delivery. |
| T16 — Build content chatbot        | P2              | Caption drafting/rewriting, brainstorming, and platform variants; image generation remains optional.   |

## Ordered work packages

- [ ] **3.1 Establish conversation contracts.** Define external thread/comment IDs scoped by provider and connection, parent relationships, edits/deletions, fetch cursor, freshness, reply draft/attempt, and source provenance. Describe unavailable access without presenting an empty inbox as proof of no comments.
- [ ] **3.2 Implement one real ingestion path.** Verify webhook authenticity, persist/deduplicate ingress, and process it asynchronously; use polling when supported instead. Commit fetched records and cursor progress consistently. Support duplicate/out-of-order events, pagination interruption, rate limits, connection revocation, and provider retention limits.
- [ ] **3.3 Deliver the manual inbox slice.** Filter by platform/account/post and load thread context with access checks and pagination. A manual reply uses the selected identity and the shared reliable outbound path, with exact text, operation key, attempts, and confirmation/uncertainty visible.
- [ ] **3.4 Add AI draft generation.** Select a model/vendor and record prompt/policy versions, brand rules, source thread context, and generation provenance. Treat all retrieved content as untrusted data. Keep tool permissions and allowed identities under server control. Handle provider timeout, rate/cost budget, and unavailable generation with an explicit recoverable result.
- [ ] **3.5 Implement approval and automatic mode.** Approval binds exact reply content/version, identity, and destination. Edits invalidate approval. Add an authorized opt-in auto policy with allowed accounts/topics, rate limits, escalation cases, and self/bot loop prevention. Recheck policy and authorization at send time. Persist why a reply was drafted, approved, sent, blocked, or deferred.
- [ ] **3.6 Build the content assistant.** Support draft captions, rewrites, ideas, and destination variants that respect known platform settings. Save accepted output as a content version. Assistant mutations use authenticated application services/MCP tools, exact previews, and the same approval/idempotency controls as the dashboard. Publishing remains an explicit authorized action.
- [ ] **3.7 Expand verified inbox capabilities.** Add each platform only for tested read/reply operations. Present incomplete synchronization, revoked scopes, unsupported replies, and stale data in the UI. Reactions and engagement fields remain provider-defined.

## File destinations

| Concern                                                     | Location                                                                                                       |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Threads, synchronization, manual-reply operations and ports | `packages/backend/src/modules/engagement/`.                                                                    |
| AI generation, prompts/policies, vendor adapters            | `packages/backend/src/modules/assistant/`.                                                                     |
| Reused publication/reply delivery primitives                | Owning operations in `packages/backend/src/modules/publishing/`; extract shared behavior only where justified. |
| Schema/migrations                                           | `packages/backend/database/`.                                                                                  |
| Inbox/assistant HTTP and MCP handlers                       | `apps/api/src/presentation/{http,mcp}/{engagement,assistant}/`.                                                |
| Provider ingress                                            | `apps/api/src/presentation/webhooks/<provider>/`.                                                              |
| Synchronization and reply orchestration                     | `apps/worker/src/{workflows,activities}/engagement/`.                                                          |
| Shared public contracts                                     | `packages/contracts/src/{engagement,assistant}/`.                                                              |
| Inbox/assistant UI                                          | `apps/web/src/features/{engagement,assistant}/`.                                                               |
| Policy decision and capability evidence                     | `docs/decisions/`, `docs/references/platform-capabilities.md`.                                                 |

Postiz's provider `comment()` methods are outbound operations; they do not establish incoming inbox coverage. Its chat tools illustrate calling shared application services. Verify actual read/reply access separately.

## Focused verification

Exercise duplicate/reordered ingress, interrupted pagination, cross-account access denial, revoked connection handling, uncertain reply outcomes, and repeated send requests. Test approval invalidation, opt-in auto limits, self-reply loop prevention, and malicious instructions embedded in a comment. Check that AI output cannot choose unauthorized identities, bypass approval, or leak secrets. Use synthetic threads and provider/model fakes for automated tests; record authorized live checks separately.

## Exit conditions

- [ ] One verified provider thread arrives through webhook or polling with observable cursor/freshness state.
- [ ] A user can read the correct scoped context and send an authorized manual reply with outcome history.
- [ ] An AI draft records provenance and requires the configured approval policy before sending.
- [ ] Editing, revocation, duplicate events, and retries cannot bypass permission/approval or silently repeat a reply.
- [ ] Explicitly enabled automatic mode has enforceable limits, escalation, loop prevention, and a working disable control.
- [ ] The content assistant creates useful drafts/variants through shared services; optional image generation is separately scoped.
- [ ] Unsupported and unverified inbox capabilities remain visible in the release capability record.

Demonstration: ingest a synthetic thread, draft an AI reply, edit it, show that old approval is invalid, approve the new version, and follow its send attempt and outcome. Use a separately authorized real thread for live evidence.
