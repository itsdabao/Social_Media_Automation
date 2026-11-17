# Backend package

The npm workspace is registered as `@social-media/backend`. Business modules, infrastructure adapters, and the database client selection are pending. Public exports will be added with actual source and callers. See the [foundation guide](../../docs/guides/workspace-foundation.md).

Use `src/modules/<feature>/domain/`, `application/`, and `infrastructure/`. Application operations use narrow interfaces under `application/ports/`; internal operation contracts belong under `application/contracts/`. Infrastructure implements those ports. API and worker composition wires the concrete implementations.

Domain and application code are framework-free. Nest controllers and Temporal activity handlers belong in their app entry points. The API and worker share this package without importing each other's source.

Application schema, migrations, and local/test seeds belong in `database/` once persistence tooling is selected. Unit tests live beside source; adapter/database integration tests belong in `tests/integration/`.
