import { Controller, Get, Header } from "@nestjs/common";
import type { ApiHealthResponse } from "@social-media/contracts/health";

@Controller("health")
export class HealthController {
  @Get()
  @Header("Cache-Control", "no-store")
  getHealth(): ApiHealthResponse {
    return { status: "ok", service: "api" };
  }
}
