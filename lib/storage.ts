import "server-only";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
export function storageConfigured() {
  return !!(
    process.env.S3_BUCKET &&
    process.env.S3_ACCESS_KEY_ID &&
    process.env.S3_SECRET_ACCESS_KEY &&
    process.env.S3_ENDPOINT
  );
}
function client() {
  if (!storageConfigured()) throw new Error("Storage is not configured");
  return new S3Client({
    region: process.env.S3_REGION ?? "auto",
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  });
}
export async function storeFile(key: string, bytes: Buffer, mime: string) {
  await client().send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      Body: bytes,
      ContentType: mime,
      CacheControl: "private, no-store",
    }),
  );
}
export async function removeFile(key: string) {
  await client().send(
    new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key }),
  );
}
export async function fileUrl(key: string, mime?: string) {
  return getSignedUrl(
    client(),
    new GetObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      ResponseCacheControl: "private, no-store",
      ResponseContentDisposition: mime === "application/pdf" ? 'attachment; filename="microjobs-work-sample.pdf"' : undefined,
    }),
    { expiresIn: 60 },
  );
}
