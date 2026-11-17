# Stage 4: Analytics and growth

Delivery status: not started.
Source parent: `04 — Analytics & Growth`. Source stage: `5 — Analytics`. Parent priority: P1.
Dependencies: [Stage 2](02-content-and-publishing.md) stable identity/destination/publication IDs and verified metrics access. Stage 3 is required only for metrics explicitly derived from its synchronized engagement data.

## Outcome

The team can inspect supported post/account performance, understand when it was measured, and compare equivalent periods without confusing unavailable data with zero.

## Scope and task traceability

| Task                         | Source priority | Planned result                                                                                                       |
| ---------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------- |
| T17 — Track platform metrics | P1              | Provider-defined likes, comments, shares, views, impressions, reach, and follower measurements where access permits. |
| T18 — Build growth dashboard | P2              | Platform/account/post filters, comparable periods, and an optional seven-day report.                                 |

## Ordered work packages

- [ ] **4.1 Define metric meaning before storage.** For each provider/metric record its unit, entity, source definition, time window, whether it is a cumulative snapshot or interval count, supported breakdowns, and availability rules. Define display timezone and comparison periods. Do not add incompatible definitions or mix follower totals with follower changes.
- [ ] **4.2 Implement one collector.** Resolve scoped accounts/publication IDs, retrieve metrics through a provider adapter in Temporal activities, normalize supported fields, and persist observation time, measured period, provider identity, provenance, and access/freshness status. Add unique observation keys and resumable pagination/checkpoints. Avoid media or large provider payloads in workflow history.
- [ ] **4.3 Handle corrections and gaps.** Define how cumulative snapshots, late provider corrections, deleted posts, revoked grants, rate limits, and missing intervals are represented. A real zero remains numeric zero; permission denied, unavailable, delayed, and unknown remain distinct. Backfill and periodic collection must not duplicate observations.
- [ ] **4.4 Build query and comparison services.** Authorize aggregate queries by account/destination; retain metric definitions through aggregation. Compare equivalent windows and coverage. Missing baseline or zero denominator cannot become a fabricated growth percentage. Label partial coverage and current-period incompleteness.
- [ ] **4.5 Build the dashboard.** Filter by platform/account/post, show freshness and availability alongside values, and link post metrics to publication history. Display only justified cross-platform totals. Provide accessible empty/error/loading states and date-range handling.
- [ ] **4.6 Add the optional seven-day report.** Agree whether it means the last seven complete days and the immediately preceding seven, or another business window. Record timezone, included entities, comparison basis, and missing coverage. Scheduled report generation uses durable orchestration; report delivery is a separately authorized external action.

## File destinations

| Concern                                                         | Location                                                 |
| --------------------------------------------------------------- | -------------------------------------------------------- |
| Metric definitions, collection/query operations, ports/adapters | `packages/backend/src/modules/analytics/`.               |
| Observations and migration/index definitions                    | `packages/backend/database/`.                            |
| Metrics collection workflows/activities                         | `apps/worker/src/{workflows,activities}/analytics/`.     |
| HTTP/MCP metric queries                                         | `apps/api/src/presentation/{http,mcp}/analytics/`.       |
| Public schemas                                                  | `packages/contracts/src/analytics/`.                     |
| Dashboard/report UI                                             | `apps/web/src/features/analytics/`.                      |
| Metric catalog and availability evidence                        | `docs/references/platform-metrics.md`.                   |
| Comparison/report definitions                                   | `docs/decisions/` and the owning analytics domain types. |

## Focused verification

Use fixture datasets with known totals, duplicate observations, corrected cumulative values, missing intervals, real zero, absent/zero baselines, and timezone/day-boundary cases. Test cross-scope query denial, interrupted collection, backfill idempotency, and contract/display handling of partial coverage. Verify aggregation independently against the selected fixture controls. A provider fake is not evidence of live metric permission.

## Exit conditions

- [ ] At least one authorized provider supplies observations that can be traced to its definitions and measurement windows.
- [ ] Repeated/backfilled collection is safe and observable.
- [ ] Dashboard values distinguish zero, unavailable, stale, delayed, and permission-limited data.
- [ ] Comparisons preserve equivalent windows and disclose missing coverage.
- [ ] Account/post access is enforced before returning aggregates.
- [ ] The seven-day report is implemented and verified if included in release scope; otherwise its explicit optional status is retained.

Demonstration: inspect one post and account across two periods, remove a baseline measurement, and show that the dashboard explains the gap rather than reporting misleading growth.
