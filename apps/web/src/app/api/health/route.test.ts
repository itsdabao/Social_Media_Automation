import assert from "node:assert/strict";
import test from "node:test";
import { GET } from "./route.ts";

await test("health route preserves public responses, status codes and cache headers", async (context) => {
  const originalApiBaseUrl = process.env.API_BASE_URL;
  context.after(() => {
    if (originalApiBaseUrl === undefined) {
      delete process.env.API_BASE_URL;
    } else {
      process.env.API_BASE_URL = originalApiBaseUrl;
    }
  });
  process.env.API_BASE_URL = "http://127.0.0.1:3001";

  const mockedFetch = context.mock.method(globalThis, "fetch", () =>
    Promise.resolve(
      Response.json({ status: "ok", service: "api", privateDetail: "secret" }),
    ),
  );

  const connectedResponse = await GET();
  assert.equal(connectedResponse.status, 200);
  assert.equal(connectedResponse.headers.get("cache-control"), "no-store");
  assert.deepEqual(await connectedResponse.json(), {
    status: "ok",
    service: "api",
  });

  mockedFetch.mock.mockImplementation(() =>
    Promise.reject(new Error("private address")),
  );
  const unavailableResponse = await GET();
  assert.equal(unavailableResponse.status, 502);
  assert.equal(unavailableResponse.headers.get("cache-control"), "no-store");
  assert.deepEqual(await unavailableResponse.json(), {
    error: { code: "api_unavailable" },
  });

  process.env.API_BASE_URL = "https://user:password@example.com";
  const invalidConfigurationResponse = await GET();
  assert.equal(invalidConfigurationResponse.status, 503);
  assert.equal(
    invalidConfigurationResponse.headers.get("cache-control"),
    "no-store",
  );
  assert.deepEqual(await invalidConfigurationResponse.json(), {
    error: { code: "invalid_api_configuration" },
  });
  assert.equal(mockedFetch.mock.callCount(), 2);
});
