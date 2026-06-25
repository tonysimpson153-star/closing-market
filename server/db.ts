import { eq, desc, and, sql } from "drizzle-orm";
import mysql from "mysql2";
import { drizzle } from "drizzle-orm/mysql2";
import { ENV } from "./_core/env";
import {
  users,
  products,
  productImages,
  businesses,
  favorites,
  notifications,
  sellerApplications,
  reviews,
  notices,
  reports,
  InsertProduct,
  InsertUser,
  InsertSellerApplication,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

async function getDb() {
  if (_db) return _db;
  if (!ENV.databaseUrl) return null;
  try {
    const pool = mysql.createPool(ENV.databaseUrl);
    _db = drizzle(pool);
    return _db;
  } catch {
    return null;
  }
}

// ─── Users ───────────────────────────────────────────────────

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return rows[0] ?? null;
}

export async function upsertUser(data: Partial<InsertUser> & { openId: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getUserByOpenId(data.openId);
  if (existing) {
    await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.openId, data.openId));
  } else {
    await db.insert(users).values({ ...data } as InsertUser);
  }
}

// ─── Products ───────────────────────────────────────────────

export async function getProducts(input?: {
  category?: "cafe" | "pcroom" | "restaurant" | "gym" | "office" | "warehouse" | "transfer";
  status?: "selling" | "reserved" | "sold";
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (input?.category) conditions.push(eq(products.category, input.category));
  if (input?.status) conditions.push(eq(products.status, input.status));

  const query = db
    .select()
    .from(products)
    .orderBy(desc(products.createdAt))
    .limit(input?.limit ?? 20)
    .offset(input?.offset ?? 0);

  if (conditions.length > 0) {
    return query.where(and(...conditions));
  }
  return query;
}

export async function getProductDetail(id: number) {
  const db = await getDb();
  if (!db) return null;

  const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!rows[0]) return null;

  const [images, seller] = await Promise.all([
    db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, id))
      .orderBy(productImages.sortOrder),
    db
      .select({ id: users.id, name: users.name, isVerified: users.isVerified })
      .from(users)
      .where(eq(users.id, rows[0].userId))
      .limit(1),
  ]);

  // 조회수 증가
  await db.update(products).set({ viewCount: (rows[0].viewCount ?? 0) + 1 }).where(eq(products.id, id));

  return {
    ...rows[0],
    images,
    sellerName: seller[0]?.name ?? null,
    isSellerVerified: seller[0]?.isVerified ?? false,
  };
}

export async function createProduct(
  data: Omit<InsertProduct, "id" | "createdAt" | "updatedAt">
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(products).values(data);
  return { id: result[0].insertId };
}

export async function updateProductStatus(
  id: number,
  status: "selling" | "reserved" | "sold",
  userId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(products)
    .set({ status })
    .where(and(eq(products.id, id), eq(products.userId, userId)));
  return { success: true };
}

// ─── Businesses ──────────────────────────────────────────────

export async function getBusinesses(input?: {
  type?: "demolition" | "interior" | "waste" | "sign" | "pos" | "cctv" | "cleaning" | "tax" | "labor";
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(businesses.isAdvertised, true)];
  if (input?.type) conditions.push(eq(businesses.type, input.type));

  return db
    .select()
    .from(businesses)
    .where(and(...conditions))
    .orderBy(desc(businesses.createdAt));
}

export async function getBusinessDetail(id: number) {
  const db = await getDb();
  if (!db) return null;

  const rows = await db.select().from(businesses).where(eq(businesses.id, id)).limit(1);
  return rows[0] ?? null;
}

// ─── Favorites ───────────────────────────────────────────────

export async function getFavorites(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(favorites).where(eq(favorites.userId, userId)).orderBy(desc(favorites.createdAt));
}

export async function toggleFavorite(
  userId: number,
  productId?: number,
  businessId?: number
) {
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

// ─── Notifications ───────────────────────────────────────────

export async function getNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
}

export async function markNotificationRead(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  return { success: true };
}

// ─── Chats ───────────────────────────────────────────────────

import { chatRooms, chatMessages, users as usersTable, products as productsTable } from "../drizzle/schema";
import { or, lt, isNull } from "drizzle-orm";

// ─── Seller Applications ─────────────────────────────────────

export async function submitSellerApplication(
  data: Omit<InsertSellerApplication, "id" | "createdAt" | "updatedAt" | "status" | "rejectionReason" | "reviewedAt" | "reviewedBy">
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 기존 심사중 신청이 있으면 중복 방지
  const existing = await db
    .select()
    .from(sellerApplications)
    .where(and(eq(sellerApplications.userId, data.userId), eq(sellerApplications.status, "pending")))
    .limit(1);

  if (existing.length > 0) {
    throw new Error("이미 심사 중인 신청이 있습니다.");
  }

  const result = await db.insert(sellerApplications).values({
    ...data,
    status: "pending",
  });
  return { id: result[0].insertId };
}

export async function getMySellerApplication(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const rows = await db
    .select()
    .from(sellerApplications)
    .where(eq(sellerApplications.userId, userId))
    .orderBy(desc(sellerApplications.createdAt))
    .limit(1);

  return rows[0] ?? null;
}

export async function getAllSellerApplications(input?: { status?: "pending" | "approved" | "rejected" | "suspended" }) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (input?.status) conditions.push(eq(sellerApplications.status, input.status));

  const query = db
    .select()
    .from(sellerApplications)
    .orderBy(desc(sellerApplications.createdAt))
    .limit(100);

  return conditions.length > 0 ? query.where(and(...conditions)) : query;
}

export async function reviewSellerApplication(
  applicationId: number,
  action: "approved" | "rejected" | "suspended",
  reviewerId: number,
  rejectionReason?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const app = await db
    .select()
    .from(sellerApplications)
    .where(eq(sellerApplications.id, applicationId))
    .limit(1);

  if (!app[0]) throw new Error("신청을 찾을 수 없습니다.");

  await db
    .update(sellerApplications)
    .set({
      status: action,
      rejectionReason: rejectionReason ?? null,
      reviewedAt: new Date(),
      reviewedBy: reviewerId,
    })
    .where(eq(sellerApplications.id, applicationId));

  // 승인 시 users 테이블 업데이트
  if (action === "approved") {
    await db
      .update(users)
      .set({ role: "seller", sellerStatus: "approved", isVerified: true })
      .where(eq(users.id, app[0].userId));
  } else if (action === "rejected") {
    await db
      .update(users)
      .set({ sellerStatus: "rejected" })
      .where(eq(users.id, app[0].userId));
  } else if (action === "suspended") {
    await db
      .update(users)
      .set({ sellerStatus: "rejected", isVerified: false })
      .where(eq(users.id, app[0].userId));
  }

  return { success: true };
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getChatList(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const rooms = await db
    .select()
    .from(chatRooms)
    .where(or(eq(chatRooms.buyerId, userId), eq(chatRooms.sellerId, userId)))
    .orderBy(desc(chatRooms.lastMessageAt))
    .limit(50);

  const result = await Promise.all(
    rooms.map(async (room) => {
      const otherUserId = room.buyerId === userId ? room.sellerId : room.buyerId;

      const [otherUser, unreadRows, product] = await Promise.all([
        db.select({ id: usersTable.id, name: usersTable.name, profileImageUrl: usersTable.profileImageUrl })
          .from(usersTable).where(eq(usersTable.id, otherUserId)).limit(1),
        db.select({ id: chatMessages.id })
          .from(chatMessages)
          .where(and(
            eq(chatMessages.roomId, room.id),
            eq(chatMessages.isRead, false),
            eq(chatMessages.senderId, otherUserId)
          )),
        room.productId
          ? db.select({ id: productsTable.id, title: productsTable.title, mainImageUrl: productsTable.mainImageUrl })
              .from(productsTable).where(eq(productsTable.id, room.productId)).limit(1)
          : Promise.resolve([]),
      ]);

      return {
        ...room,
        otherUser: otherUser[0] ?? { id: otherUserId, name: "사용자", profileImageUrl: null },
        unreadCount: unreadRows.length,
        product: (product as any[])[0] ?? null,
      };
    })
  );

  return result;
}

export async function getOrCreateChatRoom(buyerId: number, sellerId: number, productId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 기존 채팅방 확인
  const conditions = [
    eq(chatRooms.buyerId, buyerId),
    eq(chatRooms.sellerId, sellerId),
  ];
  if (productId) conditions.push(eq(chatRooms.productId, productId));

  const existing = await db.select().from(chatRooms).where(and(...conditions)).limit(1);
  if (existing[0]) return existing[0];

  // 새 채팅방 생성
  const result = await db.insert(chatRooms).values({
    buyerId,
    sellerId,
    productId: productId ?? null,
    status: "active",
  });
  const newRoom = await db.select().from(chatRooms).where(eq(chatRooms.id, result[0].insertId)).limit(1);
  return newRoom[0];
}

export async function getChatRoomDetail(roomId: number, userId: number) {
  const db = await getDb();
  if (!db) return null;

  const rooms = await db.select().from(chatRooms).where(eq(chatRooms.id, roomId)).limit(1);
  const room = rooms[0];
  if (!room) return null;

  // 접근 권한 확인
  if (room.buyerId !== userId && room.sellerId !== userId) return null;

  const otherUserId = room.buyerId === userId ? room.sellerId : room.buyerId;
  const [otherUser, product] = await Promise.all([
    db.select({ id: usersTable.id, name: usersTable.name, profileImageUrl: usersTable.profileImageUrl, isVerified: usersTable.isVerified })
      .from(usersTable).where(eq(usersTable.id, otherUserId)).limit(1),
    room.productId
      ? db.select({ id: productsTable.id, title: productsTable.title, mainImageUrl: productsTable.mainImageUrl, price: productsTable.price, status: productsTable.status })
          .from(productsTable).where(eq(productsTable.id, room.productId)).limit(1)
      : Promise.resolve([]),
  ]);

  return {
    ...room,
    otherUser: otherUser[0] ?? { id: otherUserId, name: "사용자", profileImageUrl: null, isVerified: false },
    product: (product as any[])[0] ?? null,
    myRole: room.buyerId === userId ? "buyer" : "seller",
  };
}

export async function getChatMessages(roomId: number, userId: number, limit = 50, beforeId?: number) {
  const db = await getDb();
  if (!db) return [];

  // 접근 권한 확인
  const rooms = await db.select().from(chatRooms).where(eq(chatRooms.id, roomId)).limit(1);
  const room = rooms[0];
  if (!room || (room.buyerId !== userId && room.sellerId !== userId)) return [];

  const conditions: any[] = [eq(chatMessages.roomId, roomId)];
  if (beforeId) conditions.push(lt(chatMessages.id, beforeId));

  const messages = await db
    .select()
    .from(chatMessages)
    .where(and(...conditions))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);

  return messages.reverse();
}

export async function sendChatMessage(roomId: number, senderId: number, content?: string, imageUrl?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 접근 권한 확인
  const rooms = await db.select().from(chatRooms).where(eq(chatRooms.id, roomId)).limit(1);
  const room = rooms[0];
  if (!room || (room.buyerId !== senderId && room.sellerId !== senderId)) {
    throw new Error("채팅방에 접근할 수 없습니다.");
  }

  const result = await db.insert(chatMessages).values({
    roomId,
    senderId,
    content: content ?? null,
    imageUrl: imageUrl ?? null,
    isRead: false,
  });

  // 채팅방 마지막 메시지 업데이트
  await db.update(chatRooms).set({
    lastMessage: content ?? (imageUrl ? "[사진]" : ""),
    lastMessageAt: new Date(),
  }).where(eq(chatRooms.id, roomId));

  const newMsg = await db.select().from(chatMessages).where(eq(chatMessages.id, result[0].insertId)).limit(1);
  return newMsg[0];
}

export async function markMessagesRead(roomId: number, userId: number) {
  const db = await getDb();
  if (!db) return;

  // 내가 받은 메시지(상대방이 보낸 것)를 읽음 처리
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

export async function updateChatRoomStatus(roomId: number, userId: number, status: "completed" | "cancelled") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const rooms = await db.select().from(chatRooms).where(eq(chatRooms.id, roomId)).limit(1);
  const room = rooms[0];
  if (!room || (room.buyerId !== userId && room.sellerId !== userId)) {
    throw new Error("채팅방에 접근할 수 없습니다.");
  }

  await db.update(chatRooms).set({ status }).where(eq(chatRooms.id, roomId));
  return { success: true };
}

// ─── Reviews (후기) ─────────────────────────────────────────

export async function createReview(data: {
  userId: number;
  targetUserId: number;
  productId?: number;
  chatRoomId?: number;
  rating: number;
  content?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 중복 후기 방지: 동일 채팅방에 이미 후기가 있으면 에러
  if (data.chatRoomId) {
    const existing = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.userId, data.userId), eq(reviews.chatRoomId, data.chatRoomId)))
      .limit(1);
    if (existing[0]) throw new Error("이미 후기를 작성했습니다.");
  }

  const result = await db.insert(reviews).values({
    userId: data.userId,
    targetUserId: data.targetUserId,
    productId: data.productId ?? null,
    chatRoomId: data.chatRoomId ?? null,
    rating: data.rating,
    content: data.content ?? null,
  });

  const newReview = await db.select().from(reviews).where(eq(reviews.id, result[0].insertId)).limit(1);
  return newReview[0];
}

export async function getReviewsByTargetUser(targetUserId: number, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      content: reviews.content,
      createdAt: reviews.createdAt,
      productId: reviews.productId,
      reviewerName: users.name,
      reviewerProfileUrl: users.profileImageUrl,
    })
    .from(reviews)
    .leftJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.targetUserId, targetUserId))
    .orderBy(desc(reviews.createdAt))
    .limit(limit)
    .offset(offset);

  return rows;
}

export async function getSellerRatingSummary(targetUserId: number) {
  const db = await getDb();
  if (!db) return { averageRating: 0, totalCount: 0 };

  const rows = await db
    .select({ rating: reviews.rating })
    .from(reviews)
    .where(eq(reviews.targetUserId, targetUserId));

  if (rows.length === 0) return { averageRating: 0, totalCount: 0 };

  const total = rows.reduce((sum, r) => sum + r.rating, 0);
  return {
    averageRating: Math.round((total / rows.length) * 10) / 10,
    totalCount: rows.length,
  };
}

export async function checkReviewExists(userId: number, chatRoomId: number) {
  const db = await getDb();
  if (!db) return false;
  const existing = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(and(eq(reviews.userId, userId), eq(reviews.chatRoomId, chatRoomId)))
    .limit(1);
  return existing.length > 0;
}

export async function getMyReviews(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      content: reviews.content,
      createdAt: reviews.createdAt,
      targetName: users.name,
      targetProfileUrl: users.profileImageUrl,
    })
    .from(reviews)
    .leftJoin(users, eq(reviews.targetUserId, users.id))
    .where(eq(reviews.userId, userId))
    .orderBy(desc(reviews.createdAt))
    .limit(50);
}

// ─── Admin Functions ──────────────────────────────────────────

export async function getAdminStats() {
  const db = await getDb();
  if (!db) return { totalUsers: 0, totalProducts: 0, totalReports: 0, pendingReports: 0, pendingSellers: 0 };

  const [userCount, productCount, reportCount, pendingReportCount, pendingSellerCount] = await Promise.all([
    db.select({ count: sql`COUNT(*)` }).from(users),
    db.select({ count: sql`COUNT(*)` }).from(products),
    db.select({ count: sql`COUNT(*)` }).from(reports),
    db.select({ count: sql`COUNT(*)` }).from(reports).where(eq(reports.status, "pending")),
    db.select({ count: sql`COUNT(*)` }).from(sellerApplications).where(eq(sellerApplications.status, "pending")),
  ]);

  return {
    totalUsers: Number((userCount[0] as any)?.count ?? 0),
    totalProducts: Number((productCount[0] as any)?.count ?? 0),
    totalReports: Number((reportCount[0] as any)?.count ?? 0),
    pendingReports: Number((pendingReportCount[0] as any)?.count ?? 0),
    pendingSellers: Number((pendingSellerCount[0] as any)?.count ?? 0),
  };
}

export async function getAdminProducts(input?: { limit?: number; offset?: number; status?: string }) {
  const db = await getDb();
  if (!db) return [];

  const conditions: any[] = [];
  if (input?.status) conditions.push(eq(products.status, input.status as any));

  const query = db
    .select({
      id: products.id,
      title: products.title,
      price: products.price,
      category: products.category,
      status: products.status,
      viewCount: products.viewCount,
      createdAt: products.createdAt,
      sellerName: users.name,
      sellerId: users.id,
    })
    .from(products)
    .leftJoin(users, eq(products.userId, users.id))
    .orderBy(desc(products.createdAt))
    .limit(input?.limit ?? 30)
    .offset(input?.offset ?? 0);

  if (conditions.length > 0) {
    return query.where(and(...conditions));
  }
  return query;
}

export async function adminDeleteProduct(productId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(products).where(eq(products.id, productId));
  return { success: true };
}

export async function getAdminReports(input?: { limit?: number; offset?: number; status?: string }) {
  const db = await getDb();
  if (!db) return [];

  const conditions: any[] = [];
  if (input?.status) conditions.push(eq(reports.status, input.status as any));

  const query = db
    .select({
      id: reports.id,
      targetType: reports.targetType,
      targetId: reports.targetId,
      reason: reports.reason,
      status: reports.status,
      createdAt: reports.createdAt,
      reporterName: users.name,
    })
    .from(reports)
    .leftJoin(users, eq(reports.reporterId, users.id))
    .orderBy(desc(reports.createdAt))
    .limit(input?.limit ?? 30)
    .offset(input?.offset ?? 0);

  if (conditions.length > 0) {
    return query.where(and(...conditions));
  }
  return query;
}

export async function updateReportStatus(reportId: number, status: "resolved" | "dismissed") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(reports).set({ status }).where(eq(reports.id, reportId));
  return { success: true };
}

export async function getAdminUsers(input?: { limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isVerified: users.isVerified,
      sellerStatus: users.sellerStatus,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(input?.limit ?? 50)
    .offset(input?.offset ?? 0);
}

export async function getNotices(input?: { limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      id: notices.id,
      title: notices.title,
      content: notices.content,
      isPinned: notices.isPinned,
      viewCount: notices.viewCount,
      createdAt: notices.createdAt,
      authorName: users.name,
    })
    .from(notices)
    .leftJoin(users, eq(notices.authorId, users.id))
    .orderBy(desc(notices.isPinned), desc(notices.createdAt))
    .limit(input?.limit ?? 20)
    .offset(input?.offset ?? 0);
}

export async function createNotice(data: { authorId: number; title: string; content: string; isPinned?: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(notices).values({
    authorId: data.authorId,
    title: data.title,
    content: data.content,
    isPinned: data.isPinned ?? false,
  });
  return { id: result[0].insertId };
}

export async function deleteNotice(noticeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(notices).where(eq(notices.id, noticeId));
  return { success: true };
}

// ─── 자체 인증 함수 ───

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return rows[0] ?? null;
}

export async function getUserByKakaoId(kakaoId: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(users).where(eq(users.kakaoId, kakaoId)).limit(1);
  return rows[0] ?? null;
}

export async function createUserByEmail(data: {
  openId: string;
  email: string | null;
  password: string | null;
  name: string;
  phone?: string | null;
  loginMethod: string;
  kakaoId?: string | null;
  profileImageUrl?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(users).values({
    openId: data.openId,
    email: data.email ?? undefined,
    password: data.password ?? undefined,
    name: data.name,
    phone: data.phone ?? undefined,
    loginMethod: data.loginMethod,
    kakaoId: data.kakaoId ?? undefined,
    profileImageUrl: data.profileImageUrl ?? undefined,
    role: "user",
    isVerified: false,
    lastSignedIn: new Date(),
  });
  const newUser = await getUserById(result[0].insertId);
  if (!newUser) throw new Error("Failed to create user");
  return newUser;
}


export async function updateUserSellerInfo(userId: number, data: {
  sellerStatus: "pending" | "approved" | "rejected" | "suspended";
  sellerType: "closing_soon" | "closed" | "relocating" | "inventory" | "transfer";
  businessNumber: string;
  businessName: string;
  representativeName: string;
  businessCertUrl: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({
    sellerStatus: data.sellerStatus,
    sellerType: data.sellerType,
    businessNumber: data.businessNumber,
    businessName: data.businessName,
    representativeName: data.representativeName,
    businessCertUrl: data.businessCertUrl ?? undefined,
    updatedAt: new Date(),
  }).where(eq(users.id, userId));
}

export async function updateUserCompanyInfo(userId: number, data: {
  companyStatus: "pending" | "approved" | "rejected" | "suspended";
  companyType: "demolition" | "interior" | "waste" | "signage" | "pos" | "cleaning" | "tax" | "labor";
  companyName: string;
  companyPhone: string;
  companyAddress: string;
  companyDesc: string | null;
  businessNumber: string | null;
  companyLogoUrl: string | null;
  representativeName: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({
    companyStatus: data.companyStatus,
    companyType: data.companyType,
    companyName: data.companyName,
    companyPhone: data.companyPhone,
    companyAddress: data.companyAddress,
    companyDesc: data.companyDesc ?? undefined,
    businessNumber: data.businessNumber ?? undefined,
    companyLogoUrl: data.companyLogoUrl ?? undefined,
    representativeName: data.representativeName,
    updatedAt: new Date(),
  }).where(eq(users.id, userId));
}

export async function getCompanyApplications(input?: { status?: "pending" | "approved" | "rejected" | "suspended" }) {
  const db = await getDb();
  if (!db) return [];
  let query = db.select({
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
    createdAt: users.createdAt,
  }).from(users).$dynamic();
  if (input?.status) {
    query = query.where(eq(users.companyStatus, input.status));
  } else {
    // 업체회원 신청자만 (companyStatus가 null이 아닌 경우)
    const { isNotNull } = await import("drizzle-orm");
    query = query.where(isNotNull(users.companyType));
  }
  return query.orderBy(desc(users.createdAt)).limit(100);
}

export async function reviewCompanyApplication(userId: number, action: "approved" | "rejected" | "suspended", rejectionReason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (action === "approved") {
    await db.update(users).set({
      role: "company",
      companyStatus: "approved",
      isVerified: true,
      updatedAt: new Date(),
    }).where(eq(users.id, userId));
  } else if (action === "rejected") {
    await db.update(users).set({
      companyStatus: "rejected",
      updatedAt: new Date(),
    }).where(eq(users.id, userId));
  } else if (action === "suspended") {
    await db.update(users).set({
      companyStatus: "suspended",
      isVerified: false,
      updatedAt: new Date(),
    }).where(eq(users.id, userId));
  }
  return { success: true };
}
export async function updateUserProfile(userId: number, data: { name?: string; phone?: string; profileImageUrl?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, userId));
  return getUserById(userId);
}

export async function updateUserPassword(userId: number, hashedPassword: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ password: hashedPassword, updatedAt: new Date() }).where(eq(users.id, userId));
}

export async function updateNotificationSettings(userId: number, data: {
  notifChat?: boolean;
  notifPriceDrop?: boolean;
  notifTrade?: boolean;
  notifMarketing?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, boolean | Date> = { updatedAt: new Date() };
  if (data.notifChat !== undefined) updateData.notifChat = data.notifChat;
  if (data.notifPriceDrop !== undefined) updateData.notifPriceDrop = data.notifPriceDrop;
  if (data.notifTrade !== undefined) updateData.notifTrade = data.notifTrade;
  if (data.notifMarketing !== undefined) updateData.notifMarketing = data.notifMarketing;
  await db.update(users).set(updateData as any).where(eq(users.id, userId));
}
