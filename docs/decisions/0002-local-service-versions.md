# 0002 — Local service versions and isolation

Date: 17 November 2026.

## Scope

Select concrete versions and initialization for the authorized local infrastructure part. Database access libraries, application migration tooling, production hosting, and sign-in remain open decisions.

## Selection

| Component                   | Pin                                                   |
| --------------------------- | ----------------------------------------------------- |
| Application PostgreSQL      | `postgres:17.12-alpine`                               |
| Temporal PostgreSQL         | `postgres:17.12-alpine`                               |
| Temporal Server             | `temporalio/server:1.32.2`                            |
| Temporal admin/schema tools | `temporalio/admin-tools:1.32.2`                       |
| Temporal UI                 | `temporalio/ui:2.56.1`                                |
| MinIO source                | `github.com/minio/minio@RELEASE.2025-10-15T17-29-55Z` |
| MinIO build toolchain       | `golang:1.26.11-alpine`                               |
| MinIO runtime base          | `alpine:3.24.2`                                       |

Registry manifest checks confirmed these image tags were available. The MinIO source build completed with the selected Go toolchain. Direct tags are explicit; registry tags and OS package repositories can still change, so these settings do not imply bit-for-bit reproducible artifacts.

PostgreSQL 17.12 is the current patch release in the selected major line. Temporal's PostgreSQL Compose example uses the server and admin-tools images with separate schema setup and namespace creation. The upstream example currently pins Server/admin-tools 1.32.2 and UI 2.56.1. This project uses the PostgreSQL visibility store. [PostgreSQL release](https://www.postgresql.org/about/news/postgresql-187-1712-1616-1520-1425-and-19-rc-2-released-3442/), [Temporal example versions](https://github.com/temporalio/temporal-server-operations/blob/main/compose/.env), [Temporal PostgreSQL example](https://github.com/temporalio/temporal-server-operations/blob/main/compose/docker-compose-postgres.yml).

The MinIO security release instructs container users to build from source. Its public community repository is archived. The local image is built from that official release through Go's module tooling, and its binary release metadata is set to the same tag. Upstream dependencies remain inside the Docker build. The production maintenance decision for this archived upstream remains pending. [MinIO release](https://github.com/minio/minio/releases/tag/RELEASE.2025-10-15T17-29-55Z), [upstream Go requirements](https://github.com/minio/minio/blob/RELEASE.2025-10-15T17-29-55Z/go.mod), [Go releases](https://go.dev/dl/).

## Persistence and startup

Application and Temporal PostgreSQL use separate containers, credentials, and named volumes. Temporal persistence and Visibility occupy separate databases on the Temporal PostgreSQL instance. MinIO uses its own named volume. Root commands select a fixed Compose project and publish loopback-only ports chosen apart from the existing reference stacks.

An empty Temporal PostgreSQL volume creates the two databases. One-shot jobs initialize the pinned schemas and create or recognize the namespace. The server receives a mounted dynamic-config file, required by its startup validation. Existing schema versions are preserved on repeated setup, and errors fail startup. No application tables are introduced in this part.

The focused infrastructure test creates its own project, credentials, ports, and volumes. Runtime readiness and restart/persistence evidence belong in the [local development guide](../guides/local-development.md).
