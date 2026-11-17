# Local checks and GitHub CI

There are three gates. A local pre-commit hook checks staged files before Git creates a commit. A pre-push hook runs the repository quality gate before Git sends commits. GitHub Actions repeats the gate in a clean environment after a push or pull request. Local hooks can be bypassed, so required GitHub checks should be the merge gate.

## Set up this checkout

Use Node.js 24.14.0 from `.node-version`, then run:

```sh
npm install
```

This installs pinned development tools and enables the Husky pre-commit hook in this checkout. Future clean installations can use `npm ci`. Each developer must install dependencies to enable the hook. In PowerShell, use `npm.cmd` if the local execution policy blocks `npm.ps1`; no execution-policy change is needed.

## Make a change

1. Edit the intended files.
2. Run `npm run format` to fix formatting. This changes working files; review the result before staging.
3. Stage the intended changes.
4. Commit. The pre-commit hook runs Prettier against supported staged text files and ESLint against staged `.mjs` scripts. Errors stop the commit. Review and restage corrected files before retrying.
5. Push the commit. The pre-push hook runs `npm run ci`: formatting, tooling lint, Git hook tests, TypeScript profile tests, contracts, API, and web verification. Any failure stops the push. GitHub repeats these checks in separate visible steps on Linux and Windows.
6. Open a pull request and review its checks before merging.

The hook checks files staged for the commit. It does not automatically format, commit, or push changes. lint-staged temporarily manages the index and working tree to check staged content, then restores unstaged edits. Before the first commit, it cannot create its backup stash, so the hook rejects partially staged files before running lint-staged. Stage complete intended files for the initial commit. The guard leaves the files and index unchanged when it rejects that case.

## Commands

| Command                          | Purpose                                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------ |
| `npm run format`                 | Fix supported project file formatting.                                                           |
| `npm run format:check`           | Check formatting without modifying files.                                                        |
| `npm run lint`                   | Check tooling scripts, tests, and ESLint configuration; warnings fail the check.                 |
| `npm run test:tooling`           | Test real Git hook commands against disposable repositories without creating commits or pushing. |
| `npm run test:typescript-config` | Compile disposable fixtures to verify strict typing, Node ESM, and web JSX profiles.             |
| `npm run start:api`              | Compile and start the API with optional workspace-local environment settings.                    |
| `npm run check:api`              | Run API-only typed lint, strict TypeScript, and isolated configuration/HTTP tests.               |
| `npm run dev:web`                | Start the Next.js dashboard locally after compiling its shared contracts.                        |
| `npm run check:web`              | Generate route types, check TypeScript, lint web source, and run feature tests.                  |
| `npm run check:contracts`        | Compile public exports, lint contracts, and test runtime response validation.                    |
| `npm run check:staged`           | Run the local staged-file check manually.                                                        |
| `npm run ci`                     | Run the current GitHub quality gate locally.                                                     |
| `npm run prepare`                | Re-enable hooks after installing with scripts disabled.                                          |

The root toolchain uses npm and a committed `package-lock.json`. Both local development and CI use the pinned Node.js version. The Postiz checkout under `reference/`, local secrets, environment files, dependencies, and build output are excluded from project formatting; local references and private files are also ignored by Git. Ignore rules prevent accidental additions, not deliberate force-adds or the tracking of files already committed. They are not a secret scanner.

## What CI checks today

The project contains five npm workspaces, shared TypeScript profiles, the NestJS API, the Next.js dashboard, and a public health contract. CI checks locked installation, formatting, tooling lint, Git hook/compiler-profile tests, and focused contracts/API/web gates. Typed ESLint enforces import restrictions on frontend and public contracts. Tests compile into each owning package's ignored `.local/tests/`; API HTTP tests use loopback and disposable configuration. Git hook/compiler fixtures remain under `.task-checks/`. Worker checks will be added with worker source. See the [workspace](workspace-foundation.md), [API](api-foundation.md), and [web](web-foundation.md) guides.

Local pre-push checks the current working directory. If it differs from the commits being pushed, its result is not proof about those commits. GitHub CI checks the clean pushed/PR tree and remains the authoritative remote check.

Application TypeScript shares one typed ESLint rule set, including type-only imports and braces for control-flow bodies. Public contracts reject Node built-ins in both bare and `node:` forms, in addition to application/framework imports. Each workspace retains its own compiler project. Extend the existing checks as source is added. Keep pre-commit fast and run application verification in CI. CI uses disposable data and must not publish social content, deploy, or migrate shared systems.

## What was adopted from the inspected Celesnity implementation

The inspected Agent repository uses a pre-commit formatting/lint hook and a pre-push verification hook. Core has a pre-push rule that prevents editing previously applied migrations. Agent also checks shared contract copies and uses disposable Linux containers on Windows for its runtime/sandbox tests. Their inspected deployment pipelines use Cloud Build/GKE rather than GitHub Actions.

This project adopts the two local hook stages, strict lint failures, one repeatable repository gate, and isolated regression fixtures. Pre-commit checks staged content without automatically rewriting the user's source. The GitHub Linux/Windows matrix already gives this tooling clean platform coverage; Docker is not required for these Git/Node checks. Migration immutability checks, shared-contract checks, application architecture tests, type checks, and image smoke tests must be added with the source they validate. No empty substitutes have been added.

ESLint 10's minimatch dependency is overridden to 11.0.7 to avoid the affected glob-matching versions described in [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249). The real lint and hook tests exercise the override with our configured globs. Re-evaluate it when upgrading ESLint; remove it when the upstream dependency range includes a patched version. This is a development-tool dependency change, not an application runtime dependency.

## Enforce checks on GitHub

The workflow runs for pushes, pull requests, merge groups, and manual dispatches. It uses a read-only repository token and pinned official action revisions, without application credentials.

After the workflow has been committed, pushed, and completed at least once, configure the GitHub rule for the target branch to require pull requests and these successful checks:

- `Repository checks (ubuntu-latest)`
- `Repository checks (windows-latest)`

Keep those check names stable. A workflow file alone does not prevent merging; required status checks must be enabled on GitHub. Until the initial commit and push are authorized, the workflow exists locally and has not run on GitHub.

Sources: [GitHub status checks](https://docs.github.com/en/pull-requests/reference/status-checks), [Husky setup](https://typicode.github.io/husky/get-started.html), [lint-staged](https://github.com/lint-staged/lint-staged), and [Prettier installation and CI](https://prettier.io/docs/install).
