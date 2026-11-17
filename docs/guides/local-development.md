# Local infrastructure — Part A

This part supplies PostgreSQL, self-hosted Temporal, its UI, and MinIO for local development. API/database integration, the database client, application migrations, caller identity, and the Temporal worker will be implemented in the following parts.

## Start and stop

Start Docker Desktop using Linux containers. Run the following commands from the repository root with Node.js 24.14.0 and npm 11.21.1.

```powershell
if (-not (Test-Path infra/local/.env)) {
  Copy-Item infra/local/.env.example infra/local/.env
}

npm.cmd run infra:config
npm.cmd run infra:up
npm.cmd run infra:ps
```

The example values are public local-development credentials. Private overrides belong in ignored `infra/local/.env`. Keep an existing environment file when repeating setup. The Compose CLI loads that file explicitly through `--env-file`; application `.env` files are separate.

The first startup downloads the pinned images and builds MinIO from its pinned upstream source. Go runs inside the Docker build stage. Subsequent starts reuse the build cache. `infra:up` returns after health/dependency conditions pass, or fails with a nonzero exit status. Schema and namespace initialization containers are expected to show `Exited (0)` after successful setup.

To stop the stack while retaining data:

```powershell
npm.cmd run infra:down
```

Running `infra:up` again recreates the containers with the existing named volumes. Changing PostgreSQL passwords in `.env` does not change passwords already stored in an initialized database. Keep the existing credentials when reusing those volumes.

## Connections

All published ports bind to `127.0.0.1`. The defaults are separate from the inspected Postiz/Celesnity service ports. Override the corresponding port in `infra/local/.env` if needed.

| Service                | Host connection                                                     | Setting                                                        |
| ---------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------- |
| Application PostgreSQL | `127.0.0.1:25432`, database `social_media`, user `social_media_app` | `APP_POSTGRES_PORT`, `APP_POSTGRES_PASSWORD`                   |
| Temporal gRPC          | `127.0.0.1:27233`, namespace `social-media`                         | `TEMPORAL_PORT`, `TEMPORAL_NAMESPACE`                          |
| Temporal UI            | `http://127.0.0.1:28080`                                            | `TEMPORAL_UI_PORT`                                             |
| MinIO S3 API           | `http://127.0.0.1:29000`                                            | `MINIO_API_PORT`                                               |
| MinIO console          | `http://127.0.0.1:29001`                                            | `MINIO_CONSOLE_PORT`, `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD` |

Temporal PostgreSQL is internal to the Compose network. Its two databases are `temporal` and `temporal_visibility`, stored in a dedicated PostgreSQL container and volume. Application PostgreSQL uses a separate container, credentials, and volume.

MinIO starts with empty storage. Application buckets and media authorization will be defined with the media feature.

## What starts in what order

```text
app-postgres → accepts application database connections

temporal-postgres
  → creates temporal and temporal_visibility on its empty volume
  → temporal-schema initializes or updates the pinned vendor schemas
  → temporal opens its server port
  → temporal-namespace checks the cluster API and creates/recognizes the namespace
  → temporal-ui starts

minio → opens S3 and console endpoints
```

PostgreSQL health checks wait for TCP connections. The Temporal container has a TCP liveness check, followed by a bounded cluster-health and namespace check in the initializer. The UI has an HTTP check. MinIO uses `/minio/health/ready`.

`DB=postgres12` is the Temporal SQL plugin name. Both PostgreSQL containers run the pinned PostgreSQL 17.12 image. Temporal owns its schema lifecycle; the application database remains empty until application persistence is implemented.

The schema job preserves existing schema versions and applies pending vendor updates without an overwrite flag. The visibility database creation SQL runs only on an empty Temporal PostgreSQL volume. The namespace job accepts an existing namespace and bounds startup retries. Repeating `infra:up` retains data.

## Files to read

| Responsibility                                                       | File                                                                                             |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Services, images, dependency ordering, ports, health checks, volumes | [`compose.yaml`](../../infra/local/compose.yaml)                                                 |
| Public settings template                                             | [`.env.example`](../../infra/local/.env.example)                                                 |
| Second Temporal database creation                                    | [`create-visibility-database.sql`](../../infra/services/temporal/create-visibility-database.sql) |
| Temporal schema setup                                                | [`setup-schema.sh`](../../infra/services/temporal/setup-schema.sh)                               |
| Cluster and namespace setup                                          | [`setup-namespace.sh`](../../infra/services/temporal/setup-namespace.sh)                         |
| Dynamic-config file required by the server                           | [`dynamic-config.yaml`](../../infra/services/temporal/dynamic-config.yaml)                       |
| Build MinIO from official source                                     | [`Dockerfile`](../../infra/services/minio/Dockerfile)                                            |
| Isolated service and persistence test                                | [`local-services.test.mjs`](../../tests/infrastructure/local-services.test.mjs)                  |
| Image/source selection and evidence                                  | [Decision 0002](../decisions/0002-local-service-versions.md)                                     |

Named volumes are scoped by the Compose project. The root commands explicitly select `social-media-local`. The application PostgreSQL data, Temporal PostgreSQL data, and MinIO data each have their own volume. The service scripts use LF line endings and are mounted read-only.

## Application processes

Start the existing application processes in separate terminals:

```powershell
npm.cmd run start:api
```

```powershell
npm.cmd run dev:web
```

The API health endpoint still reports HTTP liveness. Its current behavior does not probe these new dependencies. The next part will select database tooling and connect the API through backend ports/adapters.

## Focused verification

```powershell
npm.cmd run test:infra
```

This test creates a fresh `social-media-infra-check-<random>` project with generated credentials and dynamically assigned loopback ports. It checks service APIs, database separation, S3 writes, a pending Temporal workflow, and preservation after `down`/`up`. It also repeats schema and namespace initialization. The pending workflow is a persistence fixture; the application worker is still pending implementation.

The test removes only its own containers, network, and volumes. Diagnostic files remain under ignored `.task-checks/local-infra-*`, with generated passwords redacted from logs. It does not connect to developer or shared databases. The infrastructure test is an explicit local command and is not added to the existing cross-platform CI gate.

Verified on 17 November 2026: the focused infrastructure test passed, including all service startup checks, database separation, S3 writes, Temporal namespace/workflow persistence, container recreation with retained volumes, and repeated schema/namespace initialization. The test cleaned up its own containers and volumes. Application database integration, a running application worker, live platform publishing, and production recovery are not verified by this test.

Production hosting, availability, backup/restore operations, and the maintenance plan for upstream services remain pending production work.
