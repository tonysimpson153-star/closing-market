import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, publicProcedure, adminProcedure } from "./_core/trpc";
import * as db from "./db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendChatPushNotification } from "./_core/push-notifications";
import { ENV } from "./_core/env";
import { verifyAppleIdentityToken } from "./apple-auth";

const JWT_SECRET = ENV.jwtSecret;
const MAX_IMAGE_BASE64_LENGTH = 7 * 1024 * 1024;

async function enforceUploadRateLimit(userId: number, kind: string) {
  const { checkRateLimit } = await import("./_core/rateLimit");
  if (!checkRateLimit(`upload:${kind}:${userId}`, 30, 60 * 60 * 1000)) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "이미지 업로드 요청이 너무 많습니다. 잠시 후 다시 시도해주세요." });
  }
}

export const appRouter = router({
  // Public routes
  health: publicProcedure.query(() => ({ status: "ok" })),

  // ─── 자체 인증 ───
  auth: router({
    // 이메일 회원가입
        register: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(1).max(50),
        nickname: z.string().min(1).max(50),
        phone: z.string().min(9, "전화번호를 입력해주세요.").max(20),
      }))
      .mutation(async ({ ctx, input }) => {
        const { checkRateLimit } = await import("./_core/rateLimit");
        const ip = ctx.req.ip ?? "unknown";
        if (!checkRateLimit(`register:${ip}`, 10, 60 * 60 * 1000)) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "너무 많은 가입 시도가 감지되었습니다. 잠시 후 다시 시도해주세요." });
        }

        const normalizedEmail = input.email.trim().toLowerCase();
        const existing = await db.getUserByEmail(normalizedEmail);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "이미 사용 중인 이메일입니다." });
        }
        const hashedPassword = await bcrypt.hash(input.password, 10);
        const openId = `email_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        let user;
        try {
          user = await db.createUserByEmail({
            openId,
            email: normalizedEmail,
            password: hashedPassword,
            name: input.name,
            nickname: input.nickname,
            phone: input.phone,
            loginMethod: "email",
          });
        } catch (err: any) {
          if (err?.code === "ER_DUP_ENTRY" || /Duplicate entry/i.test(err?.message ?? "")) {
            throw new TRPCError({ code: "CONFLICT", message: "이미 사용 중인 이메일입니다." });
          }
          throw err;
        }
        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "30d" });
        return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role, isVerified: user.isVerified, sellerStatus: user.sellerStatus, companyStatus: user.companyStatus, profileImageUrl: user.profileImageUrl } };
      }),

    // 이메일 로그인
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { checkRateLimit } = await import("./_core/rateLimit");
        const ip = ctx.req.ip ?? "unknown";
        if (!checkRateLimit(`login:${ip}`, 10, 10 * 60 * 1000)) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "너무 많은 로그인 시도가 감지되었습니다. 잠시 후 다시 시도해주세요." });
        }

        const user = await db.getUserByEmail(input.email.trim().toLowerCase());
        if (!user || !user.password) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "이메일 또는 비밀번호가 올바르지 않습니다." });
        }

        const lockedMinutes = await db.getAccountLockStatus(user.id);
        if (lockedMinutes !== null) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: `로그인 시도가 너무 많아 계정이 잠겼습니다. 약 ${lockedMinutes}분 후 다시 시도해주세요.`,
          });
        }

        const valid = await bcrypt.compare(input.password, user.password);
        if (!valid) {
          await db.recordFailedLogin(user.id);
          throw new TRPCError({ code: "UNAUTHORIZED", message: "이메일 또는 비밀번호가 올바르지 않습니다." });
        }
        await db.resetFailedLogin(user.id);

        if (user.suspendedAt) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: user.suspendedReason
              ? `이용이 정지된 계정입니다. 사유: ${user.suspendedReason}`
              : "이용이 정지된 계정입니다. 고객센터로 문의해주세요.",
          });
        }
        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "30d" });
        return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role, isVerified: user.isVerified, sellerStatus: user.sellerStatus, companyStatus: user.companyStatus, profileImageUrl: user.profileImageUrl } };
      }),

    // 비밀번호 찾기 - 재설정 링크 이메일 발송
    forgotPassword: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ ctx, input }) => {
        const { checkRateLimit } = await import("./_core/rateLimit");
        const ip = ctx.req.ip ?? "unknown";
        if (!checkRateLimit(`password-reset:${ip}`, 5, 15 * 60 * 1000)) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "비밀번호 재설정 요청이 너무 많습니다. 잠시 후 다시 시도해주세요." });
        }
        const email = input.email.trim().toLowerCase();
        const user = await db.getUserByEmail(email);

        if (user && user.password && !user.deletedAt) {
          const crypto = await import("crypto");
          const token = crypto.randomBytes(32).toString("hex");
          const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
          await db.createPasswordResetToken(user.id, token, expiresAt);

          const { sendEmail, buildPasswordResetEmailHtml } = await import("./_core/email");
          const baseUrl = ENV.webAppUrl || "https://example.com";
          const resetUrl = `${baseUrl.replace(/\/+$/, "")}/auth/reset-password?token=${token}`;
          await sendEmail({
            to: email,
            subject: "[클로징마켓] 비밀번호 재설정 안내",
            html: buildPasswordResetEmailHtml(resetUrl),
          });
        }

        return {
          success: true,
          message: "입력하신 이메일이 가입되어 있다면, 비밀번호 재설정 링크를 보내드렸습니다.",
        };
      }),

    // 비밀번호 재설정
    resetPassword: publicProcedure
      .input(z.object({
        token: z.string(),
        newPassword: z.string().min(6, "비밀번호는 6자 이상이어야 합니다."),
      }))
      .mutation(async ({ input }) => {
        const resetToken = await db.getValidPasswordResetToken(input.token);
        if (!resetToken) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "유효하지 않거나 만료된 링크입니다. 비밀번호 찾기를 다시 시도해주세요." });
        }
        const hashed = await bcrypt.hash(input.newPassword, 10);
        await db.updateUserPassword(resetToken.userId, hashed);
        await db.markPasswordResetTokenUsed(resetToken.id);
        return { success: true };
      }),
    me: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        try {
          const decoded = jwt.verify(input.token, JWT_SECRET) as { userId: number };
          const user = await db.getUserById(decoded.userId);
          if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "사용자를 찾을 수 없습니다." });
          return { id: user.id, email: user.email, name: user.name, role: user.role, isVerified: user.isVerified, sellerStatus: user.sellerStatus, companyStatus: user.companyStatus, profileImageUrl: user.profileImageUrl, phone: user.phone };
        } catch {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "유효하지 않은 토큰입니다." });
        }
      }),

    // 카카오 로그인
    kakaoLogin: publicProcedure
      .input(z.object({ accessToken: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const { checkRateLimit } = await import("./_core/rateLimit");
        const ip = ctx.req.ip ?? "unknown";
        if (!checkRateLimit(`kakao-login:${ip}`, 20, 10 * 60 * 1000)) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "로그인 요청이 너무 많습니다. 잠시 후 다시 시도해주세요." });
        }
        const kakaoRes = await fetch("https://kapi.kakao.com/v2/user/me", {
          headers: { Authorization: `Bearer ${input.accessToken}` },
        });
        if (!kakaoRes.ok) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "카카오 인증에 실패했습니다." });
        }
        const kakaoData = await kakaoRes.json() as { id: number; kakao_account?: { email?: string; profile?: { nickname?: string; profile_image_url?: string } } };
        const kakaoId = String(kakaoData.id);
        const email = kakaoData.kakao_account?.email;
        const name = kakaoData.kakao_account?.profile?.nickname || "카카오 사용자";
        const profileImageUrl = kakaoData.kakao_account?.profile?.profile_image_url;

        let user = await db.getUserByKakaoId(kakaoId);
        if (!user) {
          const openId = `kakao_${kakaoId}`;
          user = await db.createUserByEmail({
            openId,
            email: email || null,
            password: null,
            name,
            phone: null,
            loginMethod: "kakao",
            kakaoId,
            profileImageUrl: profileImageUrl || null,
          });
        }
        if (user.suspendedAt) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: user.suspendedReason
              ? `이용이 정지된 계정입니다. 사유: ${user.suspendedReason}`
              : "이용이 정지된 계정입니다. 고객센터로 문의해주세요.",
          });
        }
        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "30d" });
        return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role, isVerified: user.isVerified, sellerStatus: user.sellerStatus, companyStatus: user.companyStatus, profileImageUrl: user.profileImageUrl } };
      }),

    // Apple 로그인
    appleLogin: publicProcedure
      .input(z.object({ identityToken: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const { checkRateLimit } = await import("./_core/rateLimit");
        const ip = ctx.req.ip ?? "unknown";
        if (!checkRateLimit(`apple-login:${ip}`, 20, 10 * 60 * 1000)) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "로그인 요청이 너무 많습니다. 잠시 후 다시 시도해주세요." });
        }
        try {
          const appleIdentity = await verifyAppleIdentityToken(input.identityToken);
          const appleId = appleIdentity.subject;
          const email = appleIdentity.email;

          let user = await db.getUserByAppleId(appleId);
          if (!user) {
            const openId = `apple_${appleId}`;
            user = await db.createUserByEmail({
              openId,
              email,
              password: null,
              name: "Apple 사용자",
              phone: null,
              loginMethod: "apple",
              profileImageUrl: null,
            });
          }
          if (user.suspendedAt) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: user.suspendedReason
                ? `이용이 정지된 계정입니다. 사유: ${user.suspendedReason}`
                : "이용이 정지된 계정입니다. 고객센터로 문의해주세요.",
            });
          }
          const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "30d" });
          return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role, isVerified: user.isVerified, sellerStatus: user.sellerStatus, companyStatus: user.companyStatus, profileImageUrl: user.profileImageUrl } };
        } catch (e: any) {
          if (e instanceof TRPCError) throw e;
          console.warn("Apple identity token verification failed", { message: e?.message });
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Apple 인증 토큰이 유효하지 않습니다." });
        }
      }),

    // 푸시 토큰 저장
    savePushToken: protectedProcedure
      .input(z.object({
        token: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.savePushToken(ctx.user.id, input.token);
        return { success: true };
      }),
  }),

  // ─── 사용자 설정 ───
  user: router({
    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(50).optional(),
        nickname: z.string().min(1).max(50).optional(),
        phone: z.string().optional(),
        profileImageUrl: z.string().url().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (input.nickname !== undefined && !input.nickname.trim()) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "닉네임을 입력해주세요." });
        }
        const updated = await db.updateUserProfile(ctx.user.id, input);
        if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "사용자를 찾을 수 없습니다." });
        return { id: updated.id, name: updated.name, nickname: updated.nickname, phone: updated.phone, email: updated.email, profileImageUrl: updated.profileImageUrl };
      }),
    changePassword: protectedProcedure
      .input(z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(6),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user || !user.password) throw new TRPCError({ code: "BAD_REQUEST", message: "비밀번호를 변경할 수 없는 계정입니다." });
        const valid = await bcrypt.compare(input.currentPassword, user.password);
        if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "현재 비밀번호가 올바르지 않습니다." });
        const hashed = await bcrypt.hash(input.newPassword, 10);
        await db.updateUserPassword(ctx.user.id, hashed);
        return { success: true };
      }),
    deleteAccount: protectedProcedure
      .input(z.object({ password: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "사용자를 찾을 수 없습니다." });

        if (user.password) {
          if (!input.password) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "비밀번호를 입력해주세요." });
          }
          const valid = await bcrypt.compare(input.password, user.password);
          if (!valid) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "비밀번호가 올바르지 않습니다." });
          }
        }

        await db.deleteAccount(ctx.user.id);
        return { success: true };
      }),
    getNotificationSettings: protectedProcedure
      .query(async ({ ctx }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user) throw new TRPCError({ code: "NOT_FOUND" });
        return {
          chatNotification: user.notifChat ?? true,
          priceDropNotification: user.notifPriceDrop ?? true,
          tradeNotification: user.notifTrade ?? true,
          marketingNotification: user.notifMarketing ?? false,
        };
      }),
    updateNotificationSettings: protectedProcedure
      .input(z.object({
        chatNotification: z.boolean().optional(),
        priceDropNotification: z.boolean().optional(),
        tradeNotification: z.boolean().optional(),
        marketingNotification: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateNotificationSettings(ctx.user.id, {
          notifChat: input.chatNotification,
          notifPriceDrop: input.priceDropNotification,
          notifTrade: input.tradeNotification,
          notifMarketing: input.marketingNotification,
        });
        return { success: true };
      }),
  }),

  products: router({
    list: publicProcedure
      .input(
        z.object({
          category: z.enum(["cafe", "pcroom", "restaurant", "gym", "office", "warehouse", "transfer"]).optional(),
          status: z.enum(["selling", "reserved", "sold"]).optional(),
          limit: z.number().min(1).max(50).default(20),
          offset: z.number().min(0).default(0),
        }).optional()
      )
      .query(({ input }) => {
        return db.getProducts(input);
      }),

    detail: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => {
        return db.getProductDetail(input.id);
      }),

    bySeller: publicProcedure
      .input(z.object({ userId: z.number().positive() }))
      .query(({ input }) => {
        return db.getSellerProducts(input.userId);
      }),

    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1).max(255),
          description: z.string().optional(),
          price: z.number().min(0),
          quantity: z.number().min(1).default(1),
          category: z.enum(["cafe", "pcroom", "restaurant", "gym", "office", "warehouse", "transfer"]),
          tradeType: z.enum(["direct", "delivery", "negotiable"]).default("direct"),
          location: z.string().optional(),
          mainImageUrl: z.string().optional(),
          images: z.array(z.string()).min(1, "이미지를 1장 이상 등록해주세요.").max(10).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { checkRateLimit } = await import("./_core/rateLimit");
        if (!checkRateLimit(`product-create:${ctx.user.id}`, 20, 60 * 60 * 1000)) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "너무 많은 상품을 등록했습니다. 잠시 후 다시 시도해주세요." });
        }

        const user = await db.getUserById(ctx.user.id);
        const isAdmin = user?.role === "admin";
        if (!user || (!isAdmin && (!user.isVerified || user.sellerStatus !== "approved"))) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "인증된 판매자만 상품을 등록할 수 있습니다.",
          });
        }

        const { images, ...productFields } = input;
        return db.createProduct({
          ...productFields,
          mainImageUrl: input.mainImageUrl ?? images?.[0],
          userId: ctx.user.id,
        }, images);
      }),

    updateStatus: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["selling", "reserved", "sold"]),
        })
      )
      .mutation(({ ctx, input }) => {
        return db.updateProductStatus(input.id, input.status, ctx.user.id);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().positive() }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.deleteProduct(input.id, ctx.user.id);
        if (!result.success) {
          throw new TRPCError({ code: "NOT_FOUND", message: "삭제할 상품을 찾을 수 없습니다." });
        }
        return result;
      }),

    myProducts: protectedProcedure.query(({ ctx }) => {
      return db.getMyProducts(ctx.user.id);
    }),
  }),

  businesses: router({
    list: publicProcedure
      .input(
        z.object({
          type: z.enum(["demolition", "interior", "waste", "sign", "pos", "cctv", "cleaning", "tax", "labor"]).optional(),
        }).optional()
      )
      .query(({ input }) => {
        return db.getBusinesses(input);
      }),

    detail: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => {
        return db.getBusinessDetail(input.id);
      }),
  }),

  // ─── 업체회원 (실제 가입한 업체) ─────────────────────────────────
  companies: router({
    list: publicProcedure
      .input(z.object({ type: z.string().optional() }).optional())
      .query(({ input }) => {
        return db.getApprovedCompanies(input);
      }),

    detail: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => {
        return db.getApprovedCompanyById(input.id);
      }),
  }),

  favorites: router({
    // 찜 목록 (인증 필요)
    list: protectedProcedure.query(({ ctx }) => {
      return db.getFavorites(ctx.user.id);
    }),

    // 찜 여부 확인 (인증 필요)
    check: protectedProcedure
      .input(
        z.object({
          productId: z.number().optional(),
          businessId: z.number().optional(),
        })
      )
      .query(({ ctx, input }) => {
        return db.isFavorited(ctx.user.id, input.productId, input.businessId);
      }),

    // 찜 토글 (인증 필요)
    toggle: protectedProcedure
      .input(
        z.object({
          productId: z.number().optional(),
          businessId: z.number().optional(),
        })
      )
      .mutation(({ ctx, input }) => {
        return db.toggleFavorite(ctx.user.id, input.productId, input.businessId);
      }),
  }),

  // ─── 최근 본 상품 ─────────────────────────────────────────────
  recentViews: router({
    list: protectedProcedure.query(({ ctx }) => {
      return db.getRecentViews(ctx.user.id);
    }),

    track: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.addRecentView(ctx.user.id, input.productId);
        return { success: true };
      }),
  }),

  // ─── 구매내역 ─────────────────────────────────────────────────
  purchases: router({
    list: protectedProcedure.query(({ ctx }) => {
      return db.getMyPurchases(ctx.user.id);
    }),
  }),

  // 채팅 이미지 업로드
  upload: router({
    chatImage: protectedProcedure
      .input(z.object({
        base64: z.string().min(4).max(MAX_IMAGE_BASE64_LENGTH),
        mimeType: z.string().default("image/jpeg"),
        fileName: z.string().default("photo.jpg"),
      }))
      .mutation(async ({ ctx, input }) => {
        await enforceUploadRateLimit(ctx.user.id, "chat");
        const { storagePut } = await import("./storage");
        const { validateImageUpload } = await import("./_core/imageValidation");
        const buffer = Buffer.from(input.base64, "base64");
        validateImageUpload(input.mimeType, buffer);
        const ext = input.mimeType.split("/")[1] ?? "jpg";
        const result = await storagePut(`chat/images/${input.fileName.replace(/\.[^.]+$/, "")}.${ext}`, buffer, input.mimeType);
        return { url: result.url };
      }),

    productImage: protectedProcedure
      .input(z.object({
        base64: z.string().min(4).max(MAX_IMAGE_BASE64_LENGTH),
        mimeType: z.string().default("image/jpeg"),
        fileName: z.string().default("photo.jpg"),
      }))
      .mutation(async ({ ctx, input }) => {
        await enforceUploadRateLimit(ctx.user.id, "product");
        const { storagePut } = await import("./storage");
        const { validateImageUpload } = await import("./_core/imageValidation");
        const buffer = Buffer.from(input.base64, "base64");
        validateImageUpload(input.mimeType, buffer);
        const ext = input.mimeType.split("/")[1] ?? "jpg";
        const result = await storagePut(
          `products/images/${ctx.user.id}_${input.fileName.replace(/\.[^.]+$/, "")}.${ext}`,
          buffer,
          input.mimeType
        );
        return { url: result.url };
      }),

    sellerDocument: protectedProcedure
      .input(z.object({
        base64: z.string().min(4).max(MAX_IMAGE_BASE64_LENGTH),
        mimeType: z.string().default("image/jpeg"),
        fileName: z.string().default("photo.jpg"),
        docType: z.enum(["cert", "photo"]),
      }))
      .mutation(async ({ ctx, input }) => {
        await enforceUploadRateLimit(ctx.user.id, "seller-document");
        const { storagePutPrivateDocument } = await import("./storage");
        const { validateImageUpload } = await import("./_core/imageValidation");
        const buffer = Buffer.from(input.base64, "base64");
        validateImageUpload(input.mimeType, buffer);
        const ext = input.mimeType.split("/")[1] ?? "jpg";
        const result = await storagePutPrivateDocument(
          `seller/${input.docType}/${ctx.user.id}_${Date.now()}.${ext}`,
          buffer,
          input.mimeType
        );
        return { url: result.url };
      }),

    companyLogo: protectedProcedure
      .input(z.object({
        base64: z.string().min(4).max(MAX_IMAGE_BASE64_LENGTH),
        mimeType: z.string().default("image/jpeg"),
        fileName: z.string().default("photo.jpg"),
      }))
      .mutation(async ({ ctx, input }) => {
        await enforceUploadRateLimit(ctx.user.id, "company-logo");
        const { storagePut } = await import("./storage");
        const { validateImageUpload } = await import("./_core/imageValidation");
        const buffer = Buffer.from(input.base64, "base64");
        validateImageUpload(input.mimeType, buffer);
        const ext = input.mimeType.split("/")[1] ?? "jpg";
        const result = await storagePut(
          `company/logo/${ctx.user.id}_${Date.now()}.${ext}`,
          buffer,
          input.mimeType
        );
        return { url: result.url };
      }),

    companyBusinessCert: protectedProcedure
      .input(z.object({
        base64: z.string().min(4).max(MAX_IMAGE_BASE64_LENGTH),
        mimeType: z.string().default("image/jpeg"),
        fileName: z.string().default("photo.jpg"),
      }))
      .mutation(async ({ ctx, input }) => {
        await enforceUploadRateLimit(ctx.user.id, "company-certificate");
        const { storagePutPrivateDocument } = await import("./storage");
        const { validateImageUpload } = await import("./_core/imageValidation");
        const buffer = Buffer.from(input.base64, "base64");
        validateImageUpload(input.mimeType, buffer);
        const ext = input.mimeType.split("/")[1] ?? "jpg";
        const result = await storagePutPrivateDocument(
          `company/cert/${ctx.user.id}_${Date.now()}.${ext}`,
          buffer,
          input.mimeType
        );
        return { url: result.url };
      }),

    profilePhoto: protectedProcedure
      .input(z.object({
        base64: z.string().min(4).max(MAX_IMAGE_BASE64_LENGTH),
        mimeType: z.string().default("image/jpeg"),
        fileName: z.string().default("photo.jpg"),
      }))
      .mutation(async ({ ctx, input }) => {
        await enforceUploadRateLimit(ctx.user.id, "profile-photo");
        const { storagePut } = await import("./storage");
        const { validateImageUpload } = await import("./_core/imageValidation");
        const buffer = Buffer.from(input.base64, "base64");
        validateImageUpload(input.mimeType, buffer);
        const ext = input.mimeType.split("/")[1] ?? "jpg";
        const result = await storagePut(
          `user/profile/${ctx.user.id}_${Date.now()}.${ext}`,
          buffer,
          input.mimeType
        );
        return { url: result.url };
      }),
  }),

  chats: router({
    list: protectedProcedure.query(({ ctx }) => {
      return db.getChatList(ctx.user.id);
    }),

    myInquiryChats: protectedProcedure.query(({ ctx }) => {
      return db.getCompanyInquiryChats(ctx.user.id);
    }),

    getOrCreate: protectedProcedure
      .input(z.object({
        sellerId: z.number(),
        productId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { checkRateLimit } = await import("./_core/rateLimit");
        if (!checkRateLimit(`chat-create:${ctx.user.id}`, 30, 60 * 60 * 1000)) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "채팅 시작 요청이 너무 많습니다. 잠시 후 다시 시도해주세요." });
        }
        if (ctx.user.id === input.sellerId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "본인에게 채팅을 시작할 수 없습니다." });
        }
        return db.getOrCreateChatRoom(ctx.user.id, input.sellerId, input.productId);
      }),

    room: protectedProcedure
      .input(z.object({ roomId: z.number() }))
      .query(({ ctx, input }) => {
        return db.getChatRoomDetail(input.roomId, ctx.user.id);
      }),

    messages: protectedProcedure
      .input(z.object({
        roomId: z.number(),
        limit: z.number().min(1).max(100).default(50),
        beforeId: z.number().optional(),
      }))
      .query(({ ctx, input }) => {
        return db.getChatMessages(input.roomId, ctx.user.id, input.limit, input.beforeId);
      }),

    send: protectedProcedure
      .input(z.object({
        roomId: z.number(),
        content: z.string().optional(),
        imageUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { checkRateLimit } = await import("./_core/rateLimit");
        if (!checkRateLimit(`chat-send:${ctx.user.id}`, 120, 60 * 60 * 1000)) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "메시지 전송이 너무 많습니다. 잠시 후 다시 시도해주세요." });
        }
        if (!input.content && !input.imageUrl) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "내용 또는 이미지가 필요합니다." });
        }
        const message = await db.sendChatMessage(input.roomId, ctx.user.id, input.content, input.imageUrl);

        try {
          const participants = await db.getChatRoomParticipants(input.roomId);
          if (participants) {
            const recipientId = participants.buyerId === ctx.user.id ? participants.sellerId : participants.buyerId;
            const recipient = await db.getUserById(recipientId);
            const sender = await db.getUserById(ctx.user.id);
            const senderName = sender?.nickname || sender?.name || "새 메시지";
            const previewText = input.content ?? "사진을 보냈습니다.";

            // 1) 인앱 알림(notifications) 테이블에 기록하여 알림 리스트에 표시
            await db.createNotification({
              userId: recipientId,
              type: "chat",
              title: `💬 ${senderName}`,
              body: previewText,
              referenceId: input.roomId,
            });

            // 2) 푸시 토큰이 있는 경우 푸시 발송
            if (recipient?.expoPushToken) {
              await sendChatPushNotification(
                recipient.expoPushToken,
                senderName,
                previewText,
                input.roomId
              );
            }
          }
        } catch (err) {
          console.error("채팅 알림 생성 및 푸시 전송 중 오류:", err);
        }

        return message;
      }),

    markRead: protectedProcedure
      .input(z.object({ roomId: z.number() }))
      .mutation(({ ctx, input }) => {
        return db.markMessagesRead(input.roomId, ctx.user.id);
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        roomId: z.number(),
        status: z.enum(["completed", "cancelled"]),
      }))
      .mutation(({ ctx, input }) => {
        return db.updateChatRoomStatus(input.roomId, ctx.user.id, input.status);
      }),
  }),

  notifications: router({
    list: protectedProcedure.query(({ ctx }) => {
      return db.getNotifications(ctx.user.id);
    }),

    markRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => {
        return db.markNotificationRead(input.id, ctx.user.id);
      }),
  }),

  // ─── 판매자 인증 ─────────────────────────────────────────────
  seller: router({
    myApplication: protectedProcedure.query(({ ctx }) => {
      return db.getMySellerApplication(ctx.user.id);
    }),

    myProfile: protectedProcedure.query(({ ctx }) => {
      return db.getUserById(ctx.user.id);
    }),

    submit: protectedProcedure
      .input(
        z.object({
          sellerType: z.enum(["closing_soon", "closed", "relocating", "inventory", "transfer"]),
          businessNumber: z.string().regex(/^\d{10}$/, "사업자등록번호 10자리를 입력해주세요."),
          businessName: z.string().min(1).max(255),
          representativeName: z.string().min(1).max(100),
          businessCertUrl: z.string().url("사업자등록증 사진을 업로드해주세요."),
          businessPhotoUrl: z.string().url().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.submitSellerApplication({
          userId: ctx.user.id,
          ...input,
          businessPhotoUrl: input.businessPhotoUrl ?? null,
        });
        await db.updateUserSellerInfo(ctx.user.id, {
          sellerStatus: "pending",
          sellerType: input.sellerType,
          businessNumber: input.businessNumber,
          businessName: input.businessName,
          representativeName: input.representativeName,
          businessCertUrl: input.businessCertUrl,
        });
        return { success: true };
      }),
  }),

  // ─── 업체회원 ─────────────────────────────────────────────────
  company: router({
    myProfile: protectedProcedure.query(({ ctx }) => {
      return db.getUserById(ctx.user.id);
    }),
    submit: protectedProcedure
      .input(z.object({
        companyType: z.enum(["demolition", "interior", "waste", "signage", "pos", "cctv", "cleaning", "tax", "labor", "consulting"]),
        companyName: z.string().min(1).max(255),
        representativeName: z.string().min(1).max(100),
        companyPhone: z.string().min(9).max(20),
        companyAddress: z.string().min(1).max(500),
        companyDesc: z.string().max(1000).optional(),
        businessNumber: z.string().min(10).max(20),
        companyLogoUrl: z.string().url().optional(),
        companyBusinessCertUrl: z.string().url().optional(),
        images: z.array(z.string().url()).max(10).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserCompanyInfo(ctx.user.id, {
          companyStatus: "pending",
          companyType: input.companyType,
          companyName: input.companyName,
          companyPhone: input.companyPhone,
          companyAddress: input.companyAddress,
          companyDesc: input.companyDesc ?? null,
          businessNumber: input.businessNumber ?? null,
          companyLogoUrl: input.companyLogoUrl ?? null,
          companyBusinessCertUrl: input.companyBusinessCertUrl ?? null,
          representativeName: input.representativeName,
        });
        if (input.images && input.images.length > 0) {
          await db.addCompanyImages(ctx.user.id, input.images);
        }

        // 업체 문의함 및 관리자 알림 생성 (업체회원이 문의 또는 신청을 보냈을 때 알림 수신)
        try {
          await db.createNotification({
            userId: ctx.user.id,
            type: "business_reply",
            title: "🏢 업체 등록 신청 완료",
            body: `[${input.companyName}] 업체 등록 신청이 접수되었습니다. 관리자 승인을 기다려주세요.`,
            referenceId: ctx.user.id,
          });
        } catch (nErr) {
          console.error("업체 등록 알림 생성 오류:", nErr);
        }

        return { success: true };
      }),

    updateProfile: protectedProcedure
      .input(z.object({
        companyName: z.string().min(1).max(255).optional(),
        representativeName: z.string().min(1).max(100).optional(),
        companyPhone: z.string().min(9).max(20).optional(),
        companyAddress: z.string().min(1).max(500).optional(),
        companyDesc: z.string().max(1000).optional(),
        companyLogoUrl: z.string().url().optional(),
        images: z.array(z.string().url()).max(10).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user || user.role !== "company" || user.companyStatus !== "approved") {
          throw new TRPCError({ code: "FORBIDDEN", message: "승인된 업체회원만 정보를 수정할 수 있습니다." });
        }
        const { images, ...profileFields } = input;
        await db.updateCompanyProfile(ctx.user.id, profileFields);
        if (images) {
          await db.addCompanyImages(ctx.user.id, images);
        }
        return { success: true };
      }),
  }),

  // ─── 신고 ────────────────────────────────────────────────────
  reports: router({
    create: protectedProcedure
      .input(
        z.object({
          targetType: z.enum(["product", "user", "comment", "chat"]),
          targetId: z.number(),
          reason: z.string().min(5, "신고 사유를 5자 이상 입력해주세요.").max(1000),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.createReport({
          reporterId: ctx.user.id,
          targetType: input.targetType,
          targetId: input.targetId,
          reason: input.reason,
        });
        return { success: true };
      }),
  }),

  // ─── 사용자 안전: 차단 ────────────────────────────────────────
  safety: router({
    blockUser: protectedProcedure
      .input(z.object({
        userId: z.number(),
        reason: z.string().trim().max(500).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.id === input.userId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "본인을 차단할 수 없습니다." });
        }
        const target = await db.getUserById(input.userId);
        if (!target || target.deletedAt) {
          throw new TRPCError({ code: "NOT_FOUND", message: "차단할 사용자를 찾을 수 없습니다." });
        }
        return db.blockUserAndReport(ctx.user.id, input.userId, input.reason);
      }),
  }),

  // ─── 1:1 고객센터 문의 ───────────────────────────────────────────
  inquiries: router({
    create: protectedProcedure
      .input(z.object({
        category: z.enum(["account", "product", "payment", "report", "seller", "company", "etc"]).default("etc"),
        title: z.string().min(1).max(255),
        content: z.string().min(1).max(2000),
      }))
      .mutation(({ ctx, input }) => {
        return db.createInquiry({ userId: ctx.user.id, ...input });
      }),

    myList: protectedProcedure.query(({ ctx }) => {
      return db.getMyInquiries(ctx.user.id);
    }),

    detail: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ ctx, input }) => {
        return db.getInquiryById(input.id, ctx.user.id);
      }),
  }),

  // ─── 관리자 전용 ─────────────────────────────────────────────
  admin: router({
    getPrivateDocumentUrl: adminProcedure
      .input(z.object({ documentUrl: z.string().min(1) }))
      .query(async ({ input }) => {
        const { privateDocumentKey, storageGetSignedUrl } = await import("./storage");
        const key = privateDocumentKey(input.documentUrl);
        if (!key) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "비공개 사업자 서류 경로가 아닙니다." });
        }
        return { url: await storageGetSignedUrl(key), expiresInSeconds: 300 };
      }),
    sellerApplications: adminProcedure
      .input(
        z.object({
          status: z.enum(["pending", "approved", "rejected", "suspended"]).optional(),
        }).optional()
      )
      .query(({ input }) => {
        return db.getAllSellerApplications(input);
      }),

    reviewApplication: adminProcedure
      .input(
        z.object({
          applicationId: z.number(),
          action: z.enum(["approved", "rejected", "suspended"]),
          rejectionReason: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) => {
        return db.reviewSellerApplication(
          input.applicationId,
          input.action,
          ctx.user.id,
          input.rejectionReason
        );
      }),

    stats: adminProcedure.query(() => {
      return db.getAdminStats();
    }),

    allProducts: adminProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(30),
        offset: z.number().min(0).default(0),
        status: z.string().optional(),
      }).optional())
      .query(({ input }) => {
        return db.getAdminProducts(input);
      }),

    deleteProduct: adminProcedure
      .input(z.object({ productId: z.number() }))
      .mutation(({ input }) => {
        return db.adminDeleteProduct(input.productId);
      }),

    allReports: adminProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(30),
        offset: z.number().min(0).default(0),
        status: z.string().optional(),
      }).optional())
      .query(({ input }) => {
        return db.getAdminReports(input);
      }),

    resolveReport: adminProcedure
      .input(z.object({
        reportId: z.number(),
        status: z.enum(["resolved", "dismissed"]),
      }))
      .mutation(({ input }) => {
        return db.updateReportStatus(input.reportId, input.status);
      }),

    allUsers: adminProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional())
      .query(({ input }) => {
        return db.getAdminUsers(input);
      }),

    suspendUser: adminProcedure
      .input(z.object({ userId: z.number(), reason: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        if (input.userId === ctx.user.id) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "본인 계정은 정지할 수 없습니다." });
        }
        const target = await db.getUserById(input.userId);
        if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "사용자를 찾을 수 없습니다." });
        if (target.role === "admin") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "다른 관리자 계정은 정지할 수 없습니다." });
        }
        return db.suspendUser(input.userId, input.reason);
      }),

    reactivateUser: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(({ input }) => {
        return db.reactivateUser(input.userId);
      }),

    notices: publicProcedure
      .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }).optional())
      .query(({ input }) => {
        return db.getNotices(input);
      }),

    createNotice: adminProcedure
      .input(z.object({
        title: z.string().min(1).max(255),
        content: z.string().min(1),
        isPinned: z.boolean().default(false),
      }))
      .mutation(({ ctx, input }) => {
        return db.createNotice({ authorId: ctx.user.id, ...input });
      }),

    deleteNotice: adminProcedure
      .input(z.object({ noticeId: z.number() }))
      .mutation(({ input }) => {
        return db.deleteNotice(input.noticeId);
      }),

    allInquiries: adminProcedure
      .input(z.object({
        status: z.enum(["pending", "answered"]).optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional())
      .query(({ input }) => {
        return db.getAllInquiries(input);
      }),

    answerInquiry: adminProcedure
      .input(z.object({ inquiryId: z.number(), answerContent: z.string().min(1).max(2000) }))
      .mutation(({ ctx, input }) => {
        return db.answerInquiry(input.inquiryId, ctx.user.id, input.answerContent);
      }),

    companyApplications: adminProcedure
      .input(z.object({
        status: z.enum(["pending", "approved", "rejected", "suspended"]).optional(),
      }).optional())
      .query(({ input }) => {
        return db.getCompanyApplications(input);
      }),

    reviewCompanyApplication: adminProcedure
      .input(z.object({
        userId: z.number(),
        action: z.enum(["approved", "rejected", "suspended"]),
        rejectionReason: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.reviewCompanyApplication(input.userId, input.action, input.rejectionReason);
        return { success: true };
      }),
  }),

  // ─── Reviews (거래 후기) ────────────────────────────────────
  reviews: router({
    create: protectedProcedure
      .input(
        z.object({
          targetUserId: z.number(),
          productId: z.number().optional(),
          chatRoomId: z.number().optional(),
          rating: z.number().min(1).max(5),
          content: z.string().max(500).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.id === input.targetUserId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "자신에게 후기를 남길 수 없습니다." });
        }
        if (!input.chatRoomId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "거래 채팅방을 통해서만 후기를 작성할 수 있습니다." });
        }
        const eligibility = await db.getReviewEligibility(input.chatRoomId, ctx.user.id, input.targetUserId, input.productId);
        if (!eligibility.allowed) {
          throw new TRPCError({ code: "FORBIDDEN", message: eligibility.reason });
        }
        return db.createReview({
          userId: ctx.user.id,
          targetUserId: input.targetUserId,
          productId: input.productId,
          chatRoomId: input.chatRoomId,
          rating: input.rating,
          content: input.content,
        });
      }),

    listBySeller: publicProcedure
      .input(
        z.object({
          targetUserId: z.number(),
          limit: z.number().min(1).max(50).default(20),
          offset: z.number().min(0).default(0),
        })
      )
      .query(({ input }) => {
        return db.getReviewsByTargetUser(input.targetUserId, input.limit, input.offset);
      }),

    ratingSummary: publicProcedure
      .input(z.object({ targetUserId: z.number() }))
      .query(({ input }) => {
        return db.getSellerRatingSummary(input.targetUserId);
      }),

    checkExists: protectedProcedure
      .input(z.object({ chatRoomId: z.number() }))
      .query(({ ctx, input }) => {
        return db.checkReviewExists(ctx.user.id, input.chatRoomId);
      }),

    myReviews: protectedProcedure.query(({ ctx }) => {
      return db.getMyReviews(ctx.user.id);
    }),
  }),

});
export type AppRouter = typeof appRouter;
