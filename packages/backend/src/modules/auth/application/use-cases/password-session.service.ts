import type {
  AuthRepository,
  AuthUser,
} from "../ports/auth.repository.port.js";

const SESSION_LIFETIME_MS = 8 * 60 * 60 * 1000;

export interface AuthSecrets {
  verifyPassword(password: string, passwordHash: string): Promise<boolean>;
  createToken(): string;
  hashToken(token: string): string;
  readonly dummyPasswordHash: string;
}

export interface AuthenticatedSession {
  readonly user: AuthUser;
  readonly token: string;
  readonly expiresAt: Date;
}

export class PasswordSessionService {
  private readonly repository: AuthRepository;
  private readonly secrets: AuthSecrets;

  constructor(repository: AuthRepository, secrets: AuthSecrets) {
    this.repository = repository;
    this.secrets = secrets;
  }

  async login(
    email: string,
    password: string,
    now: Date,
  ): Promise<AuthenticatedSession | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const account = await this.repository.findAccountByEmail(normalizedEmail);
    const expectedPasswordHash =
      account?.passwordHash ?? this.secrets.dummyPasswordHash;
    const hasValidPassword = await this.secrets.verifyPassword(
      password,
      expectedPasswordHash,
    );

    if (!account || !hasValidPassword) {
      return null;
    }

    const token = this.secrets.createToken();
    const expiresAt = new Date(now.getTime() + SESSION_LIFETIME_MS);
    await this.repository.createSession({
      tokenHash: this.secrets.hashToken(token),
      userId: account.id,
      expiresAt,
    });

    return { user: { id: account.id, email: account.email }, token, expiresAt };
  }

  async getUser(token: string, now: Date): Promise<AuthUser | null> {
    const tokenHash = this.secrets.hashToken(token);
    return this.repository.findActiveSessionUser(tokenHash, now);
  }

  async logout(token: string): Promise<void> {
    const tokenHash = this.secrets.hashToken(token);
    await this.repository.deleteSessionByTokenHash(tokenHash);
  }
}
