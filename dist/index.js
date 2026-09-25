var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/_core/env.ts
import crypto from "crypto";
function resolveJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (isProduction) {
    console.error(
      "[\uC2EC\uAC01] JWT_SECRET \uD658\uACBD\uBCC0\uC218\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4. \uC11C\uBC84 \uC2E4\uD589\uB9C8\uB2E4 \uBC14\uB00C\uB294 \uC784\uC2DC \uB79C\uB364 \uAC12\uC744 \uC0AC\uC6A9\uD569\uB2C8\uB2E4 (\uC7AC\uBC30\uD3EC/\uC7AC\uC2DC\uC791\uD560 \uB54C\uB9C8\uB2E4 \uBAA8\uB4E0 \uB85C\uADF8\uC778\uC774 \uD480\uB9BD\uB2C8\uB2E4). Manus/\uBC30\uD3EC \uD658\uACBD\uBCC0\uC218\uC5D0 JWT_SECRET\uC744 \uBC18\uB4DC\uC2DC \uCD94\uAC00\uD558\uC138\uC694."
    );
  } else {
    console.warn(
      "[\uACBD\uACE0] JWT_SECRET\uC774 \uC124\uC815\uB418\uC9C0 \uC54A\uC544 \uAC1C\uBC1C\uC6A9 \uC784\uC2DC \uAC12\uC744 \uC0AC\uC6A9\uD569\uB2C8\uB2E4. .env\uC5D0 JWT_SECRET\uC744 \uCD94\uAC00\uD558\uC138\uC694."
    );
  }
  return crypto.randomBytes(32).toString("hex");
}
var isProduction, ENV;
var init_env = __esm({
  "server/_core/env.ts"() {
    "use strict";
    isProduction = process.env.NODE_ENV === "production";
    ENV = {
      appId: process.env.VITE_APP_ID ?? "",
      cookieSecret: process.env.JWT_SECRET ?? "",
      jwtSecret: resolveJwtSecret(),
      databaseUrl: process.env.DATABASE_URL ?? "",
      // TiDB Cloud 등 TLS 접속이 필수인 매니지드 MySQL을 쓸 때 "true"로 설정
      dbSsl: process.env.DB_SSL === "true",
      // Cloudflare R2 오브젝트 스토리지 (이미지 업로드용)
      r2AccountId: process.env.R2_ACCOUNT_ID ?? "",
      r2AccessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
      r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
      r2BucketName: process.env.R2_BUCKET_NAME ?? "",
      r2PublicUrl: process.env.R2_PUBLIC_URL ?? "",
      // Resend (비밀번호 재설정 이메일 발송)
      resendApiKey: process.env.RESEND_API_KEY ?? "",
      resendFromEmail: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
      // 비밀번호 재설정 링크가 가리킬 웹 배포 주소 (예: https://closing-market.vercel.app)
      webAppUrl: process.env.WEB_APP_URL ?? "",
      oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
      ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
      isProduction,
      forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
      forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
    };
  }
});

// server/_core/rateLimit.ts
var rateLimit_exports = {};
__export(rateLimit_exports, {
  checkRateLimit: () => checkRateLimit
});
function checkRateLimit(key, maxAttempts, windowMs) {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (existing.count >= maxAttempts) {
    return false;
  }
  existing.count += 1;
  return true;
}
var buckets;
var init_rateLimit = __esm({
  "server/_core/rateLimit.ts"() {
    "use strict";
    buckets = /* @__PURE__ */ new Map();
    setInterval(() => {
      const now = Date.now();
      for (const [key, bucket] of buckets.entries()) {
        if (bucket.resetAt < now) buckets.delete(key);
      }
    }, 5 * 60 * 1e3).unref?.();
  }
});

// server/_core/email.ts
var email_exports = {};
__export(email_exports, {
  buildPasswordResetEmailHtml: () => buildPasswordResetEmailHtml,
  sendEmail: () => sendEmail
});
async function sendEmail(params) {
  if (!ENV.resendApiKey) {
    console.error("[\uC774\uBA54\uC77C \uBC1C\uC1A1 \uC2E4\uD328] RESEND_API_KEY\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.");
    return { success: false, error: "\uC774\uBA54\uC77C \uBC1C\uC1A1 \uC124\uC815\uC774 \uB418\uC5B4 \uC788\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4." };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: ENV.resendFromEmail,
        to: [params.to],
        subject: params.subject,
        html: params.html
      })
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("[\uC774\uBA54\uC77C \uBC1C\uC1A1 \uC2E4\uD328]", res.status, errText);
      return { success: false, error: errText };
    }
    return { success: true };
  } catch (err) {
    console.error("[\uC774\uBA54\uC77C \uBC1C\uC1A1 \uC624\uB958]", err);
    return { success: false, error: err instanceof Error ? err.message : "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958" };
  }
}
function buildPasswordResetEmailHtml(resetUrl) {
  return `
  <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
    <div style="color: #D4AF37; font-size: 20px; font-weight: 700; letter-spacing: 2px; margin-bottom: 24px;">
      \uD074\uB85C\uC9D5\uB9C8\uCF13
    </div>
    <h2 style="color: #222222; font-size: 18px; margin-bottom: 12px;">\uBE44\uBC00\uBC88\uD638 \uC7AC\uC124\uC815 \uC694\uCCAD</h2>
    <p style="color: #555555; font-size: 14px; line-height: 1.6;">
      \uBE44\uBC00\uBC88\uD638 \uC7AC\uC124\uC815\uC744 \uC694\uCCAD\uD558\uC168\uC2B5\uB2C8\uB2E4. \uC544\uB798 \uBC84\uD2BC\uC744 \uB20C\uB7EC \uC0C8 \uBE44\uBC00\uBC88\uD638\uB97C \uC124\uC815\uD574\uC8FC\uC138\uC694.
      \uC774 \uB9C1\uD06C\uB294 <strong>1\uC2DC\uAC04 \uB3D9\uC548\uB9CC</strong> \uC720\uD6A8\uD569\uB2C8\uB2E4.
    </p>
    <div style="margin: 28px 0;">
      <a href="${resetUrl}"
         style="background: #D4AF37; color: #ffffff; text-decoration: none; padding: 14px 28px;
                border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">
        \uC0C8 \uBE44\uBC00\uBC88\uD638 \uC124\uC815\uD558\uAE30
      </a>
    </div>
    <p style="color: #999999; font-size: 12px; line-height: 1.6;">
      \uBCF8\uC778\uC774 \uC694\uCCAD\uD558\uC9C0 \uC54A\uC73C\uC168\uB2E4\uBA74 \uC774 \uC774\uBA54\uC77C\uC744 \uBB34\uC2DC\uD558\uC154\uB3C4 \uB429\uB2C8\uB2E4. \uBE44\uBC00\uBC88\uD638\uB294 \uBCC0\uACBD\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.
    </p>
    <p style="color: #bbbbbb; font-size: 11px; margin-top: 24px; word-break: break-all;">
      \uBC84\uD2BC\uC774 \uB20C\uB9AC\uC9C0 \uC54A\uB294\uB2E4\uBA74 \uC544\uB798 \uB9C1\uD06C\uB97C \uBCF5\uC0AC\uD574\uC11C \uBE0C\uB77C\uC6B0\uC800\uC5D0 \uBD99\uC5EC\uB123\uC5B4\uC8FC\uC138\uC694.<br>
      ${resetUrl}
    </p>
  </div>`;
}
var init_email = __esm({
  "server/_core/email.ts"() {
    "use strict";
    init_env();
  }
});

// server/storage.ts
var storage_exports = {};
__export(storage_exports, {
  storageGet: () => storageGet,
  storageGetSignedUrl: () => storageGetSignedUrl,
  storagePut: () => storagePut
});
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto2 from "crypto";
function getR2Client() {
  if (_client) return _client;
  if (!ENV.r2AccountId || !ENV.r2AccessKeyId || !ENV.r2SecretAccessKey) {
    throw new Error(
      "Storage config missing: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY \uD658\uACBD\uBCC0\uC218\uB97C \uC124\uC815\uD558\uC138\uC694."
    );
  }
  _client = new S3Client({
    region: "auto",
    endpoint: `https://${ENV.r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: ENV.r2AccessKeyId,
      secretAccessKey: ENV.r2SecretAccessKey
    }
  });
  return _client;
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "");
}
function appendHashSuffix(relKey) {
  const hash = crypto2.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  if (!ENV.r2BucketName || !ENV.r2PublicUrl) {
    throw new Error(
      "Storage config missing: R2_BUCKET_NAME, R2_PUBLIC_URL \uD658\uACBD\uBCC0\uC218\uB97C \uC124\uC815\uD558\uC138\uC694."
    );
  }
  const client = getR2Client();
  const key = appendHashSuffix(normalizeKey(relKey));
  const body = typeof data === "string" ? Buffer.from(data, "utf-8") : Buffer.from(data);
  await client.send(
    new PutObjectCommand({
      Bucket: ENV.r2BucketName,
      Key: key,
      Body: body,
      ContentType: contentType
    })
  );
  const publicUrl = ENV.r2PublicUrl.replace(/\/+$/, "");
  return { key, url: `${publicUrl}/${key}` };
}
async function storageGet(relKey) {
  const key = normalizeKey(relKey);
  const publicUrl = (ENV.r2PublicUrl ?? "").replace(/\/+$/, "");
  return { key, url: `${publicUrl}/${key}` };
}
async function storageGetSignedUrl(relKey) {
  const key = normalizeKey(relKey);
  const publicUrl = (ENV.r2PublicUrl ?? "").replace(/\/+$/, "");
  return `${publicUrl}/${key}`;
}
var _client;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_env();
    _client = null;
  }
});

// server/_core/imageValidation.ts
var imageValidation_exports = {};
__export(imageValidation_exports, {
  validateImageUpload: () => validateImageUpload
});
import { TRPCError as TRPCError2 } from "@trpc/server";
function validateImageUpload(mimeType, buffer) {
  if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
    throw new TRPCError2({
      code: "BAD_REQUEST",
      message: "JPG, JPEG, PNG, WEBP \uD615\uC2DD\uC758 \uC774\uBBF8\uC9C0\uB9CC \uC5C5\uB85C\uB4DC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    });
  }
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new TRPCError2({
      code: "BAD_REQUEST",
      message: "\uC774\uBBF8\uC9C0 \uD30C\uC77C\uC740 \uCD5C\uB300 5MB\uAE4C\uC9C0 \uC5C5\uB85C\uB4DC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    });
  }
}
var ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES;
var init_imageValidation = __esm({
  "server/_core/imageValidation.ts"() {
    "use strict";
    ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
  }
});

// server/_core/index.ts
import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/db.ts
init_env();
import { eq, desc, and, sql } from "drizzle-orm";
import { createHash } from "node:crypto";
import mysql from "mysql2";
import { drizzle } from "drizzle-orm/mysql2";

// drizzle/schema.ts
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal } from "drizzle-orm/mysql-core";
var users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  nickname: varchar("nickname", { length: 50 }),
  email: varchar("email", { length: 320 }).unique(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "seller", "company", "admin"]).default("user").notNull(),
  // 판매회원 관련
  sellerStatus: mysqlEnum("sellerStatus", ["pending", "approved", "rejected", "suspended"]),
  sellerType: mysqlEnum("sellerType", ["closing_soon", "closed", "relocating", "inventory", "transfer"]),
  businessNumber: varchar("businessNumber", { length: 20 }),
  businessName: varchar("businessName", { length: 255 }),
  representativeName: varchar("representativeName", { length: 100 }),
  businessCertUrl: text("businessCertUrl"),
  businessPhotoUrl: text("businessPhotoUrl"),
  // 업체회원 관련
  companyStatus: mysqlEnum("companyStatus", ["pending", "approved", "rejected", "suspended"]),
  companyType: mysqlEnum("companyType", ["demolition", "interior", "waste", "signage", "pos", "cctv", "cleaning", "tax", "labor", "kitchen", "consulting"]),
  companyName: varchar("companyName", { length: 255 }),
  companyDesc: text("companyDesc"),
  companyPhone: varchar("companyPhone", { length: 20 }),
  companyAddress: varchar("companyAddress", { length: 500 }),
  companyLogoUrl: text("companyLogoUrl"),
  companyBusinessCertUrl: text("companyBusinessCertUrl"),
  companyRejectionReason: text("companyRejectionReason"),
  isVerified: boolean("isVerified").default(false).notNull(),
  profileImageUrl: text("profileImageUrl"),
  phone: varchar("phone", { length: 20 }),
  password: varchar("password", { length: 256 }),
  // 로그인 무차별 대입 공격 방어용
  failedLoginAttempts: int("failedLoginAttempts").default(0).notNull(),
  lockedUntil: timestamp("lockedUntil"),
  kakaoId: varchar("kakaoId", { length: 64 }),
  appleId: varchar("appleId", { length: 64 }),
  // 알림 설정
  notifChat: boolean("notifChat").default(true).notNull(),
  notifPriceDrop: boolean("notifPriceDrop").default(true).notNull(),
  notifTrade: boolean("notifTrade").default(true).notNull(),
  notifMarketing: boolean("notifMarketing").default(false).notNull(),
  // 푸시 알림
  expoPushToken: text("expoPushToken"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  // 회원 탈퇴 (소프트 삭제) - 채팅/후기 등 다른 회원과 연결된 기록은 보존하고 개인정보만 익명화
  deletedAt: timestamp("deletedAt"),
  // 관리자에 의한 계정 정지
  suspendedAt: timestamp("suspendedAt"),
  suspendedReason: text("suspendedReason")
});
var products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  price: int("price").notNull(),
  quantity: int("quantity").default(1).notNull(),
  category: mysqlEnum("category", ["cafe", "pcroom", "restaurant", "gym", "office", "warehouse", "transfer"]).notNull(),
  tradeType: mysqlEnum("tradeType", ["direct", "delivery", "negotiable"]).default("direct").notNull(),
  status: mysqlEnum("status", ["selling", "reserved", "sold"]).default("selling").notNull(),
  location: varchar("location", { length: 255 }),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  mainImageUrl: text("mainImageUrl"),
  viewCount: int("viewCount").default(0).notNull(),
  favoriteCount: int("favoriteCount").default(0).notNull(),
  isPremium: boolean("isPremium").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var productImages = mysqlTable("product_images", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  imageUrl: text("imageUrl").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var companyImages = mysqlTable("company_images", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  imageUrl: text("imageUrl").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var businessTransfers = mysqlTable("business_transfers", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  keyMoney: int("keyMoney"),
  deposit: int("deposit"),
  monthlyRent: int("monthlyRent"),
  businessType: varchar("businessType", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var businesses = mysqlTable("businesses", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["demolition", "interior", "waste", "sign", "pos", "cctv", "cleaning", "tax", "labor"]).notNull(),
  description: text("description"),
  phone: varchar("phone", { length: 20 }),
  kakaoId: varchar("kakaoId", { length: 100 }),
  address: varchar("address", { length: 500 }),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  portfolioUrls: text("portfolioUrls"),
  isAdvertised: boolean("isAdvertised").default(false).notNull(),
  adExpiresAt: timestamp("adExpiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId"),
  businessId: int("businessId"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var recentViews = mysqlTable("recent_views", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  viewedAt: timestamp("viewedAt").defaultNow().notNull()
});
var reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // 작성자 (구매자)
  targetUserId: int("targetUserId").notNull(),
  // 대상 (판매자)
  productId: int("productId"),
  chatRoomId: int("chatRoomId"),
  // 연결된 채팅방
  rating: int("rating").notNull(),
  // 1~5 별점
  content: text("content"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var comments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  parentId: int("parentId"),
  content: text("content").notNull(),
  likeCount: int("likeCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var chatRooms = mysqlTable("chat_rooms", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId"),
  buyerId: int("buyerId").notNull(),
  sellerId: int("sellerId").notNull(),
  lastMessage: text("lastMessage"),
  lastMessageAt: timestamp("lastMessageAt"),
  status: mysqlEnum("status", ["active", "completed", "cancelled"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull(),
  senderId: int("senderId").notNull(),
  content: text("content"),
  imageUrl: text("imageUrl"),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["chat", "favorite", "comment", "sold", "price_change", "business_reply", "notice"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body"),
  referenceId: int("referenceId"),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  reporterId: int("reporterId").notNull(),
  targetType: mysqlEnum("targetType", ["product", "user", "comment", "chat"]).notNull(),
  targetId: int("targetId").notNull(),
  reason: text("reason").notNull(),
  status: mysqlEnum("status", ["pending", "resolved", "dismissed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var sellerApplications = mysqlTable("seller_applications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sellerType: mysqlEnum("sellerType", ["closing_soon", "closed", "relocating", "inventory", "transfer"]).notNull(),
  businessNumber: varchar("businessNumber", { length: 20 }).notNull(),
  businessName: varchar("businessName", { length: 255 }).notNull(),
  representativeName: varchar("representativeName", { length: 100 }).notNull(),
  businessCertUrl: text("businessCertUrl").notNull(),
  businessPhotoUrl: text("businessPhotoUrl"),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "suspended"]).default("pending").notNull(),
  rejectionReason: text("rejectionReason"),
  reviewedAt: timestamp("reviewedAt"),
  reviewedBy: int("reviewedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var notices = mysqlTable("notices", {
  id: int("id").autoincrement().primaryKey(),
  authorId: int("authorId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  isPinned: boolean("isPinned").default(false).notNull(),
  viewCount: int("viewCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var inquiries = mysqlTable("inquiries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  category: mysqlEnum("category", ["account", "product", "payment", "report", "seller", "company", "etc"]).default("etc").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  status: mysqlEnum("status", ["pending", "answered"]).default("pending").notNull(),
  answerContent: text("answerContent"),
  answeredBy: int("answeredBy"),
  answeredAt: timestamp("answeredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});

// server/db.ts
import { or, lt } from "drizzle-orm";
var _db = null;
async function getDb() {
  if (_db) return _db;
  if (!ENV.databaseUrl) return null;
  try {
    const pool = ENV.dbSsl ? mysql.createPool({
      uri: ENV.databaseUrl,
      ssl: { minVersion: "TLSv1.2" }
    }) : mysql.createPool(ENV.databaseUrl);
    _db = drizzle(pool);
    return _db;
  } catch {
    return null;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return rows[0] ?? null;
}
async function upsertUser(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getUserByOpenId(data.openId);
  if (existing) {
    await db.update(users).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.openId, data.openId));
  } else {
    await db.insert(users).values({ ...data });
  }
}
async function getProducts(input) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (input?.category) conditions.push(eq(products.category, input.category));
  if (input?.status) conditions.push(eq(products.status, input.status));
  const query = db.select().from(products).orderBy(desc(products.createdAt)).limit(input?.limit ?? 20).offset(input?.offset ?? 0);
  if (conditions.length > 0) {
    return query.where(and(...conditions));
  }
  return query;
}
async function getProductDetail(id) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!rows[0]) return null;
  const [images, seller] = await Promise.all([
    db.select().from(productImages).where(eq(productImages.productId, id)).orderBy(productImages.sortOrder),
    db.select({ id: users.id, name: users.name, isVerified: users.isVerified }).from(users).where(eq(users.id, rows[0].userId)).limit(1)
  ]);
  await db.update(products).set({ viewCount: (rows[0].viewCount ?? 0) + 1 }).where(eq(products.id, id));
  return {
    ...rows[0],
    images,
    sellerName: seller[0]?.name ?? null,
    isSellerVerified: seller[0]?.isVerified ?? false
  };
}
async function createProduct(data, images) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(products).values(data);
  const productId = result[0].insertId;
  if (images && images.length > 0) {
    await db.insert(productImages).values(
      images.map((imageUrl, index) => ({
        productId,
        imageUrl,
        sortOrder: index
      }))
    );
  }
  return { id: productId };
}
async function updateProductStatus(id, status, userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(products).set({ status }).where(and(eq(products.id, id), eq(products.userId, userId)));
  return { success: true };
}
async function getMyProducts(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(eq(products.userId, userId)).orderBy(desc(products.createdAt));
}
async function getBusinesses(input) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(businesses.isAdvertised, true)];
  if (input?.type) conditions.push(eq(businesses.type, input.type));
  return db.select().from(businesses).where(and(...conditions)).orderBy(desc(businesses.createdAt));
}
async function getBusinessDetail(id) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(businesses).where(eq(businesses.id, id)).limit(1);
  return rows[0] ?? null;
}
var HIDDEN_COMPANY_IDS = [390001];
var COMPANY_SELECT_FIELDS = {
  id: users.id,
  name: users.companyName,
  type: users.companyType,
  description: users.companyDesc,
  phone: users.companyPhone,
  address: users.companyAddress,
  logoUrl: users.companyLogoUrl,
  createdAt: users.createdAt
};
async function getApprovedCompanies(input) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [
    eq(users.role, "company"),
    eq(users.companyStatus, "approved"),
    sql`${users.id} NOT IN (${sql.join(HIDDEN_COMPANY_IDS.map((id) => sql`${id}`), sql`, `)})`
  ];
  if (input?.type) conditions.push(eq(users.companyType, input.type));
  return db.select(COMPANY_SELECT_FIELDS).from(users).where(and(...conditions)).orderBy(desc(users.createdAt));
}
async function getApprovedCompanyById(id) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select(COMPANY_SELECT_FIELDS).from(users).where(
    and(
      eq(users.id, id),
      eq(users.role, "company"),
      eq(users.companyStatus, "approved"),
      sql`${users.id} NOT IN (${sql.join(HIDDEN_COMPANY_IDS.map((id2) => sql`${id2}`), sql`, `)})`
    )
  ).limit(1);
  const company = rows[0];
  if (!company) return null;
  const images = await db.select().from(companyImages).where(eq(companyImages.userId, id)).orderBy(companyImages.sortOrder);
  return { ...company, images };
}
async function addCompanyImages(userId, imageUrls) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (imageUrls.length === 0) return;
  await db.delete(companyImages).where(eq(companyImages.userId, userId));
  await db.insert(companyImages).values(
    imageUrls.map((imageUrl, index) => ({ userId, imageUrl, sortOrder: index }))
  );
}
async function getFavorites(userId) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(favorites).where(eq(favorites.userId, userId)).orderBy(desc(favorites.createdAt));
  const result = await Promise.all(
    rows.map(async (fav) => {
      const [product, business] = await Promise.all([
        fav.productId ? db.select({
          id: products.id,
          title: products.title,
          price: products.price,
          status: products.status,
          category: products.category,
          mainImageUrl: products.mainImageUrl
        }).from(products).where(eq(products.id, fav.productId)).limit(1) : Promise.resolve([]),
        fav.businessId ? db.select({
          id: businesses.id,
          name: businesses.name,
          type: businesses.type
        }).from(businesses).where(eq(businesses.id, fav.businessId)).limit(1) : Promise.resolve([])
      ]);
      return {
        ...fav,
        product: product[0] ?? null,
        business: business[0] ?? null
      };
    })
  );
  return result;
}
async function isFavorited(userId, productId, businessId) {
  const db = await getDb();
  if (!db) return false;
  const conditions = [eq(favorites.userId, userId)];
  if (productId) conditions.push(eq(favorites.productId, productId));
  else if (businessId) conditions.push(eq(favorites.businessId, businessId));
  else return false;
  const existing = await db.select({ id: favorites.id }).from(favorites).where(and(...conditions)).limit(1);
  return existing.length > 0;
}
async function toggleFavorite(userId, productId, businessId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(favorites.userId, userId)];
  if (productId) conditions.push(eq(favorites.productId, productId));
  else if (businessId) conditions.push(eq(favorites.businessId, businessId));
  else throw new Error("productId or businessId required");
  const existing = await db.select().from(favorites).where(and(...conditions)).limit(1);
  if (existing.length > 0) {
    await db.delete(favorites).where(and(...conditions));
    return { favorited: false };
  } else {
    await db.insert(favorites).values({ userId, productId, businessId });
    return { favorited: true };
  }
}
async function getNotifications(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(50);
}
async function markNotificationRead(id, userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  return { success: true };
}
async function addRecentView(userId, productId) {
  const db = await getDb();
  if (!db) return;
  await db.delete(recentViews).where(and(eq(recentViews.userId, userId), eq(recentViews.productId, productId)));
  await db.insert(recentViews).values({ userId, productId });
  const rows = await db.select({ id: recentViews.id }).from(recentViews).where(eq(recentViews.userId, userId)).orderBy(desc(recentViews.viewedAt));
  const stale = rows.slice(50);
  if (stale.length > 0) {
    await Promise.all(
      stale.map((row) => db.delete(recentViews).where(eq(recentViews.id, row.id)))
    );
  }
}
async function getRecentViews(userId) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(recentViews).where(eq(recentViews.userId, userId)).orderBy(desc(recentViews.viewedAt)).limit(50);
  const result = await Promise.all(
    rows.map(async (view) => {
      const product = await db.select({
        id: products.id,
        title: products.title,
        price: products.price,
        status: products.status,
        category: products.category,
        mainImageUrl: products.mainImageUrl
      }).from(products).where(eq(products.id, view.productId)).limit(1);
      return {
        ...view,
        product: product[0] ?? null
      };
    })
  );
  return result.filter((r) => r.product !== null);
}
async function getMyPurchases(userId) {
  const db = await getDb();
  if (!db) return [];
  const rooms = await db.select().from(chatRooms).where(and(eq(chatRooms.buyerId, userId), eq(chatRooms.status, "completed"))).orderBy(desc(chatRooms.lastMessageAt));
  const result = await Promise.all(
    rooms.map(async (room) => {
      const [product, seller] = await Promise.all([
        room.productId ? db.select({
          id: products.id,
          title: products.title,
          price: products.price,
          mainImageUrl: products.mainImageUrl,
          category: products.category
        }).from(products).where(eq(products.id, room.productId)).limit(1) : Promise.resolve([]),
        db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, room.sellerId)).limit(1)
      ]);
      return {
        chatRoomId: room.id,
        purchasedAt: room.lastMessageAt ?? room.createdAt,
        product: product[0] ?? null,
        seller: seller[0] ?? null
      };
    })
  );
  return result;
}
async function submitSellerApplication(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(sellerApplications).where(and(eq(sellerApplications.userId, data.userId), eq(sellerApplications.status, "pending"))).limit(1);
  if (existing.length > 0) {
    throw new Error("\uC774\uBBF8 \uC2EC\uC0AC \uC911\uC778 \uC2E0\uCCAD\uC774 \uC788\uC2B5\uB2C8\uB2E4.");
  }
  const result = await db.insert(sellerApplications).values({
    ...data,
    status: "pending"
  });
  return { id: result[0].insertId };
}
async function getMySellerApplication(userId) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(sellerApplications).where(eq(sellerApplications.userId, userId)).orderBy(desc(sellerApplications.createdAt)).limit(1);
  return rows[0] ?? null;
}
async function getAllSellerApplications(input) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (input?.status) conditions.push(eq(sellerApplications.status, input.status));
  const query = db.select({
    id: sellerApplications.id,
    userId: sellerApplications.userId,
    sellerType: sellerApplications.sellerType,
    businessNumber: sellerApplications.businessNumber,
    businessName: sellerApplications.businessName,
    representativeName: sellerApplications.representativeName,
    businessCertUrl: sellerApplications.businessCertUrl,
    businessPhotoUrl: sellerApplications.businessPhotoUrl,
    status: sellerApplications.status,
    rejectionReason: sellerApplications.rejectionReason,
    createdAt: sellerApplications.createdAt,
    name: users.name,
    email: users.email
  }).from(sellerApplications).leftJoin(users, eq(sellerApplications.userId, users.id)).orderBy(desc(sellerApplications.createdAt)).limit(100);
  return conditions.length > 0 ? query.where(and(...conditions)) : query;
}
async function reviewSellerApplication(applicationId, action, reviewerId, rejectionReason) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const app = await db.select().from(sellerApplications).where(eq(sellerApplications.id, applicationId)).limit(1);
  if (!app[0]) throw new Error("\uC2E0\uCCAD\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
  await db.update(sellerApplications).set({
    status: action,
    rejectionReason: rejectionReason ?? null,
    reviewedAt: /* @__PURE__ */ new Date(),
    reviewedBy: reviewerId
  }).where(eq(sellerApplications.id, applicationId));
  if (action === "approved") {
    const targetUser = await db.select({ role: users.role }).from(users).where(eq(users.id, app[0].userId)).limit(1);
    const shouldChangeRole = targetUser[0]?.role !== "admin";
    await db.update(users).set({
      ...shouldChangeRole ? { role: "seller" } : {},
      sellerStatus: "approved",
      isVerified: true
    }).where(eq(users.id, app[0].userId));
  } else if (action === "rejected") {
    await db.update(users).set({ sellerStatus: "rejected" }).where(eq(users.id, app[0].userId));
  } else if (action === "suspended") {
    await db.update(users).set({ sellerStatus: "rejected", isVerified: false }).where(eq(users.id, app[0].userId));
  }
  return { success: true };
}
async function getUserById(id) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ?? null;
}
async function getChatList(userId) {
  const db = await getDb();
  if (!db) return [];
  const rooms = await db.select().from(chatRooms).where(and(
    or(eq(chatRooms.buyerId, userId), eq(chatRooms.sellerId, userId)),
    // 업체 문의 채팅(상품 없이 나에게 들어온 문의)은 "업체 문의함"에서 따로 보여주므로
    // 일반 채팅 목록에서는 제외해 중복 노출을 방지합니다.
    sql`NOT (${chatRooms.sellerId} = ${userId} AND ${chatRooms.productId} IS NULL)`
  )).orderBy(desc(chatRooms.lastMessageAt)).limit(50);
  const result = await Promise.all(
    rooms.map(async (room) => {
      const otherUserId = room.buyerId === userId ? room.sellerId : room.buyerId;
      const [otherUser, unreadRows, product] = await Promise.all([
        db.select({ id: users.id, name: users.name, profileImageUrl: users.profileImageUrl }).from(users).where(eq(users.id, otherUserId)).limit(1),
        db.select({ id: chatMessages.id }).from(chatMessages).where(and(
          eq(chatMessages.roomId, room.id),
          eq(chatMessages.isRead, false),
          eq(chatMessages.senderId, otherUserId)
        )),
        room.productId ? db.select({ id: products.id, title: products.title, mainImageUrl: products.mainImageUrl }).from(products).where(eq(products.id, room.productId)).limit(1) : Promise.resolve([])
      ]);
      return {
        ...room,
        otherUser: otherUser[0] ?? { id: otherUserId, name: "\uC0AC\uC6A9\uC790", profileImageUrl: null },
        unreadCount: unreadRows.length,
        product: product[0] ?? null
      };
    })
  );
  return result;
}
async function getCompanyInquiryChats(userId) {
  const db = await getDb();
  if (!db) return [];
  const rooms = await db.select().from(chatRooms).where(and(eq(chatRooms.sellerId, userId), sql`${chatRooms.productId} IS NULL`)).orderBy(desc(chatRooms.lastMessageAt)).limit(50);
  const result = await Promise.all(
    rooms.map(async (room) => {
      const [buyer, unreadRows] = await Promise.all([
        db.select({ id: users.id, name: users.name, profileImageUrl: users.profileImageUrl }).from(users).where(eq(users.id, room.buyerId)).limit(1),
        db.select({ id: chatMessages.id }).from(chatMessages).where(and(
          eq(chatMessages.roomId, room.id),
          eq(chatMessages.isRead, false),
          eq(chatMessages.senderId, room.buyerId)
        ))
      ]);
      return {
        ...room,
        otherUser: buyer[0] ?? { id: room.buyerId, name: "\uC0AC\uC6A9\uC790", profileImageUrl: null },
        unreadCount: unreadRows.length
      };
    })
  );
  return result;
}
async function getOrCreateChatRoom(buyerId, sellerId, productId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [
    eq(chatRooms.buyerId, buyerId),
    eq(chatRooms.sellerId, sellerId)
  ];
  if (productId) conditions.push(eq(chatRooms.productId, productId));
  const existing = await db.select().from(chatRooms).where(and(...conditions)).limit(1);
  if (existing[0]) return existing[0];
  const result = await db.insert(chatRooms).values({
    buyerId,
    sellerId,
    productId: productId ?? null,
    status: "active"
  });
  const newRoom = await db.select().from(chatRooms).where(eq(chatRooms.id, result[0].insertId)).limit(1);
  return newRoom[0];
}
async function getChatRoomDetail(roomId, userId) {
  const db = await getDb();
  if (!db) return null;
  const rooms = await db.select().from(chatRooms).where(eq(chatRooms.id, roomId)).limit(1);
  const room = rooms[0];
  if (!room) return null;
  if (room.buyerId !== userId && room.sellerId !== userId) return null;
  const otherUserId = room.buyerId === userId ? room.sellerId : room.buyerId;
  const [otherUser, product] = await Promise.all([
    db.select({ id: users.id, name: users.name, profileImageUrl: users.profileImageUrl, isVerified: users.isVerified }).from(users).where(eq(users.id, otherUserId)).limit(1),
    room.productId ? db.select({ id: products.id, title: products.title, mainImageUrl: products.mainImageUrl, price: products.price, status: products.status }).from(products).where(eq(products.id, room.productId)).limit(1) : Promise.resolve([])
  ]);
  return {
    ...room,
    otherUser: otherUser[0] ?? { id: otherUserId, name: "\uC0AC\uC6A9\uC790", profileImageUrl: null, isVerified: false },
    product: product[0] ?? null,
    myRole: room.buyerId === userId ? "buyer" : "seller"
  };
}
async function getChatMessages(roomId, userId, limit = 50, beforeId) {
  const db = await getDb();
  if (!db) return [];
  const rooms = await db.select().from(chatRooms).where(eq(chatRooms.id, roomId)).limit(1);
  const room = rooms[0];
  if (!room || room.buyerId !== userId && room.sellerId !== userId) return [];
  const conditions = [eq(chatMessages.roomId, roomId)];
  if (beforeId) conditions.push(lt(chatMessages.id, beforeId));
  const messages = await db.select().from(chatMessages).where(and(...conditions)).orderBy(desc(chatMessages.createdAt)).limit(limit);
  return messages.reverse();
}
async function sendChatMessage(roomId, senderId, content, imageUrl) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const startedAt = Date.now();
  const rooms = await db.select().from(chatRooms).where(eq(chatRooms.id, roomId)).limit(1);
  const accessCheckedAt = Date.now();
  const room = rooms[0];
  if (!room || room.buyerId !== senderId && room.sellerId !== senderId) {
    throw new Error("\uCC44\uD305\uBC29\uC5D0 \uC811\uADFC\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
  }
  const result = await db.insert(chatMessages).values({
    roomId,
    senderId,
    content: content ?? null,
    imageUrl: imageUrl ?? null,
    isRead: false
  });
  const insertedAt = Date.now();
  await db.update(chatRooms).set({
    lastMessage: content ?? (imageUrl ? "[\uC0AC\uC9C4]" : ""),
    lastMessageAt: /* @__PURE__ */ new Date()
  }).where(eq(chatRooms.id, roomId));
  const roomUpdatedAt = Date.now();
  const newMsg = await db.select().from(chatMessages).where(eq(chatMessages.id, result[0].insertId)).limit(1);
  console.info("[chat.send.persisted]", {
    roomId,
    senderId,
    accessCheckMs: accessCheckedAt - startedAt,
    insertMs: insertedAt - accessCheckedAt,
    roomUpdateMs: roomUpdatedAt - insertedAt,
    messageReadbackMs: Date.now() - roomUpdatedAt,
    totalMs: Date.now() - startedAt
  });
  return newMsg[0];
}
async function getChatRoomParticipants(roomId) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(chatRooms).where(eq(chatRooms.id, roomId)).limit(1);
  const room = rows[0];
  if (!room) return null;
  return { buyerId: room.buyerId, sellerId: room.sellerId };
}
async function markMessagesRead(roomId, userId) {
  const db = await getDb();
  if (!db) return;
  const rooms = await db.select().from(chatRooms).where(eq(chatRooms.id, roomId)).limit(1);
  const room = rooms[0];
  if (!room) return;
  const senderId = room.buyerId === userId ? room.sellerId : room.buyerId;
  await db.update(chatMessages).set({ isRead: true }).where(
    and(
      eq(chatMessages.roomId, roomId),
      eq(chatMessages.senderId, senderId),
      eq(chatMessages.isRead, false)
    )
  );
  return { success: true };
}
async function updateChatRoomStatus(roomId, userId, status) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rooms = await db.select().from(chatRooms).where(eq(chatRooms.id, roomId)).limit(1);
  const room = rooms[0];
  if (!room || room.buyerId !== userId && room.sellerId !== userId) {
    throw new Error("\uCC44\uD305\uBC29\uC5D0 \uC811\uADFC\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
  }
  if (room.sellerId !== userId) {
    throw new Error("\uAC70\uB798\uC644\uB8CC/\uCDE8\uC18C\uB294 \uD310\uB9E4\uC790\uB9CC \uC124\uC815\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.");
  }
  await db.update(chatRooms).set({ status }).where(eq(chatRooms.id, roomId));
  return { success: true };
}
async function createReview(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (data.chatRoomId) {
    const existing = await db.select().from(reviews).where(and(eq(reviews.userId, data.userId), eq(reviews.chatRoomId, data.chatRoomId))).limit(1);
    if (existing[0]) throw new Error("\uC774\uBBF8 \uD6C4\uAE30\uB97C \uC791\uC131\uD588\uC2B5\uB2C8\uB2E4.");
  }
  const result = await db.insert(reviews).values({
    userId: data.userId,
    targetUserId: data.targetUserId,
    productId: data.productId ?? null,
    chatRoomId: data.chatRoomId ?? null,
    rating: data.rating,
    content: data.content ?? null
  });
  const newReview = await db.select().from(reviews).where(eq(reviews.id, result[0].insertId)).limit(1);
  return newReview[0];
}
async function getReviewsByTargetUser(targetUserId, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    id: reviews.id,
    rating: reviews.rating,
    content: reviews.content,
    createdAt: reviews.createdAt,
    productId: reviews.productId,
    reviewerName: users.name,
    reviewerProfileUrl: users.profileImageUrl
  }).from(reviews).leftJoin(users, eq(reviews.userId, users.id)).where(eq(reviews.targetUserId, targetUserId)).orderBy(desc(reviews.createdAt)).limit(limit).offset(offset);
  return rows;
}
async function getSellerRatingSummary(targetUserId) {
  const db = await getDb();
  if (!db) return { averageRating: 0, totalCount: 0 };
  const rows = await db.select({ rating: reviews.rating }).from(reviews).where(eq(reviews.targetUserId, targetUserId));
  if (rows.length === 0) return { averageRating: 0, totalCount: 0 };
  const total = rows.reduce((sum, r) => sum + r.rating, 0);
  return {
    averageRating: Math.round(total / rows.length * 10) / 10,
    totalCount: rows.length
  };
}
async function checkReviewExists(userId, chatRoomId) {
  const db = await getDb();
  if (!db) return false;
  const existing = await db.select({ id: reviews.id }).from(reviews).where(and(eq(reviews.userId, userId), eq(reviews.chatRoomId, chatRoomId))).limit(1);
  return existing.length > 0;
}
async function getMyReviews(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: reviews.id,
    rating: reviews.rating,
    content: reviews.content,
    createdAt: reviews.createdAt,
    targetName: users.name,
    targetProfileUrl: users.profileImageUrl
  }).from(reviews).leftJoin(users, eq(reviews.targetUserId, users.id)).where(eq(reviews.userId, userId)).orderBy(desc(reviews.createdAt)).limit(50);
}
async function getAdminStats() {
  const db = await getDb();
  if (!db) return { totalUsers: 0, totalProducts: 0, totalReports: 0, pendingReports: 0, pendingSellers: 0 };
  const [userCount, productCount, reportCount, pendingReportCount, pendingSellerCount] = await Promise.all([
    db.select({ count: sql`COUNT(*)` }).from(users),
    db.select({ count: sql`COUNT(*)` }).from(products),
    db.select({ count: sql`COUNT(*)` }).from(reports),
    db.select({ count: sql`COUNT(*)` }).from(reports).where(eq(reports.status, "pending")),
    db.select({ count: sql`COUNT(*)` }).from(sellerApplications).where(eq(sellerApplications.status, "pending"))
  ]);
  return {
    totalUsers: Number(userCount[0]?.count ?? 0),
    totalProducts: Number(productCount[0]?.count ?? 0),
    totalReports: Number(reportCount[0]?.count ?? 0),
    pendingReports: Number(pendingReportCount[0]?.count ?? 0),
    pendingSellers: Number(pendingSellerCount[0]?.count ?? 0)
  };
}
async function getAdminProducts(input) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (input?.status) conditions.push(eq(products.status, input.status));
  const query = db.select({
    id: products.id,
    title: products.title,
    price: products.price,
    category: products.category,
    status: products.status,
    viewCount: products.viewCount,
    createdAt: products.createdAt,
    sellerName: users.name,
    sellerId: users.id
  }).from(products).leftJoin(users, eq(products.userId, users.id)).orderBy(desc(products.createdAt)).limit(input?.limit ?? 30).offset(input?.offset ?? 0);
  if (conditions.length > 0) {
    return query.where(and(...conditions));
  }
  return query;
}
async function adminDeleteProduct(productId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(products).where(eq(products.id, productId));
  return { success: true };
}
async function getAdminReports(input) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (input?.status) conditions.push(eq(reports.status, input.status));
  const query = db.select({
    id: reports.id,
    targetType: reports.targetType,
    targetId: reports.targetId,
    reason: reports.reason,
    status: reports.status,
    createdAt: reports.createdAt,
    reporterName: users.name
  }).from(reports).leftJoin(users, eq(reports.reporterId, users.id)).orderBy(desc(reports.createdAt)).limit(input?.limit ?? 30).offset(input?.offset ?? 0);
  const rows = conditions.length > 0 ? await query.where(and(...conditions)) : await query;
  const result = await Promise.all(
    rows.map(async (row) => {
      let targetName = null;
      try {
        if (row.targetType === "product") {
          const p = await db.select({ title: products.title }).from(products).where(eq(products.id, row.targetId)).limit(1);
          targetName = p[0]?.title ?? null;
        } else if (row.targetType === "user") {
          const u = await db.select({ name: users.name }).from(users).where(eq(users.id, row.targetId)).limit(1);
          targetName = u[0]?.name ?? null;
        } else if (row.targetType === "chat") {
          targetName = `\uCC44\uD305\uBC29 #${row.targetId}`;
        } else if (row.targetType === "comment") {
          targetName = `\uB313\uAE00 #${row.targetId}`;
        }
      } catch {
        targetName = null;
      }
      return { ...row, targetName };
    })
  );
  return result;
}
async function updateReportStatus(reportId, status) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(reports).set({ status }).where(eq(reports.id, reportId));
  return { success: true };
}
async function createReport(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(reports).values({
    reporterId: data.reporterId,
    targetType: data.targetType,
    targetId: data.targetId,
    reason: data.reason
  });
  return { success: true };
}
async function getAdminUsers(input) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    isVerified: users.isVerified,
    sellerStatus: users.sellerStatus,
    createdAt: users.createdAt,
    deletedAt: users.deletedAt,
    suspendedAt: users.suspendedAt,
    suspendedReason: users.suspendedReason
  }).from(users).orderBy(desc(users.createdAt)).limit(input?.limit ?? 50).offset(input?.offset ?? 0);
}
async function getNotices(input) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: notices.id,
    title: notices.title,
    content: notices.content,
    isPinned: notices.isPinned,
    viewCount: notices.viewCount,
    createdAt: notices.createdAt,
    authorName: users.name
  }).from(notices).leftJoin(users, eq(notices.authorId, users.id)).orderBy(desc(notices.isPinned), desc(notices.createdAt)).limit(input?.limit ?? 20).offset(input?.offset ?? 0);
}
async function createNotice(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(notices).values({
    authorId: data.authorId,
    title: data.title,
    content: data.content,
    isPinned: data.isPinned ?? false
  });
  return { id: result[0].insertId };
}
async function deleteNotice(noticeId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(notices).where(eq(notices.id, noticeId));
  return { success: true };
}
async function createInquiry(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(inquiries).values({
    userId: data.userId,
    category: data.category,
    title: data.title,
    content: data.content
  });
  return { id: result[0].insertId };
}
async function getMyInquiries(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(inquiries).where(eq(inquiries.userId, userId)).orderBy(desc(inquiries.createdAt));
}
async function getInquiryById(id, userId) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(inquiries).where(eq(inquiries.id, id)).limit(1);
  const inquiry = rows[0];
  if (!inquiry) return null;
  if (userId !== void 0 && inquiry.userId !== userId) return null;
  return inquiry;
}
async function getAllInquiries(input) {
  const db = await getDb();
  if (!db) return [];
  const conditions = input?.status ? [eq(inquiries.status, input.status)] : [];
  const query = db.select().from(inquiries);
  const rows = await (conditions.length > 0 ? query.where(and(...conditions)) : query).orderBy(desc(inquiries.createdAt)).limit(input?.limit ?? 50).offset(input?.offset ?? 0);
  return rows;
}
async function answerInquiry(id, adminId, answerContent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(inquiries).set({ status: "answered", answerContent, answeredBy: adminId, answeredAt: /* @__PURE__ */ new Date() }).where(eq(inquiries.id, id));
  return { success: true };
}
async function getUserByEmail(email) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select({
    id: users.id,
    openId: users.openId,
    name: users.name,
    email: users.email,
    password: users.password,
    role: users.role,
    isVerified: users.isVerified,
    sellerStatus: users.sellerStatus,
    companyStatus: users.companyStatus,
    profileImageUrl: users.profileImageUrl,
    phone: users.phone,
    deletedAt: users.deletedAt,
    suspendedAt: users.suspendedAt,
    suspendedReason: users.suspendedReason
  }).from(users).where(eq(users.email, email)).limit(1);
  return rows[0] ?? null;
}
async function getUserByKakaoId(kakaoId) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(users).where(eq(users.kakaoId, kakaoId)).limit(1);
  return rows[0] ?? null;
}
async function getUserByAppleId(appleId) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select({
    id: users.id,
    openId: users.openId,
    name: users.name,
    email: users.email,
    loginMethod: users.loginMethod,
    role: users.role,
    isVerified: users.isVerified,
    sellerStatus: users.sellerStatus,
    companyStatus: users.companyStatus,
    profileImageUrl: users.profileImageUrl,
    phone: users.phone,
    appleId: users.appleId,
    suspendedAt: users.suspendedAt,
    suspendedReason: users.suspendedReason
  }).from(users).where(eq(users.appleId, appleId)).limit(1);
  return rows[0] ?? null;
}
async function createAppleUserLegacySafe(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const openId = data.openId.length <= 64 ? data.openId : `apple_${createHash("sha256").update(data.appleId).digest("hex").slice(0, 58)}`;
  await db.execute(sql`
    INSERT INTO users (\`openId\`, \`email\`, \`name\`, \`loginMethod\`, \`appleId\`)
    VALUES (${openId}, ${data.email}, ${data.name}, 'apple', ${data.appleId})
    ON DUPLICATE KEY UPDATE
      \`appleId\` = VALUES(\`appleId\`),
      \`loginMethod\` = 'apple'
  `);
  const newUser = await getUserByAppleId(data.appleId);
  if (!newUser) throw new Error("Failed to create Apple user");
  return newUser;
}
async function createUserByEmail(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(users).values({
    openId: data.openId,
    email: data.email ?? void 0,
    password: data.password ?? void 0,
    name: data.name,
    nickname: data.nickname ?? void 0,
    phone: data.phone ?? void 0,
    loginMethod: data.loginMethod,
    kakaoId: data.kakaoId ?? void 0,
    appleId: data.appleId ?? void 0,
    profileImageUrl: data.profileImageUrl ?? void 0,
    role: "user",
    isVerified: false,
    lastSignedIn: /* @__PURE__ */ new Date()
  });
  const newUser = await getUserById(result[0].insertId);
  if (!newUser) throw new Error("Failed to create user");
  return newUser;
}
async function updateUserSellerInfo(userId, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({
    sellerStatus: data.sellerStatus,
    sellerType: data.sellerType,
    businessNumber: data.businessNumber,
    businessName: data.businessName,
    representativeName: data.representativeName,
    businessCertUrl: data.businessCertUrl ?? void 0,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(users.id, userId));
}
async function updateCompanyProfile(userId, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, userId));
  return getUserById(userId);
}
async function updateUserCompanyInfo(userId, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({
    companyStatus: data.companyStatus,
    companyType: data.companyType,
    companyName: data.companyName,
    companyPhone: data.companyPhone,
    companyAddress: data.companyAddress,
    companyDesc: data.companyDesc ?? void 0,
    businessNumber: data.businessNumber ?? void 0,
    companyLogoUrl: data.companyLogoUrl ?? void 0,
    companyBusinessCertUrl: data.companyBusinessCertUrl ?? void 0,
    representativeName: data.representativeName,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(users.id, userId));
}
async function getCompanyApplications(input) {
  const db = await getDb();
  if (!db) return [];
  const selectFields = {
    id: users.id,
    name: users.name,
    email: users.email,
    phone: users.phone,
    companyStatus: users.companyStatus,
    companyType: users.companyType,
    companyName: users.companyName,
    companyPhone: users.companyPhone,
    companyAddress: users.companyAddress,
    companyDesc: users.companyDesc,
    businessNumber: users.businessNumber,
    representativeName: users.representativeName,
    companyLogoUrl: users.companyLogoUrl,
    companyBusinessCertUrl: users.companyBusinessCertUrl,
    companyRejectionReason: users.companyRejectionReason,
    createdAt: users.createdAt
  };
  const { isNotNull } = await import("drizzle-orm");
  if (input?.status) {
    return db.select(selectFields).from(users).where(eq(users.companyStatus, input.status)).orderBy(desc(users.createdAt)).limit(100);
  }
  return db.select(selectFields).from(users).where(isNotNull(users.companyType)).orderBy(desc(users.createdAt)).limit(100);
}
async function reviewCompanyApplication(userId, action, rejectionReason) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (action === "approved") {
    const targetUser = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
    const shouldChangeRole = targetUser[0]?.role !== "admin";
    await db.update(users).set({
      ...shouldChangeRole ? { role: "company" } : {},
      companyStatus: "approved",
      isVerified: true,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, userId));
  } else if (action === "rejected") {
    await db.update(users).set({
      companyStatus: "rejected",
      companyRejectionReason: rejectionReason ?? null,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, userId));
  } else if (action === "suspended") {
    await db.update(users).set({
      companyStatus: "suspended",
      isVerified: false,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, userId));
  }
  return { success: true };
}
async function updateUserProfile(userId, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, userId));
  return getUserById(userId);
}
async function updateUserPassword(userId, hashedPassword) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ password: hashedPassword, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, userId));
}
var LOCKOUT_DURATION_MS = 10 * 60 * 1e3;
async function getAccountLockStatus(_userId) {
  return null;
}
async function recordFailedLogin(_userId) {
  return;
}
async function resetFailedLogin(_userId) {
  return;
}
async function createPasswordResetToken(userId, token, expiresAt) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(passwordResetTokens).set({ used: true }).where(and(eq(passwordResetTokens.userId, userId), eq(passwordResetTokens.used, false)));
  await db.insert(passwordResetTokens).values({ userId, token, expiresAt });
  return { success: true };
}
async function getValidPasswordResetToken(token) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(passwordResetTokens).where(and(eq(passwordResetTokens.token, token), eq(passwordResetTokens.used, false))).limit(1);
  const row = rows[0];
  if (!row) return null;
  if (row.expiresAt.getTime() < Date.now()) return null;
  return row;
}
async function markPasswordResetTokenUsed(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(passwordResetTokens).set({ used: true }).where(eq(passwordResetTokens.id, id));
}
async function deleteAccount(userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({
    openId: `deleted_${userId}_${Date.now()}`,
    name: "\uD0C8\uD1F4\uD55C \uD68C\uC6D0",
    email: null,
    phone: null,
    password: null,
    kakaoId: null,
    profileImageUrl: null,
    businessCertUrl: null,
    businessPhotoUrl: null,
    companyLogoUrl: null,
    expoPushToken: null,
    role: "user",
    companyStatus: null,
    sellerStatus: null,
    deletedAt: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(users.id, userId));
  await db.update(products).set({ status: "sold" }).where(and(eq(products.userId, userId), eq(products.status, "selling")));
  return { success: true };
}
async function suspendUser(userId, reason) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({
    suspendedAt: /* @__PURE__ */ new Date(),
    suspendedReason: reason ?? null,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(users.id, userId));
  return { success: true };
}
async function reactivateUser(userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({
    suspendedAt: null,
    suspendedReason: null,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(users.id, userId));
  return { success: true };
}
async function savePushToken(userId, token) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.update(users).set({ expoPushToken: token }).where(eq(users.id, userId));
    return true;
  } catch (error) {
    console.error("\uD478\uC2DC \uD1A0\uD070 \uC800\uC7A5 \uC2E4\uD328:", error);
    return false;
  }
}
async function removePushToken(userId) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.update(users).set({ expoPushToken: null }).where(eq(users.id, userId));
    return true;
  } catch (error) {
    console.error("\uD478\uC2DC \uD1A0\uD070 \uC0AD\uC81C \uC2E4\uD328:", error);
    return false;
  }
}
async function updateNotificationSettings(userId, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData = { updatedAt: /* @__PURE__ */ new Date() };
  if (data.notifChat !== void 0) updateData.notifChat = data.notifChat;
  if (data.notifPriceDrop !== void 0) updateData.notifPriceDrop = data.notifPriceDrop;
  if (data.notifTrade !== void 0) updateData.notifTrade = data.notifTrade;
  if (data.notifMarketing !== void 0) updateData.notifMarketing = data.notifMarketing;
  await db.update(users).set(updateData).where(eq(users.id, userId));
}

// server/_core/cookies.ts
var LOCAL_HOSTS = /* @__PURE__ */ new Set(["localhost", "127.0.0.1", "::1"]);
function isIpAddress(host) {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getParentDomain(hostname) {
  if (LOCAL_HOSTS.has(hostname) || isIpAddress(hostname)) {
    return void 0;
  }
  const parts = hostname.split(".");
  if (parts.length < 3) {
    return void 0;
  }
  return "." + parts.slice(-2).join(".");
}
function getSessionCookieOptions(req) {
  const hostname = req.hostname;
  const domain = getParentDomain(hostname);
  return {
    domain,
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
init_env();
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(EXCHANGE_TOKEN_PATH, payload);
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(GET_USER_INFO_PATH, {
      accessToken: token.accessToken
    });
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(platforms.filter((p) => typeof p === "string"));
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    let token;
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice("Bearer ".length).trim();
    }
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = token || cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    if (session.openId.startsWith(CRON_OPEN_ID_PREFIX)) {
      const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
      const taskUid = userInfo.taskUid ?? null;
      if (!taskUid) {
        throw ForbiddenError("Cron session missing task_uid");
      }
      return buildCronUser(userInfo);
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var CRON_OPEN_ID_PREFIX = "cron_";
function buildCronUser(userInfo) {
  const now = /* @__PURE__ */ new Date();
  return {
    id: -1,
    openId: userInfo.openId,
    name: userInfo.name || "Manus Scheduled Task",
    email: null,
    loginMethod: null,
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    taskUid: userInfo.taskUid ?? void 0,
    isCron: true
  };
}
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
async function syncUser(userInfo) {
  if (!userInfo.openId) {
    throw new Error("openId missing from user info");
  }
  const lastSignedIn = /* @__PURE__ */ new Date();
  await upsertUser({
    openId: userInfo.openId,
    name: userInfo.name || null,
    email: userInfo.email ?? null,
    loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
    lastSignedIn
  });
  const saved = await getUserByOpenId(userInfo.openId);
  return saved ?? {
    openId: userInfo.openId,
    name: userInfo.name,
    email: userInfo.email,
    loginMethod: userInfo.loginMethod ?? null,
    lastSignedIn
  };
}
function buildUserResponse(user) {
  return {
    id: user?.id ?? null,
    openId: user?.openId ?? null,
    name: user?.name ?? null,
    email: user?.email ?? null,
    loginMethod: user?.loginMethod ?? null,
    lastSignedIn: (user?.lastSignedIn ?? /* @__PURE__ */ new Date()).toISOString(),
    role: user?.role ?? "user",
    userType: user?.userType ?? "buyer",
    isVerified: user?.isVerified ?? false,
    sellerStatus: user?.sellerStatus ?? null
  };
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      await syncUser(userInfo);
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      const frontendUrl = process.env.EXPO_WEB_PREVIEW_URL || process.env.EXPO_PACKAGER_PROXY_URL || "http://localhost:8081";
      res.redirect(302, frontendUrl);
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
  app.get("/api/oauth/mobile", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      const user = await syncUser(userInfo);
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({
        app_session_id: sessionToken,
        user: buildUserResponse(user)
      });
    } catch (error) {
      console.error("[OAuth] Mobile exchange failed", error);
      res.status(500).json({ error: "OAuth mobile exchange failed" });
    }
  });
  app.post("/api/auth/logout", (req, res) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.json({ success: true });
  });
  app.get("/api/auth/me", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      res.json({ user: buildUserResponse(user) });
    } catch (error) {
      console.error("[Auth] /api/auth/me failed:", error);
      res.status(401).json({ error: "Not authenticated", user: null });
    }
  });
  app.post("/api/auth/session", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      const authHeader = req.headers.authorization || req.headers.Authorization;
      if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
        res.status(400).json({ error: "Bearer token required" });
        return;
      }
      const token = authHeader.slice("Bearer ".length).trim();
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({ success: true, user: buildUserResponse(user) });
    } catch (error) {
      console.error("[Auth] /api/auth/session failed:", error);
      res.status(401).json({ error: "Invalid token" });
    }
  });
}

// server/_core/storageProxy.ts
init_env();
function registerStorageProxy(app) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = req.params[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }
    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` }
      });
      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }
      const { url } = await forgeResp.json();
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }
      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}

// server/_core/legal.ts
function registerLegalRoutes(app) {
  app.get("/terms", (_req, res) => {
    const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>\uC774\uC6A9\uC57D\uAD00 - \uD074\uB85C\uC9D5\uB9C8\uCF13</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
      color: #333;
      line-height: 1.6;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 20px;
      background-color: white;
      min-height: 100vh;
    }
    h1 {
      font-size: 32px;
      margin-bottom: 10px;
      color: #D4AF37;
    }
    .meta {
      font-size: 14px;
      color: #999;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 1px solid #eee;
    }
    h2 {
      font-size: 18px;
      font-weight: 600;
      margin-top: 30px;
      margin-bottom: 15px;
      color: #222;
    }
    p {
      margin-bottom: 12px;
      color: #555;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .section {
      margin-bottom: 25px;
    }
    .footer-note {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #999;
      font-style: italic;
      line-height: 1.8;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>\uD074\uB85C\uC9D5\uB9C8\uCF13 \uC774\uC6A9\uC57D\uAD00</h1>
    <div class="meta">\uC2DC\uD589\uC77C\uC790: 2026\uB144 8\uC6D4 6\uC77C</div>

    <div class="section">
      <h2>\uC81C1\uC870 (\uBAA9\uC801)</h2>
      <p>\uC774 \uC57D\uAD00\uC740 \uD074\uB85C\uC9D5\uB9C8\uCF13(\uC774\uD558 "\uD68C\uC0AC")\uC774 \uC81C\uACF5\uD558\uB294 \uC911\uACE0 \uBB3C\uD488 \uAC70\uB798 \uC911\uAC1C \uBC0F \uC804\uBB38 \uC5C5\uCCB4 \uC5F0\uACB0 \uC11C\uBE44\uC2A4(\uC774\uD558 "\uC11C\uBE44\uC2A4")\uC758 \uC774\uC6A9\uACFC \uAD00\uB828\uD558\uC5EC \uD68C\uC0AC\uC640 \uC774\uC6A9\uC790\uC758 \uAD8C\uB9AC, \uC758\uBB34 \uBC0F \uCC45\uC784\uC0AC\uD56D, \uAE30\uD0C0 \uD544\uC694\uD55C \uC0AC\uD56D\uC744 \uADDC\uC815\uD568\uC744 \uBAA9\uC801\uC73C\uB85C \uD569\uB2C8\uB2E4.</p>
    </div>

    <div class="section">
      <h2>\uC81C2\uC870 (\uC815\uC758)</h2>
      <p>1. "\uC11C\uBE44\uC2A4"\uB780 \uD68C\uC0AC\uAC00 \uC81C\uACF5\uD558\uB294 \uC911\uACE0 \uBB3C\uD488 \uB4F1\uB85D\xB7\uAC70\uB798 \uC911\uAC1C \uBC0F \uC5C5\uCCB4 \uC815\uBCF4 \uC81C\uACF5 \uD50C\uB7AB\uD3FC\uC744 \uC758\uBBF8\uD569\uB2C8\uB2E4.
2. "\uD68C\uC6D0"\uC774\uB780 \uC774 \uC57D\uAD00\uC5D0 \uB3D9\uC758\uD558\uACE0 \uC11C\uBE44\uC2A4\uC5D0 \uAC00\uC785\uD55C \uC790\uB97C \uC758\uBBF8\uD569\uB2C8\uB2E4.
3. "\uD310\uB9E4\uD68C\uC6D0"\uC774\uB780 \uC0AC\uC5C5\uC790\uB4F1\uB85D\uC99D \uB4F1 \uC11C\uB958 \uC81C\uCD9C\uC744 \uD1B5\uD574 \uD68C\uC0AC\uC758 \uC778\uC99D\uC744 \uBC1B\uC544 \uBB3C\uD488\uC744 \uB4F1\uB85D\xB7\uD310\uB9E4\uD560 \uC218 \uC788\uB294 \uD68C\uC6D0\uC744 \uC758\uBBF8\uD569\uB2C8\uB2E4.
4. "\uC5C5\uCCB4\uD68C\uC6D0"\uC774\uB780 \uC778\uD14C\uB9AC\uC5B4, \uCCA0\uAC70 \uB4F1 \uC804\uBB38 \uC11C\uBE44\uC2A4 \uC5C5\uCCB4\uB85C\uC11C \uD68C\uC0AC\uC758 \uC778\uC99D\uC744 \uBC1B\uC544 \uC11C\uBE44\uC2A4 \uC815\uBCF4\uB97C \uAC8C\uC2DC\uD558\uB294 \uD68C\uC6D0\uC744 \uC758\uBBF8\uD569\uB2C8\uB2E4.
5. "\uAC8C\uC2DC\uBB3C"\uC774\uB780 \uD68C\uC6D0\uC774 \uC11C\uBE44\uC2A4 \uB0B4\uC5D0 \uAC8C\uC2DC\uD55C \uC0C1\uD488 \uC815\uBCF4, \uC0AC\uC9C4, \uCC44\uD305 \uBA54\uC2DC\uC9C0, \uD6C4\uAE30 \uB4F1 \uC77C\uCCB4\uC758 \uC815\uBCF4\uB97C \uC758\uBBF8\uD569\uB2C8\uB2E4.</p>
    </div>

    <div class="section">
      <h2>\uC81C3\uC870 (\uC57D\uAD00\uC758 \uD6A8\uB825 \uBC0F \uBCC0\uACBD)</h2>
      <p>1. \uC774 \uC57D\uAD00\uC740 \uC11C\uBE44\uC2A4 \uD654\uBA74\uC5D0 \uAC8C\uC2DC\uD558\uAC70\uB098 \uAE30\uD0C0\uC758 \uBC29\uBC95\uC73C\uB85C \uD68C\uC6D0\uC5D0\uAC8C \uACF5\uC9C0\uD568\uC73C\uB85C\uC368 \uD6A8\uB825\uC744 \uBC1C\uC0DD\uD569\uB2C8\uB2E4.
2. \uD68C\uC0AC\uB294 \uAD00\uACC4 \uBC95\uB839\uC744 \uC704\uBC30\uD558\uC9C0 \uC54A\uB294 \uBC94\uC704\uC5D0\uC11C \uC774 \uC57D\uAD00\uC744 \uBCC0\uACBD\uD560 \uC218 \uC788\uC73C\uBA70, \uBCC0\uACBD \uC2DC \uC801\uC6A9\uC77C\uC790 \uBC0F \uBCC0\uACBD\uC0AC\uC720\uB97C \uCD5C\uC18C 7\uC77C \uC804\uC5D0 \uACF5\uC9C0\uD569\uB2C8\uB2E4. \uB2E4\uB9CC \uC774\uC6A9\uC790\uC5D0\uAC8C \uBD88\uB9AC\uD55C \uBCC0\uACBD\uC758 \uACBD\uC6B0 30\uC77C \uC804\uC5D0 \uACF5\uC9C0\uD569\uB2C8\uB2E4.</p>
    </div>

    <div class="section">
      <h2>\uC81C4\uC870 (\uD68C\uC6D0\uAC00\uC785 \uBC0F \uC778\uC99D)</h2>
      <p>1. \uD68C\uC6D0\uAC00\uC785\uC740 \uC774\uBA54\uC77C \uB610\uB294 \uCE74\uCE74\uC624 \uACC4\uC815\uC744 \uD1B5\uD574 \uC2E0\uCCAD\uD558\uBA70, \uD68C\uC0AC\uAC00 \uC774\uB97C \uC2B9\uB099\uD568\uC73C\uB85C\uC368 \uC131\uB9BD\uD569\uB2C8\uB2E4.
2. \uD310\uB9E4\uD68C\uC6D0 \uBC0F \uC5C5\uCCB4\uD68C\uC6D0 \uC790\uACA9\uC740 \uC0AC\uC5C5\uC790\uB4F1\uB85D\uC99D \uB4F1 \uAD00\uB828 \uC11C\uB958 \uC81C\uCD9C \uD6C4 \uD68C\uC0AC\uC758 \uC2EC\uC0AC\xB7\uC2B9\uC778\uC744 \uD1B5\uD574 \uBD80\uC5EC\uB429\uB2C8\uB2E4.
3. \uD68C\uC0AC\uB294 \uB2E4\uC74C \uAC01 \uD638\uC5D0 \uD574\uB2F9\uD558\uB294 \uACBD\uC6B0 \uAC00\uC785 \uC2E0\uCCAD\uC744 \uC2B9\uC778\uD558\uC9C0 \uC54A\uAC70\uB098 \uC0AC\uD6C4\uC5D0 \uC774\uC6A9\uACC4\uC57D\uC744 \uD574\uC9C0\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.
   \uAC00. \uD0C0\uC778\uC758 \uBA85\uC758\uB97C \uC774\uC6A9\uD558\uAC70\uB098 \uD5C8\uC704 \uC815\uBCF4\uB97C \uAE30\uC7AC\uD55C \uACBD\uC6B0
   \uB098. \uC81C\uCD9C\uD55C \uC0AC\uC5C5\uC790 \uC815\uBCF4\uAC00 \uC0AC\uC2E4\uACFC \uB2E4\uB974\uAC70\uB098 \uD655\uC778\uC774 \uBD88\uAC00\uB2A5\uD55C \uACBD\uC6B0
   \uB2E4. \uAE30\uD0C0 \uD68C\uC6D0\uC73C\uB85C \uB4F1\uB85D\uD558\uB294 \uAC83\uC774 \uC11C\uBE44\uC2A4 \uC6B4\uC601\uC5D0 \uD604\uC800\uD788 \uC9C0\uC7A5\uC774 \uC788\uB2E4\uACE0 \uD310\uB2E8\uB418\uB294 \uACBD\uC6B0</p>
    </div>

    <div class="section">
      <h2>\uC81C5\uC870 (\uD68C\uC6D0\uC758 \uC758\uBB34 \uBC0F \uAE08\uC9C0\uD589\uC704)</h2>
      <p>\uD68C\uC6D0\uC740 \uB2E4\uC74C \uAC01 \uD638\uC758 \uD589\uC704\uB97C \uD558\uC5EC\uC11C\uB294 \uC548 \uB429\uB2C8\uB2E4.

1. \uD5C8\uC704 \uB9E4\uBB3C \uB4F1\uB85D, \uD5C8\uC704 \uC815\uBCF4 \uAE30\uC7AC \uB4F1 \uAE30\uB9DD \uD589\uC704
2. \uD0C0\uC778\uC758 \uC815\uBCF4 \uB3C4\uC6A9 \uB610\uB294 \uC0AC\uC5C5\uC790 \uC815\uBCF4 \uD5C8\uC704 \uC81C\uCD9C
3. \uD68C\uC0AC \uBC0F \uC81C3\uC790\uC758 \uC9C0\uC2DD\uC7AC\uC0B0\uAD8C \uB4F1 \uAD8C\uB9AC\uB97C \uCE68\uD574\uD558\uB294 \uD589\uC704
4. \uB2E4\uB978 \uD68C\uC6D0\uC5D0 \uB300\uD55C \uC695\uC124, \uBE44\uBC29, \uBA85\uC608\uD6FC\uC190 \uD589\uC704
5. \uC11C\uBE44\uC2A4\uB97C \uC774\uC6A9\uD55C \uBD88\uBC95\uC801\uC778 \uBB3C\uD488(\uC7A5\uBB3C, \uC704\uC870\uD488 \uB4F1)\uC758 \uAC70\uB798
6. \uC11C\uBE44\uC2A4\uC758 \uC548\uC815\uC801 \uC6B4\uC601\uC744 \uBC29\uD574\uD560 \uC218 \uC788\uB294 \uD589\uC704(\uBE44\uC815\uC0C1\uC801\uC778 \uBC29\uBC95\uC758 \uC811\uC18D, \uC11C\uBC84\uC5D0 \uBB34\uB9AC\uB97C \uC8FC\uB294 \uD589\uC704 \uB4F1)
7. \uD68C\uC0AC\uC758 \uC2B9\uC778 \uC5C6\uC774 \uC11C\uBE44\uC2A4\uB97C \uC601\uB9AC\xB7\uBE44\uC601\uB9AC \uBAA9\uC801\uC73C\uB85C \uBCC0\uD615, \uBCF5\uC81C, \uBC30\uD3EC\uD558\uB294 \uD589\uC704</p>
    </div>

    <div class="section">
      <h2>\uC81C6\uC870 (\uC11C\uBE44\uC2A4 \uC774\uC6A9 \uC81C\uD55C)</h2>
      <p>1. \uD68C\uC0AC\uB294 \uD68C\uC6D0\uC774 \uC81C5\uC870\uB97C \uC704\uBC18\uD558\uAC70\uB098 \uC11C\uBE44\uC2A4\uC758 \uC815\uC0C1\uC801\uC778 \uC6B4\uC601\uC744 \uBC29\uD574\uD55C \uACBD\uC6B0, \uACBD\uACE0, \uC77C\uC2DC\uC815\uC9C0, \uC601\uAD6C\uC774\uC6A9\uC815\uC9C0 \uB4F1\uC758 \uC870\uCE58\uB97C \uCDE8\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.
2. \uC774\uC6A9\uC815\uC9C0 \uB4F1 \uC870\uCE58\uC5D0 \uC774\uC758\uAC00 \uC788\uB294 \uD68C\uC6D0\uC740 \uD68C\uC0AC\uAC00 \uC815\uD55C \uC808\uCC28\uC5D0 \uB530\uB77C \uC774\uC758\uC2E0\uCCAD\uC744 \uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.</p>
    </div>

    <div class="section">
      <h2>\uC81C7\uC870 (\uAC70\uB798\uC5D0 \uB300\uD55C \uD68C\uC0AC\uC758 \uC9C0\uC704)</h2>
      <p>1. \uD68C\uC0AC\uB294 \uD1B5\uC2E0\uD310\uB9E4\uC758 \uB2F9\uC0AC\uC790\uAC00 \uC544\uB2C8\uBA70, \uD68C\uC6D0 \uAC04\uC758 \uC0C1\uD488 \uC815\uBCF4 \uBC0F \uAC70\uB798\uB97C \uC911\uAC1C\uD558\uB294 \uD1B5\uC2E0\uD310\uB9E4\uC911\uAC1C\uC790\uC785\uB2C8\uB2E4.
2. \uD68C\uC0AC\uB294 \uD68C\uC6D0 \uAC04 \uC774\uB8E8\uC5B4\uC9C0\uB294 \uAC70\uB798\uC5D0 \uB300\uD574 \uC6D0\uCE59\uC801\uC73C\uB85C \uD310\uB9E4\uC790 \uB610\uB294 \uAD6C\uB9E4\uC790\uB85C\uC11C\uC758 \uCC45\uC784\uC744 \uC9C0\uC9C0 \uC54A\uC73C\uBA70, \uC0C1\uD488\uC758 \uD488\uC9C8, \uC815\uBCF4\uC758 \uC9C4\uC704, \uAC70\uB798 \uC774\uD589 \uC5EC\uBD80 \uB4F1\uC5D0 \uAD00\uD55C \uCC45\uC784\uC740 \uAC70\uB798 \uB2F9\uC0AC\uC790\uC778 \uD68C\uC6D0\uC5D0\uAC8C \uC788\uC2B5\uB2C8\uB2E4.
3. \uD68C\uC0AC\uB294 \uD310\uB9E4\uD68C\uC6D0\xB7\uC5C5\uCCB4\uD68C\uC6D0\uC758 \uC778\uC99D \uC2EC\uC0AC\uB97C \uD1B5\uD574 \uC11C\uBE44\uC2A4 \uC2E0\uB8B0\uB3C4 \uC81C\uACE0\uB97C \uC704\uD574 \uB178\uB825\uD558\uB098, \uC774 \uC778\uC99D\uC774 \uAC70\uB798 \uC548\uC804\uC744 \uBCF4\uC99D\uD558\uB294 \uAC83\uC740 \uC544\uB2D9\uB2C8\uB2E4.</p>
    </div>

    <div class="section">
      <h2>\uC81C8\uC870 (\uAC8C\uC2DC\uBB3C\uC758 \uAD00\uB9AC)</h2>
      <p>1. \uD68C\uC6D0\uC774 \uB4F1\uB85D\uD55C \uAC8C\uC2DC\uBB3C\uC758 \uC800\uC791\uAD8C\uC740 \uD574\uB2F9 \uD68C\uC6D0\uC5D0\uAC8C \uADC0\uC18D\uB429\uB2C8\uB2E4.
2. \uD68C\uC0AC\uB294 \uAC8C\uC2DC\uBB3C\uC774 \uC81C5\uC870\uC758 \uAE08\uC9C0\uD589\uC704\uC5D0 \uD574\uB2F9\uD558\uAC70\uB098 \uAD00\uACC4 \uBC95\uB839\uC5D0 \uC704\uBC18\uB41C\uB2E4\uACE0 \uD310\uB2E8\uB418\uB294 \uACBD\uC6B0 \uC0AC\uC804 \uD1B5\uC9C0 \uC5C6\uC774 \uD574\uB2F9 \uAC8C\uC2DC\uBB3C\uC744 \uC0AD\uC81C\uD558\uAC70\uB098 \uC774\uB3D9\uC2DC\uD0AC \uC218 \uC788\uC2B5\uB2C8\uB2E4.
3. \uD68C\uC6D0 \uD0C8\uD1F4 \uC2DC\uC5D0\uB3C4 \uB2E4\uB978 \uD68C\uC6D0\uACFC\uC758 \uAC70\uB798\xB7\uCC44\uD305\xB7\uD6C4\uAE30 \uAE30\uB85D \uB4F1\uC740 \uC11C\uBE44\uC2A4 \uC2E0\uB8B0\uB3C4 \uC720\uC9C0\uB97C \uC704\uD574 \uBCF4\uC874\uB420 \uC218 \uC788\uC73C\uBA70, \uC774 \uACBD\uC6B0 \uD0C8\uD1F4 \uD68C\uC6D0\uC758 \uAC1C\uC778 \uC2DD\uBCC4\uC815\uBCF4\uB294 \uC775\uBA85\uD654\uD558\uC5EC \uCC98\uB9AC\uD569\uB2C8\uB2E4. (\uC790\uC138\uD55C \uB0B4\uC6A9\uC740 \uAC1C\uC778\uC815\uBCF4\uCC98\uB9AC\uBC29\uCE68 \uCC38\uC870)</p>
    </div>

    <div class="section">
      <h2>\uC81C9\uC870 (\uD68C\uC0AC\uC758 \uBA74\uCC45)</h2>
      <p>1. \uD68C\uC0AC\uB294 \uCC9C\uC7AC\uC9C0\uBCC0, \uD1B5\uC2E0\uC7A5\uC560 \uB4F1 \uBD88\uAC00\uD56D\uB825\uC73C\uB85C \uC778\uD558\uC5EC \uC11C\uBE44\uC2A4\uB97C \uC81C\uACF5\uD560 \uC218 \uC5C6\uB294 \uACBD\uC6B0 \uCC45\uC784\uC774 \uBA74\uC81C\uB429\uB2C8\uB2E4.
2. \uD68C\uC0AC\uB294 \uD68C\uC6D0 \uAC04 \uAC70\uB798\uC5D0\uC11C \uBC1C\uC0DD\uD55C \uBD84\uC7C1\uC5D0 \uB300\uD574 \uAC1C\uC785\uD560 \uC758\uBB34\uAC00 \uC5C6\uC73C\uBA70, \uC774\uB85C \uC778\uD55C \uC190\uD574\uC5D0 \uB300\uD574 \uCC45\uC784\uC744 \uC9C0\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uB2E4\uB9CC \uD68C\uC0AC\uB294 \uC6D0\uD65C\uD55C \uBD84\uC7C1 \uD574\uACB0\uC744 \uC704\uD558\uC5EC \uC2E0\uACE0 \uAE30\uB2A5, \uACE0\uAC1D\uC13C\uD130 \uB4F1\uC744 \uD1B5\uD574 \uD569\uB9AC\uC801\uC778 \uBC94\uC704 \uB0B4\uC5D0\uC11C \uC9C0\uC6D0\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.
3. \uD68C\uC0AC\uB294 \uD68C\uC6D0\uC774 \uAC8C\uC2DC\uD55C \uC815\uBCF4\uC758 \uC2E0\uB8B0\uC131, \uC815\uD655\uC131\uC5D0 \uB300\uD574 \uBCF4\uC99D\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.</p>
    </div>

    <div class="section">
      <h2>\uC81C10\uC870 (\uBD84\uC7C1\uD574\uACB0 \uBC0F \uAD00\uD560\uBC95\uC6D0)</h2>
      <p>1. \uC11C\uBE44\uC2A4 \uC774\uC6A9\uACFC \uAD00\uB828\uD558\uC5EC \uD68C\uC0AC\uC640 \uD68C\uC6D0 \uAC04 \uBD84\uC7C1\uC774 \uBC1C\uC0DD\uD55C \uACBD\uC6B0, \uC591 \uB2F9\uC0AC\uC790\uB294 \uC6B0\uC120\uC801\uC73C\uB85C \uD611\uC758\uB97C \uD1B5\uD574 \uD574\uACB0\uD558\uB3C4\uB85D \uB178\uB825\uD569\uB2C8\uB2E4.
2. \uD611\uC758\uAC00 \uC774\uB8E8\uC5B4\uC9C0\uC9C0 \uC54A\uC744 \uACBD\uC6B0 \uAD00\uB828 \uBC95\uB839\uC5D0 \uB530\uB978 \uAD00\uD560\uBC95\uC6D0\uC5D0 \uC18C\uB97C \uC81C\uAE30\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.</p>
    </div>

    <div class="section">
      <h2>\uC81C11\uC870 (\uC57D\uAD00 \uC678 \uC900\uCE59)</h2>
      <p>\uC774 \uC57D\uAD00\uC5D0 \uBA85\uC2DC\uB418\uC9C0 \uC54A\uC740 \uC0AC\uD56D\uC740 \uAD00\uACC4 \uBC95\uB839 \uBC0F \uD68C\uC0AC\uAC00 \uC815\uD55C \uAC1C\uBCC4 \uC11C\uBE44\uC2A4\uC758 \uC774\uC6A9\uC57D\uAD00, \uC6B4\uC601\uC815\uCC45 \uBC0F \uADDC\uCE59 \uB4F1\uC5D0 \uB530\uB985\uB2C8\uB2E4.</p>
    </div>

    <div class="footer-note">
      \uCC38\uACE0: \uC774 \uBB38\uC11C\uB294 AI\uAC00 \uCC38\uACE0\uC6A9\uC73C\uB85C \uC791\uC131\uD55C \uD45C\uC900 \uC57D\uAD00 \uCD08\uC548\uC774\uBA70 \uBC95\uB960 \uC790\uBB38\uC744 \uB300\uCCB4\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uC2E4\uC81C \uC11C\uBE44\uC2A4 \uC6B4\uC601 \uC804 \uBC95\uB960 \uC804\uBB38\uAC00\uC758 \uAC80\uD1A0\uB97C \uAD8C\uC7A5\uD569\uB2C8\uB2E4.
    </div>
  </div>
</body>
</html>
    `;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  });
  app.get("/privacy", (_req, res) => {
    const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>\uAC1C\uC778\uC815\uBCF4\uCC98\uB9AC\uBC29\uCE68 - \uD074\uB85C\uC9D5\uB9C8\uCF13</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
      color: #333;
      line-height: 1.6;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 20px;
      background-color: white;
      min-height: 100vh;
    }
    h1 {
      font-size: 32px;
      margin-bottom: 10px;
      color: #D4AF37;
    }
    .meta {
      font-size: 14px;
      color: #999;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 1px solid #eee;
    }
    h2 {
      font-size: 18px;
      font-weight: 600;
      margin-top: 30px;
      margin-bottom: 15px;
      color: #222;
    }
    p {
      margin-bottom: 12px;
      color: #555;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .section {
      margin-bottom: 25px;
    }
    .footer-note {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #999;
      font-style: italic;
      line-height: 1.8;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>\uD074\uB85C\uC9D5\uB9C8\uCF13 \uAC1C\uC778\uC815\uBCF4\uCC98\uB9AC\uBC29\uCE68</h1>
    <div class="meta">\uC2DC\uD589\uC77C\uC790: 2026\uB144 8\uC6D4 6\uC77C</div>

    <div class="section">
      <h2>1. \uAC1C\uC778\uC815\uBCF4\uC758 \uC218\uC9D1 \uBC0F \uC774\uC6A9 \uBAA9\uC801</h2>
      <p>\uD074\uB85C\uC9D5\uB9C8\uCF13(\uC774\uD558 "\uD68C\uC0AC")\uC740 \uB2E4\uC74C\uC758 \uBAA9\uC801\uC744 \uC704\uD558\uC5EC \uAC1C\uC778\uC815\uBCF4\uB97C \uC218\uC9D1\uD558\uACE0 \uC774\uC6A9\uD569\uB2C8\uB2E4.
- \uD68C\uC6D0 \uAC00\uC785 \uBC0F \uAD00\uB9AC
- \uC11C\uBE44\uC2A4 \uC81C\uACF5 \uBC0F \uAC1C\uC120
- \uACE0\uAC1D \uC0C1\uB2F4 \uBC0F \uC9C0\uC6D0
- \uB9C8\uCF00\uD305 \uBC0F \uAD11\uACE0 (\uB3D9\uC758 \uC2DC)</p>
    </div>

    <div class="section">
      <h2>2. \uC218\uC9D1\uD558\uB294 \uAC1C\uC778\uC815\uBCF4\uC758 \uD56D\uBAA9</h2>
      <p>\uD68C\uC0AC\uB294 \uB2E4\uC74C\uACFC \uAC19\uC740 \uAC1C\uC778\uC815\uBCF4\uB97C \uC218\uC9D1\uD569\uB2C8\uB2E4.
- \uD544\uC218: \uC774\uB984, \uC774\uBA54\uC77C, \uC804\uD654\uBC88\uD638, \uB85C\uADF8\uC778 ID
- \uC120\uD0DD: \uD504\uB85C\uD544 \uC0AC\uC9C4, \uC8FC\uC18C, \uAE30\uD0C0 \uCD94\uAC00 \uC815\uBCF4
- \uC790\uB3D9 \uC218\uC9D1: IP \uC8FC\uC18C, \uCFE0\uD0A4, \uC811\uC18D \uB85C\uADF8, \uAE30\uAE30 \uC815\uBCF4</p>
    </div>

    <div class="section">
      <h2>3. \uAC1C\uC778\uC815\uBCF4\uC758 \uBCF4\uC720 \uBC0F \uC774\uC6A9 \uAE30\uAC04</h2>
      <p>\uAC1C\uC778\uC815\uBCF4\uB294 \uB2E4\uC74C\uACFC \uAC19\uC774 \uBCF4\uC720 \uBC0F \uC774\uC6A9\uB429\uB2C8\uB2E4.
- \uD68C\uC6D0 \uAC00\uC785 \uC815\uBCF4: \uD68C\uC6D0 \uD0C8\uD1F4 \uC2DC\uAE4C\uC9C0
- \uAC70\uB798 \uAD00\uB828 \uC815\uBCF4: \uAC70\uB798 \uC644\uB8CC \uD6C4 5\uB144
- \uB9C8\uCF00\uD305 \uC815\uBCF4: \uB3D9\uC758 \uCCA0\uD68C \uC2DC\uAE4C\uC9C0</p>
    </div>

    <div class="section">
      <h2>4. \uAC1C\uC778\uC815\uBCF4\uC758 \uC81C3\uC790 \uC81C\uACF5</h2>
      <p>\uD68C\uC0AC\uB294 \uC6D0\uCE59\uC801\uC73C\uB85C \uAC1C\uC778\uC815\uBCF4\uB97C \uC81C3\uC790\uC5D0\uAC8C \uC81C\uACF5\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uB2E4\uB9CC \uB2E4\uC74C\uC758 \uACBD\uC6B0\uB294 \uC608\uC678\uC785\uB2C8\uB2E4.
- \uBC95\uB839\uC5D0 \uB530\uB978 \uC694\uCCAD
- \uD68C\uC6D0\uC758 \uBA85\uC2DC\uC801 \uB3D9\uC758
- \uC11C\uBE44\uC2A4 \uC81C\uACF5\uC744 \uC704\uD55C \uD544\uC218 \uC81C\uD734\uC0AC</p>
    </div>

    <div class="section">
      <h2>5. \uCE74\uCE74\uC624 \uACC4\uC815 \uC5F0\uB3D9 \uC2DC \uC815\uBCF4 \uC218\uC9D1</h2>
      <p>\uCE74\uCE74\uC624 \uACC4\uC815\uC73C\uB85C \uB85C\uADF8\uC778\uD560 \uACBD\uC6B0 \uB2E4\uC74C \uC815\uBCF4\uB97C \uC218\uC9D1\uD569\uB2C8\uB2E4.
- \uCE74\uCE74\uC624 \uACC4\uC815 ID (OpenID)
- \uCE74\uCE74\uC624 \uD504\uB85C\uD544 \uC774\uB984
- \uCE74\uCE74\uC624 \uD504\uB85C\uD544 \uC774\uBA54\uC77C
\uC774 \uC815\uBCF4\uB294 \uD68C\uC0AC\uC758 \uD68C\uC6D0 \uC778\uC99D \uBC0F \uD504\uB85C\uD544 \uC124\uC815\uC5D0\uB9CC \uC0AC\uC6A9\uB418\uBA70, \uBCC4\uB3C4\uC758 \uBAA9\uC801\uC73C\uB85C \uD65C\uC6A9\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.</p>
    </div>

    <div class="section">
      <h2>6. \uAC1C\uC778\uC815\uBCF4\uC758 \uC548\uC804\uC131 \uD655\uBCF4</h2>
      <p>\uD68C\uC0AC\uB294 \uAC1C\uC778\uC815\uBCF4\uC758 \uC548\uC804\uC131\uC744 \uD655\uBCF4\uD558\uAE30 \uC704\uD574 \uB2E4\uC74C\uC758 \uC870\uCE58\uB97C \uCDE8\uD569\uB2C8\uB2E4.
- \uC554\uD638\uD654\uB41C \uD1B5\uC2E0 (HTTPS)
- \uC811\uADFC \uAD8C\uD55C \uC81C\uD55C
- \uC815\uAE30\uC801\uC778 \uBCF4\uC548 \uAC10\uC2DC
- \uC9C1\uC6D0 \uBCF4\uC548 \uAD50\uC721</p>
    </div>

    <div class="section">
      <h2>7. \uAC1C\uC778\uC815\uBCF4 \uAD00\uB828 \uAD8C\uB9AC</h2>
      <p>\uD68C\uC6D0\uC740 \uC5B8\uC81C\uB4E0\uC9C0 \uB2E4\uC74C\uC758 \uAD8C\uB9AC\uB97C \uD589\uC0AC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.
- \uAC1C\uC778\uC815\uBCF4 \uC5F4\uB78C \uC694\uCCAD
- \uAC1C\uC778\uC815\uBCF4 \uC218\uC815 \uC694\uCCAD
- \uAC1C\uC778\uC815\uBCF4 \uC0AD\uC81C \uC694\uCCAD (\uD68C\uC6D0 \uD0C8\uD1F4)
- \uAC1C\uC778\uC815\uBCF4 \uCC98\uB9AC \uB3D9\uC758 \uCCA0\uD68C</p>
    </div>

    <div class="section">
      <h2>8. \uAC1C\uC778\uC815\uBCF4 \uBCF4\uD638\uCC45\uC784\uC790</h2>
      <p>\uAC1C\uC778\uC815\uBCF4 \uAD00\uB828 \uBB38\uC758 \uC0AC\uD56D\uC774 \uC788\uC73C\uC2DC\uBA74 \uC544\uB798\uB85C \uC5F0\uB77D\uC8FC\uC2DC\uAE30 \uBC14\uB78D\uB2C8\uB2E4.
- \uC774\uBA54\uC77C: closingmarket.help@gmail.com
- \uACE0\uAC1D\uC13C\uD130 \uBB38\uC758\uB294 /support \uD398\uC774\uC9C0\uC5D0\uC11C \uD655\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.</p>
    </div>

    <div class="footer-note">
      \uCC38\uACE0: \uC774 \uBB38\uC11C\uB294 AI\uAC00 \uCC38\uACE0\uC6A9\uC73C\uB85C \uC791\uC131\uD55C \uD45C\uC900 \uAC1C\uC778\uC815\uBCF4\uCC98\uB9AC\uBC29\uCE68 \uCD08\uC548\uC774\uBA70 \uBC95\uB960 \uC790\uBB38\uC744 \uB300\uCCB4\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uC2E4\uC81C \uC11C\uBE44\uC2A4 \uC6B4\uC601 \uC804 \uBC95\uB960 \uC804\uBB38\uAC00\uC758 \uAC80\uD1A0\uB97C \uAD8C\uC7A5\uD569\uB2C8\uB2E4.
    </div>
  </div>
</body>
</html>
    `;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  });
  app.get(["/community-policy", "/report-policy"], (_req, res) => {
    const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>\uC2E0\uACE0 \uBC0F \uCEE4\uBBA4\uB2C8\uD2F0 \uC6B4\uC601\uC815\uCC45 - \uD074\uB85C\uC9D5\uB9C8\uCF13</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; background: #f7f7f7; color: #222; line-height: 1.7; }
    .container { max-width: 900px; margin: 0 auto; padding: 40px 20px 64px; background: #fff; min-height: 100vh; }
    .brand { color: #D4AF37; font-weight: 800; letter-spacing: .08em; font-size: 14px; }
    nav { display: flex; flex-wrap: wrap; gap: 14px; margin: 18px 0 30px; padding-bottom: 16px; border-bottom: 1px solid #eadfb8; }
    nav a { color: #6d5a20; text-decoration: none; font-size: 13px; }
    h1 { font-size: 30px; margin: 8px 0 10px; color: #222; line-height: 1.3; }
    .meta { font-size: 14px; color: #888; margin-bottom: 34px; padding-bottom: 18px; border-bottom: 1px solid #eee; }
    h2 { font-size: 19px; margin: 28px 0 10px; color: #222; }
    p { margin-bottom: 12px; white-space: pre-wrap; }
    .section { margin-bottom: 24px; }
    .footer-note { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888; line-height: 1.8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="brand">CLOSING MARKET</div>
    <nav>
      <a href="/privacy">\uAC1C\uC778\uC815\uBCF4\uCC98\uB9AC\uBC29\uCE68</a>
      <a href="/terms">\uC774\uC6A9\uC57D\uAD00</a>
      <a href="/support">\uACE0\uAC1D\uC9C0\uC6D0/\uBB38\uC758</a>
      <a href="/community-policy">\uC2E0\uACE0 \uBC0F \uCEE4\uBBA4\uB2C8\uD2F0 \uC6B4\uC601\uC815\uCC45</a>
    </nav>
    <h1>\uC2E0\uACE0 \uBC0F \uCEE4\uBBA4\uB2C8\uD2F0 \uC6B4\uC601\uC815\uCC45</h1>
    <div class="meta">\uC2DC\uD589\uC77C\uC790: 2026\uB144 8\uC6D4 6\uC77C</div>
    <div class="section">
      <h2>1. \uBAA9\uC801</h2>
      <p>\uBCF8 \uC6B4\uC601\uC815\uCC45\uC740 \uD074\uB85C\uC9D5\uB9C8\uCF13 \uC11C\uBE44\uC2A4\uC5D0\uC11C \uD68C\uC6D0\uC774 \uC9C0\uCF1C\uC57C \uD560 \uAE30\uBCF8\uC801\uC778 \uC774\uC6A9 \uC9C8\uC11C\uC640 \uC2E0\uACE0\xB7\uAC8C\uC2DC\uBB3C \uAD00\uB9AC \uAE30\uC900\uC744 \uC815\uD569\uB2C8\uB2E4.</p>
    </div>
    <div class="section">
      <h2>2. \uD68C\uC6D0 \uBC0F \uAC8C\uC2DC\uBB3C\uC758 \uAE30\uBCF8 \uC6D0\uCE59</h2>
      <p>\uD68C\uC6D0\uC740 \uC815\uD655\uD55C \uC815\uBCF4\uB97C \uC81C\uACF5\uD558\uACE0, \uB2E4\uB978 \uD68C\uC6D0\uC758 \uAD8C\uB9AC\uC640 \uC548\uC804\uC744 \uC874\uC911\uD574\uC57C \uD569\uB2C8\uB2E4. \uC0C1\uD488 \uAC8C\uC2DC\uBB3C, \uC5C5\uCCB4 \uC18C\uAC1C, \uD6C4\uAE30, \uCC44\uD305 \uB4F1 \uC11C\uBE44\uC2A4\uC5D0 \uB4F1\uB85D\uB418\uB294 \uBAA8\uB4E0 \uB0B4\uC6A9\uC740 \uAD00\uB828 \uBC95\uB839\uACFC \uC774\uC6A9\uC57D\uAD00\uC744 \uC900\uC218\uD574\uC57C \uD569\uB2C8\uB2E4.</p>
    </div>
    <div class="section">
      <h2>3. \uC81C\uD55C\uB418\uB294 \uAC8C\uC2DC\uBB3C \uBC0F \uD589\uC704</h2>
      <p>\uB2E4\uC74C\uC758 \uAC8C\uC2DC\uBB3C\uC774\uB098 \uD589\uC704\uB294 \uC0AC\uC804 \uD1B5\uBCF4 \uC5C6\uC774 \uC0AD\uC81C\xB7\uC218\uC815\xB7\uBE44\uACF5\uAC1C \uCC98\uB9AC\uB420 \uC218 \uC788\uC73C\uBA70, \uBC18\uBCF5\uB418\uAC70\uB098 \uC911\uB300\uD55C \uACBD\uC6B0 \uACC4\uC815 \uC774\uC6A9\uC774 \uC81C\uD55C\uB420 \uC218 \uC788\uC2B5\uB2C8\uB2E4.

1. \uD5C8\uC704 \uB9E4\uBB3C, \uD5C8\uC704 \uC0AC\uC5C5\uC790 \uC815\uBCF4, \uACFC\uC7A5 \uB610\uB294 \uAE30\uB9CC \uAD11\uACE0
2. \uC7A5\uBB3C\xB7\uC704\uC870\uD488 \uB4F1 \uBD88\uBC95 \uBB3C\uD488\uC758 \uB4F1\uB85D \uB610\uB294 \uAC70\uB798
3. \uD0C0\uC778\uC758 \uAC1C\uC778\uC815\uBCF4, \uCD08\uC0C1, \uC0C1\uD45C, \uC800\uC791\uBB3C \uBC0F \uAE30\uD0C0 \uAD8C\uB9AC\uB97C \uCE68\uD574\uD558\uB294 \uB0B4\uC6A9
4. \uC695\uC124, \uBE44\uBC29, \uD610\uC624\xB7\uCC28\uBCC4 \uD45C\uD604, \uC131\uC801 \uC218\uCE58\uC2EC\uC744 \uC720\uBC1C\uD558\uB294 \uB0B4\uC6A9 \uB610\uB294 \uD611\uBC15
5. \uB3D9\uC77C \uB0B4\uC6A9\uC758 \uBC18\uBCF5 \uAC8C\uC2DC, \uBB34\uAD00\uD55C \uAD11\uACE0\xB7\uD64D\uBCF4, \uC2A4\uD338 \uBC0F \uC11C\uBE44\uC2A4 \uC6B4\uC601\uC744 \uBC29\uD574\uD558\uB294 \uD589\uC704
6. \uC678\uBD80 \uC0AC\uAE30 \uC0AC\uC774\uD2B8\uB85C \uC720\uB3C4\uD558\uAC70\uB098 \uAE08\uC804\xB7\uC778\uC99D\uC815\uBCF4\uB97C \uBD80\uC815\uD558\uAC8C \uC694\uAD6C\uD558\uB294 \uD589\uC704
7. \uC2E0\uACE0\xB7\uC2EC\uC0AC \uC808\uCC28\uB97C \uBC29\uD574\uD558\uAC70\uB098 \uB2E4\uB978 \uD68C\uC6D0\uC758 \uC2E0\uACE0\uB97C \uBCF4\uBCF5\uD558\uB294 \uD589\uC704</p>
    </div>
    <div class="section">
      <h2>4. \uC2E0\uACE0 \uC811\uC218 \uBC0F \uCC98\uB9AC</h2>
      <p>\uD68C\uC6D0\uC740 \uC11C\uBE44\uC2A4 \uB0B4 \uACE0\uAC1D\uC13C\uD130 \uBB38\uC758\uB97C \uD1B5\uD574 \uC2E0\uACE0 \uB300\uC0C1\uACFC \uC0AC\uC720\uB97C \uAD6C\uCCB4\uC801\uC73C\uB85C \uC54C\uB824\uC8FC\uC2E4 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uC6B4\uC601\uC790\uB294 \uC811\uC218\uB41C \uB0B4\uC6A9\uC744 \uD655\uC778\uD558\uC5EC \uAC8C\uC2DC\uBB3C \uC228\uAE40\xB7\uC0AD\uC81C, \uC0C1\uB300\uBC29 \uC774\uC6A9 \uC81C\uD55C, \uCD94\uAC00 \uC790\uB8CC \uC694\uCCAD \uB4F1\uC758 \uC870\uCE58\uB97C \uCDE8\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uC2E0\uACE0 \uB0B4\uC6A9\uACFC \uCC98\uB9AC \uACB0\uACFC\uB294 \uAC1C\uC778\uC815\uBCF4 \uBCF4\uD638 \uBC0F \uBD84\uC7C1 \uC608\uBC29\uC744 \uC704\uD574 \uD544\uC694\uD55C \uBC94\uC704\uC5D0\uC11C\uB9CC \uC548\uB0B4\uD569\uB2C8\uB2E4.</p>
    </div>
    <div class="section">
      <h2>5. \uD68C\uC6D0 \uC790\uACA9 \uC81C\uD55C</h2>
      <p>\uD5C8\uC704 \uC0AC\uC5C5\uC790 \uC815\uBCF4 \uC81C\uCD9C, \uBC18\uBCF5\uC801\uC778 \uAE08\uC9C0\uD589\uC704, \uB2E4\uC218 \uD68C\uC6D0\uC5D0 \uB300\uD55C \uD53C\uD574 \uC720\uBC1C, \uAD00\uACC4 \uBC95\uB839 \uC704\uBC18 \uB610\uB294 \uBCF8 \uC815\uCC45\uC758 \uC911\uB300\uD55C \uC704\uBC18\uC774 \uD655\uC778\uB418\uBA74 \uACBD\uACE0, \uAC8C\uC2DC\uBB3C \uC81C\uD55C, \uC77C\uC2DC \uC815\uC9C0 \uB610\uB294 \uC601\uAD6C \uC774\uC6A9 \uC815\uC9C0 \uC870\uCE58\uAC00 \uC774\uB8E8\uC5B4\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uD68C\uC6D0\uC740 \uACE0\uAC1D\uC13C\uD130\uB97C \uD1B5\uD574 \uC870\uCE58\uC5D0 \uB300\uD55C \uC0AC\uC2E4\uAD00\uACC4\uC640 \uC758\uACAC\uC744 \uC81C\uCD9C\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.</p>
    </div>
    <div class="section">
      <h2>6. \uBB38\uC758\uCC98</h2>
      <p>\uC2E0\uACE0 \uBC0F \uCEE4\uBBA4\uB2C8\uD2F0 \uC6B4\uC601 \uAD00\uB828 \uBB38\uC758: closingmarket.help@gmail.com</p>
    </div>
    <div class="footer-note">\uBCF8 \uBB38\uC11C\uB294 \uC11C\uBE44\uC2A4 \uC6B4\uC601\uC744 \uC704\uD55C \uC815\uCC45 \uCD08\uC548\uC785\uB2C8\uB2E4. \uC2E4\uC81C \uC801\uC6A9 \uC804 \uAD00\uB828 \uBC95\uB839\uACFC \uC6B4\uC601 \uC808\uCC28\uC5D0 \uB9DE\uCD98 \uBC95\uB960 \uC804\uBB38\uAC00 \uAC80\uD1A0\uB97C \uAD8C\uC7A5\uD569\uB2C8\uB2E4.</div>
  </div>
</body>
</html>`;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  });
}

// server/routers.ts
import { z } from "zod";
import { TRPCError as TRPCError3 } from "@trpc/server";

// server/_core/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/routers.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// server/_core/push-notifications.ts
var EXPO_PUSH_API = "https://exp.host/--/api/v2/push/send";
var PUSH_REQUEST_TIMEOUT_MS = 4e3;
async function postExpoPush(payload) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PUSH_REQUEST_TIMEOUT_MS);
  try {
    return await fetch(EXPO_PUSH_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}
async function sendChatPushNotification(recipientPushToken, senderName, messagePreview, chatRoomId) {
  if (!recipientPushToken) {
    console.log("\uD478\uC2DC \uD1A0\uD070\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.");
    return false;
  }
  try {
    const response = await postExpoPush({
      to: recipientPushToken,
      sound: "default",
      title: `\u{1F4AC} ${senderName}`,
      body: messagePreview.substring(0, 100),
      data: {
        chatRoomId: chatRoomId.toString(),
        type: "chat_message"
      },
      badge: 1,
      priority: "high"
    });
    if (!response.ok) {
      const error = await response.json();
      console.error("Expo \uD478\uC2DC API \uC624\uB958:", error);
      return false;
    }
    console.log(`\uD478\uC2DC \uC54C\uB9BC \uC804\uC1A1 \uC131\uACF5: ${senderName}`);
    return true;
  } catch (error) {
    console.error("\uD478\uC2DC \uC54C\uB9BC \uC804\uC1A1 \uC2E4\uD328:", error);
    return false;
  }
}

// server/routers.ts
init_env();
var JWT_SECRET = ENV.jwtSecret;
var appRouter = router({
  // Public routes
  health: publicProcedure.query(() => ({ status: "ok" })),
  // ─── 자체 인증 ───
  auth: router({
    // 이메일 회원가입
    register: publicProcedure.input(z.object({
      email: z.string().email(),
      password: z.string().min(6),
      name: z.string().min(1).max(50),
      nickname: z.string().min(1).max(50),
      phone: z.string().min(9, "\uC804\uD654\uBC88\uD638\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694.").max(20)
    })).mutation(async ({ ctx, input }) => {
      const { checkRateLimit: checkRateLimit2 } = await Promise.resolve().then(() => (init_rateLimit(), rateLimit_exports));
      const ip = ctx.req.ip ?? "unknown";
      if (!checkRateLimit2(`register:${ip}`, 10, 60 * 60 * 1e3)) {
        throw new TRPCError3({ code: "TOO_MANY_REQUESTS", message: "\uB108\uBB34 \uB9CE\uC740 \uAC00\uC785 \uC2DC\uB3C4\uAC00 \uAC10\uC9C0\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694." });
      }
      const normalizedEmail = input.email.trim().toLowerCase();
      const existing = await getUserByEmail(normalizedEmail);
      if (existing) {
        throw new TRPCError3({ code: "CONFLICT", message: "\uC774\uBBF8 \uC0AC\uC6A9 \uC911\uC778 \uC774\uBA54\uC77C\uC785\uB2C8\uB2E4." });
      }
      const hashedPassword = await bcrypt.hash(input.password, 10);
      const openId = `email_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      let user;
      try {
        user = await createUserByEmail({
          openId,
          email: normalizedEmail,
          password: hashedPassword,
          name: input.name,
          nickname: input.nickname,
          phone: input.phone,
          loginMethod: "email"
        });
      } catch (err) {
        if (err?.code === "ER_DUP_ENTRY" || /Duplicate entry/i.test(err?.message ?? "")) {
          throw new TRPCError3({ code: "CONFLICT", message: "\uC774\uBBF8 \uC0AC\uC6A9 \uC911\uC778 \uC774\uBA54\uC77C\uC785\uB2C8\uB2E4." });
        }
        throw err;
      }
      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "30d" });
      return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role, isVerified: user.isVerified, sellerStatus: user.sellerStatus, companyStatus: user.companyStatus, profileImageUrl: user.profileImageUrl } };
    }),
    // 이메일 로그인
    login: publicProcedure.input(z.object({
      email: z.string().email(),
      password: z.string()
    })).mutation(async ({ ctx, input }) => {
      const { checkRateLimit: checkRateLimit2 } = await Promise.resolve().then(() => (init_rateLimit(), rateLimit_exports));
      const ip = ctx.req.ip ?? "unknown";
      if (!checkRateLimit2(`login:${ip}`, 10, 10 * 60 * 1e3)) {
        throw new TRPCError3({ code: "TOO_MANY_REQUESTS", message: "\uB108\uBB34 \uB9CE\uC740 \uB85C\uADF8\uC778 \uC2DC\uB3C4\uAC00 \uAC10\uC9C0\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694." });
      }
      const user = await getUserByEmail(input.email.trim().toLowerCase());
      if (!user || !user.password) {
        throw new TRPCError3({ code: "UNAUTHORIZED", message: "\uC774\uBA54\uC77C \uB610\uB294 \uBE44\uBC00\uBC88\uD638\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4." });
      }
      const lockedMinutes = await getAccountLockStatus(user.id);
      if (lockedMinutes !== null) {
        throw new TRPCError3({
          code: "TOO_MANY_REQUESTS",
          message: `\uB85C\uADF8\uC778 \uC2DC\uB3C4\uAC00 \uB108\uBB34 \uB9CE\uC544 \uACC4\uC815\uC774 \uC7A0\uACBC\uC2B5\uB2C8\uB2E4. \uC57D ${lockedMinutes}\uBD84 \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694.`
        });
      }
      const valid = await bcrypt.compare(input.password, user.password);
      if (!valid) {
        await recordFailedLogin(user.id);
        throw new TRPCError3({ code: "UNAUTHORIZED", message: "\uC774\uBA54\uC77C \uB610\uB294 \uBE44\uBC00\uBC88\uD638\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4." });
      }
      await resetFailedLogin(user.id);
      if (user.suspendedAt) {
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: user.suspendedReason ? `\uC774\uC6A9\uC774 \uC815\uC9C0\uB41C \uACC4\uC815\uC785\uB2C8\uB2E4. \uC0AC\uC720: ${user.suspendedReason}` : "\uC774\uC6A9\uC774 \uC815\uC9C0\uB41C \uACC4\uC815\uC785\uB2C8\uB2E4. \uACE0\uAC1D\uC13C\uD130\uB85C \uBB38\uC758\uD574\uC8FC\uC138\uC694."
        });
      }
      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "30d" });
      return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role, isVerified: user.isVerified, sellerStatus: user.sellerStatus, companyStatus: user.companyStatus, profileImageUrl: user.profileImageUrl } };
    }),
    // 비밀번호 찾기 - 재설정 링크 이메일 발송
    forgotPassword: publicProcedure.input(z.object({ email: z.string().email() })).mutation(async ({ input }) => {
      const email = input.email.trim().toLowerCase();
      const user = await getUserByEmail(email);
      if (user && user.password && !user.deletedAt) {
        const crypto3 = await import("crypto");
        const token = crypto3.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1e3);
        await createPasswordResetToken(user.id, token, expiresAt);
        const { sendEmail: sendEmail2, buildPasswordResetEmailHtml: buildPasswordResetEmailHtml2 } = await Promise.resolve().then(() => (init_email(), email_exports));
        const baseUrl = ENV.webAppUrl || "https://example.com";
        const resetUrl = `${baseUrl.replace(/\/+$/, "")}/auth/reset-password?token=${token}`;
        await sendEmail2({
          to: email,
          subject: "[\uD074\uB85C\uC9D5\uB9C8\uCF13] \uBE44\uBC00\uBC88\uD638 \uC7AC\uC124\uC815 \uC548\uB0B4",
          html: buildPasswordResetEmailHtml2(resetUrl)
        });
      }
      return {
        success: true,
        message: "\uC785\uB825\uD558\uC2E0 \uC774\uBA54\uC77C\uC774 \uAC00\uC785\uB418\uC5B4 \uC788\uB2E4\uBA74, \uBE44\uBC00\uBC88\uD638 \uC7AC\uC124\uC815 \uB9C1\uD06C\uB97C \uBCF4\uB0B4\uB4DC\uB838\uC2B5\uB2C8\uB2E4."
      };
    }),
    // 비밀번호 재설정
    resetPassword: publicProcedure.input(z.object({
      token: z.string(),
      newPassword: z.string().min(6, "\uBE44\uBC00\uBC88\uD638\uB294 6\uC790 \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4.")
    })).mutation(async ({ input }) => {
      const resetToken = await getValidPasswordResetToken(input.token);
      if (!resetToken) {
        throw new TRPCError3({ code: "BAD_REQUEST", message: "\uC720\uD6A8\uD558\uC9C0 \uC54A\uAC70\uB098 \uB9CC\uB8CC\uB41C \uB9C1\uD06C\uC785\uB2C8\uB2E4. \uBE44\uBC00\uBC88\uD638 \uCC3E\uAE30\uB97C \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694." });
      }
      const hashed = await bcrypt.hash(input.newPassword, 10);
      await updateUserPassword(resetToken.userId, hashed);
      await markPasswordResetTokenUsed(resetToken.id);
      return { success: true };
    }),
    me: publicProcedure.input(z.object({ token: z.string() })).query(async ({ input }) => {
      try {
        const decoded = jwt.verify(input.token, JWT_SECRET);
        const user = await getUserById(decoded.userId);
        if (!user) throw new TRPCError3({ code: "NOT_FOUND", message: "\uC0AC\uC6A9\uC790\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." });
        return { id: user.id, email: user.email, name: user.name, role: user.role, isVerified: user.isVerified, sellerStatus: user.sellerStatus, companyStatus: user.companyStatus, profileImageUrl: user.profileImageUrl, phone: user.phone };
      } catch {
        throw new TRPCError3({ code: "UNAUTHORIZED", message: "\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uD1A0\uD070\uC785\uB2C8\uB2E4." });
      }
    }),
    // 카카오 로그인
    kakaoLogin: publicProcedure.input(z.object({ accessToken: z.string() })).mutation(async ({ input }) => {
      const kakaoRes = await fetch("https://kapi.kakao.com/v2/user/me", {
        headers: { Authorization: `Bearer ${input.accessToken}` }
      });
      if (!kakaoRes.ok) {
        throw new TRPCError3({ code: "UNAUTHORIZED", message: "\uCE74\uCE74\uC624 \uC778\uC99D\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4." });
      }
      const kakaoData = await kakaoRes.json();
      const kakaoId = String(kakaoData.id);
      const email = kakaoData.kakao_account?.email;
      const name = kakaoData.kakao_account?.profile?.nickname || "\uCE74\uCE74\uC624 \uC0AC\uC6A9\uC790";
      const profileImageUrl = kakaoData.kakao_account?.profile?.profile_image_url;
      let user = await getUserByKakaoId(kakaoId);
      if (!user) {
        const openId = `kakao_${kakaoId}`;
        user = await createUserByEmail({
          openId,
          email: email || null,
          password: null,
          name,
          phone: null,
          loginMethod: "kakao",
          kakaoId,
          profileImageUrl: profileImageUrl || null
        });
      }
      if (user.suspendedAt) {
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: user.suspendedReason ? `\uC774\uC6A9\uC774 \uC815\uC9C0\uB41C \uACC4\uC815\uC785\uB2C8\uB2E4. \uC0AC\uC720: ${user.suspendedReason}` : "\uC774\uC6A9\uC774 \uC815\uC9C0\uB41C \uACC4\uC815\uC785\uB2C8\uB2E4. \uACE0\uAC1D\uC13C\uD130\uB85C \uBB38\uC758\uD574\uC8FC\uC138\uC694."
        });
      }
      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "30d" });
      return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role, isVerified: user.isVerified, sellerStatus: user.sellerStatus, companyStatus: user.companyStatus, profileImageUrl: user.profileImageUrl } };
    }),
    // Apple 로그인
    appleLogin: publicProcedure.input(z.object({ identityToken: z.string() })).mutation(async ({ input }) => {
      let appleData;
      try {
        const parts = input.identityToken.split(".");
        if (parts.length !== 3) throw new Error("Invalid token format");
        const decoded = JSON.parse(Buffer.from(parts[1], "base64").toString());
        appleData = decoded;
      } catch (e) {
        throw new TRPCError3({ code: "UNAUTHORIZED", message: "Apple \uC778\uC99D\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4." });
      }
      const appleId = appleData.sub;
      const email = appleData.email;
      const name = "Apple \uC0AC\uC6A9\uC790";
      let user = await getUserByAppleId(appleId);
      if (!user) {
        const openId = `apple_${appleId}`;
        user = await createAppleUserLegacySafe({
          openId,
          email: email || null,
          name,
          appleId
        });
      }
      if (user.suspendedAt) {
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: user.suspendedReason ? `\uC774\uC6A9\uC774 \uC815\uC9C0\uB41C \uACC4\uC815\uC785\uB2C8\uB2E4. \uC0AC\uC720: ${user.suspendedReason}` : "\uC774\uC6A9\uC774 \uC815\uC9C0\uB41C \uACC4\uC815\uC785\uB2C8\uB2E4. \uACE0\uAC1D\uC13C\uD130\uB85C \uBB38\uC758\uD574\uC8FC\uC138\uC694."
        });
      }
      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "30d" });
      return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role, isVerified: user.isVerified, sellerStatus: user.sellerStatus, companyStatus: user.companyStatus, profileImageUrl: user.profileImageUrl } };
    }),
    // 푸시 토큰 저장
    savePushToken: protectedProcedure.input(z.object({
      token: z.string()
    })).mutation(async ({ ctx, input }) => {
      await savePushToken(ctx.user.id, input.token);
      return { success: true };
    }),
    removePushToken: protectedProcedure.mutation(async ({ ctx }) => {
      await removePushToken(ctx.user.id);
      return { success: true };
    })
  }),
  // ─── 사용자 설정 ───
  user: router({
    updateProfile: protectedProcedure.input(z.object({
      name: z.string().min(1).max(50).optional(),
      phone: z.string().optional(),
      profileImageUrl: z.string().url().optional()
    })).mutation(async ({ ctx, input }) => {
      const updated = await updateUserProfile(ctx.user.id, input);
      if (!updated) throw new TRPCError3({ code: "NOT_FOUND", message: "\uC0AC\uC6A9\uC790\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." });
      return { id: updated.id, name: updated.name, phone: updated.phone, email: updated.email, profileImageUrl: updated.profileImageUrl };
    }),
    changePassword: protectedProcedure.input(z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(6)
    })).mutation(async ({ ctx, input }) => {
      const user = await getUserById(ctx.user.id);
      if (!user || !user.password) throw new TRPCError3({ code: "BAD_REQUEST", message: "\uBE44\uBC00\uBC88\uD638\uB97C \uBCC0\uACBD\uD560 \uC218 \uC5C6\uB294 \uACC4\uC815\uC785\uB2C8\uB2E4." });
      const valid = await bcrypt.compare(input.currentPassword, user.password);
      if (!valid) throw new TRPCError3({ code: "UNAUTHORIZED", message: "\uD604\uC7AC \uBE44\uBC00\uBC88\uD638\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4." });
      const hashed = await bcrypt.hash(input.newPassword, 10);
      await updateUserPassword(ctx.user.id, hashed);
      return { success: true };
    }),
    deleteAccount: protectedProcedure.input(z.object({ password: z.string().optional() })).mutation(async ({ ctx, input }) => {
      const user = await getUserById(ctx.user.id);
      if (!user) throw new TRPCError3({ code: "NOT_FOUND", message: "\uC0AC\uC6A9\uC790\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." });
      if (user.password) {
        if (!input.password) {
          throw new TRPCError3({ code: "BAD_REQUEST", message: "\uBE44\uBC00\uBC88\uD638\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694." });
        }
        const valid = await bcrypt.compare(input.password, user.password);
        if (!valid) {
          throw new TRPCError3({ code: "UNAUTHORIZED", message: "\uBE44\uBC00\uBC88\uD638\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4." });
        }
      }
      await deleteAccount(ctx.user.id);
      return { success: true };
    }),
    getNotificationSettings: protectedProcedure.query(async ({ ctx }) => {
      const user = await getUserById(ctx.user.id);
      if (!user) throw new TRPCError3({ code: "NOT_FOUND" });
      return {
        chatNotification: user.notifChat ?? true,
        priceDropNotification: user.notifPriceDrop ?? true,
        tradeNotification: user.notifTrade ?? true,
        marketingNotification: user.notifMarketing ?? false
      };
    }),
    updateNotificationSettings: protectedProcedure.input(z.object({
      chatNotification: z.boolean().optional(),
      priceDropNotification: z.boolean().optional(),
      tradeNotification: z.boolean().optional(),
      marketingNotification: z.boolean().optional()
    })).mutation(async ({ ctx, input }) => {
      await updateNotificationSettings(ctx.user.id, {
        notifChat: input.chatNotification,
        notifPriceDrop: input.priceDropNotification,
        notifTrade: input.tradeNotification,
        notifMarketing: input.marketingNotification
      });
      return { success: true };
    })
  }),
  products: router({
    list: publicProcedure.input(
      z.object({
        category: z.enum(["cafe", "pcroom", "restaurant", "gym", "office", "warehouse", "transfer"]).optional(),
        status: z.enum(["selling", "reserved", "sold"]).optional(),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0)
      }).optional()
    ).query(({ input }) => {
      return getProducts(input);
    }),
    detail: publicProcedure.input(z.object({ id: z.number() })).query(({ input }) => {
      return getProductDetail(input.id);
    }),
    create: protectedProcedure.input(
      z.object({
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        price: z.number().min(0),
        quantity: z.number().min(1).default(1),
        category: z.enum(["cafe", "pcroom", "restaurant", "gym", "office", "warehouse", "transfer"]),
        tradeType: z.enum(["direct", "delivery", "negotiable"]).default("direct"),
        location: z.string().optional(),
        mainImageUrl: z.string().optional(),
        images: z.array(z.string()).min(1, "\uC774\uBBF8\uC9C0\uB97C 1\uC7A5 \uC774\uC0C1 \uB4F1\uB85D\uD574\uC8FC\uC138\uC694.").max(10).optional()
      })
    ).mutation(async ({ ctx, input }) => {
      const { checkRateLimit: checkRateLimit2 } = await Promise.resolve().then(() => (init_rateLimit(), rateLimit_exports));
      if (!checkRateLimit2(`product-create:${ctx.user.id}`, 20, 60 * 60 * 1e3)) {
        throw new TRPCError3({ code: "TOO_MANY_REQUESTS", message: "\uB108\uBB34 \uB9CE\uC740 \uC0C1\uD488\uC744 \uB4F1\uB85D\uD588\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694." });
      }
      const user = await getUserById(ctx.user.id);
      const isAdmin = user?.role === "admin";
      if (!user || !isAdmin && (!user.isVerified || user.sellerStatus !== "approved")) {
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: "\uC778\uC99D\uB41C \uD310\uB9E4\uC790\uB9CC \uC0C1\uD488\uC744 \uB4F1\uB85D\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
        });
      }
      const { images, ...productFields } = input;
      return createProduct({
        ...productFields,
        mainImageUrl: input.mainImageUrl ?? images?.[0],
        userId: ctx.user.id
      }, images);
    }),
    updateStatus: protectedProcedure.input(
      z.object({
        id: z.number(),
        status: z.enum(["selling", "reserved", "sold"])
      })
    ).mutation(({ ctx, input }) => {
      return updateProductStatus(input.id, input.status, ctx.user.id);
    }),
    myProducts: protectedProcedure.query(({ ctx }) => {
      return getMyProducts(ctx.user.id);
    })
  }),
  businesses: router({
    list: publicProcedure.input(
      z.object({
        type: z.enum(["demolition", "interior", "waste", "sign", "pos", "cctv", "cleaning", "tax", "labor"]).optional()
      }).optional()
    ).query(({ input }) => {
      return getBusinesses(input);
    }),
    detail: publicProcedure.input(z.object({ id: z.number() })).query(({ input }) => {
      return getBusinessDetail(input.id);
    })
  }),
  // ─── 업체회원 (실제 가입한 업체) ─────────────────────────────────
  companies: router({
    list: publicProcedure.input(z.object({ type: z.string().optional() }).optional()).query(({ input }) => {
      return getApprovedCompanies(input);
    }),
    detail: publicProcedure.input(z.object({ id: z.number() })).query(({ input }) => {
      return getApprovedCompanyById(input.id);
    })
  }),
  favorites: router({
    // 찜 목록 (인증 필요)
    list: protectedProcedure.query(({ ctx }) => {
      return getFavorites(ctx.user.id);
    }),
    // 찜 여부 확인 (인증 필요)
    check: protectedProcedure.input(
      z.object({
        productId: z.number().optional(),
        businessId: z.number().optional()
      })
    ).query(({ ctx, input }) => {
      return isFavorited(ctx.user.id, input.productId, input.businessId);
    }),
    // 찜 토글 (인증 필요)
    toggle: protectedProcedure.input(
      z.object({
        productId: z.number().optional(),
        businessId: z.number().optional()
      })
    ).mutation(({ ctx, input }) => {
      return toggleFavorite(ctx.user.id, input.productId, input.businessId);
    })
  }),
  // ─── 최근 본 상품 ─────────────────────────────────────────────
  recentViews: router({
    list: protectedProcedure.query(({ ctx }) => {
      return getRecentViews(ctx.user.id);
    }),
    track: protectedProcedure.input(z.object({ productId: z.number() })).mutation(async ({ ctx, input }) => {
      await addRecentView(ctx.user.id, input.productId);
      return { success: true };
    })
  }),
  // ─── 구매내역 ─────────────────────────────────────────────────
  purchases: router({
    list: protectedProcedure.query(({ ctx }) => {
      return getMyPurchases(ctx.user.id);
    })
  }),
  // 채팅 이미지 업로드
  upload: router({
    chatImage: protectedProcedure.input(z.object({
      base64: z.string(),
      mimeType: z.string().default("image/jpeg"),
      fileName: z.string().default("photo.jpg")
    })).mutation(async ({ input }) => {
      const { storagePut: storagePut2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
      const { validateImageUpload: validateImageUpload2 } = await Promise.resolve().then(() => (init_imageValidation(), imageValidation_exports));
      const buffer = Buffer.from(input.base64, "base64");
      validateImageUpload2(input.mimeType, buffer);
      const ext = input.mimeType.split("/")[1] ?? "jpg";
      const result = await storagePut2(`chat/images/${input.fileName.replace(/\.[^.]+$/, "")}.${ext}`, buffer, input.mimeType);
      return { url: result.url };
    }),
    productImage: protectedProcedure.input(z.object({
      base64: z.string(),
      mimeType: z.string().default("image/jpeg"),
      fileName: z.string().default("photo.jpg")
    })).mutation(async ({ ctx, input }) => {
      const { storagePut: storagePut2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
      const { validateImageUpload: validateImageUpload2 } = await Promise.resolve().then(() => (init_imageValidation(), imageValidation_exports));
      const buffer = Buffer.from(input.base64, "base64");
      validateImageUpload2(input.mimeType, buffer);
      const ext = input.mimeType.split("/")[1] ?? "jpg";
      const result = await storagePut2(
        `products/images/${ctx.user.id}_${input.fileName.replace(/\.[^.]+$/, "")}.${ext}`,
        buffer,
        input.mimeType
      );
      return { url: result.url };
    }),
    sellerDocument: protectedProcedure.input(z.object({
      base64: z.string(),
      mimeType: z.string().default("image/jpeg"),
      fileName: z.string().default("photo.jpg"),
      docType: z.enum(["cert", "photo"])
    })).mutation(async ({ ctx, input }) => {
      const { storagePut: storagePut2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
      const { validateImageUpload: validateImageUpload2 } = await Promise.resolve().then(() => (init_imageValidation(), imageValidation_exports));
      const buffer = Buffer.from(input.base64, "base64");
      validateImageUpload2(input.mimeType, buffer);
      const ext = input.mimeType.split("/")[1] ?? "jpg";
      const result = await storagePut2(
        `seller/${input.docType}/${ctx.user.id}_${Date.now()}.${ext}`,
        buffer,
        input.mimeType
      );
      return { url: result.url };
    }),
    companyLogo: protectedProcedure.input(z.object({
      base64: z.string(),
      mimeType: z.string().default("image/jpeg"),
      fileName: z.string().default("photo.jpg")
    })).mutation(async ({ ctx, input }) => {
      const { storagePut: storagePut2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
      const { validateImageUpload: validateImageUpload2 } = await Promise.resolve().then(() => (init_imageValidation(), imageValidation_exports));
      const buffer = Buffer.from(input.base64, "base64");
      validateImageUpload2(input.mimeType, buffer);
      const ext = input.mimeType.split("/")[1] ?? "jpg";
      const result = await storagePut2(
        `company/logo/${ctx.user.id}_${Date.now()}.${ext}`,
        buffer,
        input.mimeType
      );
      return { url: result.url };
    }),
    companyBusinessCert: protectedProcedure.input(z.object({
      base64: z.string(),
      mimeType: z.string().default("image/jpeg"),
      fileName: z.string().default("photo.jpg")
    })).mutation(async ({ ctx, input }) => {
      const { storagePut: storagePut2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
      const { validateImageUpload: validateImageUpload2 } = await Promise.resolve().then(() => (init_imageValidation(), imageValidation_exports));
      const buffer = Buffer.from(input.base64, "base64");
      validateImageUpload2(input.mimeType, buffer);
      const ext = input.mimeType.split("/")[1] ?? "jpg";
      const result = await storagePut2(
        `company/cert/${ctx.user.id}_${Date.now()}.${ext}`,
        buffer,
        input.mimeType
      );
      return { url: result.url };
    }),
    profilePhoto: protectedProcedure.input(z.object({
      base64: z.string(),
      mimeType: z.string().default("image/jpeg"),
      fileName: z.string().default("photo.jpg")
    })).mutation(async ({ ctx, input }) => {
      const { storagePut: storagePut2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
      const { validateImageUpload: validateImageUpload2 } = await Promise.resolve().then(() => (init_imageValidation(), imageValidation_exports));
      const buffer = Buffer.from(input.base64, "base64");
      validateImageUpload2(input.mimeType, buffer);
      const ext = input.mimeType.split("/")[1] ?? "jpg";
      const result = await storagePut2(
        `user/profile/${ctx.user.id}_${Date.now()}.${ext}`,
        buffer,
        input.mimeType
      );
      return { url: result.url };
    })
  }),
  chats: router({
    list: protectedProcedure.query(({ ctx }) => {
      return getChatList(ctx.user.id);
    }),
    myInquiryChats: protectedProcedure.query(({ ctx }) => {
      return getCompanyInquiryChats(ctx.user.id);
    }),
    getOrCreate: protectedProcedure.input(z.object({
      sellerId: z.number(),
      productId: z.number().optional()
    })).mutation(({ ctx, input }) => {
      return getOrCreateChatRoom(ctx.user.id, input.sellerId, input.productId);
    }),
    room: protectedProcedure.input(z.object({ roomId: z.number() })).query(({ ctx, input }) => {
      return getChatRoomDetail(input.roomId, ctx.user.id);
    }),
    messages: protectedProcedure.input(z.object({
      roomId: z.number(),
      limit: z.number().min(1).max(100).default(50),
      beforeId: z.number().optional()
    })).query(({ ctx, input }) => {
      return getChatMessages(input.roomId, ctx.user.id, input.limit, input.beforeId);
    }),
    send: protectedProcedure.input(z.object({
      roomId: z.number(),
      content: z.string().optional(),
      imageUrl: z.string().optional()
    })).mutation(async ({ ctx, input }) => {
      if (!input.content && !input.imageUrl) {
        throw new TRPCError3({ code: "BAD_REQUEST", message: "\uB0B4\uC6A9 \uB610\uB294 \uC774\uBBF8\uC9C0\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4." });
      }
      const requestStartedAt = Date.now();
      const message = await sendChatMessage(input.roomId, ctx.user.id, input.content, input.imageUrl);
      console.info("[chat.send.response]", {
        roomId: input.roomId,
        senderId: ctx.user.id,
        persistenceMs: Date.now() - requestStartedAt
      });
      void (async () => {
        const notificationStartedAt = Date.now();
        try {
          const participants = await getChatRoomParticipants(input.roomId);
          if (!participants) return;
          const recipientId = participants.buyerId === ctx.user.id ? participants.sellerId : participants.buyerId;
          const [recipient, sender] = await Promise.all([
            getUserById(recipientId),
            getUserById(ctx.user.id)
          ]);
          if (recipient?.expoPushToken) {
            const delivered = await sendChatPushNotification(
              recipient.expoPushToken,
              sender?.name ?? "\uC0C8 \uBA54\uC2DC\uC9C0",
              input.content ?? "\uC0AC\uC9C4\uC744 \uBCF4\uB0C8\uC2B5\uB2C8\uB2E4.",
              input.roomId
            );
            console.info("[chat.send.push]", {
              roomId: input.roomId,
              delivered,
              elapsedMs: Date.now() - notificationStartedAt
            });
          }
        } catch (err) {
          console.error("\uCC44\uD305 \uD478\uC2DC \uC54C\uB9BC \uC804\uC1A1 \uC911 \uC624\uB958:", err);
        }
      })();
      return message;
    }),
    markRead: protectedProcedure.input(z.object({ roomId: z.number() })).mutation(({ ctx, input }) => {
      return markMessagesRead(input.roomId, ctx.user.id);
    }),
    updateStatus: protectedProcedure.input(z.object({
      roomId: z.number(),
      status: z.enum(["completed", "cancelled"])
    })).mutation(({ ctx, input }) => {
      return updateChatRoomStatus(input.roomId, ctx.user.id, input.status);
    })
  }),
  notifications: router({
    list: protectedProcedure.query(({ ctx }) => {
      return getNotifications(ctx.user.id);
    }),
    markRead: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ ctx, input }) => {
      return markNotificationRead(input.id, ctx.user.id);
    })
  }),
  // ─── 판매자 인증 ─────────────────────────────────────────────
  seller: router({
    myApplication: protectedProcedure.query(({ ctx }) => {
      return getMySellerApplication(ctx.user.id);
    }),
    myProfile: protectedProcedure.query(({ ctx }) => {
      return getUserById(ctx.user.id);
    }),
    submit: protectedProcedure.input(
      z.object({
        sellerType: z.enum(["closing_soon", "closed", "relocating", "inventory", "transfer"]),
        businessNumber: z.string().regex(/^\d{10}$/, "\uC0AC\uC5C5\uC790\uB4F1\uB85D\uBC88\uD638 10\uC790\uB9AC\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694."),
        businessName: z.string().min(1).max(255),
        representativeName: z.string().min(1).max(100),
        businessCertUrl: z.string().url("\uC0AC\uC5C5\uC790\uB4F1\uB85D\uC99D \uC0AC\uC9C4\uC744 \uC5C5\uB85C\uB4DC\uD574\uC8FC\uC138\uC694."),
        businessPhotoUrl: z.string().url().optional()
      })
    ).mutation(async ({ ctx, input }) => {
      await submitSellerApplication({
        userId: ctx.user.id,
        ...input,
        businessPhotoUrl: input.businessPhotoUrl ?? null
      });
      await updateUserSellerInfo(ctx.user.id, {
        sellerStatus: "pending",
        sellerType: input.sellerType,
        businessNumber: input.businessNumber,
        businessName: input.businessName,
        representativeName: input.representativeName,
        businessCertUrl: input.businessCertUrl
      });
      return { success: true };
    })
  }),
  // ─── 업체회원 ─────────────────────────────────────────────────
  company: router({
    myProfile: protectedProcedure.query(({ ctx }) => {
      return getUserById(ctx.user.id);
    }),
    submit: protectedProcedure.input(z.object({
      companyType: z.enum(["demolition", "interior", "waste", "signage", "pos", "cctv", "cleaning", "tax", "labor", "consulting"]),
      companyName: z.string().min(1).max(255),
      representativeName: z.string().min(1).max(100),
      companyPhone: z.string().min(9).max(20),
      companyAddress: z.string().min(1).max(500),
      companyDesc: z.string().max(1e3).optional(),
      businessNumber: z.string().min(10).max(20),
      companyLogoUrl: z.string().url().optional(),
      companyBusinessCertUrl: z.string().url().optional(),
      images: z.array(z.string().url()).max(10).optional()
    })).mutation(async ({ ctx, input }) => {
      await updateUserCompanyInfo(ctx.user.id, {
        companyStatus: "pending",
        companyType: input.companyType,
        companyName: input.companyName,
        companyPhone: input.companyPhone,
        companyAddress: input.companyAddress,
        companyDesc: input.companyDesc ?? null,
        businessNumber: input.businessNumber ?? null,
        companyLogoUrl: input.companyLogoUrl ?? null,
        companyBusinessCertUrl: input.companyBusinessCertUrl ?? null,
        representativeName: input.representativeName
      });
      if (input.images && input.images.length > 0) {
        await addCompanyImages(ctx.user.id, input.images);
      }
      return { success: true };
    }),
    updateProfile: protectedProcedure.input(z.object({
      companyName: z.string().min(1).max(255).optional(),
      representativeName: z.string().min(1).max(100).optional(),
      companyPhone: z.string().min(9).max(20).optional(),
      companyAddress: z.string().min(1).max(500).optional(),
      companyDesc: z.string().max(1e3).optional(),
      companyLogoUrl: z.string().url().optional(),
      images: z.array(z.string().url()).max(10).optional()
    })).mutation(async ({ ctx, input }) => {
      const user = await getUserById(ctx.user.id);
      if (!user || user.role !== "company" || user.companyStatus !== "approved") {
        throw new TRPCError3({ code: "FORBIDDEN", message: "\uC2B9\uC778\uB41C \uC5C5\uCCB4\uD68C\uC6D0\uB9CC \uC815\uBCF4\uB97C \uC218\uC815\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." });
      }
      const { images, ...profileFields } = input;
      await updateCompanyProfile(ctx.user.id, profileFields);
      if (images) {
        await addCompanyImages(ctx.user.id, images);
      }
      return { success: true };
    })
  }),
  // ─── 신고 ────────────────────────────────────────────────────
  reports: router({
    create: protectedProcedure.input(
      z.object({
        targetType: z.enum(["product", "user", "comment", "chat"]),
        targetId: z.number(),
        reason: z.string().min(5, "\uC2E0\uACE0 \uC0AC\uC720\uB97C 5\uC790 \uC774\uC0C1 \uC785\uB825\uD574\uC8FC\uC138\uC694.").max(1e3)
      })
    ).mutation(async ({ ctx, input }) => {
      await createReport({
        reporterId: ctx.user.id,
        targetType: input.targetType,
        targetId: input.targetId,
        reason: input.reason
      });
      return { success: true };
    })
  }),
  // ─── 1:1 고객센터 문의 ───────────────────────────────────────────
  inquiries: router({
    create: protectedProcedure.input(z.object({
      category: z.enum(["account", "product", "payment", "report", "seller", "company", "etc"]).default("etc"),
      title: z.string().min(1).max(255),
      content: z.string().min(1).max(2e3)
    })).mutation(({ ctx, input }) => {
      return createInquiry({ userId: ctx.user.id, ...input });
    }),
    myList: protectedProcedure.query(({ ctx }) => {
      return getMyInquiries(ctx.user.id);
    }),
    detail: protectedProcedure.input(z.object({ id: z.number() })).query(({ ctx, input }) => {
      return getInquiryById(input.id, ctx.user.id);
    })
  }),
  // ─── 관리자 전용 ─────────────────────────────────────────────
  admin: router({
    sellerApplications: adminProcedure.input(
      z.object({
        status: z.enum(["pending", "approved", "rejected", "suspended"]).optional()
      }).optional()
    ).query(({ input }) => {
      return getAllSellerApplications(input);
    }),
    reviewApplication: adminProcedure.input(
      z.object({
        applicationId: z.number(),
        action: z.enum(["approved", "rejected", "suspended"]),
        rejectionReason: z.string().optional()
      })
    ).mutation(({ ctx, input }) => {
      return reviewSellerApplication(
        input.applicationId,
        input.action,
        ctx.user.id,
        input.rejectionReason
      );
    }),
    stats: adminProcedure.query(() => {
      return getAdminStats();
    }),
    allProducts: adminProcedure.input(z.object({
      limit: z.number().min(1).max(100).default(30),
      offset: z.number().min(0).default(0),
      status: z.string().optional()
    }).optional()).query(({ input }) => {
      return getAdminProducts(input);
    }),
    deleteProduct: adminProcedure.input(z.object({ productId: z.number() })).mutation(({ input }) => {
      return adminDeleteProduct(input.productId);
    }),
    allReports: adminProcedure.input(z.object({
      limit: z.number().min(1).max(100).default(30),
      offset: z.number().min(0).default(0),
      status: z.string().optional()
    }).optional()).query(({ input }) => {
      return getAdminReports(input);
    }),
    resolveReport: adminProcedure.input(z.object({
      reportId: z.number(),
      status: z.enum(["resolved", "dismissed"])
    })).mutation(({ input }) => {
      return updateReportStatus(input.reportId, input.status);
    }),
    allUsers: adminProcedure.input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0)
    }).optional()).query(({ input }) => {
      return getAdminUsers(input);
    }),
    suspendUser: adminProcedure.input(z.object({ userId: z.number(), reason: z.string().optional() })).mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user.id) {
        throw new TRPCError3({ code: "BAD_REQUEST", message: "\uBCF8\uC778 \uACC4\uC815\uC740 \uC815\uC9C0\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." });
      }
      const target = await getUserById(input.userId);
      if (!target) throw new TRPCError3({ code: "NOT_FOUND", message: "\uC0AC\uC6A9\uC790\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." });
      if (target.role === "admin") {
        throw new TRPCError3({ code: "BAD_REQUEST", message: "\uB2E4\uB978 \uAD00\uB9AC\uC790 \uACC4\uC815\uC740 \uC815\uC9C0\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." });
      }
      return suspendUser(input.userId, input.reason);
    }),
    reactivateUser: adminProcedure.input(z.object({ userId: z.number() })).mutation(({ input }) => {
      return reactivateUser(input.userId);
    }),
    notices: publicProcedure.input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }).optional()).query(({ input }) => {
      return getNotices(input);
    }),
    createNotice: adminProcedure.input(z.object({
      title: z.string().min(1).max(255),
      content: z.string().min(1),
      isPinned: z.boolean().default(false)
    })).mutation(({ ctx, input }) => {
      return createNotice({ authorId: ctx.user.id, ...input });
    }),
    deleteNotice: adminProcedure.input(z.object({ noticeId: z.number() })).mutation(({ input }) => {
      return deleteNotice(input.noticeId);
    }),
    allInquiries: adminProcedure.input(z.object({
      status: z.enum(["pending", "answered"]).optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0)
    }).optional()).query(({ input }) => {
      return getAllInquiries(input);
    }),
    answerInquiry: adminProcedure.input(z.object({ inquiryId: z.number(), answerContent: z.string().min(1).max(2e3) })).mutation(({ ctx, input }) => {
      return answerInquiry(input.inquiryId, ctx.user.id, input.answerContent);
    }),
    companyApplications: adminProcedure.input(z.object({
      status: z.enum(["pending", "approved", "rejected", "suspended"]).optional()
    }).optional()).query(({ input }) => {
      return getCompanyApplications(input);
    }),
    reviewCompanyApplication: adminProcedure.input(z.object({
      userId: z.number(),
      action: z.enum(["approved", "rejected", "suspended"]),
      rejectionReason: z.string().optional()
    })).mutation(async ({ input }) => {
      await reviewCompanyApplication(input.userId, input.action, input.rejectionReason);
      return { success: true };
    })
  }),
  // ─── Reviews (거래 후기) ────────────────────────────────────
  reviews: router({
    create: protectedProcedure.input(
      z.object({
        targetUserId: z.number(),
        productId: z.number().optional(),
        chatRoomId: z.number().optional(),
        rating: z.number().min(1).max(5),
        content: z.string().max(500).optional()
      })
    ).mutation(async ({ ctx, input }) => {
      if (ctx.user.id === input.targetUserId) {
        throw new TRPCError3({ code: "BAD_REQUEST", message: "\uC790\uC2E0\uC5D0\uAC8C \uD6C4\uAE30\uB97C \uB0A8\uAE38 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." });
      }
      return createReview({
        userId: ctx.user.id,
        targetUserId: input.targetUserId,
        productId: input.productId,
        chatRoomId: input.chatRoomId,
        rating: input.rating,
        content: input.content
      });
    }),
    listBySeller: publicProcedure.input(
      z.object({
        targetUserId: z.number(),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0)
      })
    ).query(({ input }) => {
      return getReviewsByTargetUser(input.targetUserId, input.limit, input.offset);
    }),
    ratingSummary: publicProcedure.input(z.object({ targetUserId: z.number() })).query(({ input }) => {
      return getSellerRatingSummary(input.targetUserId);
    }),
    checkExists: protectedProcedure.input(z.object({ chatRoomId: z.number() })).query(({ ctx, input }) => {
      return checkReviewExists(ctx.user.id, input.chatRoomId);
    }),
    myReviews: protectedProcedure.query(({ ctx }) => {
      return getMyReviews(ctx.user.id);
    })
  })
});

// server/_core/context.ts
import jwt2 from "jsonwebtoken";
init_env();
async function createContext(opts) {
  let user = null;
  try {
    const authHeader = opts.req.headers["authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const decoded = jwt2.verify(token, ENV.jwtSecret);
      if (decoded?.userId) {
        user = await getUserById(decoded.userId);
        if (user?.deletedAt || user?.suspendedAt) {
          user = null;
        }
      }
    }
  } catch {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/schemaCompat.ts
import { sql as sql2 } from "drizzle-orm";
async function ensureUsersSchemaCompatibility() {
  const db = await getDb();
  if (!db) {
    console.warn("[schema] DATABASE_URL\uC774 \uC5C6\uC5B4 users \uC2A4\uD0A4\uB9C8 \uBCF4\uC815\uC744 \uAC74\uB108\uB701\uB2C8\uB2E4.");
    return;
  }
  const statements = [
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `nickname` VARCHAR(50) NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `loginMethod` VARCHAR(64) NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `role` VARCHAR(32) NOT NULL DEFAULT 'user'",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `sellerStatus` VARCHAR(32) NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `sellerType` VARCHAR(32) NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `businessNumber` VARCHAR(20) NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `businessName` VARCHAR(255) NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `representativeName` VARCHAR(100) NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `businessCertUrl` TEXT NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `businessPhotoUrl` TEXT NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `companyStatus` VARCHAR(32) NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `companyType` VARCHAR(32) NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `companyName` VARCHAR(255) NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `companyDesc` TEXT NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `companyPhone` VARCHAR(20) NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `companyAddress` VARCHAR(500) NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `companyLogoUrl` TEXT NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `companyBusinessCertUrl` TEXT NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `companyRejectionReason` TEXT NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `isVerified` TINYINT(1) NOT NULL DEFAULT 0",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `profileImageUrl` TEXT NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `phone` VARCHAR(20) NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `password` VARCHAR(256) NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `failedLoginAttempts` INT NOT NULL DEFAULT 0",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `lockedUntil` TIMESTAMP NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `kakaoId` VARCHAR(64) NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `appleId` VARCHAR(64) NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `notifChat` TINYINT(1) NOT NULL DEFAULT 1",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `notifPriceDrop` TINYINT(1) NOT NULL DEFAULT 1",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `notifTrade` TINYINT(1) NOT NULL DEFAULT 1",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `notifMarketing` TINYINT(1) NOT NULL DEFAULT 0",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `expoPushToken` TEXT NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `lastSignedIn` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `deletedAt` TIMESTAMP NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `suspendedAt` TIMESTAMP NULL",
    "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `suspendedReason` TEXT NULL",
    // 기존 회원 시스템에서 관리자였던 계정의 권한만 복구합니다.
    // 상품·업체·채팅 등 다른 데이터는 변경하지 않습니다.
    "UPDATE `users` SET `role` = 'admin' WHERE `email` IN ('mm328i@naver.com', 'admin@closingmarket.com')"
  ];
  for (const statement of statements) {
    try {
      await db.execute(sql2.raw(statement));
    } catch (error) {
      console.error("[schema] users \uCEEC\uB7FC \uBCF4\uC815 \uC2E4\uD328:", statement, error);
      throw error;
    }
  }
  console.log("[schema] users \uC2A4\uD0A4\uB9C8 \uD638\uD658\uC131 \uD655\uC778 \uC644\uB8CC");
}

// server/_core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  await ensureUsersSchemaCompatibility();
  const app = express();
  app.set("trust proxy", 1);
  const server = createServer(app);
  const allowedOrigins = [
    ...process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()) : [],
    ...process.env.WEB_APP_URL ? [process.env.WEB_APP_URL] : [],
    "http://localhost:3000",
    "http://localhost:8081"
  ].filter(Boolean);
  const isRenderPreview = (origin) => /\.onrender\.com$/.test(new URL(origin).hostname);
  const isManusPreview = (origin) => /\.manus\.computer$/.test(new URL(origin).hostname);
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      let allow = false;
      try {
        allow = allow = allowedOrigins.includes(origin) || isRenderPreview(origin) || isManusPreview(origin);
      } catch {
        allow = false;
      }
      if (allow) {
        res.header("Access-Control-Allow-Origin", origin);
        res.header("Access-Control-Allow-Credentials", "true");
      }
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerLegalRoutes(app);
  app.get(["/", "/home"], (_req, res) => {
    res.status(200).type("html").send(`<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>\uD074\uB85C\uC9D5\uB9C8\uCF13</title>
  <style>
    :root { color-scheme: light; font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif; }
    body { margin: 0; background: #fff; color: #222; }
    main { box-sizing: border-box; width: min(760px, 100%); margin: 0 auto; padding: 56px 24px 64px; }
    .brand { color: #D4AF37; font-weight: 800; letter-spacing: .08em; font-size: 14px; }
    h1 { margin: 18px 0 12px; font-size: 34px; line-height: 1.25; }
    .lead { color: #666; line-height: 1.7; margin: 0 0 28px; }
    .links { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; }
    .links a { display: block; padding: 20px; border: 1px solid #eadfb8; border-radius: 16px; color: #222; text-decoration: none; background: #fffdf7; font-weight: 700; }
    .links a span { display: block; margin-top: 7px; color: #777; font-size: 13px; font-weight: 400; line-height: 1.5; }
    footer { margin-top: 34px; color: #888; font-size: 12px; line-height: 1.7; }
  </style>
</head>
<body>
  <main>
    <div class="brand">CLOSING MARKET</div>
    <h1>\uC0AC\uC5C5\uC744 \uC815\uB9AC\uD558\uACE0, \uB2E4\uC2DC \uC2DC\uC791\uD558\uB294 \uACF3</h1>
    <p class="lead">\uD3D0\uC5C5\xB7\uC0AC\uC5C5\uC815\uB9AC \uBB3C\uD488 \uC911\uACE0\uAC70\uB798\uC640 \uC0AC\uC5C5\uC5D0 \uD544\uC694\uD55C \uC804\uBB38 \uC5C5\uCCB4 \uC5F0\uACB0\uC744 \uC81C\uACF5\uD558\uB294 \uD074\uB85C\uC9D5\uB9C8\uCF13\uC785\uB2C8\uB2E4.</p>
    <div class="links">
      <a href="/privacy">\uAC1C\uC778\uC815\uBCF4\uCC98\uB9AC\uBC29\uCE68<span>\uAC1C\uC778\uC815\uBCF4 \uC218\uC9D1\xB7\uC774\uC6A9 \uBC0F \uBCF4\uD638 \uC548\uB0B4</span></a>
      <a href="/terms">\uC774\uC6A9\uC57D\uAD00<span>\uC11C\uBE44\uC2A4 \uC774\uC6A9 \uC870\uAC74\uACFC \uD68C\uC6D0\uC758 \uAD8C\uB9AC\xB7\uC758\uBB34</span></a>
      <a href="/support">\uACE0\uAC1D\uC9C0\uC6D0/\uBB38\uC758<span>\uC11C\uBE44\uC2A4 \uC774\uC6A9 \uBB38\uC758\uC640 \uC774\uBA54\uC77C \uC0C1\uB2F4 \uC548\uB0B4</span></a>
      <a href="/community-policy">\uC2E0\uACE0 \uBC0F \uCEE4\uBBA4\uB2C8\uD2F0 \uC6B4\uC601\uC815\uCC45<span>\uAC8C\uC2DC\uBB3C \uAE30\uC900\uACFC \uC2E0\uACE0 \uCC98\uB9AC \uC808\uCC28</span></a>
    </div>
    <footer>\uBB38\uC758: closingmarket.help@gmail.com</footer>
  </main>
</body>
</html>`);
  });
  app.get(["/support", "/support/"], (_req, res) => {
    res.status(200).type("html").send(`<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>\uD074\uB85C\uC9D5\uB9C8\uCF13 \uACE0\uAC1D\uC13C\uD130</title>
  <style>
    :root { color-scheme: light; font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif; }
    body { margin: 0; background: #fff; color: #222; }
    main { box-sizing: border-box; width: min(680px, 100%); margin: 0 auto; padding: 56px 24px 64px; }
    .brand { color: #D4AF37; font-weight: 800; letter-spacing: .08em; font-size: 14px; }
    h1 { margin: 18px 0 10px; font-size: 32px; line-height: 1.25; }
    .lead { color: #666; line-height: 1.7; margin: 0 0 28px; }
    section { border: 1px solid #eadfb8; border-radius: 16px; padding: 22px; margin-top: 14px; background: #fffdf7; }
    h2 { font-size: 17px; margin: 0 0 10px; }
    p { line-height: 1.7; margin: 0; }
    a { display: inline-block; margin-top: 18px; padding: 12px 18px; border-radius: 10px; background: #D4AF37; color: #222; text-decoration: none; font-weight: 700; }
    small { display: block; color: #888; margin-top: 28px; line-height: 1.6; }
  </style>
</head>
<body>
  <main>
    <div class="brand">CLOSING MARKET</div>
    <h1>\uD074\uB85C\uC9D5\uB9C8\uCF13 \uACE0\uAC1D\uC13C\uD130</h1>
    <p class="lead">\uC11C\uBE44\uC2A4 \uC774\uC6A9 \uC911 \uAD81\uAE08\uD55C \uC810\uC774\uB098 \uBD88\uD3B8\uD55C \uC810\uC774 \uC788\uC73C\uC2E0\uAC00\uC694?</p>
    <section>
      <h2>1:1 \uBB38\uC758\uB294 \uC571\uC5D0\uC11C \uC774\uC6A9\uD574\uC8FC\uC138\uC694</h2>
      <p>\uD074\uB85C\uC9D5\uB9C8\uCF13 \uC571\uC5D0\uC11C <strong>\uB9C8\uC774\uD398\uC774\uC9C0 \u2192 \uACE0\uAC1D\uC13C\uD130 \uBB38\uC758</strong>\uB85C \uB4E4\uC5B4\uAC00 \uBB38\uC758\uB97C \uC791\uC131\uD558\uACE0 \uB2F5\uBCC0\uC744 \uD655\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.</p>
    </section>
    <section>
      <h2>\uC774\uBA54\uC77C \uBB38\uC758</h2>
      <p>closingmarket.help@gmail.com</p>
      <a href="mailto:closingmarket.help@gmail.com">\uC774\uBA54\uC77C \uBCF4\uB0B4\uAE30</a>
    </section>
    <small>\uC774 \uD398\uC774\uC9C0\uB294 \uACE0\uAC1D\uC13C\uD130 \uC548\uB0B4\uC6A9 \uC6F9 \uD398\uC774\uC9C0\uC785\uB2C8\uB2E4. \uD68C\uC6D0\uBCC4 \uBB38\uC758 \uB0B4\uC5ED\uC740 \uB85C\uADF8\uC778\uB41C \uC571\uC5D0\uC11C \uC548\uC804\uD558\uAC8C \uD655\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.</small>
  </main>
</body>
</html>`);
  });
  app.get(["/community-policy", "/report-policy"], (_req, res) => {
    res.status(200).type("html").send(`<!doctype html>
<html lang="ko">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>\uC2E0\uACE0 \uBC0F \uCEE4\uBBA4\uB2C8\uD2F0 \uC6B4\uC601\uC815\uCC45 - \uD074\uB85C\uC9D5\uB9C8\uCF13</title>
<style>body{margin:0;background:#f7f7f7;color:#222;font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR",sans-serif;line-height:1.7}.container{max-width:900px;margin:0 auto;padding:40px 20px 64px;background:#fff;min-height:100vh}.brand{color:#D4AF37;font-weight:800;letter-spacing:.08em;font-size:14px}nav{display:flex;flex-wrap:wrap;gap:14px;margin:18px 0 30px;padding-bottom:16px;border-bottom:1px solid #eadfb8}nav a{color:#6d5a20;text-decoration:none;font-size:13px}h1{font-size:30px;line-height:1.3}h2{font-size:19px;margin:28px 0 10px}p{white-space:pre-wrap}.meta{color:#888;border-bottom:1px solid #eee;padding-bottom:18px}.note{margin-top:40px;padding-top:20px;border-top:1px solid #eee;color:#888;font-size:12px}</style>
</head>
<body><div class="container"><div class="brand">CLOSING MARKET</div><nav><a href="/privacy">\uAC1C\uC778\uC815\uBCF4\uCC98\uB9AC\uBC29\uCE68</a><a href="/terms">\uC774\uC6A9\uC57D\uAD00</a><a href="/support">\uACE0\uAC1D\uC9C0\uC6D0/\uBB38\uC758</a><a href="/community-policy">\uC2E0\uACE0 \uBC0F \uCEE4\uBBA4\uB2C8\uD2F0 \uC6B4\uC601\uC815\uCC45</a></nav><h1>\uC2E0\uACE0 \uBC0F \uCEE4\uBBA4\uB2C8\uD2F0 \uC6B4\uC601\uC815\uCC45</h1><div class="meta">\uC2DC\uD589\uC77C\uC790: 2026\uB144 8\uC6D4 6\uC77C</div><h2>1. \uBAA9\uC801</h2><p>\uD074\uB85C\uC9D5\uB9C8\uCF13 \uC11C\uBE44\uC2A4\uC758 \uC548\uC804\uD55C \uC774\uC6A9 \uC9C8\uC11C\uC640 \uC2E0\uACE0\xB7\uAC8C\uC2DC\uBB3C \uAD00\uB9AC \uAE30\uC900\uC744 \uC815\uD569\uB2C8\uB2E4.</p><h2>2. \uC81C\uD55C\uB418\uB294 \uAC8C\uC2DC\uBB3C \uBC0F \uD589\uC704</h2><p>\uD5C8\uC704 \uB9E4\uBB3C\xB7\uD5C8\uC704 \uC0AC\uC5C5\uC790 \uC815\uBCF4\xB7\uACFC\uC7A5 \uAD11\uACE0, \uBD88\uBC95 \uBB3C\uD488 \uAC70\uB798, \uD0C0\uC778\uC758 \uAD8C\uB9AC \uCE68\uD574, \uC695\uC124\xB7\uBE44\uBC29\xB7\uD610\uC624 \uD45C\uD604, \uAC1C\uC778\uC815\uBCF4 \uBB34\uB2E8 \uB178\uCD9C, \uC2A4\uD338\xB7\uC0AC\uAE30 \uC720\uB3C4 \uBC0F \uC2E0\uACE0 \uBCF4\uBCF5 \uD589\uC704\uB294 \uC81C\uD55C\uB429\uB2C8\uB2E4.</p><h2>3. \uC2E0\uACE0 \uBC0F \uCC98\uB9AC</h2><p>\uD68C\uC6D0\uC740 \uACE0\uAC1D\uC9C0\uC6D0/\uBB38\uC758 \uACBD\uB85C\uB97C \uD1B5\uD574 \uC2E0\uACE0 \uB300\uC0C1\uACFC \uC0AC\uC720\uB97C \uC54C\uB824\uC8FC\uC2E4 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uC6B4\uC601\uC790\uB294 \uD655\uC778 \uD6C4 \uAC8C\uC2DC\uBB3C \uC0AD\uC81C\xB7\uBE44\uACF5\uAC1C, \uC774\uC6A9 \uC81C\uD55C, \uCD94\uAC00 \uC790\uB8CC \uC694\uCCAD \uB4F1\uC758 \uC870\uCE58\uB97C \uCDE8\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.</p><h2>4. \uC774\uC6A9 \uC81C\uD55C</h2><p>\uAE08\uC9C0\uD589\uC704\uAC00 \uBC18\uBCF5\uB418\uAC70\uB098 \uC911\uB300\uD55C \uACBD\uC6B0 \uACBD\uACE0, \uAC8C\uC2DC\uBB3C \uC81C\uD55C, \uC77C\uC2DC \uC815\uC9C0 \uB610\uB294 \uC601\uAD6C \uC774\uC6A9 \uC815\uC9C0\uAC00 \uC774\uB8E8\uC5B4\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4.</p><h2>5. \uBB38\uC758\uCC98</h2><p>closingmarket.help@gmail.com</p><div class="note">\uBCF8 \uC815\uCC45\uC740 \uC11C\uBE44\uC2A4 \uC6B4\uC601\uC744 \uC704\uD55C \uCD08\uC548\uC774\uBA70 \uC2E4\uC81C \uC801\uC6A9 \uC804 \uAD00\uB828 \uBC95\uB839\uACFC \uC6B4\uC601 \uC808\uCC28\uC5D0 \uB9DE\uCD98 \uBC95\uB960 \uC804\uBB38\uAC00 \uAC80\uD1A0\uB97C \uAD8C\uC7A5\uD569\uB2C8\uB2E4.</div></div></body></html>`);
  });
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`[api] server listening on port ${port}`);
  });
}
startServer().catch(console.error);
