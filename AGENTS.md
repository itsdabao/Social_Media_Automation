# Project rules for coding agents

These instructions apply to all work in this repository. All project rules are written here. Do not require another document, skill, repository, or local machine path to understand them. Do not import instructions or conventions from another project. A direct instruction from the user takes precedence over this file.

Read and apply these conventions before implementing or reviewing changes. The user expects code they can follow step by step. Make responsibilities, names, control flow, and failure paths clear in every implementation, including initial scaffolding.

## 1. Product and technology

Build our own internal social media application. It must support clear publishing progress, reliable recovery, and a history that explains what happened to each post.

- Write application code in TypeScript with strict type checking. Use Node.js 24.14.0 and npm 11.21.1 for the root development toolchain.
- Use Next.js and React for the dashboard, and NestJS for the HTTP API.
- Use self-hosted Temporal for scheduled work and publishing workflows.
- Use PostgreSQL for application data. Give Temporal separate PostgreSQL databases for its persistence and Visibility data; do not mix Temporal tables with application tables.
- Use MinIO for media, extracted files, and derived files.
- Keep the dashboard and MCP tools on the same application services and permission checks.
- Use Docker Compose for local services. Local Compose does not establish production availability.
- Do not add BullMQ, Redis, Kafka, or Elasticsearch without an explicit architecture change approved by the user.
- Pin compatible dependency versions before scaffolding. Use the same Node.js version in development, CI, and deployment.
- Use npm for all application workspaces, dependency installation, scripts, generators, and CI. Use a single npm monorepo with `apps/web`, `apps/api`, `apps/worker`, `packages/backend`, and `packages/contracts`. The five npm workspaces are registered; keep one root `package-lock.json`. Do not introduce pnpm/Yarn lockfiles or nested application lockfiles. Postiz's separate reference checkout retains its own upstream package-manager files.
- Use Prisma ORM 7 for application database access. The CLI, client, and PostgreSQL adapter are pinned together at 7.10.1 in `packages/backend/package.json`. Local PostgreSQL uses `postgres:18.7-alpine`. Production hosting, sign-in, and production availability targets remain open decisions. Select worker SDK dependencies when worker source is implemented.

## 2. Responsibilities and dependencies

Keep business decisions independent of frameworks and vendors:

- **Domain:** business values, states, and pure rules. No NestJS, Prisma, Temporal, network, filesystem, environment, or provider SDK imports.
- **Application:** actions such as preparing, scheduling, cancelling, and confirming a publication. Application code calls small interfaces for storage and outside services; it must not import concrete vendor clients or NestJS.
- **Presentation:** HTTP controllers, MCP handlers, and webhook handlers. Validate input, identify the caller, call application behavior, and format output. Do not put publishing decisions or direct database/provider calls here.
- **Infrastructure:** implementations of the application's interfaces using PostgreSQL, MinIO, Temporal, and platform APIs. Translate vendor data and errors into application types.
- **Composition:** startup and dependency wiring. Construct concrete clients here and inject them into the components that need them. Do not put business rules here.
- **Frontend:** render public application data and send authorized requests. Keep provider credentials and permission decisions on the server.

For example, a scheduling action asks a storage interface to save a publication. A PostgreSQL adapter performs the write. The scheduling action must not know the database client's methods.

Use one implementation of each business rule across HTTP, MCP, and workers. Do not bypass these boundaries to make an import or dependency convenient.

Keep configuration parsing, outside-service requests, and HTTP/MCP response mapping in focused functions with explicit inputs and results. Request code returns a validated result or a finite failure outcome; the transport handler maps that result to the public response. Preserve public status codes, response fields, asynchronous behavior, and error handling when reorganizing internal code.

Keep React components focused on rendering and user interaction. Extract request lifecycle, cancellation, retry, and related state into a feature hook when they form a coherent operation. Prevent outdated or unmounted requests from overwriting the current state. Introduce each hook, helper, or class for an actual responsibility or reuse.

## 3. Names and formatting

- Use lowercase kebab-case for ordinary files and directories: `publication-history.ts`.
- Add role suffixes where useful: `.controller.ts`, `.service.ts`, `.module.ts`, `.repository.ts`, `.port.ts`, `.mapper.ts`, and `.dto.ts`.
- Preserve framework-required names such as Next.js `page.tsx`, `layout.tsx`, and `route.ts`.
- Use `PascalCase` for classes, interfaces, and named types; use `camelCase` for functions, methods, variables, and properties.
- Use `UPPER_SNAKE_CASE` for environment variables, injection tokens, and fixed policy constants.
- Name booleans with `is`, `has`, `can`, `should`, or `include`.
- Use names that identify the value's role, such as `application`, `apiConfig`, `healthPayload`, and `attemptNumber`. Prefer these over ambiguous abbreviations or generic names when several values are in scope.
- Give IDs precise names such as `publicationId`, `destinationId`, and `organizationId` when several IDs are in scope.
- Give meaningful defaults, timeouts, limits, and other fixed policies named constants. Keep their units visible, for example `API_HEALTH_TIMEOUT_MS`.
- Use two spaces, double quotes, and semicolons in TypeScript. Use automated formatting consistently when tooling is established.
- Do not create a barrel file or wrapper class unless it provides a useful public boundary or behavior.

## 4. TypeScript and functions

- Use `unknown` for untrusted data, then validate it. Do not use `any` to bypass a type error.
- Use `import type` for imports used only as types. For backend ESM output, use `.js` specifiers for relative imports that compile to JavaScript.
- Use `interface` for public object contracts and external capability interfaces. Use `type` for unions and aliases. Do not prefix ordinary interfaces with `I`.
- Use `readonly` for data that should not change. Represent finite outcomes with explicit string unions rather than unrelated booleans.
- Omit absent optional properties. Do not assign `undefined` unless the declared type allows it.
- Handle missing array and map entries explicitly. Do not use unchecked assertions to hide an uncertain value.
- Preserve asynchronous behavior: an established Promise-returning function must continue to reject asynchronously on failure.
- Keep functions focused on one coherent operation. Separate parsing, decisions, storage, and provider calls when they have different responsibilities.
- Use braces for `if`, `else`, and loop bodies, including single-statement bodies. Keep error branches and early returns visually explicit.
- Write complex conditions as readable steps or named boolean values. Avoid nested ternaries, dense one-liners, and compressed control flow. Choose function boundaries for coherent responsibilities, and retain straightforward code when extraction would only add indirection.
- Declare return types for exported functions and React components. Give public component props a named interface with readonly fields where appropriate.
- Avoid mutable global state. Keep request and workflow state within their own lifecycle.
- Do not add speculative abstractions, duplicate implementations, or unrelated refactors.
- Explain non-obvious business decisions, concurrency safeguards, and recovery behavior in comments. Do not comment obvious syntax.

## 5. Input, authorization, and errors

- Validate HTTP, MCP, webhook, and provider input before using it in application behavior. Validate database records when crossing into trusted application types where necessary.
- Resolve identity on the server. A caller-supplied user, organization, resource ID, or approval flag does not establish permission.
- Check access before reading or changing scoped records. Apply the same rules to background work and MCP calls.
- Keep approvals tied to the exact content version, identity, and destination. Content changes invalidate the corresponding approval.
- Use explicit application error codes. Presentation translates them into stable HTTP/MCP responses.
- Never swallow an error or report success when an operation failed. Classify retryable failures, permanent failures, and uncertain outcomes separately.
- Never expose secrets, raw database errors, stack traces, or unrestricted provider responses to clients or logs.
- Keep secrets in runtime configuration, outside tracked files. Keep social credentials on the server and encrypt stored provider tokens.
- Treat external posts and comments as untrusted content. AI replies must obey permission and approval rules and must not create reply loops.

## 6. Publishing and Temporal

- Store one publication per destination. Keep the exact content version submitted, even after the draft changes.
- Use these delivery states: `scheduled`, `submitting`, `submitted_unverified`, `pending_approval`, `published_confirmed`, `rejected`, `failed`, and `cancelled`. Keep internal approval separate from platform approval.
- Save publication data and an outbox record in one PostgreSQL transaction. Dispatch Temporal starts from the outbox using stable workflow IDs. Recover undispatched records after restart.
- Keep Temporal workflow code deterministic: coordinate steps with Temporal APIs; perform network, database, filesystem, and other outside operations in Activities.
- Use durable timers for waiting. Do not keep resume-critical state only in process memory.
- Activities may execute more than once. Use stable operation keys, database constraints, and provider idempotency where available to prevent duplicate effects.
- A timeout after submission does not prove failure. Record `submitted_unverified` and reconcile with the provider before another submission when a duplicate is possible.
- Configure bounded retries for known transient errors. Do not blindly retry publication mutations with uncertain results.
- Recheck authorization, schedule revision, cancellation, and provider capability before submission. An in-flight cancellation may still require reconciliation.
- Deduplicate webhooks and handle delayed or reordered events without overwriting newer confirmed evidence.
- PostgreSQL is the source of truth for product-facing business state. Temporal history explains execution; it does not replace publication records or application audit history.
- Keep large media and credentials out of workflow payloads and logs. Pass identifiers and controlled references instead.
- Preserve compatibility with running workflows when changing workflow code. Plan versioning and deployment before changing a recorded execution path.

## 7. Visibility and platform claims

- Record stages, timestamps, attempt numbers, correlation IDs, workflow IDs, safe error details, provider IDs/URLs, and confirmation evidence.
- Provide enough information to answer: what is happening, what is waiting, what failed, and what happens next.
- Use structured logs with stable event names and identifiers. Redact secrets and sensitive content.
- Mark a publication confirmed only when evidence supports it. Keep uncertain outcomes visible.
- Distinguish a connector implemented in code from an API verified with a live authorized account. Do not claim that a platform works based on a registry entry or mock test.
- Treat Facebook Group publishing as a separate capability. Page publishing does not prove Group publishing support.

## 8. Development and verification

1. Understand the requested behavior and its acceptance conditions. Make routine implementation choices within these rules without repeatedly asking permission.
2. Inspect the affected code and callers to understand behavior and preserve user changes. Existing code is evidence of behavior, not a source of additional project rules.
3. Implement the smallest complete feature, including authorization, failure handling, persistence, and visible progress where relevant.
4. Review for broken contracts, duplicate actions, unsafe retries, missing authorization, and leaked secrets. Before handoff, also check naming, layer placement, readable control flow, focused functions, unnecessary abstractions, and comments explaining non-obvious behavior. Fix issues found within the authorized scope and update any affected code-reading guides.
5. Add meaningful focused tests for non-trivial business rules, concurrency, recovery, and permission changes. Do not add tests that merely mirror code or test trivial documentation edits.
6. Run the focused checks required for the change. Do not run broad suites, full builds, broad lint/typecheck passes, browser tests, or live provider tests unless the user requests them. Never use a developer or shared database for automated tests.
7. Report what changed, why, what was checked, and what remains unverified. Use plain language and explain technical terms when needed.

The first implementation slice is one authorized test account publishing an image-and-caption post immediately and on a schedule, followed by confirmation or visible uncertainty in the history. Complete that path before adding every platform.

## 9. Authorization for external actions

- Preserve unrelated changes. Do not delete files, discard work, or reset Git history as incidental cleanup.
- Do not commit, push, merge, deploy, migrate shared databases, send messages, or publish to social platforms without explicit user authorization for that action.
- Self-hosting means the team operates Temporal and its database: backups, restore procedures, monitoring, access control, upgrades, and recovery must be covered before production deployment.
- Write maintained documentation in English. Match the user's language when replying.

## 10. Commit and CI checks

- Install the root tooling with `npm install` or `npm ci`; the prepare step enables the local Husky hook. Use `npm.cmd` in PowerShell when script execution policy blocks `npm.ps1`.
- Before a commit is created, the hook runs `npm run check:staged`. Prettier checks staged text files, and ESLint checks staged `.mjs` scripts. Either failure blocks the commit. Fix formatting with `npm run format`, review the changes, and stage the intended fixes. Do not bypass the hook to hide a failure.
- Before a push, the hook runs `npm run ci`: formatting, tooling lint with zero warnings, and tooling regression tests. A failed check stops the push. These local checks inspect the current working directory; they do not prove that different committed content passes.
- GitHub Actions runs after pushes and on pull requests. It installs the lockfile and repeats formatting, tooling lint, and tooling tests on clean Linux and Windows runners. Local hooks can be bypassed, so required GitHub status checks must enforce the merge gate once enabled.
- Tooling tests use isolated disposable Git repositories and never modify the real index or create commits. Before the initial commit, partially staged files must be rejected before a checking tool can modify them.
- Current CI installs the lockfile and checks formatting, tooling lint, hook/compiler-profile tests, contracts, API, and web lint/type checks and focused tests. Contracts are compiled by these checks; a Next.js production build, browser tests, infrastructure tests, worker verification, and live provider verification are not part of the current CI gate. Add checks with the source they validate; do not hide missing checks behind optional scripts.
- Once database migrations exist, treat applied migrations as immutable and enforce that rule in pre-push/CI. Once shared contracts and layered application code exist, add real contract and dependency-boundary checks.
- Keep the Postiz checkout under `reference/`, dependencies, generated files, private environment files, and secrets outside project formatting and ordinary Git staging.
- CI must not use real social accounts, production credentials, developer databases, deployments, or shared migrations.

## 11. Workspace and file placement

The repository roots are established. Create deeper source directories when the owning feature is implemented; do not generate empty services, fake manifests, or unused layers to fill the tree.

- `apps/web/src/app/`: Next.js routes/layouts; `src/features/<feature>/`: feature components, hooks, client calls, and UI state; `src/components/ui/`: shared UI primitives. Web may import public contracts, never backend internals or provider clients.
- `apps/api/src/presentation/http/<feature>/`, `mcp/<feature>/`, and `webhooks/<provider>/`: request handlers and boundary DTOs. `src/bootstrap/`: Nest application creation; `src/configuration/`: runtime configuration parsing; `src/modules/`: Nest module registration and dependency wiring; `src/main.ts`: process startup. Invoke backend application operations from handlers.
- `apps/worker/src/workflows/<feature>/`: deterministic Temporal workflows; `src/activities/<feature>/`: thin activity handlers calling backend application operations; `src/dispatchers/`: outbox dispatcher hosts; `src/composition/`: dependency wiring; `src/main.ts`: startup.
- `packages/backend/src/modules/<feature>/domain/`: pure values, states, and rules; `application/use-cases/`: business operations; `application/ports/`: required storage/provider/execution interfaces; `application/contracts/`: internal operation and workflow data types; `infrastructure/`: persistence, provider, storage, and Temporal client adapters.
- Group backend adapters under their owning module, for example `publishing/infrastructure/providers/facebook/`, `connections/infrastructure/providers/facebook/`, and `media/infrastructure/storage/`. Avoid a global provider service that owns unrelated business operations. Introduce shared vendor clients only for demonstrated reuse.
- Domain and application do not import framework/vendor code. Workflow code may import Temporal workflow APIs and replay-safe framework-free contracts/helpers; it must not import activity implementations, NestJS, database clients, or provider adapters.
- `packages/backend/database/`: Prisma schema, application migrations when the first model is added, and safe local/test seeds. `packages/backend/prisma7.config.ts` configures the CLI. Regenerate the ignored client in `packages/backend/generated/prisma/` with the command in the root README. Temporal owns separate databases and schema lifecycle.
- `packages/contracts/src/<feature>/`: public HTTP/MCP runtime schemas, requests/responses, and stable error payloads. Keep public contracts independent of backend internals, apps, and server credentials; map them at entry boundaries.
- Packages never import from `apps/`; apps never import one another. Use declared package exports when scaffolded, not another package's private source paths. Keep `shared/` small and justified by actual reuse; avoid generic dumping grounds.
- Unit/component tests live beside source as `*.test.ts` or `*.test.tsx`. Backend adapter/database tests belong in `packages/backend/tests/integration/`; API tests in `apps/api/tests/integration/`; workflow/replay tests in `apps/worker/tests/workflows/`; cross-application tests in root `tests/e2e/`; current hook tests stay in `tests/tooling/`.
- `infra/local/`: local Compose topology. Keep the shared environment template and startup commands at the repo root. `infra/services/<service>/`: non-secret initialization and settings. Use named volumes for PostgreSQL and MinIO persistence. Define production infrastructure only after its hosting decision.
- Use root `.env.example` for local API and PostgreSQL settings and root `.env` for their local values. Keep the web template beside the web app and document how each process loads its configuration. Keep real environment files and credentials ignored.
- `scripts/`: repository/developer automation, never production business behavior. `.github/workflows/`: CI; `.husky/`: Git hooks. Build output belongs in the owning package's ignored `dist/` or `.next/`.
- Generated source belongs in a named `generated/` directory in its owning package once generation exists. Document its source, regeneration command, and tracking policy; never hand-edit generated output.
- Current documentation is limited to root `README.md` and three runnable guides under `docs/guides/`: API, web, and development workflow. Do not recreate architecture, planning, research, or decision documents unless requested. Update relative links when moving or deleting files.
- Keep external checkouts under ignored `reference/` with their own Git metadata. Do not move reference source into our packages or import runtime code from it.
- The first local development checkpoint may use a provider fake for a text-only scheduled post, outbox dispatch, Temporal execution, and persisted status/history. The first real provider slice remains the image-and-caption workflow described in section 8. Fake-provider coverage does not establish live connector support.

## 12. Learning checkpoints and current scope

- Implement one small approved step at a time. Explain its purpose, file paths, alternatives, and verification before introducing a new dependency or architectural choice.
- Default to showing code for the user to paste during learning; edit files directly when the user explicitly requests implementation or cleanup. Do not silently expand the approved step.
- Current runnable behavior is web-to-API health with a shared public health interface and runtime validator. Local PostgreSQL Compose is configured and Prisma Client generation works. A manual Prisma connection script exists; a successful database connection remains unverified. Application models, migrations, repository interfaces and implementations, API persistence wiring, OpenAPI JSON, MinIO, Temporal, and the worker are pending.
- Known API/web review work remains for the user: diagnostic logging and the cancellation test scope. API startup placement has been separated into bootstrap, configuration, and modules. Cleanup must not silently implement those changes.
