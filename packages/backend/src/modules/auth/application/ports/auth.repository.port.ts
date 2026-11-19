export interface AuthUser {
  readonly id: string;
  readonly email: string;
}

export interface PasswordAccount extends AuthUser {
  readonly passwordHash: string;
}

export interface NewAuthSession {
  readonly tokenHash: string;
  readonly userId: string;
  readonly expiresAt: Date;
}

export interface AuthRepository {
  findAccountByEmail(email: string): Promise<PasswordAccount | null>;
  createSession(session: NewAuthSession): Promise<void>;
  findActiveSessionUser(tokenHash: string, now: Date): Promise<AuthUser | null>;
  deleteSessionByTokenHash(tokenHash: string): Promise<void>;
}
