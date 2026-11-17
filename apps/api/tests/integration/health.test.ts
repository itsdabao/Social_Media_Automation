import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { join } from "node:path";
import { createInterface } from "node:readline";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createApi } from "../../src/composition/create-api.js";

const entryPoint = fileURLToPath(new URL("../../src/main.js", import.meta.url));

await test("health is public liveness and closing the app releases its listener", async () => {
  const app = await createApi();
  const server = app.getHttpServer();
  try {
    await app.listen(0, "127.0.0.1");
    const response = await fetch(`${await app.getUrl()}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    const body: unknown = await response.json();
    assert.equal(response.status, 200);
    assert.deepEqual(body, { status: "ok", service: "api" });
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("x-powered-by"), null);
  } finally {
    await app.close();
  }
  assert.equal(server.listening, false);
});

await test(
  "entry point loads a local env file and serves health",
  { timeout: 15000 },
  async (context) => {
    const fixtures = fileURLToPath(new URL("../../fixtures/", import.meta.url));
    await mkdir(fixtures, { recursive: true });
    const directory = await mkdtemp(join(fixtures, "startup-"));
    await writeFile(
      join(directory, ".env"),
      "API_HOST=127.0.0.1\nAPI_PORT=0\n",
    );
    const environment = Object.fromEntries(
      Object.entries(process.env).filter(
        ([key]) => !["API_HOST", "API_PORT"].includes(key),
      ),
    );
    const child = spawn(process.execPath, ["--env-file=.env", entryPoint], {
      cwd: directory,
      env: environment,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const exited = once(child, "exit");
    context.after(async () => {
      if (child.exitCode === null && child.signalCode === null) {
        child.kill("SIGINT");
      }
      await exited;
    });
    const lines = createInterface({ input: child.stdout });
    context.after(() => lines.close());
    const lineEvent: unknown = await once(lines, "line", {
      signal: AbortSignal.timeout(10000),
    });
    assert.ok(Array.isArray(lineEvent));
    const line: unknown = lineEvent[0];
    assert.ok(typeof line === "string");
    const event: unknown = JSON.parse(line);
    assert.ok(typeof event === "object" && event !== null);
    assert.ok("event" in event && event.event === "api.started");
    assert.ok("url" in event && typeof event.url === "string");
    const response = await fetch(`${event.url}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    assert.equal(response.status, 200);
    await response.body?.cancel();
  },
);

await test("invalid configuration exits with a safe structured error", () => {
  const result = spawnSync(process.execPath, [entryPoint], {
    env: { ...process.env, API_PORT: "secret-value", API_HOST: "127.0.0.1" },
    encoding: "utf8",
    timeout: 10000,
  });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  const event: unknown = JSON.parse(result.stderr);
  assert.deepEqual(event, {
    event: "api.startup_failed",
    code: "invalid_configuration",
  });
  assert.ok(!result.stderr.includes("secret-value"));
});

await test("a busy port fails startup and closes the API resources", async () => {
  const occupied = createServer();
  await new Promise<void>((resolve, reject) => {
    occupied.once("error", reject);
    occupied.listen(0, "127.0.0.1", resolve);
  });
  try {
    const address = occupied.address();
    assert.ok(address !== null && typeof address === "object");
    const result = spawnSync(process.execPath, [entryPoint], {
      env: {
        ...process.env,
        API_HOST: "127.0.0.1",
        API_PORT: String(address.port),
      },
      encoding: "utf8",
      timeout: 10000,
    });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 1);
    const event: unknown = JSON.parse(result.stderr);
    assert.deepEqual(event, {
      event: "api.startup_failed",
      code: "startup_failed",
    });
    assert.equal(result.stdout, "");
  } finally {
    await new Promise<void>((resolve, reject) => {
      occupied.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
});
