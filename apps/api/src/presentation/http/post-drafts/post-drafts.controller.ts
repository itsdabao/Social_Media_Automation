import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Header,
  Headers,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseFilters,
} from "@nestjs/common";
import type { PasswordSessionService } from "@social-media/backend/auth";
import type {
  createPostDraft,
  deletePostDraft,
  findPostDraft,
  listPostDrafts,
  updatePostDraftCaption,
} from "@social-media/backend/post-drafts";
import { parseCreatePostDraftRequest } from "@social-media/contracts/post-drafts";
import { PASSWORD_SESSION_SERVICE } from "../auth/auth.controller.js";
import { requireSignedInUser } from "../auth/require-signed-in-user.js";
import { DraftStorageFilter } from "./draft-storage.filter.js";

export const CREATE_DRAFT = Symbol("CREATE_DRAFT");

export type CreateDraft = (
  ownerId: string,
  caption: string,
) => ReturnType<typeof createPostDraft>;

export const FIND_DRAFT = Symbol("FIND_DRAFT");

export type FindDraft = (
  input: Parameters<typeof findPostDraft>[1],
) => ReturnType<typeof findPostDraft>;

export const LIST_DRAFTS = Symbol("LIST_DRAFTS");

export type ListDrafts = (ownerId: string) => ReturnType<typeof listPostDrafts>;

export const UPDATE_DRAFT_CAPTION = Symbol("UPDATE_DRAFT_CAPTION");

export type UpdateDraftCaption = (
  input: Parameters<typeof updatePostDraftCaption>[1],
) => ReturnType<typeof updatePostDraftCaption>;

export const DELETE_DRAFT = Symbol("DELETE_DRAFT");

export type DeleteDraft = (
  input: Parameters<typeof deletePostDraft>[1],
) => ReturnType<typeof deletePostDraft>;

interface DraftResponse {
  readonly id: string;
  readonly caption: string;
}

function rejectDirectBrowserMutation(origin: string | undefined): void {
  if (origin !== undefined) {
    throw new ForbiddenException({ error: { code: "origin_not_allowed" } });
  }
}

function readDraftCaption(body: unknown): string {
  const input = parseCreatePostDraftRequest(body);
  if (!input) {
    throw new BadRequestException({ error: { code: "invalid_caption" } });
  }

  return input.caption;
}

@Controller("drafts")
@UseFilters(DraftStorageFilter)
export class PostDraftsController {
  constructor(
    @Inject(PASSWORD_SESSION_SERVICE)
    private readonly sessions: PasswordSessionService | null,
    @Inject(CREATE_DRAFT)
    private readonly createDraft: CreateDraft,
    @Inject(FIND_DRAFT)
    private readonly findDraft: FindDraft,
    @Inject(LIST_DRAFTS)
    private readonly listDrafts: ListDrafts,
    @Inject(UPDATE_DRAFT_CAPTION)
    private readonly updateDraftCaption: UpdateDraftCaption,
    @Inject(DELETE_DRAFT)
    private readonly deleteDraft: DeleteDraft,
  ) {}

  @Post()
  @Header("Cache-Control", "no-store")
  async create(
    @Body() body: unknown,
    @Headers("cookie") cookieHeader: string | undefined,
    @Headers("origin") origin: string | undefined,
  ): Promise<DraftResponse> {
    rejectDirectBrowserMutation(origin);
    const user = await requireSignedInUser(cookieHeader, this.sessions);
    const caption = readDraftCaption(body);
    const draft = await this.createDraft(user.id, caption);
    return { id: draft.id, caption: draft.caption };
  }

  @Get()
  @Header("Cache-Control", "no-store")
  async listByOwner(
    @Headers("cookie") cookieHeader: string | undefined,
  ): Promise<readonly DraftResponse[]> {
    const user = await requireSignedInUser(cookieHeader, this.sessions);
    const drafts = await this.listDrafts(user.id);
    return drafts.map(({ id, caption }) => ({ id, caption }));
  }

  @Get(":draftId")
  @Header("Cache-Control", "no-store")
  async findById(
    @Param("draftId") draftId: string,
    @Headers("cookie") cookieHeader: string | undefined,
  ): Promise<DraftResponse> {
    const user = await requireSignedInUser(cookieHeader, this.sessions);
    const draft = await this.findDraft({ draftId, ownerId: user.id });

    if (!draft) {
      throw new NotFoundException({ error: { code: "draft_not_found" } });
    }

    return { id: draft.id, caption: draft.caption };
  }

  @Patch(":draftId")
  @Header("Cache-Control", "no-store")
  async updateCaption(
    @Param("draftId") draftId: string,
    @Body() body: unknown,
    @Headers("cookie") cookieHeader: string | undefined,
    @Headers("origin") origin: string | undefined,
  ): Promise<DraftResponse> {
    rejectDirectBrowserMutation(origin);
    const user = await requireSignedInUser(cookieHeader, this.sessions);
    const caption = readDraftCaption(body);
    const draft = await this.updateDraftCaption({
      draftId,
      ownerId: user.id,
      caption,
    });

    if (!draft) {
      throw new NotFoundException({ error: { code: "draft_not_found" } });
    }

    return { id: draft.id, caption: draft.caption };
  }

  @Delete(":draftId")
  @HttpCode(204)
  @Header("Cache-Control", "no-store")
  async deleteById(
    @Param("draftId") draftId: string,
    @Headers("cookie") cookieHeader: string | undefined,
    @Headers("origin") origin: string | undefined,
  ): Promise<void> {
    rejectDirectBrowserMutation(origin);
    const user = await requireSignedInUser(cookieHeader, this.sessions);
    const result = await this.deleteDraft({ draftId, ownerId: user.id });

    if (result === "not_found") {
      throw new NotFoundException({ error: { code: "draft_not_found" } });
    }
  }
}
