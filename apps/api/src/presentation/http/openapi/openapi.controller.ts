import { Controller, Get, Header } from "@nestjs/common";

const OPENAPI_DOCUMENT = {
  openapi: "3.0.3",
  info: { title: "Social Media Automation API", version: "0.0.0" },
  paths: {
    "/health": {
      get: {
        operationId: "getHealth",
        summary: "Check HTTP liveness",
        responses: {
          "200": {
            description: "The API can serve HTTP requests.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["status", "service"],
                  properties: {
                    status: { type: "string", enum: ["ok"] },
                    service: { type: "string", enum: ["api"] },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/ready": {
      get: {
        operationId: "getReadiness",
        summary: "Check PostgreSQL readiness",
        responses: {
          "200": {
            description: "PostgreSQL answered the readiness query.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["status"],
                  properties: { status: { type: "string", enum: ["ready"] } },
                },
              },
            },
          },
          "503": {
            description: "The database is unavailable or unconfigured.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["error"],
                  properties: {
                    error: {
                      type: "object",
                      required: ["code"],
                      properties: {
                        code: {
                          type: "string",
                          enum: ["database_unavailable"],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

@Controller("openapi.json")
export class OpenApiController {
  @Get()
  @Header("Cache-Control", "no-store")
  getDocument(): typeof OPENAPI_DOCUMENT {
    return OPENAPI_DOCUMENT;
  }
}
