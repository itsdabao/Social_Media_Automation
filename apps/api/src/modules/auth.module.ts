import { Module } from "@nestjs/common";
import { createPasswordSessionService } from "@social-media/backend/auth";
import type { PasswordSessionService } from "@social-media/backend/auth";
import {
  AuthController,
  PASSWORD_SESSION_SERVICE,
} from "../presentation/http/auth/auth.controller.js";
import { DatabaseConnection, DatabaseModule } from "./database.module.js";

@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
  providers: [
    {
      provide: PASSWORD_SESSION_SERVICE,
      inject: [DatabaseConnection],
      useFactory: (
        database: DatabaseConnection,
      ): PasswordSessionService | null => {
        return database.client
          ? createPasswordSessionService(database.client)
          : null;
      },
    },
  ],
  exports: [PASSWORD_SESSION_SERVICE],
})
export class AuthModule {}
