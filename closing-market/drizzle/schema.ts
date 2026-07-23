import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
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
  suspendedReason: text("suspendedReason"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Products (상품) table
 */
export const products = mysqlTable("products", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Product images (상품 이미지) table
 */
export const productImages = mysqlTable("product_images", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  imageUrl: text("imageUrl").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProductImage = typeof productImages.$inferSelect;

/**
 * Company gallery images (업체 소개 사진 여러 장) table
 */
export const companyImages = mysqlTable("company_images", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  imageUrl: text("imageUrl").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CompanyImage = typeof companyImages.$inferSelect;

/**
 * Business transfer (사업양도) table
 */
export const businessTransfers = mysqlTable("business_transfers", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  keyMoney: int("keyMoney"),
  deposit: int("deposit"),
  monthlyRent: int("monthlyRent"),
  businessType: varchar("businessType", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BusinessTransfer = typeof businessTransfers.$inferSelect;

/**
 * Partner businesses (추천 업체) table
 */
export const businesses = mysqlTable("businesses", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Business = typeof businesses.$inferSelect;
export type InsertBusiness = typeof businesses.$inferInsert;

/**
 * Favorites (찜) table
 */
export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId"),
  businessId: int("businessId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Favorite = typeof favorites.$inferSelect;

/**
 * Recent product views (최근 본 상품) table
 */
export const recentViews = mysqlTable("recent_views", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  viewedAt: timestamp("viewedAt").defaultNow().notNull(),
});

export type RecentView = typeof recentViews.$inferSelect;

/**
 * Reviews (후기) table
 */
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),          // 작성자 (구매자)
  targetUserId: int("targetUserId").notNull(), // 대상 (판매자)
  productId: int("productId"),
  chatRoomId: int("chatRoomId"),             // 연결된 채팅방
  rating: int("rating").notNull(),           // 1~5 별점
  content: text("content"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;

/**
 * Comments (댓글) table
 */
export const comments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  parentId: int("parentId"),
  content: text("content").notNull(),
  likeCount: int("likeCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Comment = typeof comments.$inferSelect;

/**
 * Chat rooms (채팅방) table
 */
export const chatRooms = mysqlTable("chat_rooms", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId"),
  buyerId: int("buyerId").notNull(),
  sellerId: int("sellerId").notNull(),
  lastMessage: text("lastMessage"),
  lastMessageAt: timestamp("lastMessageAt"),
  status: mysqlEnum("status", ["active", "completed", "cancelled"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatRoom = typeof chatRooms.$inferSelect;

/**
 * Chat messages (채팅 메시지) table
 */
export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull(),
  senderId: int("senderId").notNull(),
  content: text("content"),
  imageUrl: text("imageUrl"),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;

/**
 * Notifications (알림) table
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["chat", "favorite", "comment", "sold", "price_change", "business_reply", "notice"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body"),
  referenceId: int("referenceId"),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;

/**
 * Reports (신고) table
 */
export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  reporterId: int("reporterId").notNull(),
  targetType: mysqlEnum("targetType", ["product", "user", "comment", "chat"]).notNull(),
  targetId: int("targetId").notNull(),
  reason: text("reason").notNull(),
  status: mysqlEnum("status", ["pending", "resolved", "dismissed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Report = typeof reports.$inferSelect;

/**
 * Seller applications (판매자 인증 신청) table
 */
export const sellerApplications = mysqlTable("seller_applications", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SellerApplication = typeof sellerApplications.$inferSelect;
export type InsertSellerApplication = typeof sellerApplications.$inferInsert;

/**
 * Notices (공지사항) table
 */
export const notices = mysqlTable("notices", {
  id: int("id").autoincrement().primaryKey(),
  authorId: int("authorId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  isPinned: boolean("isPinned").default(false).notNull(),
  viewCount: int("viewCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Notice = typeof notices.$inferSelect;
export type InsertNotice = typeof notices.$inferInsert;

/**
 * 1:1 고객센터 문의 (Inquiries) table
 */
export const inquiries = mysqlTable("inquiries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  category: mysqlEnum("category", ["account", "product", "payment", "report", "seller", "company", "etc"]).default("etc").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  status: mysqlEnum("status", ["pending", "answered"]).default("pending").notNull(),
  answerContent: text("answerContent"),
  answeredBy: int("answeredBy"),
  answeredAt: timestamp("answeredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Inquiry = typeof inquiries.$inferSelect;

/**
 * 비밀번호 재설정 토큰 (이메일 로그인 사용자 전용)
 */
export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertInquiry = typeof inquiries.$inferInsert;
