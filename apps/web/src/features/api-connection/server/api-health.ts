import { isApiHealthResponse } from "@social-media/contracts/health";
import type { ApiHealthResponse } from "@social-media/contracts/health";
import { readApiHealthEndpoint } from "./api-health-config.ts";

const API_HEALTH_TIMEOUT_MS = 3000;

export type ApiHealthCheckResult =
  | { readonly status: "connected"; readonly health: ApiHealthResponse }
  | { readonly status: "unavailable" }
  | { readonly status: "invalid_configuration" };

export async function checkApiHealth(
  apiBaseUrl: string | undefined,
): Promise<ApiHealthCheckResult> {
  let endpoint: URL;
  try {
    endpoint = readApiHealthEndpoint(apiBaseUrl);
  } catch {
    return { status: "invalid_configuration" };
  }

  try {
    const apiResponse = await fetch(endpoint, {
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(API_HEALTH_TIMEOUT_MS),
    });
    if (!apiResponse.ok) {
      await apiResponse.body?.cancel();
      return { status: "unavailable" };
    }

    const healthPayload: unknown = await apiResponse.json();
    if (!isApiHealthResponse(healthPayload)) {
      return { status: "unavailable" };
    }

    // Copy the public fields so unexpected upstream data cannot reach the browser.
    return {
      status: "connected",
      health: { status: healthPayload.status, service: healthPayload.service },
    };
  } catch {
    return { status: "unavailable" };
  }
}
