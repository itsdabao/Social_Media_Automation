import assert from "node:assert/strict";
import test from "node:test";
import { ApiConfigurationError, readApiConfig } from "./api-config.js";

await test("missing API variables use loopback and port 3001", () => {
  assert.deepEqual(readApiConfig({}), { host: "127.0.0.1", port: 3001 });
});

await test("explicit addresses and boundary ports are supported", () => {
  assert.deepEqual(readApiConfig({ API_HOST: "::1", API_PORT: "65535" }), {
    host: "::1",
    port: 65535,
  });
  assert.equal(readApiConfig({ API_PORT: "0" }).port, 0);
});

await test("invalid hosts fail without including their values in errors", () => {
  for (const host of ["", "localhost", "127.0.0.999", "secret@example.com"]) {
    assert.throws(() => readApiConfig({ API_HOST: host }), {
      name: "ApiConfigurationError",
      message: "API_HOST must be an IPv4 or IPv6 address.",
    });
  }
});

await test("ports must be whole decimal numbers within the TCP range", () => {
  for (const port of [
    "",
    "-1",
    "65536",
    "3.5",
    "3001abc",
    "1e3",
    " 3001 ",
    "3001\n",
    "03001",
    "-0",
  ]) {
    assert.throws(
      () => readApiConfig({ API_PORT: port }),
      ApiConfigurationError,
    );
  }
});
