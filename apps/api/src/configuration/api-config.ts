import { isIP } from "node:net";

const DEFAULT_API_HOST = "127.0.0.1";
const DEFAULT_API_PORT = 3001;
const MIN_API_PORT = 0;
const MAX_API_PORT = 65535;

export interface ApiConfig {
  readonly host: string;
  readonly port: number;
}

export class ApiConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiConfigurationError";
  }
}

export function readApiConfig(
  environment: Readonly<Record<string, string | undefined>>,
): ApiConfig {
  const host = environment.API_HOST ?? DEFAULT_API_HOST;
  const portText = environment.API_PORT ?? String(DEFAULT_API_PORT);
  const port = Number(portText);

  if (isIP(host) === 0) {
    throw new ApiConfigurationError(
      "API_HOST must be an IPv4 or IPv6 address.",
    );
  }

  const isValidPort =
    Number.isInteger(port) &&
    port >= MIN_API_PORT &&
    port <= MAX_API_PORT &&
    String(port) === portText;

  if (!isValidPort) {
    throw new ApiConfigurationError(
      "API_PORT must be an integer from 0 to 65535.",
    );
  }

  return { host, port };
}
