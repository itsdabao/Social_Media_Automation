import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module.js";

export async function createApi(): Promise<NestExpressApplication> {
  const application = await NestFactory.create<NestExpressApplication>(
    AppModule,
    {
      // main.ts reports sanitized startup errors instead of raw framework exceptions.
      logger: false,
      // Reject the startup Promise so main.ts can close resources and report failure.
      abortOnError: false,
    },
  );

  application.disable("x-powered-by");
  application.enableShutdownHooks(["SIGINT", "SIGTERM"]);

  return application;
}
