import { Module } from "@nestjs/common";
import type { OnModuleDestroy } from "@nestjs/common";
import {
  createPrismaClient,
  pingDatabase,
} from "@social-media/backend/database";
import { DATABASE_READINESS } from "../presentation/http/health/database-readiness.js";
import type { DatabaseReadiness } from "../presentation/http/health/database-readiness.js";

type DatabaseClient = ReturnType<typeof createPrismaClient>;

export class DatabaseConnection implements DatabaseReadiness, OnModuleDestroy {
  constructor(readonly client: DatabaseClient | null) {}

  async isReady(): Promise<boolean> {
    if (this.client === null) {
      return false;
    }

    try {
      await pingDatabase(this.client);
      return true;
    } catch {
      return false;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.$disconnect();
  }
}

@Module({
  providers: [
    {
      provide: DatabaseConnection,
      useFactory: (): DatabaseConnection => {
        const databaseUrl = process.env.DATABASE_URL?.trim();

        if (!databaseUrl) {
          return new DatabaseConnection(null);
        }

        return new DatabaseConnection(createPrismaClient(databaseUrl));
      },
    },
    { provide: DATABASE_READINESS, useExisting: DatabaseConnection },
  ],
  exports: [DatabaseConnection, DATABASE_READINESS],
})
export class DatabaseModule {}
