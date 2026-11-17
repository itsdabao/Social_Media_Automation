# Platform capability baseline

Updated on 13 November 2026 from the local Postiz checkout at commit `4823080b413b9d3dc625d466939eb43b9657c66c`.

## What is established

API-based publishing is an implemented reference pattern. Postiz registers publishing adapters for nine of the ten platform families requested in our tracker, with concrete authentication, submission, and result-handling code. We can use these implementations to design our provider ports and adapter flows and proceed with application development.

This inventory records source evidence. Live operation under our developer apps, grants, identities, and destinations remains a separate access check. Current official endpoint compatibility, pricing, review requirements, and exact format limits must be checked for each connector when it is implemented.

## Reference publishing coverage

Adapter paths below are relative to `reference/postiz-app/libraries/nestjs-libraries/src/integrations/social/`. Registration is in `integrations/integration.manager.ts` under the same shared library's `src/` directory.

| Platform family | Publishing source                                           | Reference status                             | Our account verification                                 |
| --------------- | ----------------------------------------------------------- | -------------------------------------------- | -------------------------------------------------------- |
| Facebook        | `facebook.provider.ts`                                      | Page discovery and publishing paths present. | Pending.                                                 |
| LinkedIn        | `linkedin.provider.ts`, `linkedin.page.provider.ts`         | Member and Page adapter variants present.    | Pending per identity type.                               |
| Instagram       | `instagram.provider.ts`, `instagram.standalone.provider.ts` | Publishing adapter variants present.         | Pending per account/auth variant.                        |
| Threads         | `threads.provider.ts`                                       | Publishing adapter present.                  | Pending.                                                 |
| X               | `x.provider.ts`                                             | Publishing adapter present.                  | Pending.                                                 |
| TikTok          | `tiktok.provider.ts`, `tiktok.business.provider.ts`         | Publishing adapter variants present.         | Pending per account/auth variant.                        |
| Reddit          | `reddit.provider.ts`                                        | Publishing adapter present.                  | Pending per account/community.                           |
| Bluesky         | `bluesky.provider.ts`                                       | Publishing adapter present.                  | Pending.                                                 |
| Medium          | `medium.provider.ts`                                        | Publishing adapter present.                  | Pending; verify access availability for our integration. |
| Substack        | No registered adapter found.                                | Unresolved reference gap.                    | Pending feasibility/access research.                     |

Facebook Profile publishing and external Facebook Group create/share support are separate capability questions. The inspected Facebook Page path does not establish them. Incoming comments, outbound replies, and metrics also require their own operation-level evidence.

## Delivery consequences

- The baseline adapter inventory is complete. Do not repeat a broad investigation of whether social publishing integrations can be built before starting the foundation.
- Use Facebook Page as the proposed first real connector, subject to an authorized test Page and developer-app access. If another supported destination already has usable access, record the substitution and its acceptance conditions.
- Build the local scheduled-publication checkpoint while developer-app/account prerequisites are prepared. A provider fake exercises scheduling and recovery through the same application port the real adapter will implement.
- For each selected connector, inspect its Postiz flow, check current official requirements, implement our adapter, then record authorized connection, image/caption submission, scheduled execution, read-back, and failure/reconnect evidence.
- Keep Substack and external Groups as explicit research items. They do not block unrelated application scaffolding or verified Page publishing work.

## Evidence to add with each connector

Record operation, account type, identity/destination, official source URL and check date, scopes/review requirements, cost/rate limits, media restrictions, configured access prerequisites, and sanitized observed results. Track connection, publishing, read-back, comments, replies, and metrics independently. Store credentials outside this document.

For the inspected workflow and recovery design, see the [Postiz deep dive](postiz/deep-dive.md) and [reference review](postiz/reference-review.md). This baseline does not mark our application connectors or tracker research task fully delivered.
