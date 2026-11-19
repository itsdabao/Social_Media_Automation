import type { NextRequest } from "next/server.js";
import { forwardAuth } from "../../../../features/auth/server/auth-api.ts";

export function GET(request: NextRequest): Promise<Response> {
  return forwardAuth(request, "me");
}
