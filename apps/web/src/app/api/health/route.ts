import { checkApiHealth } from "../../../features/api-connection/server/api-health.ts";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export async function GET(): Promise<Response> {
  const result = await checkApiHealth(process.env.API_BASE_URL);

  switch (result.status) {
    case "connected":
      return Response.json(result.health, { headers: NO_STORE_HEADERS });
    case "unavailable":
      return Response.json(
        { error: { code: "api_unavailable" } },
        { status: 502, headers: NO_STORE_HEADERS },
      );
    case "invalid_configuration":
      return Response.json(
        { error: { code: "invalid_api_configuration" } },
        { status: 503, headers: NO_STORE_HEADERS },
      );
  }
}
