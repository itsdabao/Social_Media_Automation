export interface CreatePostDraftRequest {
  readonly caption: string;
}

export function parseCreatePostDraftRequest(
  input: unknown,
): CreatePostDraftRequest | null {
  if (typeof input !== "object" || input === null) {
    return null;
  }

  if (!("caption" in input) || typeof input.caption !== "string") {
    return null;
  }

  const caption = input.caption.trim();
  if (caption.length === 0 || caption.includes("\u0000")) {
    return null;
  }

  return { caption };
}
