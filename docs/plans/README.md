# Five-stage delivery roadmap

Prepared on 13 November 2026 from the supplied task tracker exports and the current workspace design. These are implementation plans; creating them does not complete the source tasks. Owners, dates, and effort estimates are unassigned.

## Execution order

| Stage | Plan                                                       | Demonstrable outcome                                                                                                   | Dependency                                                                            |
| ----- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 1     | [Discovery and foundation](01-discovery-and-foundation.md) | Runnable local web/API/worker, isolated services, recorded stack decisions, and an evidence-based capability backlog.  | Existing workspace and tooling.                                                       |
| 2     | [Content and publishing](02-content-and-publishing.md)     | Create, schedule, submit, and inspect a publication; first with a provider fake, then one authorized real destination. | Stage 1 foundation; external capabilities gate only the corresponding real connector. |
| 3     | [Engagement and AI](03-engagement-and-ai.md)               | Supported comments appear in one inbox, with controlled manual and AI replies.                                         | Stage 2 identity, authorization, publishing reliability, and relevant comment access. |
| 4     | [Analytics and growth](04-analytics-and-growth.md)         | Explainable post/account metrics and comparisons with visible availability and freshness.                              | Stage 2 stable identities/publication IDs and verified metrics access.                |
| 5     | [QA and internal rollout](05-qa-and-internal-rollout.md)   | An agreed release passes workflow/recovery checks and has self-hosted operating procedures.                            | Stage 2 plus every Stage 3/4 feature included in the release.                         |

The stage numbers normalize the five parent groups. Original tracker labels such as `0–2 — Discovery`, `3 — Core MVP`, and the two different `5` labels are preserved in each plan as source metadata, not interpreted as dates or durations.

Begin with Stage 1's version/database decisions and runnable foundation. Stage 2's first checkpoint is one text-only scheduled post against a local provider fake, with persisted history. The first real connector checkpoint adds an authorized test account, image/caption, immediate/scheduled execution, and confirmation or visible uncertainty.

The [platform capability baseline](../references/platform-capabilities.md) already covers all ten requested families: Postiz has registered publishing adapters for nine, with Substack unresolved. Proceed with the runnable foundation and a first local publishing slice. Verify current requirements and our account access for each connector as it enters implementation; Facebook Page is the proposed first real destination. Group support requires its own feasibility decision. If a capability is unavailable, record the result and seek a scope decision before omitting a required workflow. Stage 4 can proceed after Stage 2 independently of AI. An initial publishing-only rollout can use Stage 5 after an explicit release-scope decision.

Security, scoped access, redaction, useful logs, and focused tests start with the first feature. Stage 5 verifies and operationalizes them.

## How to execute a plan

Each plan contains ordered work packages, target locations, focused verification, dependencies, a demonstrable checkpoint, and exit conditions. Checkboxes start open unless completed implementation evidence is recorded. Record concrete checks and remaining limitations in the plan as work proceeds. A provider fake proves application behavior; real account verification is separate.

Follow root AGENTS.md for project rules. Plans describe delivery work and reference the agreed [workspace layout](../workspace-layout.md) and [architecture](../architecture/architecture-design.md). External actions retain the authorization requirements already stated in AGENTS.md.

## Source provenance

Both CSVs were read without modification from `C:\Users\Admin\Downloads\Media_Automation_task\`:

| Export                                                   | SHA-256                                                            |
| -------------------------------------------------------- | ------------------------------------------------------------------ |
| `Tasks Tracker 415e88c85a268073a4aae45c8f56181f.csv`     | `BD6226C4C002EA710078BBF2C42034E24A8429EF23266ADAEF748D18214642F0` |
| `Tasks Tracker 415e88c85a268073a4aae45c8f56181f_all.csv` | `8D6DBF108CF12AC7320F693713415CD1C10748CE1ADF8E95D41630AAE93C3361` |

Each has 26 records: five parents, 18 explicitly labeled subtasks, and three records without a task-level label. Task name, description, and status match between exports. The `_all.csv` supplies parent relations, priorities, and stage labels. Its parent relations place the three unlabeled rows under Stages 2 and 5.

The exports have no populated due dates, owners, or definitions of done. Completion criteria below are proposed implementation criteria. Descriptions are requirement input, not instructions to execute external actions. Links in the export were not opened, and no Notion tasks were changed.

## Task coverage

The T identifiers below are local traceability labels, not Notion task IDs. Record numbers count data records in `_all.csv`, excluding its header.

| Local ID | Source record | Original task                                                                          | Source priority | Plan                         |
| -------- | ------------- | -------------------------------------------------------------------------------------- | --------------- | ---------------------------- |
| T01      | 2             | Confirm requirements & MVP scope                                                       | P0              | 1                            |
| T02      | 3             | Research platform APIs                                                                 | P0              | 1                            |
| T03      | 4             | Validate Facebook Groups posting — description covers Page and LinkedIn API validation | P0              | 1                            |
| T04      | 23            | Validate Facebook Groups posting — description covers external Groups                  | Unspecified     | 1                            |
| T05      | 6             | Connect social accounts                                                                | P0              | 2                            |
| T06      | 7             | Build content library                                                                  | P0              | 2                            |
| T07      | 8             | Build post composer                                                                    | P0              | 2                            |
| T08      | 24            | Manage publishing destinations                                                         | Unspecified     | 2                            |
| T09      | 9             | Implement publishing & scheduling                                                      | P0              | 2                            |
| T10      | 10            | Add Facebook Groups publishing flow                                                    | P0              | 2                            |
| T11      | 25            | Implement Facebook Groups distribution                                                 | Unspecified     | 2                            |
| T12      | 11            | Track publishing history                                                               | P0              | 2                            |
| T13      | 13            | Sync comments & engagement                                                             | P1              | 3                            |
| T14      | 14            | Build unified comment inbox                                                            | P1              | 3                            |
| T15      | 15            | Add AI auto-reply & approval                                                           | P1              | 3                            |
| T16      | 17            | Build content chatbot                                                                  | P2              | 3                            |
| T17      | 18            | Track platform metrics                                                                 | P1              | 4                            |
| T18      | 19            | Build growth dashboard                                                                 | P2              | 4                            |
| T19      | 21            | Test end-to-end workflows                                                              | P1              | 5                            |
| T20      | 26            | Add security & monitoring                                                              | Unspecified     | 5, with baseline work in 1–4 |
| T21      | 22            | Prepare internal rollout                                                               | P1              | 5                            |

T03 and T04 retain their shared source title but are planned as separate investigations based on their descriptions. T10 and T11 share one implementation work package with separate acceptance checks for workflow control and external destination outcomes. Missing child priorities are not inferred from parent priorities.

## Current baseline

Workspace directories, self-contained project rules, source research, and local hook/CI definitions exist. Application packages, app checks, migrations, own Compose services, and production deployment are not implemented. GitHub CI has not been verified remotely. The separate Postiz demo is reference software and does not establish our application readiness.
