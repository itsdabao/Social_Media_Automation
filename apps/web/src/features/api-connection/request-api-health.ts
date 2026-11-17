import { isApiHealthResponse } from "@social-media/contracts/health";

const HEALTH_REQUEST_TIMEOUT_MS = 6000;

export async function requestApiHealth(signal: AbortSignal): Promise<void> {
  const healthResponse = await fetch("/api/health", {
    cache: "no-store",
    signal: AbortSignal.any([
      signal,
      AbortSignal.timeout(HEALTH_REQUEST_TIMEOUT_MS),
    ]),
  });
  if (!healthResponse.ok) {
    await healthResponse.body?.cancel();
    throw new Error("API connection failed");
  }
  const healthPayload: unknown = await healthResponse.json();
  if (!isApiHealthResponse(healthPayload)) {
    throw new Error("Invalid health response");
  }
}
