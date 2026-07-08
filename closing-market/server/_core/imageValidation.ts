import { TRPCError } from "@trpc/server";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * 이미지 업로드 형식(JPG/JPEG/PNG/WEBP)과 크기(최대 5MB)를 검증합니다.
 * 조건을 만족하지 않으면 TRPCError를 던집니다.
 */
export function validateImageUpload(mimeType: string, buffer: Buffer) {
  if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "JPG, JPEG, PNG, WEBP 형식의 이미지만 업로드할 수 있습니다.",
    });
  }
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "이미지 파일은 최대 5MB까지 업로드할 수 있습니다.",
    });
  }
}
