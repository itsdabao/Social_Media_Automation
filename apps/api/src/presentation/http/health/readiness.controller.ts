import {
  Controller,
  Get,
  Header,
  Inject,
  ServiceUnavailableException,
} from "@nestjs/common";
import { DATABASE_READINESS } from "./database-readiness.js";
import type { DatabaseReadiness } from "./database-readiness.js";

interface ReadinessResponse {
  readonly status: "ready";
}

@Controller("ready")
export class ReadinessController {
  constructor(
    @Inject(DATABASE_READINESS)
    private readonly databaseReadiness: DatabaseReadiness,
  ) {}

  @Get()
  @Header("Cache-Control", "no-store")
  async getReadiness(): Promise<ReadinessResponse> {
    if (!(await this.databaseReadiness.isReady())) {
      throw new ServiceUnavailableException({
        error: { code: "database_unavailable" },
      });
    }

    return { status: "ready" };
  }
}
