import { eq, desc, and, sql, notInArray } from "drizzle-orm";
import mysql from "mysql2";
import { drizzle } from "drizzle-orm/mysql2";
import { ENV } from "./_core/env";
import {
  users,
  products,
  productImages,
  companyImages,
  businesses,
  favorites,
  notifications,
  sellerApplications,
  reviews,
  notices,
  inquiries,
  passwordResetTokens,
  reports,
  userBlocks,
  InsertProduct,
  InsertUser,
  InsertSellerApplication,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;
let _userBlocksReady: Promise<void> | null = null;

async function getDb() {
  if (_db) return _db;
  if (!ENV.databaseUrl) return null;
  try {
    // TiDB Cloud 등 매니지드 MySQL은 TLS 접속이 필수입니다.
    // DB_SSL=true 환경변수를 설정하면 TLS를 활성화합니다.
    const pool = ENV.dbSsl
      ? mysql.createPool({
          uri: ENV.databaseUrl,
          ssl: { minVersion: "TLSv1.2" },
        })
      : mysql.createPool(ENV.databaseUrl);
    _db = drizzle(pool);
    return _db;
  } catch {
    return null;
  }
}

/**
 * Render 운영 서비스가 기존 TiDB에 연결된 경우에도 사용자 차단 관계 테이블을
 * 비파괴적으로 보장합니다. 기존 사용자·상품·채팅 테이블은 변경하지 않습니다.
 */
async function ensureUserBlocksTable(db: NonNullable<typeof _db>) {
  if (!_userBlocksReady) {
    _userBlocksReady = db
      .execute(sql`
        CREATE TABLE IF NOT EXISTS user_blocks (
          id INT AUTO_INCREMENT NOT NULL,
          blockerId INT NOT NULL,
          blockedId INT NOT NULL,
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY user_blocks_blocker_blocked_unique (blockerId, blockedId)
        )
      `)
      .then(() => undefined)
      .catch((error) => {
        _userBlocksReady = null;
        throw error;
      });
  }
  await _userBlocksReady;
}

/**
 * Render 운영 환경에서만 실행하는 홍보·시연용 카탈로그 동기화입니다.
 * 명확한 테스트 레코드만 다루며 기존 사용자가 등록한 데이터는 변경하지 않습니다.
 */
export async function syncRenderDemoCatalog() {
  if (!process.env.RENDER) return;

  const db = await getDb();
  if (!db) return;

  const productsToRefresh = [
    {
      id: 90001,
      title: "카페 정리 | 900 냉장 쇼케이스 2단",
      description: "매장 정리로 내놓습니다. 음료·디저트 진열용으로 사용했고 냉각과 조명 모두 정상 작동합니다. 외관에 생활 스크래치가 조금 있어 사진 확인 부탁드립니다. 용호동 1층 매장에서 직접 가져가실 분 우선입니다.",
      price: 780000,
      quantity: 1,
      category: "warehouse" as const,
      tradeType: "direct" as const,
      status: "selling" as const,
      location: "부산 남구 용호동",
      mainImageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663789757905/hyAemnZPsRXMIUyc.jpg",
      viewCount: 127,
      favoriteCount: 14,
      isPremium: true,
      createdAt: new Date("2026-07-29T03:12:00+09:00"),
    },
    {
      id: 60001,
      title: "업소용 2도어 냉장고 900L | 식당 정리",
      description: "분식집 이전 준비로 판매합니다. 2023년 구매 후 약 2년 사용했고 냉장·온도조절 이상 없습니다. 상판에 사용감은 있지만 내부 선반과 도어 패킹은 깨끗하게 관리했습니다. 운반은 구매자 부담이며 일정 맞으면 상차 도와드립니다.",
      price: 630000,
      quantity: 1,
      category: "restaurant" as const,
      tradeType: "negotiable" as const,
      status: "selling" as const,
      location: "부산 남구 대연동",
      mainImageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663789757905/XNWtadHbzmmZExqY.jpg",
      viewCount: 86,
      favoriteCount: 9,
      isPremium: false,
      createdAt: new Date("2026-08-03T10:25:00+09:00"),
    },
    {
      id: 30001,
      title: "PC방 정리 | RTX 3060 게이밍PC 8대 일괄",
      description: "좌석 교체로 나온 동일 사양 게이밍PC 8대입니다. RTX 3060, 16GB 메모리, NVMe SSD 구성이고 정상 부팅과 게임 실행을 확인했습니다. 개별 판매보다 일괄 구매 우선이며 직접 방문 확인 가능합니다.",
      price: 5200000,
      quantity: 8,
      category: "pcroom" as const,
      tradeType: "negotiable" as const,
      status: "reserved" as const,
      location: "부산 해운대구 우동",
      mainImageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663789757905/vsSpKOgCnZXdwfWw.jpg",
      viewCount: 243,
      favoriteCount: 31,
      isPremium: true,
      createdAt: new Date("2026-07-18T14:40:00+09:00"),
    },
  ];

  for (const product of productsToRefresh) {
    await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, product.id));
  }

  const companiesToRefresh = [
    {
      id: 180001,
      companyName: "온결 상업공간 인테리어",
      companyType: "interior" as const,
      companyDesc: "카페·식당·소형 매장의 부분 리뉴얼부터 전체 인테리어까지 진행합니다. 현장 실측 후 공정표와 견적을 투명하게 안내드립니다.",
      companyPhone: "010-3184-6246",
      companyAddress: "서울 마포구·서대문구 중심 방문 상담",
      companyLogoUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663789757905/bZDKODUGOuFdxRpZ.jpg",
    },
    {
      id: 150001,
      companyName: "맑은정리 자원순환",
      companyType: "waste" as const,
      companyDesc: "폐업 매장 집기, 재활용 가능 자원, 일반 폐기물까지 현장 상황에 맞춰 분리 수거합니다. 사진 상담 후 방문 일정과 견적을 안내드립니다.",
      companyPhone: "010-2323-5656",
      companyAddress: "서울 강남구·송파구·서초구",
      companyLogoUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663789757905/zVOJvLmUuewkkhsA.jpg",
    },
    {
      id: 120001,
      companyName: "새길 매장철거",
      companyType: "demolition" as const,
      companyDesc: "소형 매장 원상복구와 내부 철거를 전문으로 합니다. 공정 전 현장 확인 후 소음·폐기물 처리 일정을 함께 안내드립니다.",
      companyPhone: "010-1234-1234",
      companyAddress: "서울 강남구·성동구·광진구",
      companyLogoUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663789757905/gaElEzeIGKVaMPSK.jpg",
    },
    {
      id: 1,
      companyName: "리셋 POS 솔루션",
      companyType: "pos" as const,
      companyDesc: "카페·식당·소매점 POS와 키오스크 설치, 메뉴 세팅, 오픈 후 기본 사용 교육을 제공합니다. 업종과 매장 규모에 맞춰 구성합니다.",
      companyPhone: "010-5858-5858",
      companyAddress: "부산 전 지역 방문 설치",
      companyLogoUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663789757905/nsIviWLSJKlCerVB.jpg",
    },
  ];

  for (const company of companiesToRefresh) {
    await db
      .update(users)
      .set({
        companyName: company.companyName,
        companyType: company.companyType,
        companyDesc: company.companyDesc,
        companyPhone: company.companyPhone,
        companyAddress: company.companyAddress,
        companyLogoUrl: company.companyLogoUrl,
        companyStatus: "approved",
        isVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, company.id));
  }

  const demoSellers = [
    {
      openId: "demo_catalog_cafe_seller_20260816",
      name: "마감카페 정리",
      nickname: "카페정리중",
      role: "seller" as const,
      sellerStatus: "approved" as const,
      sellerType: "closed" as const,
      businessName: "모닝브릿지 카페",
      representativeName: "김서윤",
      isVerified: true,
    },
    {
      openId: "demo_catalog_gym_seller_20260816",
      name: "동네짐 정리",
      nickname: "운동기구정리",
      role: "seller" as const,
      sellerStatus: "approved" as const,
      sellerType: "relocating" as const,
      businessName: "밸런스짐",
      representativeName: "박도현",
      isVerified: true,
    },
  ];

  const sellerIds = new Map<string, number>();
  for (const seller of demoSellers) {
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.openId, seller.openId)).limit(1);
    if (existing[0]) {
      sellerIds.set(seller.openId, existing[0].id);
      await db.update(users).set({ ...seller, updatedAt: new Date() }).where(eq(users.id, existing[0].id));
      continue;
    }
    await db.insert(users).values(seller);
    const created = await db.select({ id: users.id }).from(users).where(eq(users.openId, seller.openId)).limit(1);
    if (created[0]) sellerIds.set(seller.openId, created[0].id);
  }

  const additionalProducts = [
    {
      sellerOpenId: "demo_catalog_cafe_seller_20260816",
      title: "2그룹 에스프레소 머신 + 그라인더 세트",
      description: "매장 리브랜딩으로 장비 교체 예정이라 판매합니다. 에스프레소 머신과 그라인더를 함께 드리며 최근까지 매일 사용했습니다. 정기 점검을 받아 추출과 스팀 모두 정상입니다. 방문 시 작동 확인 가능합니다.",
      price: 2850000,
      quantity: 1,
      category: "cafe" as const,
      tradeType: "negotiable" as const,
      status: "selling" as const,
      location: "부산 수영구 광안동",
      mainImageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663789757905/bDCTnWpsHTnkVShn.jpg",
      viewCount: 318,
      favoriteCount: 42,
      isPremium: true,
      createdAt: new Date("2026-08-10T11:20:00+09:00"),
    },
    {
      sellerOpenId: "demo_catalog_cafe_seller_20260816",
      title: "카페 원목 2인 테이블·의자 8세트",
      description: "원목 상판 테이블과 의자 2개 구성 8세트입니다. 카페에서 약 1년 반 사용했고 흔들림 없이 튼튼합니다. 일부 상판에 생활 자국이 있어 일괄 가격으로 내놓습니다.",
      price: 480000,
      quantity: 8,
      category: "cafe" as const,
      tradeType: "direct" as const,
      status: "selling" as const,
      location: "부산 수영구 광안동",
      mainImageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663789757905/bZDKODUGOuFdxRpZ.jpg",
      viewCount: 74,
      favoriteCount: 7,
      isPremium: false,
      createdAt: new Date("2026-08-06T16:15:00+09:00"),
    },
    {
      sellerOpenId: "demo_catalog_gym_seller_20260816",
      title: "상업용 트레드밀 3대 일괄 | 이전 정리",
      description: "센터 이전으로 정리하는 상업용 트레드밀 3대입니다. 속도·경사·안전정지 모두 정상 작동하며 지난달 벨트 점검을 마쳤습니다. 엘리베이터 있는 2층이며 운반은 협의 가능합니다.",
      price: 1650000,
      quantity: 3,
      category: "gym" as const,
      tradeType: "negotiable" as const,
      status: "selling" as const,
      location: "부산 동래구 온천동",
      viewCount: 156,
      favoriteCount: 18,
      isPremium: false,
      createdAt: new Date("2026-08-12T09:35:00+09:00"),
    },
    {
      sellerOpenId: "demo_catalog_cafe_seller_20260816",
      title: "아연도금 파렛트랙 선반 4단 3세트",
      description: "창고 정리로 내놓는 아연도금 선반입니다. 조립식이라 분해 후 이동 가능하고 매장 재고 보관용으로 사용했습니다. 녹이나 휨 없이 상태 양호하며 한 세트씩도 협의 가능합니다.",
      price: 390000,
      quantity: 3,
      category: "warehouse" as const,
      tradeType: "direct" as const,
      status: "selling" as const,
      location: "부산 남구 문현동",
      mainImageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663789757905/drJrAEBoiushLgCt.jpg",
      viewCount: 61,
      favoriteCount: 5,
      isPremium: false,
      createdAt: new Date("2026-07-31T13:10:00+09:00"),
    },
  ];

  for (const { sellerOpenId, ...product } of additionalProducts) {
    const sellerId = sellerIds.get(sellerOpenId);
    if (!sellerId) continue;
    const existing = await db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.userId, sellerId), eq(products.title, product.title)))
      .limit(1);
    if (existing[0]) {
      await db.update(products).set({ ...product, userId: sellerId, updatedAt: new Date() }).where(eq(products.id, existing[0].id));
    } else {
      await db.insert(products).values({ ...product, userId: sellerId });
    }
  }
}

// ─── Users ───────────────────────────────────────────────────

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return rows[0] ?? null;
}





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

export async function getUserByAppleId(appleId: string) {
  // Apple의 sub 값으로 만드는 openId는 고유하며, 별도 appleId DB 컬럼이
  // 아직 없는 운영 DB에서도 동일한 Apple 계정을 안정적으로 식별할 수 있다.
  return getUserByOpenId(`apple_${appleId}`);
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
}, viewerId?: number) {
  const db = await getDb();
  if (!db) return [];
  const blockedCounterpartIds = viewerId ? await getBlockedCounterpartIds(viewerId) : [];

  // 공개 목록에는 제목·설명·거래 지역·대표 사진이 모두 등록된 완성 매물만 표시합니다.
  // 저장 중인 초안이나 불완전한 과거 레코드는 보존하되, 외부 사용자와 심사자에게 노출하지 않습니다.
  const conditions = [
    sql`${products.title} IS NOT NULL AND TRIM(${products.title}) <> ''`,
    sql`${products.description} IS NOT NULL AND TRIM(${products.description}) <> ''`,
    sql`${products.location} IS NOT NULL AND TRIM(${products.location}) <> ''`,
    sql`${products.mainImageUrl} IS NOT NULL AND TRIM(${products.mainImageUrl}) <> ''`,
    sql`${products.price} > 0`,
  ];
  if (input?.category) conditions.push(eq(products.category, input.category));
  if (input?.status) conditions.push(eq(products.status, input.status));
  if (blockedCounterpartIds.length > 0) conditions.push(notInArray(products.userId, blockedCounterpartIds));

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

export async function getProductDetail(id: number, viewerId?: number) {
  const db = await getDb();
  if (!db) return null;

  const rows = await db
    .select()
    .from(products)
    .where(and(
      eq(products.id, id),
      sql`${products.title} IS NOT NULL AND TRIM(${products.title}) <> ''`,
      sql`${products.description} IS NOT NULL AND TRIM(${products.description}) <> ''`,
      sql`${products.location} IS NOT NULL AND TRIM(${products.location}) <> ''`,
      sql`${products.mainImageUrl} IS NOT NULL AND TRIM(${products.mainImageUrl}) <> ''`,
      sql`${products.price} > 0`,
    ))
    .limit(1);
  if (!rows[0]) return null;
  if (viewerId && await isUserBlockedBetween(viewerId, rows[0].userId)) return null;

  const [images, seller] = await Promise.all([
    db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, id))
      .orderBy(productImages.sortOrder),
    db
      .select({ id: users.id, name: users.name, nickname: users.nickname, isVerified: users.isVerified })
      .from(users)
      .where(eq(users.id, rows[0].userId))
      .limit(1),
  ]);

  // 조회수 증가
  await db.update(products).set({ viewCount: (rows[0].viewCount ?? 0) + 1 }).where(eq(products.id, id));

  const sellerUser = seller[0];
  const sellerDisplayName = sellerUser?.nickname || sellerUser?.name || null;

  return {
    ...rows[0],
    images,
    sellerId: sellerUser?.id ?? rows[0].userId,
    sellerNickname: sellerUser?.nickname ?? null,
    sellerName: sellerDisplayName,
    isSellerVerified: sellerUser?.isVerified ?? false,
  };
}

export async function createProduct(
  data: Omit<InsertProduct, "id" | "createdAt" | "updatedAt">,
  images?: string[]
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(products).values(data);
  const productId = result[0].insertId;

  if (images && images.length > 0) {
    await db.insert(productImages).values(
      images.map((imageUrl, index) => ({
        productId,
        imageUrl,
        sortOrder: index,
      }))
    );
  }

  return { id: productId };
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

/** 등록자 본인만 상품과 연결 이미지를 삭제합니다. */
export async function deleteProduct(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const owned = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.id, id), eq(products.userId, userId)))
    .limit(1);
  if (!owned[0]) return { success: false };

  await db.delete(productImages).where(eq(productImages.productId, id));
  await db.delete(products).where(and(eq(products.id, id), eq(products.userId, userId)));
  return { success: true };
}

export async function getMyProducts(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(products)
    .where(eq(products.userId, userId))
    .orderBy(desc(products.createdAt));
}

/** 판매자 프로필에 공개할 판매중·예약중 상품 목록입니다. */
export async function getSellerProducts(userId: number, viewerId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (viewerId && await isUserBlockedBetween(viewerId, userId)) return [];

  return db
    .select()
    .from(products)
    .where(and(
      eq(products.userId, userId),
      sql`${products.status} IN ('selling', 'reserved')`,
    ))
    .orderBy(desc(products.createdAt));
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

// ─── 업체회원 (실제 가입한 업체) ────────────────────────────────
// businesses 테이블과 달리, 회원가입 후 관리자 승인을 받은 실제 "업체회원" 계정을 조회합니다.

const COMPANY_SELECT_FIELDS = {
  id: users.id,
  name: users.companyName,
  type: users.companyType,
  description: users.companyDesc,
  phone: users.companyPhone,
  address: users.companyAddress,
  logoUrl: users.companyLogoUrl,
  createdAt: users.createdAt,
};

export async function getApprovedCompanies(input?: { type?: string }, viewerId?: number) {
  const db = await getDb();
  if (!db) return [];
  const blockedCounterpartIds = viewerId ? await getBlockedCounterpartIds(viewerId) : [];

  const conditions = [
    eq(users.role, "company"),
    eq(users.companyStatus, "approved"),
    sql`${users.deletedAt} IS NULL`,
    sql`${users.companyName} IS NOT NULL AND TRIM(${users.companyName}) <> ''`,
    sql`${users.companyDesc} IS NOT NULL AND TRIM(${users.companyDesc}) <> ''`,
    sql`${users.companyPhone} IS NOT NULL AND TRIM(${users.companyPhone}) <> ''`,
    sql`${users.companyAddress} IS NOT NULL AND TRIM(${users.companyAddress}) <> ''`,
  ];
  if (input?.type) conditions.push(eq(users.companyType, input.type as any));
  if (blockedCounterpartIds.length > 0) conditions.push(notInArray(users.id, blockedCounterpartIds));

  return db
    .select({
      ...COMPANY_SELECT_FIELDS,
      reviewCount: sql<number>`COUNT(${reviews.id})`,
      averageRating: sql<number | null>`ROUND(AVG(${reviews.rating}), 1)`,
    })
    .from(users)
    .leftJoin(
      reviews,
      blockedCounterpartIds.length > 0
        ? and(eq(reviews.targetUserId, users.id), notInArray(reviews.userId, blockedCounterpartIds))
        : eq(reviews.targetUserId, users.id),
    )
    .where(and(...conditions))
    .groupBy(
      users.id,
      users.companyName,
      users.companyType,
      users.companyDesc,
      users.companyPhone,
      users.companyAddress,
      users.companyLogoUrl,
      users.createdAt,
    )
    .orderBy(desc(users.createdAt));
}

export async function getApprovedCompanyById(id: number, viewerId?: number) {
  const db = await getDb();
  if (!db) return null;

  const rows = await db
    .select(COMPANY_SELECT_FIELDS)
    .from(users)
    .where(and(
      eq(users.id, id),
      eq(users.role, "company"),
      eq(users.companyStatus, "approved"),
      sql`${users.deletedAt} IS NULL`,
      sql`${users.companyName} IS NOT NULL AND TRIM(${users.companyName}) <> ''`,
      sql`${users.companyDesc} IS NOT NULL AND TRIM(${users.companyDesc}) <> ''`,
      sql`${users.companyPhone} IS NOT NULL AND TRIM(${users.companyPhone}) <> ''`,
      sql`${users.companyAddress} IS NOT NULL AND TRIM(${users.companyAddress}) <> ''`,
    ))
    .limit(1);
  const company = rows[0];
  if (!company) return null;
  if (viewerId && await isUserBlockedBetween(viewerId, company.id)) return null;

  const images = await db
    .select()
    .from(companyImages)
    .where(eq(companyImages.userId, id))
    .orderBy(companyImages.sortOrder);

  return { ...company, images };
}

export async function addCompanyImages(userId: number, imageUrls: string[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (imageUrls.length === 0) return;

  // 기존 소개 사진은 교체 (재신청/수정 시 중복 누적 방지)
  await db.delete(companyImages).where(eq(companyImages.userId, userId));
  await db.insert(companyImages).values(
    imageUrls.map((imageUrl, index) => ({ userId, imageUrl, sortOrder: index }))
  );
}

// ─── Favorites ───────────────────────────────────────────────

export async function getFavorites(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const blockedCounterpartIds = new Set(await getBlockedCounterpartIds(userId));

  const rows = await db
    .select()
    .from(favorites)
    .where(eq(favorites.userId, userId))
    .orderBy(desc(favorites.createdAt));

  const result = await Promise.all(
    rows.map(async (fav) => {
      const [product, business] = await Promise.all([
        fav.productId
          ? db.select({
              id: products.id,
              title: products.title,
              price: products.price,
              status: products.status,
              category: products.category,
              mainImageUrl: products.mainImageUrl,
              userId: products.userId,
            }).from(products).where(eq(products.id, fav.productId)).limit(1)
          : Promise.resolve([]),
        fav.businessId
          ? db.select({
              id: businesses.id,
              name: businesses.name,
              type: businesses.type,
            }).from(businesses).where(eq(businesses.id, fav.businessId)).limit(1)
          : Promise.resolve([]),
      ]);

      const selectedProduct = (product as any[])[0] ?? null;
      return {
        ...fav,
        product: selectedProduct && !blockedCounterpartIds.has(selectedProduct.userId) ? selectedProduct : null,
        business: (business as any[])[0] ?? null,
      };
    })
  );

  return result.filter((favorite) => favorite.product !== null || favorite.business !== null);
}

export async function isFavorited(userId: number, productId?: number, businessId?: number) {
  const db = await getDb();
  if (!db) return false;
  const conditions = [eq(favorites.userId, userId)];
  if (productId) conditions.push(eq(favorites.productId, productId));
  else if (businessId) conditions.push(eq(favorites.businessId, businessId));
  else return false;
  const existing = await db.select({ id: favorites.id }).from(favorites).where(and(...conditions)).limit(1);
  return existing.length > 0;
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

export async function createNotification(data: { userId: number; type: "chat" | "favorite" | "comment" | "sold" | "price_change" | "business_reply" | "notice"; title: string; body?: string; referenceId?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(notifications).values({
    userId: data.userId,
    type: data.type,
    title: data.title,
    body: data.body ?? null,
    referenceId: data.referenceId ?? null,
    isRead: false,
  });
  return { success: true };
}

// ─── Chats ───────────────────────────────────────────────────

import { chatRooms, chatMessages, users as usersTable, products as productsTable, recentViews } from "../drizzle/schema";
import { or, lt, isNull } from "drizzle-orm";

// ─── Recent Views (최근 본 상품) ────────────────────────────────

export async function addRecentView(userId: number, productId: number) {
  const db = await getDb();
  if (!db) return;

  // 이미 본 상품이면 기존 기록 삭제 후 다시 추가 (최신순 유지)
  await db
    .delete(recentViews)
    .where(and(eq(recentViews.userId, userId), eq(recentViews.productId, productId)));
  await db.insert(recentViews).values({ userId, productId });

  // 사용자당 최근 50개만 유지
  const rows = await db
    .select({ id: recentViews.id })
    .from(recentViews)
    .where(eq(recentViews.userId, userId))
    .orderBy(desc(recentViews.viewedAt));
  const stale = rows.slice(50);
  if (stale.length > 0) {
    await Promise.all(
      stale.map((row) => db.delete(recentViews).where(eq(recentViews.id, row.id)))
    );
  }
}

export async function getRecentViews(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const blockedCounterpartIds = new Set(await getBlockedCounterpartIds(userId));

  const rows = await db
    .select()
    .from(recentViews)
    .where(eq(recentViews.userId, userId))
    .orderBy(desc(recentViews.viewedAt))
    .limit(50);

  const result = await Promise.all(
    rows.map(async (view) => {
      const product = await db
        .select({
          id: productsTable.id,
          title: productsTable.title,
          price: productsTable.price,
          status: productsTable.status,
          category: productsTable.category,
          mainImageUrl: productsTable.mainImageUrl,
          userId: productsTable.userId,
        })
        .from(productsTable)
        .where(eq(productsTable.id, view.productId))
        .limit(1);

      return {
        ...view,
        product: product[0] && !blockedCounterpartIds.has(product[0].userId) ? product[0] : null,
      };
    })
  );

  // 삭제된 상품은 제외
  return result.filter((r) => r.product !== null);
}

// ─── Purchases (구매내역) ────────────────────────────────────────

export async function getMyPurchases(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const rooms = await db
    .select()
    .from(chatRooms)
    .where(and(eq(chatRooms.buyerId, userId), eq(chatRooms.status, "completed")))
    .orderBy(desc(chatRooms.lastMessageAt));

  const result = await Promise.all(
    rooms.map(async (room) => {
      const [product, seller] = await Promise.all([
        room.productId
          ? db.select({
              id: productsTable.id,
              title: productsTable.title,
              price: productsTable.price,
              mainImageUrl: productsTable.mainImageUrl,
              category: productsTable.category,
            }).from(productsTable).where(eq(productsTable.id, room.productId)).limit(1)
          : Promise.resolve([]),
        db.select({ id: usersTable.id, name: usersTable.name })
          .from(usersTable).where(eq(usersTable.id, room.sellerId)).limit(1),
      ]);

      return {
        chatRoomId: room.id,
        purchasedAt: room.lastMessageAt ?? room.createdAt,
        product: (product as any[])[0] ?? null,
        seller: seller[0] ?? null,
      };
    })
  );

  return result;
}

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
    .select({
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
      email: users.email,
    })
    .from(sellerApplications)
    .leftJoin(users, eq(sellerApplications.userId, users.id))
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

  // 승인 시 users 테이블 업데이트 (관리자 계정은 role을 덮어쓰지 않음)
  if (action === "approved") {
    const targetUser = await db.select({ role: users.role }).from(users).where(eq(users.id, app[0].userId)).limit(1);
    const shouldChangeRole = targetUser[0]?.role !== "admin";
    await db
      .update(users)
      .set({
        ...(shouldChangeRole ? { role: "seller" as const } : {}),
        sellerStatus: "approved",
        isVerified: true,
      })
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
  const blockedCounterpartIds = new Set(await getBlockedCounterpartIds(userId));

  const rooms = await db
    .select()
    .from(chatRooms)
    .where(and(
      or(eq(chatRooms.buyerId, userId), eq(chatRooms.sellerId, userId)),
      // 업체 문의 채팅(상품 없이 나에게 들어온 문의)은 "업체 문의함"에서 따로 보여주므로
      // 일반 채팅 목록에서는 제외해 중복 노출을 방지합니다.
      sql`NOT (${chatRooms.sellerId} = ${userId} AND ${chatRooms.productId} IS NULL)`
    ))
    .orderBy(desc(chatRooms.lastMessageAt))
    .limit(50);

  const result = await Promise.all(
    rooms.map(async (room) => {
      const otherUserId = room.buyerId === userId ? room.sellerId : room.buyerId;

      const [otherUser, unreadRows, product] = await Promise.all([
        db.select({ id: usersTable.id, name: usersTable.name, nickname: usersTable.nickname, profileImageUrl: usersTable.profileImageUrl })
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

      const u = otherUser[0];
      const displayName = u?.nickname || u?.name || "사용자";
      return {
        ...room,
        otherUser: u ? { ...u, name: displayName } : { id: otherUserId, name: "사용자", profileImageUrl: null },
        unreadCount: unreadRows.length,
        product: (product as any[])[0] ?? null,
      };
    })
  );

  return result.filter((room) => !blockedCounterpartIds.has(room.otherUser.id));
}

export async function getCompanyInquiryChats(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const blockedCounterpartIds = new Set(await getBlockedCounterpartIds(userId));

  const rooms = await db
    .select()
    .from(chatRooms)
    .where(and(eq(chatRooms.sellerId, userId), sql`${chatRooms.productId} IS NULL`))
    .orderBy(desc(chatRooms.lastMessageAt))
    .limit(50);

  const result = await Promise.all(
    rooms.map(async (room) => {
      const [buyer, unreadRows] = await Promise.all([
        db.select({ id: usersTable.id, name: usersTable.name, nickname: usersTable.nickname, profileImageUrl: usersTable.profileImageUrl })
          .from(usersTable).where(eq(usersTable.id, room.buyerId)).limit(1),
        db.select({ id: chatMessages.id })
          .from(chatMessages)
          .where(and(
            eq(chatMessages.roomId, room.id),
            eq(chatMessages.isRead, false),
            eq(chatMessages.senderId, room.buyerId)
          )),
      ]);

      const b = buyer[0];
      const displayName = b?.nickname || b?.name || "사용자";
      return {
        ...room,
        otherUser: b ? { ...b, name: displayName } : { id: room.buyerId, name: "사용자", profileImageUrl: null },
        unreadCount: unreadRows.length,
      };
    })
  );

  return result.filter((room) => !blockedCounterpartIds.has(room.otherUser.id));
}

export async function getOrCreateChatRoom(buyerId: number, sellerId: number, productId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (await isUserBlockedBetween(buyerId, sellerId)) {
    throw new Error("차단된 사용자와는 채팅을 시작할 수 없습니다.");
  }

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
  if (await isUserBlockedBetween(userId, otherUserId)) return null;
  const [otherUser, product] = await Promise.all([
    db.select({ id: usersTable.id, name: usersTable.name, nickname: usersTable.nickname, profileImageUrl: usersTable.profileImageUrl, isVerified: usersTable.isVerified })
      .from(usersTable).where(eq(usersTable.id, otherUserId)).limit(1),
    room.productId
      ? db.select({ id: productsTable.id, title: productsTable.title, mainImageUrl: productsTable.mainImageUrl, price: productsTable.price, status: productsTable.status })
          .from(productsTable).where(eq(productsTable.id, room.productId)).limit(1)
      : Promise.resolve([]),
  ]);

  const ou = otherUser[0];
  const ouDisplayName = ou?.nickname || ou?.name || "사용자";
  return {
    ...room,
    otherUser: ou ? { ...ou, name: ouDisplayName } : { id: otherUserId, name: "사용자", profileImageUrl: null, isVerified: false },
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
  const otherUserId = room.buyerId === userId ? room.sellerId : room.buyerId;
  if (await isUserBlockedBetween(userId, otherUserId)) return [];

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
  const otherUserId = room.buyerId === senderId ? room.sellerId : room.buyerId;
  if (await isUserBlockedBetween(senderId, otherUserId)) {
    throw new Error("차단된 사용자와는 채팅할 수 없습니다.");
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

export async function getChatRoomParticipants(roomId: number) {
  const db = await getDb();
  if (!db) return null;

  const rows = await db.select().from(chatRooms).where(eq(chatRooms.id, roomId)).limit(1);
  const room = rows[0];
  if (!room) return null;
  return { buyerId: room.buyerId, sellerId: room.sellerId };
}

export async function markMessagesRead(roomId: number, userId: number) {
  const db = await getDb();
  if (!db) return;

  // 내가 받은 메시지(상대방이 보낸 것)를 읽음 처리
  const rooms = await db.select().from(chatRooms).where(eq(chatRooms.id, roomId)).limit(1);
  const room = rooms[0];
  if (!room) return;
  if (room.buyerId !== userId && room.sellerId !== userId) {
    throw new Error("채팅방에 접근할 수 없습니다.");
  }

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

/** 후기 작성자가 완료된 거래 채팅의 당사자이며 상대방에게만 작성하는지 검증합니다. */
export async function getReviewEligibility(
  chatRoomId: number,
  userId: number,
  targetUserId: number,
  productId?: number,
): Promise<{ allowed: boolean; reason: string }> {
  const db = await getDb();
  if (!db) return { allowed: false, reason: "데이터베이스를 사용할 수 없습니다." };

  const rooms = await db.select().from(chatRooms).where(eq(chatRooms.id, chatRoomId)).limit(1);
  const room = rooms[0];
  if (!room) return { allowed: false, reason: "거래 채팅방을 찾을 수 없습니다." };
  if (room.status !== "completed") return { allowed: false, reason: "거래 완료 후에만 후기를 작성할 수 있습니다." };
  if (room.buyerId !== userId && room.sellerId !== userId) {
    return { allowed: false, reason: "후기를 작성할 권한이 없습니다." };
  }
  const counterpartyId = room.buyerId === userId ? room.sellerId : room.buyerId;
  if (await isUserBlockedBetween(userId, counterpartyId)) {
    return { allowed: false, reason: "차단한 사용자와는 후기를 작성할 수 없습니다." };
  }
  if (counterpartyId !== targetUserId) {
    return { allowed: false, reason: "거래 상대방에게만 후기를 작성할 수 있습니다." };
  }
  if (productId !== undefined && room.productId !== productId) {
    return { allowed: false, reason: "거래 상품 정보가 일치하지 않습니다." };
  }
  return { allowed: true, reason: "" };
}

export async function updateChatRoomStatus(roomId: number, userId: number, status: "completed" | "cancelled") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const rooms = await db.select().from(chatRooms).where(eq(chatRooms.id, roomId)).limit(1);
  const room = rooms[0];
  if (!room || (room.buyerId !== userId && room.sellerId !== userId)) {
    throw new Error("채팅방에 접근할 수 없습니다.");
  }
  if (room.sellerId !== userId) {
    throw new Error("거래완료/취소는 판매자만 설정할 수 있습니다.");
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

export async function getReviewsByTargetUser(targetUserId: number, limit = 20, offset = 0, viewerId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (viewerId && await isUserBlockedBetween(viewerId, targetUserId)) return [];
  const blockedCounterpartIds = viewerId ? await getBlockedCounterpartIds(viewerId) : [];
  const conditions = [eq(reviews.targetUserId, targetUserId)];
  if (blockedCounterpartIds.length > 0) conditions.push(notInArray(reviews.userId, blockedCounterpartIds));

  const rows = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      content: reviews.content,
      createdAt: reviews.createdAt,
      productId: reviews.productId,
      reviewerName: sql<string>`COALESCE(${users.nickname}, ${users.name})`,
      reviewerProfileUrl: users.profileImageUrl,
    })
    .from(reviews)
    .leftJoin(users, eq(reviews.userId, users.id))
    .where(and(...conditions))
    .orderBy(desc(reviews.createdAt))
    .limit(limit)
    .offset(offset);

  return rows;
}

export async function getSellerRatingSummary(targetUserId: number, viewerId?: number) {
  const db = await getDb();
  if (!db) return { averageRating: 0, totalCount: 0 };
  if (viewerId && await isUserBlockedBetween(viewerId, targetUserId)) return { averageRating: 0, totalCount: 0 };
  const blockedCounterpartIds = viewerId ? await getBlockedCounterpartIds(viewerId) : [];
  const conditions = [eq(reviews.targetUserId, targetUserId)];
  if (blockedCounterpartIds.length > 0) conditions.push(notInArray(reviews.userId, blockedCounterpartIds));

  const rows = await db
    .select({ rating: reviews.rating })
    .from(reviews)
    .where(and(...conditions));

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

  const rows = conditions.length > 0 ? await query.where(and(...conditions)) : await query;

  // 신고 대상(targetType)에 따라 실제 이름/제목을 조회해서 붙여줍니다.
  const result = await Promise.all(
    rows.map(async (row) => {
      let targetName: string | null = null;
      try {
        if (row.targetType === "product") {
          const p = await db.select({ title: products.title }).from(products).where(eq(products.id, row.targetId)).limit(1);
          targetName = p[0]?.title ?? null;
        } else if (row.targetType === "user") {
          const u = await db.select({ name: users.name }).from(users).where(eq(users.id, row.targetId)).limit(1);
          targetName = u[0]?.name ?? null;
        } else if (row.targetType === "chat") {
          targetName = `채팅방 #${row.targetId}`;
        } else if (row.targetType === "comment") {
          targetName = `댓글 #${row.targetId}`;
        }
      } catch {
        targetName = null;
      }
      return { ...row, targetName };
    })
  );

  return result;
}


export async function updateReportStatus(reportId: number, status: "resolved" | "dismissed") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(reports).set({ status }).where(eq(reports.id, reportId));
  return { success: true };
}

export async function createReport(data: {
  reporterId: number;
  targetType: "product" | "user" | "comment" | "chat";
  targetId: number;
  reason: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const inserted = await db.insert(reports).values({
    reporterId: data.reporterId,
    targetType: data.targetType,
    targetId: data.targetId,
    reason: data.reason,
  });
  const reportId = Number(inserted[0]?.insertId ?? 0);

  // 신고는 관리자 대시보드에서 조회할 수 있을 뿐 아니라, 관리자 계정의 인앱 알림에도 즉시 남깁니다.
  const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
  if (admins.length > 0) {
    await db.insert(notifications).values(
      admins.map((admin) => ({
        userId: admin.id,
        type: "notice" as const,
        title: "새 사용자 신고가 접수되었습니다",
        body: `${data.targetType} 신고를 검토해주세요.`,
        referenceId: reportId || null,
        isRead: false,
      })),
    );
  }

  return { success: true, reportId };
}

/** 차단과 반대 차단을 모두 포함한 상대 사용자 ID 목록입니다. */
export async function getBlockedCounterpartIds(userId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  await ensureUserBlocksTable(db);
  const rows = await db
    .select({ blockerId: userBlocks.blockerId, blockedId: userBlocks.blockedId })
    .from(userBlocks)
    .where(or(eq(userBlocks.blockerId, userId), eq(userBlocks.blockedId, userId)));
  return [...new Set(rows.map((row) => (row.blockerId === userId ? row.blockedId : row.blockerId)))];
}

export async function isUserBlockedBetween(firstUserId: number, secondUserId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  await ensureUserBlocksTable(db);
  const rows = await db
    .select({ id: userBlocks.id })
    .from(userBlocks)
    .where(
      or(
        and(eq(userBlocks.blockerId, firstUserId), eq(userBlocks.blockedId, secondUserId)),
        and(eq(userBlocks.blockerId, secondUserId), eq(userBlocks.blockedId, firstUserId)),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

export async function blockUserAndReport(blockerId: number, blockedId: number, reason?: string) {
  if (blockerId === blockedId) throw new Error("본인을 차단할 수 없습니다.");
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await ensureUserBlocksTable(db);
  const existing = await db
    .select({ id: userBlocks.id })
    .from(userBlocks)
    .where(and(eq(userBlocks.blockerId, blockerId), eq(userBlocks.blockedId, blockedId)))
    .limit(1);
  if (existing.length === 0) {
    await db.insert(userBlocks).values({ blockerId, blockedId });
  }
  const report = await createReport({
    reporterId: blockerId,
    targetType: "user",
    targetId: blockedId,
    reason: `사용자 차단 및 운영자 검토 요청${reason ? `: ${reason}` : ""}`,
  });
  return { success: true, reportId: report.reportId };
}

/** 현재 로그인한 사용자가 만든 차단 관계만 해제합니다. */
export async function unblockUser(blockerId: number, blockedId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await ensureUserBlocksTable(db);
  await db
    .delete(userBlocks)
    .where(and(eq(userBlocks.blockerId, blockerId), eq(userBlocks.blockedId, blockedId)));
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
      deletedAt: users.deletedAt,
      suspendedAt: users.suspendedAt,
      suspendedReason: users.suspendedReason,
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

// ─── 1:1 고객센터 문의 ───────────────────────────────────────────

export async function createInquiry(data: { userId: number; category: string; title: string; content: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(inquiries).values({
    userId: data.userId,
    category: data.category as any,
    title: data.title,
    content: data.content,
  });
  return { id: result[0].insertId };
}

export async function getMyInquiries(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(inquiries).where(eq(inquiries.userId, userId)).orderBy(desc(inquiries.createdAt));
}

export async function getInquiryById(id: number, userId?: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(inquiries).where(eq(inquiries.id, id)).limit(1);
  const inquiry = rows[0];
  if (!inquiry) return null;
  // userId가 주어지면(일반 사용자 조회) 본인 문의인지 확인
  if (userId !== undefined && inquiry.userId !== userId) return null;
  return inquiry;
}

export async function getAllInquiries(input?: { status?: "pending" | "answered"; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = input?.status ? [eq(inquiries.status, input.status)] : [];
  const query = db.select().from(inquiries);
  const rows = await (conditions.length > 0 ? query.where(and(...conditions)) : query)
    .orderBy(desc(inquiries.createdAt))
    .limit(input?.limit ?? 50)
    .offset(input?.offset ?? 0);
  return rows;
}

export async function answerInquiry(id: number, adminId: number, answerContent: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(inquiries)
    .set({ status: "answered", answerContent, answeredBy: adminId, answeredAt: new Date() })
    .where(eq(inquiries.id, id));
  return { success: true };
}



export async function createUserByEmail(data: {
  openId: string;
  email: string | null;
  password: string | null;
  name: string;
  nickname?: string | null;
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
    nickname: data.nickname ?? undefined,
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

export async function updateCompanyProfile(userId: number, data: {
  companyName?: string;
  representativeName?: string;
  companyPhone?: string;
  companyAddress?: string;
  companyDesc?: string;
  companyLogoUrl?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, userId));
  return getUserById(userId);
}

export async function updateUserCompanyInfo(userId: number, data: {
  companyStatus: "pending" | "approved" | "rejected" | "suspended";
  companyType: "demolition" | "interior" | "waste" | "signage" | "pos" | "cctv" | "cleaning" | "tax" | "labor" | "consulting";
  companyName: string;
  companyPhone: string;
  companyAddress: string;
  companyDesc: string | null;
  businessNumber: string | null;
  companyLogoUrl: string | null;
  companyBusinessCertUrl: string | null;
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
    companyBusinessCertUrl: data.companyBusinessCertUrl ?? undefined,
    representativeName: data.representativeName,
    updatedAt: new Date(),
  }).where(eq(users.id, userId));
}

export async function getCompanyApplications(input?: { status?: "pending" | "approved" | "rejected" | "suspended" }) {
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
    createdAt: users.createdAt,
  };

  const { isNotNull } = await import("drizzle-orm");

  if (input?.status) {
    return db.select(selectFields).from(users)
      .where(eq(users.companyStatus, input.status))
      .orderBy(desc(users.createdAt))
      .limit(100);
  }

  return db.select(selectFields).from(users)
    .where(isNotNull(users.companyType))
    .orderBy(desc(users.createdAt))
    .limit(100);
}


export async function reviewCompanyApplication(userId: number, action: "approved" | "rejected" | "suspended", rejectionReason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (action === "approved") {
    const targetUser = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
    const shouldChangeRole = targetUser[0]?.role !== "admin";
    await db.update(users).set({
      ...(shouldChangeRole ? { role: "company" as const } : {}),
      companyStatus: "approved",
      isVerified: true,
      updatedAt: new Date(),
    }).where(eq(users.id, userId));
  } else if (action === "rejected") {
    await db.update(users).set({
      companyStatus: "rejected",
      companyRejectionReason: rejectionReason ?? null,
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
export async function updateUserProfile(userId: number, data: { name?: string; nickname?: string; phone?: string; profileImageUrl?: string }) {
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

// ─── 로그인 브루트포스 방어 ─────────────────────────────────────

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 10 * 60 * 1000; // 10분

/** 계정이 현재 잠겨있으면 남은 잠금 시간(분)을 반환, 아니면 null */
export async function getAccountLockStatus(userId: number): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select({ lockedUntil: users.lockedUntil }).from(users).where(eq(users.id, userId)).limit(1);
  const lockedUntil = rows[0]?.lockedUntil;
  if (!lockedUntil) return null;
  const remainingMs = lockedUntil.getTime() - Date.now();
  if (remainingMs <= 0) return null;
  return Math.ceil(remainingMs / 60000);
}

/** 로그인 실패 기록. 5회 누적 시 10분간 잠금 처리 */
export async function recordFailedLogin(userId: number) {
  const db = await getDb();
  if (!db) return;
  const rows = await db.select({ failedLoginAttempts: users.failedLoginAttempts }).from(users).where(eq(users.id, userId)).limit(1);
  const nextCount = (rows[0]?.failedLoginAttempts ?? 0) + 1;

  if (nextCount >= MAX_FAILED_ATTEMPTS) {
    await db.update(users).set({
      failedLoginAttempts: nextCount,
      lockedUntil: new Date(Date.now() + LOCKOUT_DURATION_MS),
    }).where(eq(users.id, userId));
  } else {
    await db.update(users).set({ failedLoginAttempts: nextCount }).where(eq(users.id, userId));
  }
}

/** 로그인 성공 시 실패 카운트 초기화 */
export async function resetFailedLogin(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ failedLoginAttempts: 0, lockedUntil: null }).where(eq(users.id, userId));
}

// ─── 비밀번호 재설정 (이메일 로그인 전용) ─────────────────────────

export async function createPasswordResetToken(userId: number, token: string, expiresAt: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // 기존에 발급했던 미사용 토큰은 무효화 (재요청 시 이전 링크는 못 쓰게)
  await db.update(passwordResetTokens).set({ used: true }).where(and(eq(passwordResetTokens.userId, userId), eq(passwordResetTokens.used, false)));
  await db.insert(passwordResetTokens).values({ userId, token, expiresAt });
  return { success: true };
}

export async function getValidPasswordResetToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(passwordResetTokens)
    .where(and(eq(passwordResetTokens.token, token), eq(passwordResetTokens.used, false)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  if (row.expiresAt.getTime() < Date.now()) return null;
  return row;
}

export async function markPasswordResetTokenUsed(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(passwordResetTokens).set({ used: true }).where(eq(passwordResetTokens.id, id));
}

// ─── 회원 탈퇴 ─────────────────────────────────────────────────
export async function deleteAccount(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 채팅/후기 등 다른 회원과 연결된 기록은 그대로 남기고,
  // 개인 식별 정보만 지우고 재로그인이 불가능하도록 처리 (소프트 삭제)
  await db
    .update(users)
    .set({
      openId: `deleted_${userId}_${Date.now()}`,
      name: "탈퇴한 회원",
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
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  // 탈퇴한 회원이 올린 판매중인 상품은 더 이상 목록에 노출되지 않도록 판매완료 처리
  await db
    .update(products)
    .set({ status: "sold" })
    .where(and(eq(products.userId, userId), eq(products.status, "selling")));

  return { success: true };
}


// ─── 관리자 - 회원 정지/해제 ─────────────────────────────────────

export async function suspendUser(userId: number, reason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(users)
    .set({
      suspendedAt: new Date(),
      suspendedReason: reason ?? null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return { success: true };
}

export async function reactivateUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(users)
    .set({
      suspendedAt: null,
      suspendedReason: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return { success: true };
}

export async function setUserRole(userId: number, role: "user" | "seller" | "company" | "admin") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(users)
    .set({ role, isVerified: true, updatedAt: new Date() })
    .where(eq(users.id, userId));

  return { success: true };
}

export async function savePushToken(userId: number, token: string) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db
      .update(users)
      .set({ expoPushToken: token })
      .where(eq(users.id, userId));
    return true;
  } catch (error) {
    console.error("푸시 토큰 저장 실패:", error);
    return false;
  }
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
