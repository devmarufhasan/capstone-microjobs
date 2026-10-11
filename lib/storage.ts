import "server-only";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
export function storageConfigured() {
  if ((process.env.STORAGE_DRIVER ?? "local") === "local") return true;
  return process.env.STORAGE_DRIVER === "s3" && s3Configured();
}
function s3Configured() {
  return !!(
    process.env.S3_BUCKET &&
    process.env.S3_ACCESS_KEY_ID &&
    process.env.S3_SECRET_ACCESS_KEY &&
    process.env.S3_ENDPOINT
  );
}
function client() {
  if (!s3Configured()) throw new Error("S3 storage is not configured");
  return new S3Client({
    region: process.env.S3_REGION ?? "auto",
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  });
}
const LOCAL_PREFIX = "local:";
function localPath(key: string) {
  const parts = key.slice(LOCAL_PREFIX.length).split("/");
  if (
    !key.startsWith(LOCAL_PREFIX) ||
    parts.some(
      (part) =>
        !/^[a-zA-Z0-9_.-]+$/.test(part) || part === "." || part === "..",
    )
  )
    throw new Error("Invalid local storage key");
  return join(process.cwd(), "storage", "uploads", ...parts);
}
// Call only after the media endpoint has checked owner/admin/public permissions.
export async function localFileResponse(key: string, mime: string) {
  if (!key.startsWith(LOCAL_PREFIX)) return null;
  try {
    const bytes = await readFile(localPath(key));
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": mime,
        "Content-Length": String(bytes.length),
        "Cache-Control": "private, no-store",
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition":
          mime === "application/pdf"
            ? 'attachment; filename="microjobs-work-sample.pdf"'
            : "inline",
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT")
      return Response.json(
        { error: { message: "File not found." } },
        {
          status: 404,
          headers: { "Cache-Control": "private, no-store" },
        },
      );
    throw error;
  }
}
export async function storeFile(key: string, bytes: Buffer, mime: string) {
  if (!storageConfigured()) throw new Error("Storage is not configured");
  if ((process.env.STORAGE_DRIVER ?? "local") === "local") {
    const storedKey = `${LOCAL_PREFIX}${key}`;
    const path = localPath(storedKey);
    await mkdir(dirname(path), { recursive: true, mode: 0o700 });
    await writeFile(path, bytes, { flag: "wx", mode: 0o600 });
    return storedKey;
  }
  await client().send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      Body: bytes,
      ContentType: mime,
      CacheControl: "private, no-store",
    }),
  );
  return key;
}
export async function removeFile(key: string) {
  if (key.startsWith(LOCAL_PREFIX)) {
    await unlink(localPath(key)).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    });
    return;
  }
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
      ResponseContentDisposition:
        mime === "application/pdf"
          ? 'attachment; filename="microjobs-work-sample.pdf"'
          : undefined,
    }),
    { expiresIn: 60 },
  );
}
