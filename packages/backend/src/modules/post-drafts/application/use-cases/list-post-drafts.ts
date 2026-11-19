import type {
  PostDraft,
  PostDraftRepository,
} from "../ports/post-draft.repository.port.js";

export async function listPostDrafts(
  repository: Pick<PostDraftRepository, "listByOwner">,
  ownerId: string,
): Promise<readonly PostDraft[]> {
  return repository.listByOwner(ownerId);
}
