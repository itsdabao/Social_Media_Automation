# Part 1 — npm workspace and TypeScript foundation

This increment establishes dependency ownership and compiler settings. The application entry points will be implemented in later increments, starting with the API. Database access, sign-in, and production hosting remain open decisions.

## Install

Use Node.js **24.14.0** and npm **11.21.1** from the repository root.

```sh
node --version
npm --version
npm ci
npm ls --workspaces --depth=0
npm run test:typescript-config
```

In PowerShell, use `npm.cmd` if script execution policy blocks `npm.ps1`. `npm ci` installs the root lockfile and runs `prepare` to enable Husky. Keep one `package-lock.json` at the root. Run dependency changes from the root with `npm install <package>@<version> --workspace <name>`.

`.npmrc` enables exact saves and rejects incompatible Node/npm engines. Root and workspace manifests declare the toolchain versions. Future runtime images must use the same Node.js version.

## Dependency ownership

Versions were checked against npm registry metadata, engines, and peer dependencies on 16 November 2026.

| Owner                     | Dependencies                                                                       |
| ------------------------- | ---------------------------------------------------------------------------------- |
| Root                      | TypeScript `5.9.3`, Node types `24.19.2`, existing repository tooling              |
| `@social-media/web`       | Next.js `16.4.6`, React/React DOM `19.3.1`, React/React DOM types `19.3.0`         |
| `@social-media/api`       | Nest common/core/platform-express `12.5.0`, reflect-metadata `0.2.2`, RxJS `7.8.2` |
| `@social-media/worker`    | Temporal worker SDK `1.25.0`                                                       |
| `@social-media/backend`   | Framework-independent business package; dependencies added with implementations    |
| `@social-media/contracts` | Public transport contracts; dependencies added with concrete runtime schemas       |

TypeScript 5.9.3 is an explicit starting choice for this foundation. Upgrades should be checked against framework and SDK compatibility. All direct versions are exact, while the lockfile records the resolved transitive tree.

The backend and contracts packages currently expose no imports (`"exports": {}`). Add a named export only when its actual source exists and a caller uses it. Add inter-workspace dependencies with the first real imports. This keeps package boundaries explicit as implementation proceeds.

## Read these files in order

1. Root `package.json` registers the five workspace paths and shared tools. npm links those packages during installation.
2. Each workspace `package.json` owns its framework dependencies. Business behavior will be owned by `packages/backend`, following the controller → use case → port → adapter pattern used in Celesnity.
3. `tsconfig.base.json` defines strict rules shared by application source.
4. `tsconfig.node.json` selects NodeNext ESM resolution and Node types for API, worker, and backend package configurations.
5. `tsconfig.web.json` selects bundler resolution, JSX preservation, and DOM/React types for Next.js.
6. `tests/configuration/typescript-config.test.mjs` checks the profiles against disposable source files.

Application-specific tsconfigs will extend these profiles when source is added. Nest decorator options belong to the API configuration introduced with Nest source. Package build output and public exports are defined alongside the source they compile.

The compiler rules reject implicit `any`, assigning `undefined` to an absent optional field, and using an uncertain array entry without checking it. NodeNext requires relative ESM imports such as `./publication.js` in emitted backend code. The web profile accepts bundler-style imports and JSX.

## Verification and limits

`npm run test:typescript-config` compiles isolated fixtures under ignored `.task-checks/` and checks four behaviors:

- Node ESM output runs with relative `.js` imports and Node built-ins.
- Strict mode, optional-property handling, and array access reject unsafe code.
- The Node profile rejects extensionless relative ESM imports and browser globals.
- The web profile accepts React JSX, DOM globals, and bundler resolution.

These tests are part of `npm run ci` and GitHub Actions. Existing formatting, tooling lint, and Git hook tests remain in the gate. Application lint, typecheck, build, and business tests are added with application source. The application has no runnable server, dashboard, worker, database schema, or provider integration at this checkpoint.

After reviewing this part, the next increment implements the Nest API entry point and health endpoint so that the first request can be traced through startup, composition, and presentation.

## Part 1 handoff

Status: `READY_FOR_USER_REVIEW` on 16 November 2026.

Verified locally with Node.js 24.14.0 and npm 11.21.1:

- Dependency installation produced the single root lockfile and five linked workspaces. `npm ls --workspaces --depth=0` succeeded with the pinned direct dependencies.
- All four `test:typescript-config` tests passed.
- ESLint passed for the new configuration test, and Prettier passed for the changed text files.
- Importing the Temporal worker SDK succeeded. Server connectivity and worker registration will be exercised with the worker implementation.

The broad CI gate, Git hook regression suite, clean-install replay, application builds, browser checks, and live provider checks were not run for this increment. GitHub Actions has been updated locally; remote execution requires a separately authorized push.
