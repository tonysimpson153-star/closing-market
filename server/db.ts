import { eq, desc, and } from "drizzle-orm";
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
  InsertProduct,
  InsertUser,
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

  const images = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, id))
    .orderBy(productImages.sortOrder);

  return { ...rows[0], images };
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

import { chatRooms, users as usersTable } from "../drizzle/schema";
import { or, sql } from "drizzle-orm";

export async function getChatList(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const rooms = await db
    .select()
    .from(chatRooms)
    .where(or(eq(chatRooms.buyerId, userId), eq(chatRooms.sellerId, userId)))
    .orderBy(desc(chatRooms.lastMessageAt))
    .limit(50);

  // 상대방 이름 조회
  const result = await Promise.all(
    rooms.map(async (room) => {
      const otherUserId = room.buyerId === userId ? room.sellerId : room.buyerId;
      const otherUser = await db
        .select({ name: usersTable.name })
        .from(usersTable)
        .where(eq(usersTable.id, otherUserId))
        .limit(1);

      // 읽지 않은 메시지 수 (간단히 0으로 처리)
      return {
        ...room,
        otherUserName: otherUser[0]?.name ?? "사용자",
        unreadCount: 0,
      };
    })
  );

  return result;
}
