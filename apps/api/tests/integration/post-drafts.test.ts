import assert from "node:assert/strict";
import test from "node:test";
import type { TestContext } from "node:test";
import { Logger } from "@nestjs/common";
import { MODULE_METADATA } from "@nestjs/common/constants.js";
import { createApi } from "../../src/bootstrap/create-api.js";
import { AuthModule } from "../../src/modules/auth.module.js";
import {
  DatabaseConnection,
  DatabaseModule,
} from "../../src/modules/database.module.js";
import { PASSWORD_SESSION_SERVICE } from "../../src/presentation/http/auth/auth.controller.js";

interface TestFactory {
  readonly provide: unknown;
  useFactory: () => unknown;
}

function isTestFactory(value: unknown): value is TestFactory {
  return (
    typeof value === "object" &&
    value !== null &&
    "provide" in value &&
    "useFactory" in value &&
    typeof value.useFactory === "function"
  );
}

function mockFactory(
  context: TestContext,
  module: typeof AuthModule | typeof DatabaseModule,
  token: unknown,
  create: () => unknown,
): void {
  const providers: unknown = Reflect.getMetadata(
    MODULE_METADATA.PROVIDERS,
    module,
  );
  assert.ok(Array.isArray(providers));
  const factory = providers
    .filter(isTestFactory)
    .find((provider) => provider.provide === token);
  assert.ok(factory);
  context.mock.method(factory, "useFactory", create);
}

const OWNER_TOKEN = "a".repeat(43);
const OTHER_TOKEN = "b".repeat(43);
const OWNER_COOKIE = { Cookie: `social_media_session=${OWNER_TOKEN}` };
const OTHER_COOKIE = { Cookie: `social_media_session=${OTHER_TOKEN}` };

async function startTestApi(
  context: TestContext,
  client: object | null,
): Promise<string> {
  mockFactory(context, DatabaseModule, DatabaseConnection, () => ({
    client,
    onModuleDestroy: () => Promise.resolve(),
  }));
  mockFactory(context, AuthModule, PASSWORD_SESSION_SERVICE, () => ({
    getUser(token: string) {
      if (token === OWNER_TOKEN) {
        return Promise.resolve({ id: "owner", email: "owner@example.test" });
      }
      if (token === OTHER_TOKEN) {
        return Promise.resolve({ id: "other", email: "other@example.test" });
      }
      return Promise.resolve(null);
    },
  }));
  const app = await createApi();
  context.after(() => app.close());
  await app.listen(0, "127.0.0.1");
  return app.getUrl();
}

function send(
  baseUrl: string,
  path: string,
  options?: RequestInit,
): Promise<Response> {
  return fetch(baseUrl + path, {
    ...options,
    signal: AbortSignal.timeout(5000),
  });
}

function captionRequest(
  method: "POST" | "PATCH",
  cookie: { Cookie: string },
  caption: string,
): RequestInit {
  return {
    method,
    headers: { ...cookie, "Content-Type": "application/json" },
    body: JSON.stringify({ caption }),
  };
}

async function expectError(
  response: Response,
  status: number,
  code: string,
): Promise<void> {
  assert.equal(response.status, status);
  assert.deepEqual(await response.json(), { error: { code } });
}

await test("draft routes enforce ownership and validate captions before writing", async (context) => {
  type DraftRow = { id: string; ownerId: string; caption: string };
  type DraftKey = { id: string; ownerId?: string };
  const rows: DraftRow[] = [];
  const matches = (row: DraftRow, where: DraftKey): boolean =>
    row.id === where.id &&
    (where.ownerId === undefined || row.ownerId === where.ownerId);
  const url = await startTestApi(context, {
    postDraft: {
      create({ data }: { data: Omit<DraftRow, "id"> }) {
        const row = { id: "draft-1", ...data };
        rows.push(row);
        return Promise.resolve(row);
      },
      findMany({ where }: { where: { ownerId: string } }) {
        return Promise.resolve(
          rows.filter((row) => row.ownerId === where.ownerId),
        );
      },
      findFirst({ where }: { where: DraftKey }) {
        return Promise.resolve(rows.find((row) => matches(row, where)) ?? null);
      },
      updateManyAndReturn({
        where,
        data,
      }: {
        where: DraftKey;
        data: { caption: string };
      }) {
        const row = rows.find((candidate) => matches(candidate, where));
        if (!row) {
          return Promise.resolve([]);
        }
        row.caption = data.caption;
        return Promise.resolve([row]);
      },
      deleteMany({ where }: { where: DraftKey }) {
        const index = rows.findIndex((row) => matches(row, where));
        if (index === -1) {
          return Promise.resolve({ count: 0 });
        }
        rows.splice(index, 1);
        return Promise.resolve({ count: 1 });
      },
    },
  });

  const invalidCaption = "draft\u0000";
  await expectError(
    await send(
      url,
      "/drafts",
      captionRequest("POST", OWNER_COOKIE, invalidCaption),
    ),
    400,
    "invalid_caption",
  );
  assert.equal(rows.length, 0);

  const created = await send(
    url,
    "/drafts",
    captionRequest("POST", OWNER_COOKIE, "123151"),
  );
  assert.equal(created.status, 201);
  assert.deepEqual(await created.json(), { id: "draft-1", caption: "123151" });
  const path = "/drafts/draft-1";

  await expectError(await send(url, path), 401, "unauthenticated");
  const otherList = await send(url, "/drafts", { headers: OTHER_COOKIE });
  assert.equal(otherList.status, 200);
  assert.deepEqual(await otherList.json(), []);
  await expectError(
    await send(url, path, { headers: OTHER_COOKIE }),
    404,
    "draft_not_found",
  );
  await expectError(
    await send(url, path, captionRequest("PATCH", OTHER_COOKIE, "other")),
    404,
    "draft_not_found",
  );
  await expectError(
    await send(url, path, { method: "DELETE", headers: OTHER_COOKIE }),
    404,
    "draft_not_found",
  );
  await expectError(
    await send(
      url,
      path,
      captionRequest("PATCH", OWNER_COOKIE, invalidCaption),
    ),
    400,
    "invalid_caption",
  );
  assert.deepEqual(rows, [
    { id: "draft-1", ownerId: "owner", caption: "123151" },
  ]);

  const updated = await send(
    url,
    path,
    captionRequest("PATCH", OWNER_COOKIE, "  Ảnh mô tả  "),
  );
  assert.equal(updated.status, 200);
  assert.deepEqual(await updated.json(), {
    id: "draft-1",
    caption: "Ảnh mô tả",
  });
  const ownedList = await send(url, "/drafts", { headers: OWNER_COOKIE });
  const ownedDraft = await send(url, path, { headers: OWNER_COOKIE });
  assert.equal(ownedDraft.status, 200);
  assert.deepEqual(await ownedDraft.json(), {
    id: "draft-1",
    caption: "Ảnh mô tả",
  });
  assert.equal(ownedList.status, 200);
  assert.deepEqual(await ownedList.json(), [
    { id: "draft-1", caption: "Ảnh mô tả" },
  ]);

  const deleted = await send(url, path, {
    method: "DELETE",
    headers: OWNER_COOKIE,
  });
  assert.equal(deleted.status, 204);
  assert.equal(await deleted.text(), "");
  await expectError(
    await send(url, path, { headers: OWNER_COOKIE }),
    404,
    "draft_not_found",
  );

  const spec = await send(url, "/openapi.json");
  assert.equal(spec.status, 200);
  assert.partialDeepStrictEqual(await spec.json(), {
    paths: {
      "/drafts": {
        post: { operationId: "createDraft" },
        get: { operationId: "listDrafts" },
      },
      "/drafts/{draftId}": {
        get: { operationId: "getDraft" },
        patch: { operationId: "updateDraftCaption" },
        delete: { operationId: "deleteDraft", responses: { "204": {} } },
      },
    },
  });
});

await test("draft routes return a stable error when storage is unavailable", async (context) => {
  const baseUrl = await startTestApi(context, null);
  await expectError(
    await send(baseUrl, "/drafts", { headers: OWNER_COOKIE }),
    503,
    "database_unavailable",
  );
});

await test("draft routes hide unexpected storage error messages", async (context) => {
  const log = context.mock.method(Logger.prototype, "error", () => {});
  const baseUrl = await startTestApi(context, {
    postDraft: {
      findMany() {
        return Promise.reject(new Error("private storage detail"));
      },
    },
  });
  await expectError(
    await send(baseUrl, "/drafts", { headers: OWNER_COOKIE }),
    500,
    "draft_storage_failed",
  );
  assert.deepEqual(
    log.mock.calls.map((call) => call.arguments),
    [[{ event: "draft.storage_failed", code: "draft_storage_failed" }]],
  );
});
