import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
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

    // 상품 등록 (인증 필요)
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
      .mutation(({ ctx, input }) => {
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

  chats: router({
    // 채팅 목록 (인증 필요)
    list: protectedProcedure.query(({ ctx }) => {
      return db.getChatList(ctx.user.id);
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
});

export type AppRouter = typeof appRouter;
