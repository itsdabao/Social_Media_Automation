# Infrastructure

Local infrastructure is implemented in `local/compose.yaml`, with service settings under `services/`. See the [local development guide](../docs/guides/local-development.md) for startup, credentials, ports, and focused verification.

- `local/`: PostgreSQL/Temporal/MinIO topology, health checks, named volumes, and a public environment template.
- `services/temporal/`: Temporal database/schema/namespace initialization and dynamic configuration.
- `services/minio/`: build the pinned upstream MinIO release.

Use separate application and Temporal databases; Temporal owns its own schema lifecycle. Application migrations belong in `packages/backend/database/`.

Use Compose named volumes for service persistence. Store local exports/logs under ignored root `.local/` and credentials in ignored environment files or `.secrets/`. Reference Postiz services remain under its own ignored checkout.

Production-specific infrastructure gets a named directory after the hosting decision. Local Compose does not establish production availability or a recovery plan.
