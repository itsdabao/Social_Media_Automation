import type {
  FindPostDraftInput,
  PostDraft,
  PostDraftRepository,
} from "../ports/post-draft.repository.port.js";

export async function findPostDraft(
  repository: Pick<PostDraftRepository, "findById">,
  input: FindPostDraftInput,
): Promise<PostDraft | null> {
  return repository.findById(input);
}
