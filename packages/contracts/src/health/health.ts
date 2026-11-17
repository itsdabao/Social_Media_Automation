export interface ApiHealthResponse {
  readonly status: "ok";
  readonly service: "api";
}

export function isApiHealthResponse(
  value: unknown,
): value is ApiHealthResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    value.status === "ok" &&
    "service" in value &&
    value.service === "api"
  );
}
