import { Controller, Get, Header } from "@nestjs/common";

const OPENAPI_DOCUMENT = {
  openapi: "3.0.3",
  info: { title: "Social Media Automation API", version: "0.0.0" },
  components: {
    securitySchemes: {
      sessionCookie: {
        type: "apiKey",
        in: "cookie",
        name: "social_media_session",
      },
    },
    schemas: {
      SignedInUser: {
        type: "object",
        required: ["id", "email"],
        properties: {
          id: { type: "string" },
          email: { type: "string", format: "email" },
        },
      },
    },
  },
  paths: {
    "/auth/login": {
      post: {
        operationId: "login",
        summary: "Sign in with a local email and password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", format: "password" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Signed in and issued a session cookie.",
            headers: { "Set-Cookie": { schema: { type: "string" } } },
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SignedInUser" },
              },
            },
          },
          "400": { description: "The login payload is invalid." },
          "401": { description: "The email or password is incorrect." },
          "403": {
            description: "The browser must sign in through the web origin.",
          },
          "503": { description: "Authentication is unavailable." },
        },
      },
    },
    "/auth/me": {
      get: {
        operationId: "getCurrentUser",
        summary: "Read the user associated with the current session",
        security: [{ sessionCookie: [] }],
        responses: {
          "200": {
            description: "The signed-in user.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SignedInUser" },
              },
            },
          },
          "401": {
            description: "The session is missing, expired, or revoked.",
          },
          "503": { description: "Authentication is unavailable." },
        },
      },
    },
    "/auth/logout": {
      post: {
        operationId: "logout",
        summary: "Revoke the current session and clear its cookie",
        security: [{ sessionCookie: [] }, {}],
        responses: {
          "204": { description: "The browser session cookie was cleared." },
          "403": {
            description: "The browser must sign out through the web origin.",
          },
          "503": { description: "Authentication is unavailable." },
        },
      },
    },
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
