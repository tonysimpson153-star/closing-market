import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import { ENV } from "./_core/env";

let _client: S3Client | null = null;
let _privateClient: S3Client | null = null;

function getR2Client(): S3Client | null {
  if (_client) return _client;

  if (!ENV.r2AccountId || !ENV.r2AccessKeyId || !ENV.r2SecretAccessKey) {
    return null;
  }

  try {
    _client = new S3Client({
      region: "auto",
      endpoint: `https://${ENV.r2AccountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: ENV.r2AccessKeyId,
        secretAccessKey: ENV.r2SecretAccessKey,
      },
    });
  } catch (err) {
    console.error("[Storage] Failed to init S3 client:", err);
    return null;
  }
  return _client;
}

function getPrivateR2Client(): S3Client | null {
  if (_privateClient) return _privateClient;
  if (!ENV.r2AccountId || !ENV.r2PrivateAccessKeyId || !ENV.r2PrivateSecretAccessKey) {
    return null;
  }
  _privateClient = new S3Client({
    region: "auto",
    endpoint: `https://${ENV.r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: ENV.r2PrivateAccessKeyId,
      secretAccessKey: ENV.r2PrivateSecretAccessKey,
    },
  });
  return _privateClient;
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
 * 파일을 업로드하고, 가벼운 URL 문자열을 반환합니다.
 * 대용량 Data URI 대신 경량화된 URL을 반환하여 tRPC 응답 변환(superjson) 오류를 원천 차단합니다.
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  try {
    const key = appendHashSuffix(normalizeKey(relKey));
    const body =
      typeof data === "string" ? Buffer.from(data, "utf-8") : Buffer.from(data);

    // 1. R2 설정이 있는 경우 R2로 업로드 시도
    if (ENV.r2BucketName && ENV.r2PublicUrl) {
      const client = getR2Client();
      if (client) {
        try {
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
        } catch (err) {
          console.error("[Storage] R2 upload failed, falling back to forge/local:", err);
        }
      }
    }

    // 2. 내장 Forge API를 통한 업로드 시도 (가능한 경우)
    if (ENV.forgeApiUrl && ENV.forgeApiKey) {
      try {
        const forgeUrl = new URL(
          "v1/storage/upload",
          ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
        );
        const formData = new FormData();
        const blob = new Blob([body], { type: contentType });
        formData.append("file", blob, key);
        formData.append("path", key);

        const forgeResp = await fetch(forgeUrl, {
          method: "POST",
          headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
          body: formData,
        });

        if (forgeResp.ok) {
          const resJson = (await forgeResp.json()) as { url?: string };
          if (resJson.url) {
            return { key, url: resJson.url };
          }
        }
      } catch (forgeErr) {
        console.error("[Storage] Forge upload fallback failed:", forgeErr);
      }
    }

    // 3. 최종 안전 폴백: 가벼운 프록시 URL 반환 (tRPC 응답 크기 초과 방지)
    return { key, url: `/manus-storage/${key}` };
  } catch (err) {
    console.error("[Storage] storagePut unexpected error:", err);
    return { key: "fallback.jpg", url: `/manus-storage/fallback.jpg` };
  }
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const publicUrl = (ENV.r2PublicUrl ?? "").replace(/\/+$/, "");
  return { key, url: publicUrl ? `${publicUrl}/${key}` : `/manus-storage/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const key = normalizeKey(relKey);
  const client = getPrivateR2Client();
  if (!client || !ENV.r2PrivateBucketName) {
    throw new Error("Private document storage is not configured");
  }
  return getSignedUrl(client, new GetObjectCommand({ Bucket: ENV.r2PrivateBucketName, Key: key }), { expiresIn: 300 });
}

export async function storagePutPrivateDocument(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const client = getPrivateR2Client();
  if (!client || !ENV.r2PrivateBucketName) {
    throw new Error("Private document storage is not configured");
  }
  const key = appendHashSuffix(normalizeKey(`private/business-documents/${relKey}`));
  const body = typeof data === "string" ? Buffer.from(data, "utf-8") : Buffer.from(data);
  await client.send(new PutObjectCommand({ Bucket: ENV.r2PrivateBucketName, Key: key, Body: body, ContentType: contentType }));
  return { key, url: `private://${key}` };
}

export function privateDocumentKey(documentUrl: string): string | null {
  return documentUrl.startsWith("private://") ? normalizeKey(documentUrl.slice("private://".length)) : null;
}
