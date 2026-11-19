import { createHash, randomBytes } from "node:crypto";
import type { PrismaClient } from "../../../generated/prisma/client.js";
import { PasswordSessionService } from "./application/use-cases/password-session.service.js";
import { PrismaAuthRepository } from "./infrastructure/persistence/prisma-auth.repository.js";
import {
  DUMMY_PASSWORD_HASH,
  verifyPassword,
} from "./infrastructure/security/password-hash.js";

const SESSION_TOKEN_BYTES = 32;

export function createPasswordSessionService(
  database: PrismaClient,
): PasswordSessionService {
  return new PasswordSessionService(new PrismaAuthRepository(database), {
    verifyPassword,
    createToken: () => randomBytes(SESSION_TOKEN_BYTES).toString("base64url"),
    hashToken: (token) => createHash("sha256").update(token).digest("hex"),
    dummyPasswordHash: DUMMY_PASSWORD_HASH,
  });
}

export type { PasswordSessionService } from "./application/use-cases/password-session.service.js";
