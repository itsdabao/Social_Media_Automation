import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";

const COMPOSE_WAIT_TIMEOUT_SECONDS = "60";
const isWindows = process.platform === "win32";
const running = new Set();
let isStopping = false;

function start(label, command, args) {
  const child = spawn(command, args, {
    detached: !isWindows,
    stdio: "inherit",
  });
  running.add(child);
  child.once("close", () => running.delete(child));

  return once(child, "exit").then(
    ([code, signal]) => ({ label, code, signal }),
    (error) => {
      throw new Error(`${label} could not start: ${error.message}`);
    },
  );
}

async function run(label, command, args) {
  const result = await start(label, command, args);
  if (!isStopping && result.code !== 0) {
    throw new Error(`${label} failed (${result.signal ?? result.code}).`);
  }
}

function stop(exitCode) {
  if (isStopping) {
    return;
  }
  isStopping = true;
  process.exitCode = exitCode;

  for (const child of running) {
    if (
      child.pid === undefined ||
      child.exitCode !== null ||
      child.signalCode
    ) {
      continue;
    }
    if (isWindows) {
      spawnSync("taskkill.exe", ["/pid", String(child.pid), "/t", "/f"], {
        stdio: "ignore",
        windowsHide: true,
      });
      continue;
    }
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch (error) {
      if (error.code !== "ESRCH") {
        throw error;
      }
    }
  }
}

async function main() {
  const npmCli = process.env.npm_execpath;
  if (!npmCli) {
    throw new Error("Run this command through npm run dev.");
  }

  console.log("[dev] Starting PostgreSQL and Silo");
  await run("Docker Compose", "docker", [
    "compose",
    "--env-file",
    ".env",
    "-f",
    "infra/local/compose.yaml",
    "up",
    "--wait",
    "--wait-timeout",
    COMPOSE_WAIT_TIMEOUT_SECONDS,
    "postgres",
    "silo",
  ]);
  if (isStopping) {
    return;
  }

  console.log("[dev] Building API and shared packages");
  await run("API build", process.execPath, [npmCli, "run", "build:api"]);
  if (isStopping) {
    return;
  }

  console.log("[dev] Starting API and web. Press Ctrl+C to stop both.");
  const result = await Promise.race([
    start("API", process.execPath, [
      npmCli,
      "run",
      "start",
      "--workspace",
      "@social-media/api",
    ]),
    // The API build already built contracts, which is also the web predev step.
    start("Web", process.execPath, [
      npmCli,
      "--ignore-scripts",
      "run",
      "dev",
      "--workspace",
      "@social-media/web",
    ]),
  ]);

  if (!isStopping) {
    throw new Error(
      `${result.label} exited (${result.signal ?? result.code}).`,
    );
  }
}

process.once("SIGINT", () => stop(130));
process.once("SIGTERM", () => stop(143));

try {
  await main();
} catch (error) {
  if (!isStopping) {
    console.error(`[dev] ${error.message}`);
    stop(1);
  }
}
