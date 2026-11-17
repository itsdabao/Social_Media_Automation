import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { randomBytes } from "node:crypto";
import {
  appendFile,
  mkdir,
  mkdtemp,
  readFile,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const executeFile = promisify(execFile);
const root = fileURLToPath(new URL("../../", import.meta.url));
const COMMAND_TIMEOUT_MS = 60_000;
const STARTUP_TIMEOUT_MS = 15 * 60_000;

await test(
  "local services initialize, retain data across recreation and recover from restart",
  {
    timeout: 20 * 60_000,
  },
  async (context) => {
    const fixtures = join(root, ".task-checks");
    await mkdir(fixtures, { recursive: true });
    const directory = await mkdtemp(join(fixtures, "local-infra-"));
    const projectName = `social-media-infra-check-${randomBytes(5).toString("hex")}`;
    const environmentPath = join(directory, ".env");
    const logPath = join(directory, "docker.log");
    const settings = {
      APP_POSTGRES_PASSWORD: randomBytes(24).toString("hex"),
      TEMPORAL_POSTGRES_PASSWORD: randomBytes(24).toString("hex"),
      MINIO_ROOT_USER: "infra-check",
      MINIO_ROOT_PASSWORD: randomBytes(24).toString("hex"),
      APP_POSTGRES_PORT: "0",
      TEMPORAL_PORT: "0",
      TEMPORAL_UI_PORT: "0",
      MINIO_API_PORT: "0",
      MINIO_CONSOLE_PORT: "0",
      TEMPORAL_NAMESPACE: "infra-check",
    };
    await writeFile(
      environmentPath,
      Object.entries(settings)
        .map(([key, value]) => `${key}=${value}`)
        .join("\n") + "\n",
      { flag: "wx" },
    );

    function redactCredentials(value) {
      let redacted = value;
      for (const [key, password] of Object.entries(settings)) {
        if (key.endsWith("_PASSWORD")) {
          redacted = redacted.replaceAll(password, "[redacted]");
        }
      }
      return redacted;
    }

    async function compose(args, timeout = COMMAND_TIMEOUT_MS) {
      const commandArgs = [
        "compose",
        "--project-name",
        projectName,
        "--env-file",
        environmentPath,
        "--file",
        join(root, "infra/local/compose.yaml"),
        ...args,
      ];
      try {
        const result = await executeFile("docker", commandArgs, {
          cwd: root,
          env: { ...process.env, ...settings },
          encoding: "utf8",
          maxBuffer: 8 * 1024 * 1024,
          timeout,
          windowsHide: true,
        });
        return result.stdout.trim();
      } catch (error) {
        const output = String(error.stdout ?? "") + String(error.stderr ?? "");
        await appendFile(logPath, redactCredentials(output) + "\n");
        for (const key of ["message", "stack", "stdout", "stderr", "cmd"]) {
          if (typeof error[key] === "string") {
            error[key] = redactCredentials(error[key]);
          }
        }
        throw new Error(
          `Local infrastructure command failed. Inspect ${logPath}.`,
          { cause: error },
        );
      }
    }

    async function queryDatabase(service, database, user, sql) {
      return compose([
        "exec",
        "--no-TTY",
        service,
        "psql",
        "--username",
        user,
        "--dbname",
        database,
        "--no-psqlrc",
        "--set",
        "ON_ERROR_STOP=1",
        "--tuples-only",
        "--no-align",
        "--command",
        sql,
      ]);
    }

    async function temporal(args) {
      return compose([
        "run",
        "--rm",
        "--no-deps",
        "--entrypoint",
        "temporal",
        "temporal-namespace",
        "--address",
        "temporal:7233",
        "--namespace",
        settings.TEMPORAL_NAMESPACE,
        ...args,
      ]);
    }

    // Cleanup is restricted to the fresh, randomly named test project.
    // Fixture files/logs are retained; developer databases and volumes are never used.
    context.after(async () => {
      assert.match(projectName, /^social-media-infra-check-[a-f0-9]{10}$/);
      try {
        const logs = await compose(["logs", "--no-color", "--tail", "100"]);
        await appendFile(logPath, redactCredentials(logs) + "\n");
      } finally {
        await compose(["down", "--volumes"], 120_000);
      }
    });

    for (const filename of ["setup-schema.sh", "setup-namespace.sh"]) {
      const script = await readFile(
        join(root, "infra/services/temporal", filename),
        "utf8",
      );
      assert.ok(
        !script.includes("\r"),
        `${filename} must have LF line endings`,
      );
    }
    await compose(["config", "--quiet"]);
    await compose(
      ["up", "--build", "--detach", "--wait", "--wait-timeout", "180"],
      STARTUP_TIMEOUT_MS,
    );

    const appTables = await queryDatabase(
      "app-postgres",
      "social_media",
      "social_media_app",
      "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';",
    );
    assert.equal(
      appTables,
      "0",
      "Temporal tables must never enter the application database",
    );

    const temporalDatabases = await queryDatabase(
      "temporal-postgres",
      "postgres",
      "temporal",
      "SELECT datname FROM pg_database WHERE datname IN ('temporal','temporal_visibility') ORDER BY datname;",
    );
    assert.equal(temporalDatabases, "temporal\ntemporal_visibility");
    await temporal(["operator", "cluster", "health"]);
    await temporal(["operator", "namespace", "describe"]);

    const uiAddress = await compose(["port", "temporal-ui", "8080"]);
    const uiResponse = await fetch(`http://${uiAddress}`, {
      signal: AbortSignal.timeout(5000),
    });
    assert.equal(uiResponse.status, 200);
    await uiResponse.body?.cancel();

    const minioAddress = await compose(["port", "minio", "9000"]);
    const minioResponse = await fetch(
      `http://${minioAddress}/minio/health/ready`,
      {
        signal: AbortSignal.timeout(5000),
      },
    );
    assert.equal(minioResponse.status, 200);
    await minioResponse.body?.cancel();

    await queryDatabase(
      "app-postgres",
      "social_media",
      "social_media_app",
      "CREATE TABLE infrastructure_probe (value text NOT NULL); INSERT INTO infrastructure_probe VALUES ('retained');",
    );
    const s3Request =
      'curl --fail --silent --show-error --aws-sigv4 "aws:amz:us-east-1:s3" --user "$MINIO_ROOT_USER:$MINIO_ROOT_PASSWORD"';
    await compose([
      "exec",
      "--no-TTY",
      "minio",
      "sh",
      "-ec",
      `${s3Request} --request PUT http://127.0.0.1:9000/infra-check`,
    ]);
    await compose([
      "exec",
      "--no-TTY",
      "minio",
      "sh",
      "-ec",
      `${s3Request} --request PUT --data-binary retained http://127.0.0.1:9000/infra-check/probe.txt`,
    ]);

    // A pending workflow proves server-side persistence without pretending a worker exists.
    await temporal([
      "workflow",
      "start",
      "--workflow-id",
      "infrastructure-probe",
      "--task-queue",
      "infra-check",
      "--type",
      "InfrastructureProbe",
    ]);

    await compose(["down"], 120_000);
    await compose(
      ["up", "--detach", "--wait", "--wait-timeout", "180"],
      STARTUP_TIMEOUT_MS,
    );

    assert.equal(
      await queryDatabase(
        "app-postgres",
        "social_media",
        "social_media_app",
        "SELECT value FROM infrastructure_probe;",
      ),
      "retained",
    );
    const object = await compose([
      "exec",
      "--no-TTY",
      "minio",
      "sh",
      "-ec",
      `${s3Request} http://127.0.0.1:9000/infra-check/probe.txt`,
    ]);
    assert.equal(object, "retained");
    await temporal([
      "workflow",
      "describe",
      "--workflow-id",
      "infrastructure-probe",
    ]);

    // Re-running setup jobs must retain schema/data and accept an existing namespace.
    await compose(["run", "--rm", "--no-deps", "temporal-schema"]);
    await compose(["run", "--rm", "--no-deps", "temporal-namespace"]);
    await temporal(["operator", "cluster", "health"]);
  },
);
