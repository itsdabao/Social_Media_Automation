import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Header,
  Headers,
  HttpCode,
  Inject,
  Post,
  Res,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import type { PasswordSessionService } from "@social-media/backend/auth";
import { parseLoginInput } from "@social-media/contracts/auth";
import type { SignedInUser } from "@social-media/contracts/auth";
import { formatSessionCookie, readSessionToken } from "./session-cookie.js";
import { requireSignedInUser } from "./require-signed-in-user.js";

export const PASSWORD_SESSION_SERVICE = Symbol("PASSWORD_SESSION_SERVICE");

interface CookieResponse {
  setHeader(name: string, value: string): void;
}

function rejectDirectBrowserMutation(origin: string | undefined): void {
  // The same-origin web proxy checks Origin and does not forward it to Nest.
  if (origin !== undefined) {
    throw new ForbiddenException({ error: { code: "origin_not_allowed" } });
  }
}

@Controller("auth")
export class AuthController {
  constructor(
    @Inject(PASSWORD_SESSION_SERVICE)
    private readonly sessions: PasswordSessionService | null,
  ) {}

  @Post("login")
  @HttpCode(200)
  @Header("Cache-Control", "no-store")
  async login(
    @Body() body: unknown,
    @Headers("origin") origin: string | undefined,
    @Res({ passthrough: true }) response: CookieResponse,
  ): Promise<SignedInUser> {
    rejectDirectBrowserMutation(origin);
    const input = parseLoginInput(body);
    if (!input) {
      throw new BadRequestException({ error: { code: "invalid_login_input" } });
    }

    const session = await this.withSessions((sessions) =>
      sessions.login(input.email, input.password, new Date()),
    );
    if (!session) {
      throw new UnauthorizedException({
        error: { code: "invalid_credentials" },
      });
    }

    response.setHeader(
      "Set-Cookie",
      formatSessionCookie(
        session.token,
        session.expiresAt,
        process.env.NODE_ENV === "production",
      ),
    );
    return session.user;
  }

  @Get("me")
  @Header("Cache-Control", "no-store")
  async me(
    @Headers("cookie") cookieHeader: string | undefined,
  ): Promise<SignedInUser> {
    return requireSignedInUser(cookieHeader, this.sessions);
  }

  @Post("logout")
  @HttpCode(204)
  @Header("Cache-Control", "no-store")
  async logout(
    @Headers("origin") origin: string | undefined,
    @Headers("cookie") cookieHeader: string | undefined,
    @Res({ passthrough: true }) response: CookieResponse,
  ): Promise<void> {
    rejectDirectBrowserMutation(origin);
    const token = readSessionToken(cookieHeader);
    if (token) {
      await this.withSessions((sessions) => sessions.logout(token));
    }

    response.setHeader(
      "Set-Cookie",
      formatSessionCookie(
        "",
        new Date(0),
        process.env.NODE_ENV === "production",
      ),
    );
  }

  private async withSessions<Result>(
    action: (sessions: PasswordSessionService) => Promise<Result>,
  ): Promise<Result> {
    if (!this.sessions) {
      throw new ServiceUnavailableException({
        error: { code: "authentication_unavailable" },
      });
    }

    try {
      return await action(this.sessions);
    } catch {
      throw new ServiceUnavailableException({
        error: { code: "authentication_unavailable" },
      });
    }
  }
}
