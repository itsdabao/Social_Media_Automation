# Celesnity conventions as a code-reading guide

This is a learning/reference guide for this project, based on the local `D:\Celestiny\celesnity-agent` repository. It summarizes conventions from its root `AGENTS.md`, `skills/README.md`, `codebase-orientation`, `clean-architecture`, `naming-conventions`, `coding-conventions`, and `security-and-isolation` skills. It is not a claim that the social-media app should copy the agent's domain model or every folder name.

## The mental model

Follow one request through the system:

```text
HTTP / MCP / UI
      ↓
Presentation: parse, validate, authenticate, map the request
      ↓
Application: decide and coordinate the use case
      ↓
Port: describe the external capability the use case needs
      ↓
Infrastructure adapter: call PostgreSQL, Temporal, MinIO, or a provider API
      ↓
Presentation maps the result back to a response or visible event
```

`Domain` contains pure business rules and values that do not need a database, network, framework, or filesystem. `Modules` and `bootstrap` construct the concrete objects and connect the layers. Dependencies point inward: business decisions must not depend on a specific database client or HTTP framework.

## A concrete Celesnity example: create a room

The existing code provides a small example of the pattern:

1. [`rooms.controller.ts`](/D:/Celestiny/celesnity-agent/src/presentation/http/rooms/rooms.controller.ts) receives `POST /rooms`. The Nest controller obtains the authenticated owner, receives a validated DTO, maps the public request fields, calls the use case, then maps the result to the HTTP response.
2. [`room-use-cases.ts`](/D:/Celestiny/celesnity-agent/src/application/room/room-use-cases.ts) runs the application behavior: trims and checks the name and members, checks an optional key for a conflict, then asks the repository to create the room. It does not know Prisma exists.
3. [`rooms.ts`](/D:/Celestiny/celesnity-agent/src/application/shared/ports/execution/rooms.ts) defines `RoomRepository`, the capability the use case needs, plus the `RoomRecord` and input shapes. This is the seam between policy and storage.
4. [`repositories/rooms.ts`](/D:/Celestiny/celesnity-agent/src/infrastructure/prisma/repositories/rooms.ts) implements that contract with Prisma. It writes the room and members in a database transaction and maps the database row back to an application record.
5. Nest module/composition code injects the concrete repository into the controller/use case path. That is where the app chooses Prisma as the implementation.

In plain English: **the controller speaks HTTP; the use case decides whether room creation is allowed; the port says what storage operation is needed; the adapter performs it in PostgreSQL.** This makes the business decision understandable without first learning Nest or Prisma.

## How to read unfamiliar code

1. Find the route or public function with `rg -n`, then find its callers and nearest test.
2. Follow the call into application behavior. Write down the input, decisions, errors, and returned result.
3. Find the port/interface used by that behavior and identify what it promises.
4. Find the concrete adapter and see how it fulfills the promise (including transaction, retry, mapping, and ownership conditions).
5. Find composition/wiring to see which adapter is actually active.
6. Follow the result back to the user-visible response, event, or status record.

Do not infer ownership from a filename. A controller named `PostsController` should not automatically own publishing policy. Trace imports, calls, and tests to establish where behavior really lives.

## Conventions to carry into this project

- Use lowercase kebab-case for TypeScript filenames and directories; use role suffixes such as `.controller.ts`, `.service.ts`, `.repository.ts`, `.port.ts`, and `.mapper.ts` when they clarify responsibility.
- Use `PascalCase` for classes and named types, `camelCase` for functions and values, and `UPPER_SNAKE_CASE` for fixed configuration constants and environment variables.
- Prefer immutable records and explicit finite-state unions. At JSON/database boundaries, keep established field spelling and map it deliberately.
- Validate untrusted input at the outer boundary. Keep domain/application code independent of Nest decorators and Prisma models.
- Inject narrow interfaces for external capabilities. Avoid making application code import a concrete adapter merely for convenience.
- Keep absent optional fields absent; don’t emit `property: undefined` unless the contract explicitly allows it.
- Preserve async contracts, including whether failures reject a Promise or throw synchronously.
- Check authorization before any owner-scoped read or mutation. An ID supplied by a caller selects a record; it does not prove permission to access it.
- Translate internal errors to stable, deliberate API outcomes. Do not leak raw provider responses, stack traces, credentials, or database errors.
- Follow the nearest established vertical slice and compiler/linter rules instead of adding abstractions speculatively.

## Applying the pattern to our publishing system

For a `schedule publication` request, the analogous path should be:

```text
Dashboard or MCP tool
  → API/MCP presentation validates caller, post version, destination, and schedule
  → Publishing application service checks permissions and domain rules
  → PostgreSQL transaction saves publication + outbox entry
  → outbox/Temporal adapter starts a stable Temporal workflow
  → Temporal workflow coordinates waits and retries
  → provider adapter activity calls Facebook/LinkedIn/etc.
  → result/reconciliation updates publication records
  → API returns current status; UI shows stages and evidence
```

Temporal is infrastructure, not the place for social-media policy or business records. Keep workflow code focused on orchestration; keep provider API calls in activities; keep current user-facing publication state in our PostgreSQL database. MCP and HTTP should invoke the same application service so they cannot drift into different authorization or publishing behavior.

## Reference source files

- [`AGENTS.md`](/D:/Celestiny/celesnity-agent/AGENTS.md) and [`skills/README.md`](/D:/Celestiny/celesnity-agent/skills/README.md) route work to relevant procedures.
- [`clean-architecture/SKILL.md`](/D:/Celestiny/celesnity-agent/skills/clean-architecture/SKILL.md) explains dependency direction and layer placement.
- [`naming-conventions/SKILL.md`](/D:/Celestiny/celesnity-agent/skills/naming-conventions/SKILL.md) covers file, symbol, and boundary names.
- [`coding-conventions/SKILL.md`](/D:/Celestiny/celesnity-agent/skills/coding-conventions/SKILL.md) covers TypeScript, Nest, async behavior, validation, and errors.
- [`security-and-isolation/SKILL.md`](/D:/Celestiny/celesnity-agent/skills/security-and-isolation/SKILL.md) covers authorization, tenant isolation, paths, MCP scope, and secrets.

Reference reviewed on 13 November 2026. Celesnity remains a living codebase; re-check the relevant skill and nearby implementation when applying these conventions to a future change.
