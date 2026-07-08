with open('server/db.ts', 'r') as f:
    content = f.read()

# 1. reviewSellerApplication에서 userType: "seller" 제거
content = content.replace(
    '    await db\n      .update(users)\n      .set({ userType: "seller", sellerStatus: "approved", isVerified: true })\n      .where(eq(users.id, app[0].userId));',
    '    await db\n      .update(users)\n      .set({ role: "seller", sellerStatus: "approved", isVerified: true })\n      .where(eq(users.id, app[0].userId));'
)

# 2. getAdminUsers에서 userType 제거
content = content.replace(
    '      userType: users.userType,\n      isVerified: users.isVerified,\n      sellerStatus: users.sellerStatus,',
    '      isVerified: users.isVerified,\n      sellerStatus: users.sellerStatus,'
)

# 3. createUserByEmail에서 userType 파라미터 및 사용 제거
content = content.replace(
    '  userType?: "buyer" | "seller";\n})',
    '})'
)
content = content.replace(
    '    role: "user",\n    userType: data.userType ?? "buyer",\n    isVerified: false,',
    '    role: "user",\n    isVerified: false,'
)

# 4. updateUserSellerInfo 함수 추가 (createUserByEmail 이후)
new_functions = '''
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
'''

# updateUserProfile 함수 앞에 새 함수들 삽입
insert_before = 'export async function updateUserProfile('
if insert_before in content:
    content = content.replace(insert_before, new_functions + insert_before)
    print("SUCCESS: 새 함수들 추가 완료")
else:
    print("ERROR: updateUserProfile 함수를 찾지 못했습니다")

with open('server/db.ts', 'w') as f:
    f.write(content)
print("db.ts 저장 완료")
