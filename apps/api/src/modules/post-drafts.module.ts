import { Module } from "@nestjs/common";
import {
  createPostDraft,
  deletePostDraft,
  DraftStorageError,
  findPostDraft,
  listPostDrafts,
  PrismaPostDraftRepository,
  updatePostDraftCaption,
} from "@social-media/backend/post-drafts";
import {
  CREATE_DRAFT,
  DELETE_DRAFT,
  FIND_DRAFT,
  LIST_DRAFTS,
  PostDraftsController,
  UPDATE_DRAFT_CAPTION,
} from "../presentation/http/post-drafts/post-drafts.controller.js";
import type {
  CreateDraft,
  DeleteDraft,
  FindDraft,
  ListDrafts,
  UpdateDraftCaption,
} from "../presentation/http/post-drafts/post-drafts.controller.js";
import { AuthModule } from "./auth.module.js";
import { DatabaseConnection, DatabaseModule } from "./database.module.js";

const POST_DRAFT_REPOSITORY = Symbol("POST_DRAFT_REPOSITORY");

function requireRepository(
  repository: PrismaPostDraftRepository | null,
): PrismaPostDraftRepository {
  if (!repository) {
    throw new DraftStorageError("unavailable");
  }

  return repository;
}

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [PostDraftsController],
  providers: [
    {
      provide: POST_DRAFT_REPOSITORY,
      inject: [DatabaseConnection],
      useFactory: (
        database: DatabaseConnection,
      ): PrismaPostDraftRepository | null =>
        database.client ? new PrismaPostDraftRepository(database.client) : null,
    },
    {
      provide: CREATE_DRAFT,
      inject: [POST_DRAFT_REPOSITORY],
      useFactory:
        (repository: PrismaPostDraftRepository | null): CreateDraft =>
        async (ownerId, caption) =>
          createPostDraft(requireRepository(repository), ownerId, caption),
    },
    {
      provide: FIND_DRAFT,
      inject: [POST_DRAFT_REPOSITORY],
      useFactory:
        (repository: PrismaPostDraftRepository | null): FindDraft =>
        async (input) =>
          findPostDraft(requireRepository(repository), input),
    },
    {
      provide: LIST_DRAFTS,
      inject: [POST_DRAFT_REPOSITORY],
      useFactory:
        (repository: PrismaPostDraftRepository | null): ListDrafts =>
        async (ownerId) =>
          listPostDrafts(requireRepository(repository), ownerId),
    },
    {
      provide: UPDATE_DRAFT_CAPTION,
      inject: [POST_DRAFT_REPOSITORY],
      useFactory:
        (repository: PrismaPostDraftRepository | null): UpdateDraftCaption =>
        async (input) =>
          updatePostDraftCaption(requireRepository(repository), input),
    },
    {
      provide: DELETE_DRAFT,
      inject: [POST_DRAFT_REPOSITORY],
      useFactory:
        (repository: PrismaPostDraftRepository | null): DeleteDraft =>
        async (input) =>
          deletePostDraft(requireRepository(repository), input),
    },
  ],
})
export class PostDraftsModule {}
