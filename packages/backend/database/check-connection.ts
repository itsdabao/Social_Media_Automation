import { createPrismaClient } from "../src/infrastructure/database/create-prisma-client.ts";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required.");
}

const prisma = createPrismaClient(databaseUrl);

try {
  const rows = await prisma.$queryRaw`SELECT 1 AS ok`;
  console.log(rows);
} finally {
  await prisma.$disconnect();
}
