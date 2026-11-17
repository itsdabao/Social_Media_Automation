import assert from "node:assert/strict";
import test from "node:test";
import { checkApiHealth } from "./api-health.ts";

await test("health check validates and copies only public response fields", async (context) => {
  const mocked = context.mock.method(globalThis, "fetch", () =>
    Promise.resolve(
      Response.json({ status: "ok", service: "api", privateDetail: "secret" }),
    ),
  );
  const result = await checkApiHealth(undefined);
  assert.deepEqual(result, {
    status: "connected",
    health: { status: "ok", service: "api" },
  });
  const call = mocked.mock.calls[0];
  assert.ok(call);
  const [url, options] = call.arguments;
  assert.ok(url instanceof URL);
  assert.equal(url.href, "http://127.0.0.1:3001/health");
  assert.equal(options?.cache, "no-store");
  assert.equal(options?.redirect, "error");
  assert.ok(options?.signal instanceof AbortSignal);
});

await test("invalid server configuration is rejected before any network call", async (context) => {
  const mocked = context.mock.method(globalThis, "fetch", () =>
    Promise.reject(new Error("Unexpected fetch")),
  );
  for (const value of [
    "",
    "file:///private",
    "https://user:password@example.com",
    "http://localhost:3001/path",
    "http://localhost:3001?secret=1",
    "http://localhost:3001/#private",
  ]) {
    assert.deepEqual(await checkApiHealth(value), {
      status: "invalid_configuration",
    });
  }
  assert.equal(mocked.mock.callCount(), 0);
});

await test("HTTP failure cannot be mistaken for healthy content", async (context) => {
  context.mock.method(globalThis, "fetch", () =>
    Promise.resolve(
      Response.json({ status: "ok", service: "api" }, { status: 500 }),
    ),
  );
  assert.deepEqual(await checkApiHealth("http://127.0.0.1:3001"), {
    status: "unavailable",
  });
});

await test("malformed JSON and unexpected success payloads produce a safe failure", async (context) => {
  const mocked = context.mock.method(globalThis, "fetch", () =>
    Promise.resolve(new Response("private upstream error")),
  );
  const invalidJson = await checkApiHealth(undefined);
  assert.deepEqual(invalidJson, { status: "unavailable" });
  mocked.mock.mockImplementation(() =>
    Promise.resolve(Response.json({ status: "ok", service: "worker" })),
  );
  assert.deepEqual(await checkApiHealth(undefined), { status: "unavailable" });
});

await test("network failure and timeout remain visible without exposing raw errors", async (context) => {
  const mocked = context.mock.method(globalThis, "fetch", () =>
    Promise.reject(new TypeError("private address")),
  );
  assert.deepEqual(await checkApiHealth(undefined), { status: "unavailable" });
  mocked.mock.mockImplementation(() =>
    Promise.reject(new DOMException("Timed out", "TimeoutError")),
  );
  assert.deepEqual(await checkApiHealth(undefined), { status: "unavailable" });
});
