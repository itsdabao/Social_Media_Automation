import assert from "node:assert/strict";
import test from "node:test";
import type { AuthRepository } from "../ports/auth.repository.port.js";
import { PasswordSessionService } from "./password-session.service.ts";

await test("password login stores a hashed session and checks expiration and revocation", async () => {
  const user = { id: "user-1", email: "owner@example.test" };
  const sessions = new Map<string, { userId: string; expiresAt: Date }>();
  const repository: AuthRepository = {
    findAccountByEmail: async (email) =>
      email === user.email
        ? { ...user, passwordHash: "stored-password-hash" }
        : null,
    createSession: async ({ tokenHash, userId, expiresAt }) => {
      sessions.set(tokenHash, { userId, expiresAt });
    },
    findActiveSessionUser: async (tokenHash, now) => {
      const session = sessions.get(tokenHash);
      return session?.userId === user.id && session.expiresAt > now
        ? user
        : null;
    },
    deleteSessionByTokenHash: async (tokenHash) => {
      sessions.delete(tokenHash);
    },
  };
  const checkedHashes: string[] = [];
  const service = new PasswordSessionService(repository, {
    verifyPassword: async (password, hash) => {
      checkedHashes.push(hash);
      return password === "test-password" && hash === "stored-password-hash";
    },
    createToken: () => "session-token",
    hashToken: (token) => `hashed-${token}`,
    dummyPasswordHash: "dummy-hash",
  });
  const now = new Date("2026-11-19T00:00:00Z");

  assert.equal(
    await service.login("unknown@example.test", "test-password", now),
    null,
  );
  assert.equal(await service.login(user.email, "wrong-password", now), null);
  assert.deepEqual(checkedHashes, ["dummy-hash", "stored-password-hash"]);
  assert.equal(sessions.size, 0);

  const result = await service.login(
    " OWNER@EXAMPLE.TEST ",
    "test-password",
    now,
  );
  assert.ok(result);
  assert.deepEqual(result.user, user);
  assert.equal(sessions.has(result.token), false);
  assert.deepEqual(sessions.get(`hashed-${result.token}`), {
    userId: user.id,
    expiresAt: result.expiresAt,
  });
  assert.deepEqual(await service.getUser(result.token, now), user);
  assert.equal(await service.getUser(result.token, result.expiresAt), null);
  await service.logout(result.token);
  assert.equal(await service.getUser(result.token, now), null);
});
