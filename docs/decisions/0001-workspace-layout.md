# 0001: Application and package boundaries

Status: accepted for workspace preparation on 13 November 2026.

The project needs separate web, API, and worker entry points, shared application operations for HTTP/MCP/workers, and a clear boundary around third-party source references.

Use `apps/web`, `apps/api`, and `apps/worker` for process entry points. Use `packages/backend` for feature-owned domain, application, and infrastructure code, and `packages/contracts` for public transport schemas. Put Compose and service configuration under `infra`. Keep the established npm root tooling and one root lockfile; register npm workspaces when actual package manifests are scaffolded.

This allows API and worker processes to share business behavior while scaling independently. It also prevents frontend code from depending on server credentials or database models. Feature modules contain their own layers so changes can be followed within one business area.

Directory ownership is established now. Database client, sign-in provider, application dependency versions, production topology, and framework-specific package configuration are still open. Source remains to be scaffolded.

The complete placement map and examples are in [workspace-layout.md](../workspace-layout.md). Mandatory agent rules remain self-contained in the root AGENTS.md.
