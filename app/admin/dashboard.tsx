import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/lib/auth-store";

type TabType = "overview" | "products" | "sellers" | "companies" | "reports" | "users" | "notices";

export default function AdminDashboard() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeContent, setNoticeContent] = useState("");
  const [noticePinned, setNoticePinned] = useState(false);

  // 관리자 권한 체크
  if (!user || user.role !== "admin") {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <Text style={{ fontSize: 48 }}>🔒</Text>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>접근 권한 없음</Text>
          <Text style={[styles.emptyDesc, { color: colors.muted }]}>관리자만 접근할 수 있습니다.</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {/* 헤더 */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ fontSize: 22, color: colors.primary }}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>관리자 대시보드</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* 탭 바 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabBar, { borderBottomColor: colors.border }]}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {(["overview", "products", "sellers", "companies", "reports", "users", "notices"] as TabType[]).map((tab) => {
          const labels: Record<TabType, string> = {
            overview: "📊 개요",
            products: "📦 상품",
            sellers: "🏢 판매자",
            companies: "🏢 업체",
            reports: "🚨 신고",
            users: "👥 회원",
            notices: "📢 공지",
          };
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[
                styles.tabItem,
                activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
              ]}
            >
              <Text style={[styles.tabLabel, { color: activeTab === tab ? colors.primary : colors.muted }]}>
                {labels[tab]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 탭 콘텐츠 */}
      {activeTab === "overview" && <OverviewTab colors={colors} router={router} />}
      {activeTab === "products" && <ProductsTab colors={colors} />}
      {activeTab === "sellers" && <SellerApplicationsTab colors={colors} />}
      {activeTab === "companies" && <CompanyApplicationsTab colors={colors} />}
      {activeTab === "reports" && <ReportsTab colors={colors} />}
      {activeTab === "users" && <UsersTab colors={colors} />}
      {activeTab === "notices" && (
        <NoticesTab
          colors={colors}
          noticeTitle={noticeTitle}
          setNoticeTitle={setNoticeTitle}
          noticeContent={noticeContent}
          setNoticeContent={setNoticeContent}
          noticePinned={noticePinned}
          setNoticePinned={setNoticePinned}
        />
      )}
    </ScreenContainer>
  );
}

// ─── 개요 탭 ─────────────────────────────────────────────────

function OverviewTab({ colors, router }: { colors: any; router: any }) {
  const { data: stats, isLoading, refetch } = trpc.admin.stats.useQuery();

  const statCards = [
    { label: "전체 회원", value: stats?.totalUsers ?? 0, icon: "👥", color: "#3B82F6" },
    { label: "전체 상품", value: stats?.totalProducts ?? 0, icon: "📦", color: "#10B981" },
    { label: "전체 신고", value: stats?.totalReports ?? 0, icon: "🚨", color: "#EF4444" },
    { label: "미처리 신고", value: stats?.pendingReports ?? 0, icon: "⚠️", color: "#F59E0B" },
    { label: "판매자 심사 대기", value: stats?.pendingSellers ?? 0, icon: "🏪", color: "#8B5CF6" },
  ];

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
    >
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>📊 플랫폼 현황</Text>

      <View style={styles.statsGrid}>
        {statCards.map((card) => (
          <View
            key={card.label}
            style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={{ fontSize: 28 }}>{card.icon}</Text>
            <Text style={[styles.statValue, { color: card.color }]}>{card.value.toLocaleString()}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>{card.label}</Text>
          </View>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 24 }]}>⚡ 빠른 메뉴</Text>
      <View style={styles.quickMenu}>
        {[
          { label: "판매자 신청 관리", icon: "🏪", path: "/admin/seller-applications" },
          { label: "신고 처리", icon: "🚨", action: "reports" },
          { label: "공지사항 작성", icon: "📢", action: "notices" },
        ].map((item) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.quickItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => item.path ? router.push(item.path as any) : null}
          >
            <Text style={{ fontSize: 24 }}>{item.icon}</Text>
            <Text style={[styles.quickLabel, { color: colors.foreground }]}>{item.label}</Text>
            <Text style={{ color: colors.muted }}>→</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── 상품 관리 탭 ─────────────────────────────────────────────

function ProductsTab({ colors }: { colors: any }) {
  const { data: products, isLoading, refetch } = trpc.admin.allProducts.useQuery();
  const deleteMutation = trpc.admin.deleteProduct.useMutation({
    onSuccess: () => { Alert.alert("완료", "상품이 삭제되었습니다."); refetch(); },
    onError: (e: any) => Alert.alert("오류", e.message),
  });

  const handleDelete = (id: number, title: string) => {
    Alert.alert("상품 삭제", `"${title}" 상품을 삭제하시겠습니까?`, [
      { text: "취소", style: "cancel" },
      { text: "삭제", style: "destructive", onPress: () => deleteMutation.mutate({ productId: id }) },
    ]);
  };

  const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    selling: { label: "판매중", color: "#10B981" },
    reserved: { label: "예약중", color: "#F59E0B" },
    sold: { label: "판매완료", color: "#6B7280" },
  };

  const CATEGORY_LABELS: Record<string, string> = {
    cafe: "카페", pcroom: "PC방", restaurant: "식당", gym: "헬스장",
    office: "사무실", warehouse: "창고재고", transfer: "사업양도",
  };

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  }

  return (
    <FlatList
      data={products ?? []}
      keyExtractor={(item: any) => String(item.id)}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={[styles.emptyTitle, { color: colors.muted }]}>등록된 상품이 없습니다.</Text>
        </View>
      }
      renderItem={({ item }: { item: any }) => {
        const status = STATUS_LABELS[item.status] ?? { label: item.status, color: "#6B7280" };
        return (
          <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.listCardRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.listCardTitle, { color: colors.foreground }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[styles.listCardSub, { color: colors.muted }]}>
                  {CATEGORY_LABELS[item.category] ?? item.category} · {item.sellerName ?? "알 수 없음"}
                </Text>
                <Text style={[styles.listCardSub, { color: colors.muted }]}>
                  {Number(item.price).toLocaleString()}원 · 조회 {item.viewCount}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end", gap: 8 }}>
                <View style={[styles.badge, { backgroundColor: status.color + "20" }]}>
                  <Text style={{ color: status.color, fontSize: 12, fontWeight: "600" }}>{status.label}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.deleteBtn, { borderColor: colors.error }]}
                  onPress={() => handleDelete(item.id, item.title)}
                >
                  <Text style={{ color: colors.error, fontSize: 12 }}>삭제</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      }}
    />
  );
}

// ─── 신고 관리 탭 ─────────────────────────────────────────────

function ReportsTab({ colors }: { colors: any }) {
  const { data: reports, isLoading, refetch } = trpc.admin.allReports.useQuery();
  const resolveMutation = trpc.admin.resolveReport.useMutation({
    onSuccess: () => { Alert.alert("완료", "신고가 처리되었습니다."); refetch(); },
    onError: (e: any) => Alert.alert("오류", e.message),
  });

  const handleResolve = (id: number, action: "resolved" | "dismissed") => {
    const label = action === "resolved" ? "처리 완료" : "기각";
    Alert.alert(`신고 ${label}`, `이 신고를 ${label} 처리하시겠습니까?`, [
      { text: "취소", style: "cancel" },
      { text: label, onPress: () => resolveMutation.mutate({ reportId: id, status: action }) },
    ]);
  };

  const TARGET_LABELS: Record<string, string> = {
    product: "상품", user: "회원", comment: "댓글", chat: "채팅",
  };

  const STATUS_COLORS: Record<string, string> = {
    pending: "#F59E0B", resolved: "#10B981", dismissed: "#6B7280",
  };

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  }

  return (
    <FlatList
      data={reports ?? []}
      keyExtractor={(item: any) => String(item.id)}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={[styles.emptyTitle, { color: colors.muted }]}>신고 내역이 없습니다.</Text>
        </View>
      }
      renderItem={({ item }: { item: any }) => (
        <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.listCardRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] + "20" }]}>
                  <Text style={{ color: STATUS_COLORS[item.status], fontSize: 11, fontWeight: "600" }}>
                    {item.status === "pending" ? "미처리" : item.status === "resolved" ? "처리완료" : "기각"}
                  </Text>
                </View>
                <Text style={[{ fontSize: 12, color: colors.muted }]}>
                  {TARGET_LABELS[item.targetType] ?? item.targetType} #{item.targetId}
                </Text>
              </View>
              <Text style={[styles.listCardTitle, { color: colors.foreground }]} numberOfLines={2}>
                {item.reason}
              </Text>
              <Text style={[styles.listCardSub, { color: colors.muted }]}>
                신고자: {item.reporterName ?? "알 수 없음"}
              </Text>
            </View>
          </View>
          {item.status === "pending" && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#10B981" }]}
                onPress={() => handleResolve(item.id, "resolved")}
              >
                <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>처리 완료</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.muted }]}
                onPress={() => handleResolve(item.id, "dismissed")}
              >
                <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>기각</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    />
  );
}

// ─── 회원 관리 탭 ─────────────────────────────────────────────

function UsersTab({ colors }: { colors: any }) {
  const { data: users, isLoading, refetch } = trpc.admin.allUsers.useQuery();

  const SELLER_STATUS: Record<string, { label: string; color: string }> = {
    pending: { label: "심사중", color: "#F59E0B" },
    approved: { label: "인증완료", color: "#10B981" },
    rejected: { label: "반려", color: "#EF4444" },
  };

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  }

  return (
    <FlatList
      data={users ?? []}
      keyExtractor={(item: any) => String(item.id)}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={[styles.emptyTitle, { color: colors.muted }]}>회원이 없습니다.</Text>
        </View>
      }
      renderItem={({ item }: { item: any }) => {
        const sellerInfo = item.sellerStatus ? SELLER_STATUS[item.sellerStatus] : null;
        return (
          <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.listCardRow}>
              <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
                <Text style={{ fontSize: 18 }}>👤</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={[styles.listCardTitle, { color: colors.foreground }]}>
                    {item.name ?? "이름 없음"}
                  </Text>
                  {item.role === "admin" && (
                    <View style={[styles.badge, { backgroundColor: "#3B82F620" }]}>
                      <Text style={{ color: "#3B82F6", fontSize: 10 }}>관리자</Text>
                    </View>
                  )}
                  {sellerInfo && item.isVerified && (
                    <View style={[styles.badge, { backgroundColor: sellerInfo.color + "20" }]}>
                      <Text style={{ color: sellerInfo.color, fontSize: 10 }}>{sellerInfo.label}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.listCardSub, { color: colors.muted }]}>{item.email ?? "이메일 없음"}</Text>
                <Text style={[styles.listCardSub, { color: colors.muted }]}>
                  {item.role === "seller" ? "판매회원" : item.role === "company" ? "업체회원" : item.role === "admin" ? "관리자" : "일반회원"} · 가입일{" "}
                  {new Date(item.createdAt).toLocaleDateString("ko-KR")}
                </Text>
              </View>
            </View>
          </View>
        );
      }}
    />
  );
}

// ─── 판매자 신청 탭 ─────────────────────────────

function SellerApplicationsTab({ colors }: { colors: any }) {
  const { data: applications, isLoading, refetch } = trpc.admin.sellerApplications.useQuery();
  const reviewMutation = trpc.admin.reviewApplication.useMutation({
    onSuccess: () => {
      Alert.alert("완료", "처리되었습니다.");
      refetch();
    },
    onError: (e: any) => Alert.alert("오류", e.message),
  });

  const SELLER_TYPE_LABELS: Record<string, string> = {
    closing_soon: "폐업 예정",
    closed: "폐업 완료",
    relocating: "사업장 이전",
    inventory: "재고 정리",
    transfer: "사업 양도",
  };

  const handleReview = (id: number, action: "approve" | "reject") => {
    if (action === "reject") {
      Alert.prompt(
        "반려 사유",
        "반려 사유를 입력해주세요",
        (reason) => {
          if (!reason?.trim()) return;
          reviewMutation.mutate({ applicationId: id, action: "rejected", rejectionReason: reason.trim() });
        },
        "plain-text"
      );
    } else {
      Alert.alert("승인 확인", "판매자 신청을 승인하시겠습니까?", [
        { text: "취소", style: "cancel" },
        { text: "승인", onPress: () => reviewMutation.mutate({ applicationId: id, action: "approved" }) },
      ]);
    }
  };

  if (isLoading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;

  return (
    <FlatList
      data={applications ?? []}
      keyExtractor={(item: any) => String(item.id)}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🏢</Text>
          <Text style={[styles.emptyTitle, { color: colors.muted }]}>판매자 신청이 없습니다.</Text>
        </View>
      }
      renderItem={({ item }: { item: any }) => {
        const isPending = item.sellerStatus === "pending";
        const statusColor = item.sellerStatus === "approved" ? "#10B981" : item.sellerStatus === "rejected" ? "#EF4444" : "#F59E0B";
        const statusLabel = item.sellerStatus === "approved" ? "승인" : item.sellerStatus === "rejected" ? "반려" : "심사중";
        return (
          <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
              <Text style={[styles.listCardTitle, { color: colors.foreground }]}>{item.businessName ?? "상호 없음"}</Text>
              <View style={[styles.badge, { backgroundColor: statusColor + "20" }]}>
                <Text style={{ color: statusColor, fontSize: 11, fontWeight: "700" }}>{statusLabel}</Text>
              </View>
            </View>
            <Text style={[styles.listCardSub, { color: colors.muted }]}>
              신청자: {item.name ?? "알 수 없음"} ({item.email})
            </Text>
            <Text style={[styles.listCardSub, { color: colors.muted }]}>
              유형: {SELLER_TYPE_LABELS[item.sellerType] ?? item.sellerType} · 사업자번호: {item.businessNumber ?? "-"}
            </Text>
            <Text style={[styles.listCardSub, { color: colors.muted }]}>
              대표자: {item.representativeName ?? "-"}
            </Text>
            {item.rejectReason && (
              <Text style={[styles.listCardSub, { color: colors.error, marginTop: 4 }]}>
                반려 사유: {item.rejectReason}
              </Text>
            )}
            {isPending && (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: "#10B981" }]}
                  onPress={() => handleReview(item.id, "approve")}
                >
                  <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>승인</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.error }]}
                  onPress={() => handleReview(item.id, "reject")}
                >
                  <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>반려</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      }}
    />
  );
}

// ─── 업체 신청 탭 ─────────────────────────────

function CompanyApplicationsTab({ colors }: { colors: any }) {
  const { data: applications, isLoading, refetch } = trpc.admin.companyApplications.useQuery();
    const reviewMutation = trpc.admin.reviewCompanyApplication.useMutation({
    onSuccess: () => {
      Alert.alert("완료", "처리되었습니다.");
      refetch();
    },
    onError: (e: any) => Alert.alert("오류", e.message),
  });
  const COMPANY_TYPE_LABELS: Record<string, string> = {
    demolition: "철거업체",
    interior: "인테리어업체",
    waste: "폐기물처리업체",
    signage: "간판업체",
    pos: "POS업체",
    cleaning: "청소업체",
    tax: "세무사",
    labor: "노무사",
  };

    const handleReview = (id: number, action: "approve" | "reject") => {
    if (action === "reject") {
      Alert.prompt(
        "반려 사유",
        "반려 사유를 입력해주세요",
        (reason) => {
          if (!reason?.trim()) return;
          reviewMutation.mutate({ userId: id, action: "rejected", rejectionReason: reason.trim() });
        },
        "plain-text"
      );
    } else {
      Alert.alert("승인 확인", "업체 등록 신청을 승인하시겠습니까?", [
        { text: "취소", style: "cancel" },
        { text: "승인", onPress: () => reviewMutation.mutate({ userId: id, action: "approved" }) },
      ]);
    }
  };
  if (isLoading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;

  return (
    <FlatList
      data={applications ?? []}
      keyExtractor={(item: any) => String(item.id)}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🏢</Text>
          <Text style={[styles.emptyTitle, { color: colors.muted }]}>업체 등록 신청이 없습니다.</Text>
        </View>
      }
      renderItem={({ item }: { item: any }) => {
        const isPending = item.status === "pending";
        const statusColor = item.status === "approved" ? "#10B981" : item.status === "rejected" ? "#EF4444" : "#F59E0B";
        const statusLabel = item.status === "approved" ? "승인" : item.status === "rejected" ? "반려" : "심사중";
        return (
          <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
              <Text style={[styles.listCardTitle, { color: colors.foreground }]}>{item.companyName ?? "업체명 없음"}</Text>
              <View style={[styles.badge, { backgroundColor: statusColor + "20" }]}>
                <Text style={{ color: statusColor, fontSize: 11, fontWeight: "700" }}>{statusLabel}</Text>
              </View>
            </View>
            <Text style={[styles.listCardSub, { color: colors.muted }]}>
              신청자: {item.userName ?? "알 수 없음"} ({item.userEmail})
            </Text>
            <Text style={[styles.listCardSub, { color: colors.muted }]}>
              유형: {COMPANY_TYPE_LABELS[item.companyType] ?? item.companyType} · 연락체: {item.companyPhone ?? "-"}
            </Text>
            <Text style={[styles.listCardSub, { color: colors.muted }]}>
              주소: {item.companyAddress ?? "-"}
            </Text>
            {item.rejectReason && (
              <Text style={[styles.listCardSub, { color: colors.error, marginTop: 4 }]}>
                반려 사유: {item.rejectReason}
              </Text>
            )}
            {isPending && (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: "#10B981" }]}
                  onPress={() => handleReview(item.id, "approve")}
                >
                  <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>승인</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.error }]}
                  onPress={() => handleReview(item.id, "reject")}
                >
                  <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>반려</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      }}
    />
  );
}

// ─── 공지사항 탭 ─────────────────────────────────────────────

function NoticesTab({
  colors,
  noticeTitle,
  setNoticeTitle,
  noticeContent,
  setNoticeContent,
  noticePinned,
  setNoticePinned,
}: {
  colors: any;
  noticeTitle: string;
  setNoticeTitle: (v: string) => void;
  noticeContent: string;
  setNoticeContent: (v: string) => void;
  noticePinned: boolean;
  setNoticePinned: (v: boolean) => void;
}) {
  const { data: notices, isLoading, refetch } = trpc.admin.notices.useQuery();
  const createMutation = trpc.admin.createNotice.useMutation({
    onSuccess: () => {
      Alert.alert("완료", "공지사항이 등록되었습니다.");
      setNoticeTitle("");
      setNoticeContent("");
      setNoticePinned(false);
      refetch();
    },
    onError: (e: any) => Alert.alert("오류", e.message),
  });
  const deleteMutation = trpc.admin.deleteNotice.useMutation({
    onSuccess: () => { Alert.alert("완료", "공지사항이 삭제되었습니다."); refetch(); },
    onError: (e: any) => Alert.alert("오류", e.message),
  });

  const handleCreate = () => {
    if (!noticeTitle.trim()) return Alert.alert("입력 오류", "제목을 입력해주세요.");
    if (!noticeContent.trim()) return Alert.alert("입력 오류", "내용을 입력해주세요.");
    createMutation.mutate({ title: noticeTitle.trim(), content: noticeContent.trim(), isPinned: noticePinned });
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* 작성 폼 */}
      <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>📢 공지사항 작성</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
          placeholder="제목"
          placeholderTextColor={colors.muted}
          value={noticeTitle}
          onChangeText={setNoticeTitle}
        />
        <TextInput
          style={[styles.input, styles.textarea, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
          placeholder="내용을 입력하세요..."
          placeholderTextColor={colors.muted}
          value={noticeContent}
          onChangeText={setNoticeContent}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />
        <TouchableOpacity
          style={[styles.pinToggle, { borderColor: noticePinned ? colors.primary : colors.border }]}
          onPress={() => setNoticePinned(!noticePinned)}
        >
          <Text style={{ color: noticePinned ? colors.primary : colors.muted, fontSize: 14 }}>
            {noticePinned ? "📌 상단 고정" : "📌 상단 고정 (비활성)"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: createMutation.isPending ? 0.6 : 1 }]}
          onPress={handleCreate}
          disabled={createMutation.isPending}
        >
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
            {createMutation.isPending ? "등록 중..." : "공지사항 등록"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 공지 목록 */}
      <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 24 }]}>공지사항 목록</Text>
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
      ) : (notices ?? []).length === 0 ? (
        <Text style={[styles.emptyDesc, { color: colors.muted, textAlign: "center", marginTop: 16 }]}>
          등록된 공지사항이 없습니다.
        </Text>
      ) : (
        (notices ?? []).map((notice: any) => (
          <View
            key={notice.id}
            style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={styles.listCardRow}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  {notice.isPinned && (
                    <View style={[styles.badge, { backgroundColor: "#3B82F620" }]}>
                      <Text style={{ color: "#3B82F6", fontSize: 10 }}>📌 고정</Text>
                    </View>
                  )}
                  <Text style={[styles.listCardTitle, { color: colors.foreground }]} numberOfLines={1}>
                    {notice.title}
                  </Text>
                </View>
                <Text style={[styles.listCardSub, { color: colors.muted }]} numberOfLines={2}>
                  {notice.content}
                </Text>
                <Text style={[styles.listCardSub, { color: colors.muted }]}>
                  {new Date(notice.createdAt).toLocaleDateString("ko-KR")}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.deleteBtn, { borderColor: colors.error }]}
                onPress={() =>
                  Alert.alert("삭제 확인", "이 공지사항을 삭제하시겠습니까?", [
                    { text: "취소", style: "cancel" },
                    { text: "삭제", style: "destructive", onPress: () => deleteMutation.mutate({ noticeId: notice.id }) },
                  ])
                }
              >
                <Text style={{ color: colors.error, fontSize: 12 }}>삭제</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, alignItems: "flex-start" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  tabBar: { borderBottomWidth: 1, maxHeight: 48 },
  tabItem: { paddingHorizontal: 16, paddingVertical: 12, marginRight: 4 },
  tabLabel: { fontSize: 14, fontWeight: "600" },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statCard: {
    width: "47%",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    gap: 4,
  },
  statValue: { fontSize: 24, fontWeight: "800" },
  statLabel: { fontSize: 12, textAlign: "center" },
  quickMenu: { gap: 10 },
  quickItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickLabel: { flex: 1, fontSize: 15, fontWeight: "600" },
  listCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  listCardRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  listCardTitle: { fontSize: 15, fontWeight: "600", marginBottom: 2 },
  listCardSub: { fontSize: 12, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  deleteBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1 },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  actionBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  formCard: { borderRadius: 12, borderWidth: 1, padding: 16, gap: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  textarea: { height: 120, paddingTop: 10 },
  pinToggle: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  emptyTitle: { fontSize: 16, fontWeight: "600", marginTop: 12 },
  emptyDesc: { fontSize: 14, marginTop: 6 },
});
