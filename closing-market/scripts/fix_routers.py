import re

with open('server/routers.ts', 'r') as f:
    content = f.read()

# seller.submit 부분 교체: businessCertUrl optional로 변경 + updateUserSellerInfo 추가
old_submit = '''    // 판매자 신청 제출
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
  }),'''

new_submit = '''    // 판매회원 신청 제출 (일반회원 → 판매회원 전환)
    submit: protectedProcedure
      .input(
        z.object({
          sellerType: z.enum(["closing_soon", "closed", "relocating", "inventory", "transfer"]),
          businessNumber: z.string().min(10).max(20),
          businessName: z.string().min(1).max(255),
          representativeName: z.string().min(1).max(100),
          businessCertUrl: z.string().url().optional(),
          businessPhotoUrl: z.string().url().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.submitSellerApplication({
          userId: ctx.user.id,
          ...input,
          businessCertUrl: input.businessCertUrl ?? "",
          businessPhotoUrl: input.businessPhotoUrl ?? null,
        });
        await db.updateUserSellerInfo(ctx.user.id, {
          sellerStatus: "pending",
          sellerType: input.sellerType,
          businessNumber: input.businessNumber,
          businessName: input.businessName,
          representativeName: input.representativeName,
          businessCertUrl: input.businessCertUrl ?? null,
        });
        return { success: true };
      }),
  }),
  // ─── 업체회원 ─────────────────────────────────────────────────
  company: router({
    // 내 업체 프로필 조회
    myProfile: protectedProcedure.query(({ ctx }) => {
      return db.getUserById(ctx.user.id);
    }),
    // 업체회원 신청 제출 (일반회원 → 업체회원 전환)
    apply: protectedProcedure
      .input(z.object({
        companyType: z.enum(["demolition", "interior", "waste", "signage", "pos", "cleaning", "tax", "labor"]),
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

        return { success: true };
      }),
  }),'''

if old_submit in content:
    content = content.replace(old_submit, new_submit)
    print("SUCCESS: seller.submit 교체 + company 라우터 추가 완료")
else:
    # 공백/줄바꿈 차이 디버깅
    idx = content.find("// 판매자 신청 제출")
    if idx >= 0:
        print(f"Found at {idx}:")
        print(repr(content[idx:idx+200]))
    else:
        print("ERROR: '// 판매자 신청 제출' 텍스트도 없음")

# admin 라우터에 업체회원 승인 추가
old_admin_end = '''    // 공지사항 삭제
    deleteNotice: adminProcedure
      .input(z.object({ noticeId: z.number() }))
      .mutation(({ input }) => {
        return db.deleteNotice(input.noticeId);
      }),
  }),'''

new_admin_end = '''    // 공지사항 삭제
    deleteNotice: adminProcedure
      .input(z.object({ noticeId: z.number() }))
      .mutation(({ input }) => {
        return db.deleteNotice(input.noticeId);
      }),
    // 업체회원 신청 목록 조회
    companyApplications: adminProcedure
      .input(z.object({
        status: z.enum(["pending", "approved", "rejected", "suspended"]).optional(),
      }).optional())
      .query(({ input }) => {
        return db.getCompanyApplications(input);
      }),
    // 업체회원 신청 승인/반려
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
  }),'''

if old_admin_end in content:
    content = content.replace(old_admin_end, new_admin_end)
    print("SUCCESS: admin 라우터에 업체회원 승인 추가 완료")
else:
    print("WARNING: admin 라우터 끝 텍스트를 찾지 못했습니다")

with open('server/routers.ts', 'w') as f:
    f.write(content)
print("파일 저장 완료")
