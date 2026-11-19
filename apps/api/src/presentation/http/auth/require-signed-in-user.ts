import {
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import type { PasswordSessionService } from "@social-media/backend/auth";
import type { SignedInUser } from "@social-media/contracts/auth";
import { readSessionToken } from "./session-cookie.js";

export async function requireSignedInUser(
  cookieHeader: string | undefined,
  sessions: Pick<PasswordSessionService, "getUser"> | null,
): Promise<SignedInUser> {
  const token = readSessionToken(cookieHeader);
  if (!token) {
    throw new UnauthorizedException({ error: { code: "unauthenticated" } });
  }

  if (!sessions) {
    throw new ServiceUnavailableException({
      error: { code: "authentication_unavailable" },
    });
  }

  let user: SignedInUser | null;
  try {
    user = await sessions.getUser(token, new Date());
  } catch {
    throw new ServiceUnavailableException({
      error: { code: "authentication_unavailable" },
    });
  }

  if (!user) {
    throw new UnauthorizedException({ error: { code: "unauthenticated" } });
  }

  return user;
}
