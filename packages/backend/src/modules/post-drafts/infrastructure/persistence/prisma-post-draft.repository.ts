import type { PrismaClient } from "../../../../../generated/prisma/client.js";
import type {
  CreatePostDraftInput,
  FindPostDraftInput,
  PostDraft,
  PostDraftRepository,
  UpdatePostDraftCaptionInput,
} from "../../application/ports/post-draft.repository.port.js";

export class PrismaPostDraftRepository implements PostDraftRepository {
  private readonly database: Pick<PrismaClient, "postDraft">;

  constructor(database: Pick<PrismaClient, "postDraft">) {
    this.database = database;
  }

  async create(input: CreatePostDraftInput): Promise<PostDraft> {
    return this.database.postDraft.create({
      data: {
        ownerId: input.ownerId,
        caption: input.caption,
      },
    });
  }

  async findById(input: FindPostDraftInput): Promise<PostDraft | null> {
    return this.database.postDraft.findFirst({
      where: {
        id: input.draftId,
        ownerId: input.ownerId,
      },
    });
  }

  async listByOwner(ownerId: string): Promise<readonly PostDraft[]> {
    return this.database.postDraft.findMany({
      where: { ownerId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
  }

  async updateCaption(
    input: UpdatePostDraftCaptionInput,
  ): Promise<PostDraft | null> {
    const [updatedDraft] = await this.database.postDraft.updateManyAndReturn({
      where: {
        id: input.draftId,
        ownerId: input.ownerId,
      },
      data: { caption: input.caption },
    });

    return updatedDraft ?? null;
  }

  async deleteById(
    input: FindPostDraftInput,
  ): Promise<"deleted" | "not_found"> {
    const result = await this.database.postDraft.deleteMany({
      where: {
        id: input.draftId,
        ownerId: input.ownerId,
      },
    });

    return result.count === 1 ? "deleted" : "not_found";
  }
}
