import { Module } from "@nestjs/common";
import { HealthController } from "../presentation/http/health/health.controller.js";
import { ReadinessController } from "../presentation/http/health/readiness.controller.js";
import { OpenApiController } from "../presentation/http/openapi/openapi.controller.js";
import { DatabaseModule } from "./database.module.js";
import { AuthModule } from "./auth.module.js";

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [HealthController, ReadinessController, OpenApiController],
})
export class AppModule {}
