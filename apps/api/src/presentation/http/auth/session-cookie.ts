import {
  isSessionToken,
  SESSION_COOKIE_NAME,
} from "@social-media/contracts/auth";

export function readSessionToken(
  cookieHeader: string | undefined,
): string | null {
  const prefix = `${SESSION_COOKIE_NAME}=`;
  const cookies = cookieHeader?.split(";").map((cookie) => cookie.trim());
  const token = cookies
    ?.find((cookie) => cookie.startsWith(prefix))
    ?.slice(prefix.length);
  return isSessionToken(token) ? token : null;
}

export function formatSessionCookie(
  token: string,
  expiresAt: Date,
  isSecure: boolean,
): string {
  const attributes = [
    `${SESSION_COOKIE_NAME}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Expires=${expiresAt.toUTCString()}`,
  ];

  if (isSecure) {
    attributes.push("Secure");
  }

  return attributes.join("; ");
}
