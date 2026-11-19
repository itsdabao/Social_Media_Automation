import type { NextRequest } from "next/server.js";
import { forwardAuth } from "../../../../features/auth/server/auth-api.ts";

export function POST(request: NextRequest): Promise<Response> {
  return forwardAuth(request, "login");
}
