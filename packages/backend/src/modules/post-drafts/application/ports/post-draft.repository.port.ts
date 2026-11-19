export class DraftStorageError extends Error {
  constructor(readonly kind: "unavailable" | "unexpected") {
    super(kind);
  }
}

export interface PostDraft {
  readonly id: string;
  readonly ownerId: string;
  readonly caption: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreatePostDraftInput {
  readonly ownerId: string;
  readonly caption: string;
}

export interface FindPostDraftInput {
  readonly ownerId: string;
  readonly draftId: string;
}

export interface PostDraftRepository {
  create(input: CreatePostDraftInput): Promise<PostDraft>;
  findById(input: FindPostDraftInput): Promise<PostDraft | null>;
  listByOwner(ownerId: string): Promise<readonly PostDraft[]>;
  updateCaption(input: UpdatePostDraftCaptionInput): Promise<PostDraft | null>;
  deleteById(input: FindPostDraftInput): Promise<"deleted" | "not_found">;
}

export interface UpdatePostDraftCaptionInput extends FindPostDraftInput {
  readonly caption: string;
}
