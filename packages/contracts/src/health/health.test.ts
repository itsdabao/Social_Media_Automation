import assert from "node:assert/strict";
import test from "node:test";
import { isApiHealthResponse } from "./health.js";

await test("health rejects malformed data and responses from another service", () => {
  for (const value of [
    null,
    "ok",
    [],
    {},
    { status: "ok" },
    { status: "ok", service: "worker" },
    { status: "failed", service: "api" },
  ]) {
    assert.equal(isApiHealthResponse(value), false);
  }
  assert.equal(isApiHealthResponse({ status: "ok", service: "api" }), true);
});
