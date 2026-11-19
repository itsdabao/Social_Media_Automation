import type { PrismaClient } from "../../../../../generated/prisma/client.js";
import type {
  AuthRepository,
  AuthUser,
  NewAuthSession,
  PasswordAccount,
} from "../../application/ports/auth.repository.port.js";

export class PrismaAuthRepository implements AuthRepository {
  constructor(
    private readonly database: Pick<PrismaClient, "user" | "session">,
  ) {}

  async findAccountByEmail(email: string): Promise<PasswordAccount | null> {
    return this.database.user.findUnique({
      where: { email },
      select: { id: true, email: true, passwordHash: true },
    });
  }

  async createSession(session: NewAuthSession): Promise<void> {
    await this.database.session.create({
      data: {
        tokenHash: session.tokenHash,
        userId: session.userId,
        expiresAt: session.expiresAt,
      },
    });
  }

  async findActiveSessionUser(
    tokenHash: string,
    now: Date,
  ): Promise<AuthUser | null> {
    const session = await this.database.session.findUnique({
      where: { tokenHash, expiresAt: { gt: now } },
      select: { user: { select: { id: true, email: true } } },
    });
    return session?.user ?? null;
  }

  async deleteSessionByTokenHash(tokenHash: string): Promise<void> {
    await this.database.session.deleteMany({ where: { tokenHash } });
  }
}
