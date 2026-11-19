import { PutObjectCommand } from "@aws-sdk/client-s3";
import type { S3Client } from "@aws-sdk/client-s3";

export interface UploadToSiloInput {
  readonly bucket: string;
  readonly key: string;
  readonly bytes: Buffer;
  readonly contentType: string;
}

export async function uploadToSilo(
  silo: S3Client,
  input: UploadToSiloInput,
): Promise<void> {
  await silo.send(
    new PutObjectCommand({
      Bucket: input.bucket,
      Key: input.key,
      Body: input.bytes,
      ContentType: input.contentType,
    }),
  );
}
