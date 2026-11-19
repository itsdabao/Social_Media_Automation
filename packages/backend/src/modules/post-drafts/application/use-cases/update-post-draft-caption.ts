import type {
  PostDraft,
  PostDraftRepository,
  UpdatePostDraftCaptionInput,
} from "../ports/post-draft.repository.port.js";

export async function updatePostDraftCaption(
  repository: Pick<PostDraftRepository, "updateCaption">,
  input: UpdatePostDraftCaptionInput,
): Promise<PostDraft | null> {
  return repository.updateCaption(input);
}
