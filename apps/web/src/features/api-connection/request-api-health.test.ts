import assert from "node:assert/strict";
import test from "node:test";
import { requestApiHealth } from "./request-api-health.ts";

await test("browser requests use the same-origin route and recover on a later check", async (context) => {
  let isAvailable = true;
  const mocked = context.mock.method(globalThis, "fetch", () =>
    Promise.resolve(
      isAvailable
        ? Response.json({ status: "ok", service: "api" })
        : new Response(null, { status: 502 }),
    ),
  );
  const signal = new AbortController().signal;
  await requestApiHealth(signal);
  isAvailable = false;
  await assert.rejects(requestApiHealth(signal));
  isAvailable = true;
  await requestApiHealth(signal);
  assert.equal(mocked.mock.callCount(), 3);
  const call = mocked.mock.calls[0];
  assert.ok(call);
  assert.equal(call.arguments[0], "/api/health");
  assert.equal(call.arguments[1]?.cache, "no-store");
});

await test("browser rejects malformed successful responses", async (context) => {
  context.mock.method(globalThis, "fetch", () =>
    Promise.resolve(Response.json({ status: "ok" })),
  );
  await assert.rejects(requestApiHealth(new AbortController().signal));
});

await test("unmount cancellation is passed to the active request", async (context) => {
  const controller = new AbortController();
  let requestSignal: AbortSignal | null | undefined;
  context.mock.method(
    globalThis,
    "fetch",
    (_input: RequestInfo | URL, options?: RequestInit) => {
      requestSignal = options?.signal;
      return Promise.resolve(Response.json({ status: "ok", service: "api" }));
    },
  );
  await requestApiHealth(controller.signal);
  assert.ok(requestSignal instanceof AbortSignal);
  controller.abort();
  assert.equal(requestSignal.aborted, true);
});
