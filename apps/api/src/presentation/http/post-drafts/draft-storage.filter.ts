import { Catch, HttpStatus, Logger } from "@nestjs/common";
import type { ArgumentsHost, ExceptionFilter } from "@nestjs/common";
import { DraftStorageError } from "@social-media/backend/post-drafts";

interface DraftErrorResponse {
  status(statusCode: number): {
    json(body: { error: { code: string } }): void;
  };
}

@Catch(DraftStorageError)
export class DraftStorageFilter implements ExceptionFilter<DraftStorageError> {
  private readonly logger = new Logger(DraftStorageFilter.name);

  catch(error: DraftStorageError, host: ArgumentsHost): void {
    const isUnavailable = error.kind === "unavailable";
    const status = isUnavailable
      ? HttpStatus.SERVICE_UNAVAILABLE
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const code = isUnavailable
      ? "database_unavailable"
      : "draft_storage_failed";

    this.logger.error({ event: "draft.storage_failed", code });
    const response = host.switchToHttp().getResponse<DraftErrorResponse>();
    response.status(status).json({ error: { code } });
  }
}
