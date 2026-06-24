import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, publicProcedure, adminProcedure } from "./_core/trpc";
import * as db from "./db";

export const appRouter = router({
  // Public routes
  health: publicProcedure.query(() => ({ status: "ok" })),

  products: router({
    // 최신 상품 목록 (공개)
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

    // 상품 상세 (공개)
    detail: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => {
        return db.getProductDetail(input.id);
      }),

    // 상품 등록 (인증된 판매자만 가능)
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
        })
      )
      .mutation(async ({ ctx, input }) => {
        // 판매자 인증 여부 확인
        const user = await db.getUserById(ctx.user.id);
        if (!user || !user.isVerified || user.sellerStatus !== "approved") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "인증된 판매자만 상품을 등록할 수 있습니다.",
          });
        }
        return db.createProduct({ ...input, userId: ctx.user.id });
      }),

    // 상품 상태 변경 (인증 필요)
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
  }),

  businesses: router({
    // 추천 업체 목록 (공개)
    list: publicProcedure
      .input(
        z.object({
          type: z.enum(["demolition", "interior", "waste", "sign", "pos", "cctv", "cleaning", "tax", "labor"]).optional(),
        }).optional()
      )
      .query(({ input }) => {
        return db.getBusinesses(input);
      }),

    // 업체 상세 (공개)
    detail: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => {
        return db.getBusinessDetail(input.id);
      }),
  }),

  favorites: router({
    // 찜 목록 (인증 필요)
    list: protectedProcedure.query(({ ctx }) => {
      return db.getFavorites(ctx.user.id);
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

  // 채팅 이미지 업로드
  upload: router({
    chatImage: protectedProcedure
      .input(z.object({
        base64: z.string(),
        mimeType: z.string().default("image/jpeg"),
        fileName: z.string().default("photo.jpg"),
      }))
      .mutation(async ({ input }) => {
        const { storagePut } = await import("./storage");
        const buffer = Buffer.from(input.base64, "base64");
        const ext = input.mimeType.split("/")[1] ?? "jpg";
        const result = await storagePut(`chat/images/${input.fileName.replace(/\.[^.]+$/, "")}.${ext}`, buffer, input.mimeType);
        return { url: result.url };
      }),
  }),

  chats: router({
    // 채팅 목록 (인증 필요)
    list: protectedProcedure.query(({ ctx }) => {
      return db.getChatList(ctx.user.id);
    }),

    // 채팅방 생성 또는 기존 채팅방 조회
    getOrCreate: protectedProcedure
      .input(z.object({
        sellerId: z.number(),
        productId: z.number().optional(),
      }))
      .mutation(({ ctx, input }) => {
        return db.getOrCreateChatRoom(ctx.user.id, input.sellerId, input.productId);
      }),

    // 채팅방 상세 (메시지 포함)
    room: protectedProcedure
      .input(z.object({ roomId: z.number() }))
      .query(({ ctx, input }) => {
        return db.getChatRoomDetail(input.roomId, ctx.user.id);
      }),

    // 메시지 목록 조회
    messages: protectedProcedure
      .input(z.object({
        roomId: z.number(),
        limit: z.number().min(1).max(100).default(50),
        beforeId: z.number().optional(),
      }))
      .query(({ ctx, input }) => {
        return db.getChatMessages(input.roomId, ctx.user.id, input.limit, input.beforeId);
      }),

    // 메시지 전송
    send: protectedProcedure
      .input(z.object({
        roomId: z.number(),
        content: z.string().optional(),
        imageUrl: z.string().optional(),
      }))
      .mutation(({ ctx, input }) => {
        if (!input.content && !input.imageUrl) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "내용 또는 이미지가 필요합니다." });
        }
        return db.sendChatMessage(input.roomId, ctx.user.id, input.content, input.imageUrl);
      }),

    // 읽음 처리
    markRead: protectedProcedure
      .input(z.object({ roomId: z.number() }))
      .mutation(({ ctx, input }) => {
        return db.markMessagesRead(input.roomId, ctx.user.id);
      }),

    // 거래 완료 / 취소
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
    // 알림 목록 (인증 필요)
    list: protectedProcedure.query(({ ctx }) => {
      return db.getNotifications(ctx.user.id);
    }),

    // 알림 읽음 처리
    markRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => {
        return db.markNotificationRead(input.id, ctx.user.id);
      }),
  }),

  // ─── 판매자 인증 ─────────────────────────────────────────────
  seller: router({
    // 내 판매자 신청 상태 조회
    myApplication: protectedProcedure.query(({ ctx }) => {
      return db.getMySellerApplication(ctx.user.id);
    }),

    // 내 계정 상세 정보 조회 (판매자 상태 포함)
    myProfile: protectedProcedure.query(({ ctx }) => {
      return db.getUserById(ctx.user.id);
    }),

    // 판매자 신청 제출
    submit: protectedProcedure
      .input(
        z.object({
          sellerType: z.enum(["closing_soon", "closed", "relocating", "inventory", "transfer"]),
          businessNumber: z.string().min(10).max(20),
          businessName: z.string().min(1).max(255),
          representativeName: z.string().min(1).max(100),
          businessCertUrl: z.string().url(),
          businessPhotoUrl: z.string().url().optional(),
        })
      )
      .mutation(({ ctx, input }) => {
        return db.submitSellerApplication({
          userId: ctx.user.id,
          ...input,
          businessPhotoUrl: input.businessPhotoUrl ?? null,
        });
      }),
  }),

  // ─── 관리자 전용 ─────────────────────────────────────────────
  admin: router({
    // 판매자 신청 목록 조회
    sellerApplications: adminProcedure
      .input(
        z.object({
          status: z.enum(["pending", "approved", "rejected", "suspended"]).optional(),
        }).optional()
      )
      .query(({ input }) => {
        return db.getAllSellerApplications(input);
      }),

    // 판매자 신청 승인/반려/정지
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

    // 통계
    stats: adminProcedure.query(() => {
      return db.getAdminStats();
    }),

    // 전체 상품 목록
    allProducts: adminProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(30),
        offset: z.number().min(0).default(0),
        status: z.string().optional(),
      }).optional())
      .query(({ input }) => {
        return db.getAdminProducts(input);
      }),

    // 상품 삭제
    deleteProduct: adminProcedure
      .input(z.object({ productId: z.number() }))
      .mutation(({ input }) => {
        return db.adminDeleteProduct(input.productId);
      }),

    // 신고 목록
    allReports: adminProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(30),
        offset: z.number().min(0).default(0),
        status: z.string().optional(),
      }).optional())
      .query(({ input }) => {
        return db.getAdminReports(input);
      }),

    // 신고 처리
    resolveReport: adminProcedure
      .input(z.object({
        reportId: z.number(),
        status: z.enum(["resolved", "dismissed"]),
      }))
      .mutation(({ input }) => {
        return db.updateReportStatus(input.reportId, input.status);
      }),

    // 회원 목록
    allUsers: adminProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional())
      .query(({ input }) => {
        return db.getAdminUsers(input);
      }),

    // 공지사항 목록 (공개)
    notices: publicProcedure
      .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }).optional())
      .query(({ input }) => {
        return db.getNotices(input);
      }),

    // 공지사항 작성
    createNotice: adminProcedure
      .input(z.object({
        title: z.string().min(1).max(255),
        content: z.string().min(1),
        isPinned: z.boolean().default(false),
      }))
      .mutation(({ ctx, input }) => {
        return db.createNotice({ authorId: ctx.user.id, ...input });
      }),

    // 공지사항 삭제
    deleteNotice: adminProcedure
      .input(z.object({ noticeId: z.number() }))
      .mutation(({ input }) => {
        return db.deleteNotice(input.noticeId);
      }),
  }),

  // ─── Reviews (거래 후기) ────────────────────────────────────
  reviews: router({
    // 후기 작성 (구매자만 가능)
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
        return db.createReview({
          userId: ctx.user.id,
          targetUserId: input.targetUserId,
          productId: input.productId,
          chatRoomId: input.chatRoomId,
          rating: input.rating,
          content: input.content,
        });
      }),

    // 특정 판매자의 후기 목록 (공개)
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

    // 판매자 평균 별점 요약 (공개)
    ratingSummary: publicProcedure
      .input(z.object({ targetUserId: z.number() }))
      .query(({ input }) => {
        return db.getSellerRatingSummary(input.targetUserId);
      }),

    // 후기 작성 여부 확인 (채팅방 기준)
    checkExists: protectedProcedure
      .input(z.object({ chatRoomId: z.number() }))
      .query(({ ctx, input }) => {
        return db.checkReviewExists(ctx.user.id, input.chatRoomId);
      }),

    // 내가 작성한 후기 목록
    myReviews: protectedProcedure.query(({ ctx }) => {
      return db.getMyReviews(ctx.user.id);
    }),
  }),

});
export type AppRouter = typeof appRouter;
