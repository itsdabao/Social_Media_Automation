import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));

function createFixture() {
  // Keep disposable repositories isolated from the real index and credentials.
  // Retain them under the ignored directory for failure diagnosis.
  const fixtures = join(root, ".task-checks");
  mkdirSync(fixtures, { recursive: true });
  const directory = mkdtempSync(join(fixtures, "hooks-"));
  const environment = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !key.startsWith("GIT_")),
  );
  const git = (...args) => {
    const result = spawnSync(
      "git",
      ["-c", `safe.directory=${directory.replaceAll("\\", "/")}`, ...args],
      {
        cwd: directory,
        encoding: "utf8",
        env: environment,
        timeout: 60_000,
      },
    );
    if (result.error) throw result.error;
    return result;
  };
  const mustGit = (...args) => {
    const result = git(...args);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    return result.stdout;
  };
  const write = (name, content) =>
    writeFileSync(join(directory, name), content);

  mustGit("init", "--quiet", "--initial-branch=main");
  mustGit("config", "core.hooksPath", join(directory, ".git", "hooks"));
  const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  manifest.scripts.ci = "node scripts/ci-fixture.mjs";
  write("package.json", JSON.stringify(manifest, null, 2) + "\n");
  for (const name of [
    ".prettierrc.json",
    ".gitattributes",
    "eslint.config.mjs",
  ]) {
    write(name, readFileSync(join(root, name)));
  }
  mkdirSync(join(directory, "scripts"));
  write(
    "scripts/check-staged.mjs",
    readFileSync(join(root, "scripts/check-staged.mjs")),
  );
  for (const hook of ["pre-commit", "pre-push"]) {
    const path = join(directory, ".git", "hooks", hook);
    writeFileSync(
      path,
      "#!/bin/sh\n" + readFileSync(join(root, ".husky", hook), "utf8"),
    );
    chmodSync(path, 0o755);
  }
  return {
    git,
    mustGit,
    write,
    read: (name) => readFileSync(join(directory, name), "utf8"),
    hook: (name) => git("hook", "run", name),
  };
}

test("pre-commit succeeds when nothing is staged", () => {
  const fixture = createFixture();
  const result = fixture.hook("pre-commit");
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout + result.stderr, /No staged files/);
});

test("pre-commit blocks unformatted staged content", () => {
  const fixture = createFixture();
  fixture.write("post.json", '{"caption":"demo"}');
  fixture.mustGit("add", "--", "post.json");
  const result = fixture.hook("pre-commit");
  assert.notEqual(result.status, 0);
  assert.match(result.stdout + result.stderr, /Code style issues/);
  assert.notEqual(fixture.git("rev-parse", "--verify", "HEAD").status, 0);
});

test("pre-commit accepts formatted files with spaces in their names", () => {
  const fixture = createFixture();
  const content = '{\n  "caption": "demo"\n}\n';
  fixture.write("post with spaces.json", content);
  fixture.mustGit("add", "--", "post with spaces.json");
  const result = fixture.hook("pre-commit");
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(fixture.read("post with spaces.json"), content);
});

test("pre-commit blocks a formatted script with an ESLint error", () => {
  const fixture = createFixture();
  fixture.write("scripts/invalid.mjs", "console.log(missingValue);\n");
  fixture.mustGit("add", "--", "scripts/invalid.mjs");
  const result = fixture.hook("pre-commit");
  assert.notEqual(result.status, 0);
  assert.match(result.stdout + result.stderr, /no-undef/);
});

test("initial partial staging is rejected without changing working or staged content", () => {
  const fixture = createFixture();
  const staged = '{\n  "caption": "staged"\n}\n';
  const unstaged = '{"caption":"unstaged"}';
  fixture.write("post.json", staged);
  fixture.mustGit("add", "--", "post.json");
  fixture.write("post.json", unstaged);
  const result = fixture.hook("pre-commit");
  assert.notEqual(result.status, 0);
  assert.match(result.stdout + result.stderr, /partially staged files/);
  assert.equal(fixture.read("post.json"), unstaged);
  assert.equal(fixture.mustGit("show", ":post.json"), staged);
});

test("pre-push blocks a failed CI command", () => {
  const fixture = createFixture();
  fixture.write("scripts/ci-fixture.mjs", "process.exit(1);\n");
  const result = fixture.hook("pre-push");
  assert.notEqual(result.status, 0);
  assert.match(result.stdout + result.stderr, /ci-fixture/);
});

test("pre-push accepts a successful CI command", () => {
  const fixture = createFixture();
  fixture.write(
    "scripts/ci-fixture.mjs",
    'console.log("CI fixture passed");\n',
  );
  const result = fixture.hook("pre-push");
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout + result.stderr, /CI fixture passed/);
});
