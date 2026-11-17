import { execFileSync, spawnSync } from "node:child_process";
import lintStaged from "lint-staged";

function gitFiles(args) {
  return execFileSync("git", [...args, "-z"], { encoding: "utf8" })
    .split("\0")
    .filter(Boolean);
}

const staged = new Set(
  gitFiles(["diff", "--cached", "--name-only", "--diff-filter=ACMR"]),
);
if (staged.size === 0) {
  console.log("No staged files to check.");
  process.exit(0);
}

// Before the first commit, lint-staged cannot back up partially staged edits.
// Reject that case before it has a chance to modify the working tree.
const head = spawnSync("git", ["rev-parse", "--verify", "--quiet", "HEAD"], {
  encoding: "utf8",
});
if (head.error) throw head.error;
if (head.status !== 0 && head.status !== 1) {
  throw new Error(head.stderr || "Unable to inspect Git HEAD.");
}

if (head.status === 1) {
  const partiallyStaged = gitFiles(["diff", "--name-only"]).filter((file) =>
    staged.has(file),
  );
  if (partiallyStaged.length > 0) {
    console.error(
      "The first commit contains partially staged files. Stage each complete intended file or unstage it, then retry. No files were changed.",
    );
    process.exit(1);
  }
}

process.exitCode = (await lintStaged()) ? 0 : 1;
