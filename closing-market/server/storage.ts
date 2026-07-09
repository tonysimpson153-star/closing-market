// Cloudflare R2 (S3 호환 오브젝트 스토리지) 기반 파일 업로드 헬퍼
//
// 필요한 환경변수:
//   R2_ACCOUNT_ID       - Cloudflare 계정 ID
//   R2_ACCESS_KEY_ID    - R2 API 토큰의 Access Key ID
//   R2_SECRET_ACCESS_KEY- R2 API 토큰의 Secret Access Key
//   R2_BUCKET_NAME      - 생성한 버킷 이름
//   R2_PUBLIC_URL       - 버킷 공개 접근 URL (r2.dev 주소 또는 연결한 커스텀 도메인)
//                         예: https://pub-xxxxxxxx.r2.dev  또는  https://cdn.example.com
//
// R2는 S3와 API가 호환되므로 표준 @aws-sdk/client-s3로 그대로 사용할 수 있습니다.

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import { ENV } from "./_core/env";

let _client: S3Client | null = null;

function getR2Client(): S3Client {
  if (_client) return _client;

  if (!ENV.r2AccountId || !ENV.r2AccessKeyId || !ENV.r2SecretAccessKey) {
    throw new Error(
      "Storage config missing: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY 환경변수를 설정하세요."
    );
  }

  _client = new S3Client({
    region: "auto",
    endpoint: `https://${ENV.r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: ENV.r2AccessKeyId,
      secretAccessKey: ENV.r2SecretAccessKey,
    },
  });
  return _client;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

/**
 * 파일을 R2 버킷에 업로드하고, 공개적으로 접근 가능한 URL을 반환합니다.
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  if (!ENV.r2BucketName || !ENV.r2PublicUrl) {
    throw new Error(
      "Storage config missing: R2_BUCKET_NAME, R2_PUBLIC_URL 환경변수를 설정하세요."
    );
  }

  const client = getR2Client();
  const key = appendHashSuffix(normalizeKey(relKey));

  const body =
    typeof data === "string" ? Buffer.from(data, "utf-8") : Buffer.from(data);

  await client.send(
    new PutObjectCommand({
      Bucket: ENV.r2BucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  const publicUrl = ENV.r2PublicUrl.replace(/\/+$/, "");
  return { key, url: `${publicUrl}/${key}` };
}

/**
 * 참고: R2 공개 버킷을 사용하므로 URL 자체가 이미 접근 가능한 주소입니다.
 * storageGet/storageGetSignedUrl은 이전 버전과의 호환을 위해 남겨두되,
 * 현재 코드베이스에서는 storagePut이 반환하는 url만 사용합니다.
 */
export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const publicUrl = (ENV.r2PublicUrl ?? "").replace(/\/+$/, "");
  return { key, url: `${publicUrl}/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  // 공개 버킷을 사용하므로 서명 URL 없이 공개 URL을 그대로 반환합니다.
  const key = normalizeKey(relKey);
  const publicUrl = (ENV.r2PublicUrl ?? "").replace(/\/+$/, "");
  return `${publicUrl}/${key}`;
}
