import { defineConfig } from "prisma/config";

const databaseUrl = process.env.DATABASE_URL?.trim();

export default defineConfig({
  schema: "database/schema.prisma",
  migrations: {
    path: "database/migrations",
  },
  ...(databaseUrl ? { datasource: { url: databaseUrl } } : {}),
});
