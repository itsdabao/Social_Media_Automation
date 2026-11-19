import {
  isSessionToken,
  parseLoginInput,
  parseSignedInUser,
  SESSION_COOKIE_NAME,
} from "@social-media/contracts/auth";
import type { SignedInUser } from "@social-media/contracts/auth";
import type { NextRequest } from "next/server.js";
import { readApiOrigin } from "../../../server/api-origin.ts";

const AUTH_TIMEOUT_MS = 5000;
const DEFAULT_WEB_AUTH_ORIGIN = "http://127.0.0.1:3000";
const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

type AuthAction = "login" | "me" | "logout";
type CurrentUser =
  | { readonly status: "authenticated"; readonly user: SignedInUser }
  | { readonly status: "unauthenticated" }
  | { readonly status: "unavailable" };

async function requestAuth(
  action: AuthAction,
  token?: string,
  body?: string,
): Promise<Response> {
  const endpoint = new URL(
    `/auth/${action}`,
    readApiOrigin(process.env.API_BASE_URL),
  );
  const headers = new Headers();
  if (isSessionToken(token)) {
    headers.set("Cookie", `${SESSION_COOKIE_NAME}=${token}`);
  }
  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(endpoint, {
    method: action === "me" ? "GET" : "POST",
    headers,
    ...(body === undefined ? {} : { body }),
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(AUTH_TIMEOUT_MS),
  });
}

export async function readCurrentUser(
  token: string | undefined,
): Promise<CurrentUser> {
  if (!token) {
    return { status: "unauthenticated" };
  }

  try {
    const response = await requestAuth("me", token);
    if (!response.ok) {
      await response.body?.cancel();
      return {
        status: response.status === 401 ? "unauthenticated" : "unavailable",
      };
    }

    const user = parseSignedInUser(await response.json());
    return user ? { status: "authenticated", user } : { status: "unavailable" };
  } catch {
    return { status: "unavailable" };
  }
}

function authError(status: number, code: string): Response {
  return Response.json(
    { error: { code } },
    { status, headers: NO_STORE_HEADERS },
  );
}

export async function forwardAuth(
  request: NextRequest,
  action: AuthAction,
): Promise<Response> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (action === "me") {
    const currentUser = await readCurrentUser(token);
    if (currentUser.status === "authenticated") {
      return Response.json(currentUser.user, { headers: NO_STORE_HEADERS });
    }
    return currentUser.status === "unauthenticated"
      ? authError(401, "unauthenticated")
      : authError(503, "authentication_unavailable");
  }

  const allowedOrigin = process.env.WEB_AUTH_ORIGIN ?? DEFAULT_WEB_AUTH_ORIGIN;
  if (request.headers.get("origin") !== allowedOrigin) {
    return authError(403, "origin_not_allowed");
  }

  let loginBody: string | undefined;
  if (action === "login") {
    try {
      const input = parseLoginInput(await request.json());
      if (!input) {
        return authError(400, "invalid_login_input");
      }
      loginBody = JSON.stringify(input);
    } catch {
      return authError(400, "invalid_login_input");
    }
  }

  try {
    const response = await requestAuth(action, token, loginBody);
    if (!response.ok) {
      await response.body?.cancel();
      return response.status === 401
        ? authError(401, "invalid_credentials")
        : authError(503, "authentication_unavailable");
    }

    const sessionCookie = response.headers.get("set-cookie");
    if (!sessionCookie?.startsWith(`${SESSION_COOKIE_NAME}=`)) {
      await response.body?.cancel();
      return authError(503, "authentication_unavailable");
    }
    const headers = { ...NO_STORE_HEADERS, "Set-Cookie": sessionCookie };
    if (action === "logout" && response.status === 204) {
      return new Response(null, { status: 204, headers });
    }

    const user =
      action === "login" && response.status === 200
        ? parseSignedInUser(await response.json())
        : null;
    return user
      ? Response.json(user, { headers })
      : authError(503, "authentication_unavailable");
  } catch {
    return authError(503, "authentication_unavailable");
  }
}
