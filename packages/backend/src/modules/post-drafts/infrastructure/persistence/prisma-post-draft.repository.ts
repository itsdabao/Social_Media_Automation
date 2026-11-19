import { Prisma } from "../../../../../generated/prisma/client.js";
import type { PrismaClient } from "../../../../../generated/prisma/client.js";
import { DraftStorageError } from "../../application/ports/post-draft.repository.port.js";
import type {
  CreatePostDraftInput,
  FindPostDraftInput,
  PostDraft,
  PostDraftRepository,
  UpdatePostDraftCaptionInput,
} from "../../application/ports/post-draft.repository.port.js";

const DATABASE_UNAVAILABLE_CODES = new Set([
  "P1001",
  "P1002",
  "P1008",
  "P1017",
  "P2024",
]);

function readPrismaErrorCode(error: unknown): string | undefined {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code;
  }
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return error.errorCode;
  }
  return undefined;
}

async function runDraftQuery<Result>(
  query: () => Promise<Result>,
): Promise<Result> {
  try {
    return await query();
  } catch (error: unknown) {
    const code = readPrismaErrorCode(error);

    if (code !== undefined && DATABASE_UNAVAILABLE_CODES.has(code)) {
      throw new DraftStorageError("unavailable");
    }

    throw new DraftStorageError("unexpected");
  }
}

export class PrismaPostDraftRepository implements PostDraftRepository {
  private readonly database: Pick<PrismaClient, "postDraft">;

  constructor(database: Pick<PrismaClient, "postDraft">) {
    this.database = database;
  }

  async create(input: CreatePostDraftInput): Promise<PostDraft> {
    return runDraftQuery(() =>
      this.database.postDraft.create({
        data: {
          ownerId: input.ownerId,
          caption: input.caption,
        },
      }),
    );
  }

  async findById(input: FindPostDraftInput): Promise<PostDraft | null> {
    return runDraftQuery(() =>
      this.database.postDraft.findFirst({
        where: {
          id: input.draftId,
          ownerId: input.ownerId,
        },
      }),
    );
  }

  async listByOwner(ownerId: string): Promise<readonly PostDraft[]> {
    return runDraftQuery(() =>
      this.database.postDraft.findMany({
        where: { ownerId },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      }),
    );
  }

  async updateCaption(
    input: UpdatePostDraftCaptionInput,
  ): Promise<PostDraft | null> {
    const [updatedDraft] = await runDraftQuery(() =>
      this.database.postDraft.updateManyAndReturn({
        where: {
          id: input.draftId,
          ownerId: input.ownerId,
        },
        data: { caption: input.caption },
      }),
    );

    return updatedDraft ?? null;
  }

  async deleteById(
    input: FindPostDraftInput,
  ): Promise<"deleted" | "not_found"> {
    const result = await runDraftQuery(() =>
      this.database.postDraft.deleteMany({
        where: {
          id: input.draftId,
          ownerId: input.ownerId,
        },
      }),
    );

    return result.count === 1 ? "deleted" : "not_found";
  }
}
