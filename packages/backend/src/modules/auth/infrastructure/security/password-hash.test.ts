import assert from "node:assert/strict";
import test from "node:test";
import { hashPassword, verifyPassword } from "./password-hash.ts";

await test("only the original password verifies against the stored hash", async () => {
  const password = " test-password-đúng ";
  const passwordHash = await hashPassword(password);

  assert.equal(await verifyPassword(password, passwordHash), true);
  assert.equal(await verifyPassword(password.trim(), passwordHash), false);
});

await test("hashing one password twice uses different salts", async () => {
  const password = "sample-password-for-test";
  const firstHash = await hashPassword(password);
  const secondHash = await hashPassword(password);

  assert.notEqual(firstHash, secondHash);
  assert.equal(await verifyPassword(password, secondHash), true);
});

await test("unsupported or malformed stored hashes are rejected", async () => {
  const saltHex = "0".repeat(32);
  const keyHex = "1".repeat(64);

  assert.equal(await verifyPassword("password", ""), false);
  assert.equal(
    await verifyPassword("password", `scrypt-v2$${saltHex}$${keyHex}`),
    false,
  );
  assert.equal(
    await verifyPassword("password", `scrypt-v1$${saltHex}$not-a-key`),
    false,
  );
});
