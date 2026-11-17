# Worker application

The npm workspace is registered as `@social-media/worker` with a pinned Temporal worker SDK. The worker entry point and outbox dispatcher will be added with their owning increments. See the [foundation guide](../../docs/guides/workspace-foundation.md).

Use `src/main.ts` for startup, `src/composition/` for concrete dependency wiring, `src/workflows/<feature>/` for deterministic Temporal coordination, `src/activities/<feature>/` for thin application-operation handlers, and `src/dispatchers/` for background dispatcher hosts.

Business operations and adapter implementations belong to `packages/backend`. Workflow code imports only replay-safe code and contracts; it does not import activity implementations or their dependency graph. Credentials and large media stay out of workflow payloads.

Workflow/replay tests belong in `tests/workflows/`. App environment templates belong here when their variables are known.
