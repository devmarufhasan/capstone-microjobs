import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
vi.mock("server-only", () => ({}));
import {
  localFileResponse,
  removeFile,
  storageConfigured,
  storeFile,
} from "../lib/storage";

let directory: string;
beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), "microjobs-storage-"));
  vi.spyOn(process, "cwd").mockReturnValue(directory);
  vi.stubEnv("STORAGE_DRIVER", "local");
});
afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  await rm(directory, { recursive: true, force: true });
});

it("stores private files and serves exact bytes with private response headers", async () => {
  expect(storageConfigured()).toBe(true);
  const bytes = Buffer.from([0xff, 0xd8, 0xff, 0x00]);
  const key = await storeFile(
    "university_id/alice/id.jpg",
    bytes,
    "image/jpeg",
  );
  expect(key).toBe("local:university_id/alice/id.jpg");
  const file = await stat(
    join(directory, "storage/uploads/university_id/alice/id.jpg"),
  );
  expect(file.mode & 0o777).toBe(0o600);
  const response = await localFileResponse(key, "image/jpeg");
  expect(response?.headers.get("Cache-Control")).toBe("private, no-store");
  expect(response?.headers.get("X-Content-Type-Options")).toBe("nosniff");
  expect(Buffer.from(await response!.arrayBuffer())).toEqual(bytes);
  await expect(
    storeFile("university_id/alice/id.jpg", bytes, "image/jpeg"),
  ).rejects.toThrow();
  await removeFile(key);
  expect((await localFileResponse(key, "image/jpeg"))?.status).toBe(404);
  await removeFile(key);
});

it("rejects path traversal and forces PDF downloads", async () => {
  for (const key of [
    "../secret",
    "/tmp/secret",
    "a/../../secret",
    "a\\secret",
  ]) {
    await expect(
      storeFile(key, Buffer.from("test"), "image/jpeg"),
    ).rejects.toThrow("Invalid local storage key");
  }
  const key = await storeFile(
    "portfolio/alice/sample.pdf",
    Buffer.from("%PDF-test"),
    "application/pdf",
  );
  expect(
    (await localFileResponse(key, "application/pdf"))?.headers.get(
      "Content-Disposition",
    ),
  ).toContain("attachment");
  expect(
    await localFileResponse("portfolio/legacy-s3.jpg", "image/jpeg"),
  ).toBeNull();
});
