import { createPrismaClient } from "../src/infrastructure/database/create-prisma-client.ts";
import { hashPassword } from "../src/modules/auth/infrastructure/security/password-hash.ts";

interface LocalUserSeedConfig {
  readonly databaseUrl: string;
  readonly email: string;
  readonly password: string;
}

class SeedConfigError extends Error {}

function readSeedConfig(environment: NodeJS.ProcessEnv): LocalUserSeedConfig {
  const email = environment.LOCAL_AUTH_EMAIL?.trim().toLowerCase();
  const password = environment.LOCAL_AUTH_PASSWORD;
  const databaseUrl = environment.DATABASE_URL?.trim();

  if (!email || !/^[^\s@]+@[^\s@]+$/u.test(email) || !password?.trim()) {
    throw new SeedConfigError(
      "Set LOCAL_AUTH_EMAIL and LOCAL_AUTH_PASSWORD to seed a local user.",
    );
  }

  if (!databaseUrl || !URL.canParse(databaseUrl)) {
    throw new SeedConfigError(
      "Set DATABASE_URL to the local PostgreSQL connection URL.",
    );
  }

  const target = new URL(databaseUrl);
  const isPostgres = ["postgresql:", "postgres:"].includes(target.protocol);
  const isLoopback = ["127.0.0.1", "localhost", "[::1]"].includes(
    target.hostname,
  );
  if (!isPostgres || !isLoopback) {
    throw new SeedConfigError(
      "The local user seed requires a loopback PostgreSQL connection.",
    );
  }

  return { databaseUrl, email, password };
}

async function seedLocalUser(config: LocalUserSeedConfig): Promise<void> {
  const { databaseUrl, email, password } = config;
  const passwordHash = await hashPassword(password);
  const prisma = createPrismaClient(databaseUrl);
  try {
    const result = await prisma.user.createMany({
      data: { email, passwordHash },
      skipDuplicates: true,
    });
    if (result.count === 1) {
      console.log("Created a local user.");
    } else {
      console.log(
        "The local user already exists. Its password was left unchanged.",
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

try {
  const seedConfig = readSeedConfig(process.env);
  await seedLocalUser(seedConfig);
} catch (error: unknown) {
  process.exitCode = 1;
  if (error instanceof SeedConfigError) {
    console.error(error.message);
  } else {
    console.error(
      "Local user seed failed. Check PostgreSQL and the applied migrations.",
    );
  }
}
