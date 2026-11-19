export const SESSION_COOKIE_NAME = "social_media_session";
const SESSION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/u;

export function isSessionToken(value: string | undefined): value is string {
  return value !== undefined && SESSION_TOKEN_PATTERN.test(value);
}

export interface LoginInput {
  readonly email: string;
  readonly password: string;
}

export interface SignedInUser {
  readonly id: string;
  readonly email: string;
}

const MAX_EMAIL_LENGTH = 254;
const MAX_PASSWORD_LENGTH = 1024;

export function parseLoginInput(input: unknown): LoginInput | null {
  if (
    typeof input !== "object" ||
    input === null ||
    !("email" in input) ||
    !("password" in input)
  ) {
    return null;
  }

  const { email, password } = input;
  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    email.length > MAX_EMAIL_LENGTH ||
    password.length > MAX_PASSWORD_LENGTH ||
    password.length === 0
  ) {
    return null;
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+$/u.test(normalizedEmail)) {
    return null;
  }

  return { email: normalizedEmail, password };
}

export function parseSignedInUser(value: unknown): SignedInUser | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !("id" in value) ||
    typeof value.id !== "string" ||
    value.id === "" ||
    !("email" in value) ||
    typeof value.email !== "string" ||
    value.email === ""
  ) {
    return null;
  }

  return { id: value.id, email: value.email };
}
