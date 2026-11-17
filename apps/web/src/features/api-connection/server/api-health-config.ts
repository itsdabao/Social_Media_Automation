const DEFAULT_API_BASE_URL = "http://127.0.0.1:3001";

export function readApiHealthEndpoint(apiBaseUrl: string | undefined): URL {
  const endpoint = new URL(apiBaseUrl ?? DEFAULT_API_BASE_URL);
  const isHttpProtocol =
    endpoint.protocol === "http:" || endpoint.protocol === "https:";
  const hasCredentials = endpoint.username !== "" || endpoint.password !== "";
  const hasExtraUrlParts =
    endpoint.pathname !== "/" || endpoint.search !== "" || endpoint.hash !== "";

  if (!isHttpProtocol || hasCredentials || hasExtraUrlParts) {
    throw new Error(
      "API_BASE_URL must be an HTTP(S) origin without credentials.",
    );
  }

  endpoint.pathname = "/health";
  return endpoint;
}
