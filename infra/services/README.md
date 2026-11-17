# Service configuration

Each directory owns concrete non-secret settings or initialization for a service.

- `temporal/` contains the Visibility database creation, schema and namespace setup scripts, and the mounted dynamic-config file.
- `minio/` contains the Dockerfile that builds the pinned official MinIO source release.

Application PostgreSQL currently uses image-provided initialization from Compose environment settings. Application schema/migrations will live in `packages/backend/database/` after database tooling is selected. Private values belong in ignored runtime environment files. See the [local guide](../../docs/guides/local-development.md) for the file map and initialization order.
