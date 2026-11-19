import type {
  FindPostDraftInput,
  PostDraftRepository,
} from "../ports/post-draft.repository.port.js";

export async function deletePostDraft(
  repository: Pick<PostDraftRepository, "deleteById">,
  input: FindPostDraftInput,
): Promise<"deleted" | "not_found"> {
  return repository.deleteById(input);
}
