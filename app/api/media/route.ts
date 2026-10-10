import { createHash } from "node:crypto";
import sharp from "sharp";
import { PDFDocument, PDFName } from "pdf-lib";
import { and, count, eq, gte } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { HttpError, json, requireUser, route, sameOrigin } from "@/lib/http";
import { detectImage, MAX_UPLOAD_BYTES } from "@/lib/policy";
import { emailVerificationEnabled } from "@/lib/feature-flags";
import { storageConfigured, storeFile, removeFile } from "@/lib/storage";
export async function POST(request: Request) {
  return route(async () => {
    sameOrigin(request);
    const actor = await requireUser(request);
    if (!storageConfigured())
      throw new HttpError(503, "File uploads are not available yet.");
    if (emailVerificationEnabled() && !actor.emailVerified)
      throw new HttpError(403, "Verify your email before uploading.");
    // Enforce actual streamed body size, not just the untrusted Content-Length header.
    const reader = request.body?.getReader();
    if (!reader) throw new HttpError(400, "Choose a file.");
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_UPLOAD_BYTES + 16_384) {
        await reader.cancel();
        throw new HttpError(413, "Maximum upload size is 5 MB.");
      }
      chunks.push(value);
    }
    const form = await new Response(Buffer.concat(chunks), {
      headers: { "Content-Type": request.headers.get("content-type") ?? "" },
    }).formData();
    const file = form.get("file"),
      purpose = form.get("purpose");
    if (
      !(file instanceof File) ||
      !["portfolio", "university_id"].includes(String(purpose))
    )
      throw new HttpError(400, "Choose a file and valid purpose.");
    if (file.size > MAX_UPLOAD_BYTES || file.size === 0)
      throw new HttpError(413, "Choose a file up to 5 MB.");
    const [daily] = await getDb()
      .select({ value: count() })
      .from(media)
      .where(
        and(
          eq(media.ownerId, actor.id),
          gte(media.createdAt, new Date(Date.now() - 86_400_000)),
        ),
      );
    if (daily.value >= 30)
      throw new HttpError(
        429,
        "Daily upload limit reached. Try again tomorrow.",
      );
    const original = Buffer.from(await file.arrayBuffer());
    const mime = detectImage(original);
    const isPdf =
      purpose === "portfolio" && original.subarray(0, 5).toString() === "%PDF-";
    if (!mime && !isPdf)
      throw new HttpError(
        415,
        purpose === "portfolio"
          ? "Only JPEG, PNG, and PDF files are supported."
          : "Only JPEG and PNG images are supported.",
      );
    let bytes: Buffer;
    if (isPdf) {
      try {
        const source = await PDFDocument.load(original);
        if (source.getPageCount() === 0 || source.getPageCount() > 20)
          throw new Error("Invalid page count");
        const clean = await PDFDocument.create();
        const pages = await clean.copyPages(source, source.getPageIndices());
        for (const page of pages) {
          page.node.delete(PDFName.of("Annots"));
          clean.addPage(page);
        }
        bytes = Buffer.from(await clean.save());
        if (bytes.length > MAX_UPLOAD_BYTES) throw new Error("Too large");
      } catch {
        throw new HttpError(
          400,
          "Choose a readable PDF of up to 20 pages and 5 MB.",
        );
      }
    } else
      try {
        bytes = await sharp(original, {
          limitInputPixels: 25_000_000,
          animated: false,
        })
          .rotate()
          .resize({
            width: 2400,
            height: 2400,
            fit: "inside",
            withoutEnlargement: true,
          })
          .jpeg({ quality: 90 })
          .toBuffer();
      } catch {
        throw new HttpError(
          400,
          "This image could not be read. Choose a valid JPEG or PNG.",
        );
      }
    const id = crypto.randomUUID(),
      storedMime = isPdf ? "application/pdf" : "image/jpeg",
      key = `${purpose}/${actor.id}/${id}.${isPdf ? "pdf" : "jpg"}`;
    await storeFile(key, bytes, storedMime);
    try {
      await getDb()
        .insert(media)
        .values({
          id,
          ownerId: actor.id,
          purpose: purpose as "portfolio" | "university_id",
          storageKey: key,
          mimeType: storedMime,
          sizeBytes: bytes.length,
          checksum: createHash("sha256").update(bytes).digest("hex"),
        });
    } catch (error) {
      await removeFile(key).catch(() =>
        console.error("orphan_upload_cleanup_failed"),
      );
      throw error;
    }
    return json({ id }, 201);
  });
}
