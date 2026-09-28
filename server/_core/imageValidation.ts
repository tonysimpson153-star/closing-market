import { TRPCError } from "@trpc/server";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];
// 현재 출시본도 iPhone 원본 사진을 등록할 수 있도록 서버 허용 용량을 유지한다.
// 다음 앱 업데이트에서는 전송 전에 사진을 줄여 이 한도보다 훨씬 작게 보낸다.
const MAX_FILE_SIZE_BYTES = 12 * 1024 * 1024; // 12MB

/**
 * 이미지 업로드 형식(JPG/JPEG/PNG/WEBP/HEIC/HEIF)과 크기(최대 12MB)를 검증합니다.
 * 조건을 만족하지 않으면 TRPCError를 던집니다.
 */
export function validateImageUpload(mimeType: string, buffer: Buffer) {
  if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "JPG, JPEG, PNG, WEBP, HEIC 형식의 이미지만 업로드할 수 있습니다.",
    });
  }
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "이미지 파일은 최대 12MB까지 업로드할 수 있습니다.",
    });
  }
}
