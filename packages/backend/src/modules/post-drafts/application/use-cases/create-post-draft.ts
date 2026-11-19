import type {
  PostDraft,
  PostDraftRepository,
} from "../ports/post-draft.repository.port.js";

export async function createPostDraft(
  repository: Pick<PostDraftRepository, "create">,
  ownerId: string,
  caption: string,
): Promise<PostDraft> {
  return repository.create({ ownerId, caption });
}
