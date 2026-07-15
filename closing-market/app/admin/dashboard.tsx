"use client";

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
  Pressable,
  Image,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/lib/auth-store";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { LucideIcon } from "@/components/ui/icon-lucide";

type TabType = "overview" | "products" | "sellers" | "companies" | "reports" | "users" | "notices" | "inquiries";

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
          <View style={{ marginBottom: 16 }}>
            <LucideIcon name="lock" size={48} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>접근 권한 없음</Text>
          <Text style={[styles.emptyDesc, { color: colors.muted }]}>관리자만 접근할 수 있습니다.</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]} className="bg-background">
      {/* 헤더 */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>관리자 대시보드</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* 탭 바 - 프리미엄 스타일 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabBar, { borderBottomColor: colors.border, flexGrow: 0 }]}
        contentContainerStyle={{ paddingHorizontal: 16, alignItems: "flex-start" }}
      >
        {(["overview", "products", "sellers", "companies", "reports", "users", "notices", "inquiries"] as TabType[]).map((tab) => {
          const getTabIcon = (tab: TabType) => {
            const iconMap: Record<TabType, string> = {
              overview: "bar-chart",
              products: "package",
              sellers: "briefcase",
              companies: "building",
              reports: "alert-triangle",
              users: "users",
              notices: "bell",
              inquiries: "message",
            };
            return iconMap[tab];
          };
          const labels: Record<TabType, string> = {
            overview: "개요",
            products: "상품",
            sellers: "판매자",
            companies: "업체",
            reports: "신고",
            users: "회원",
            notices: "공지",
            inquiries: "문의",
          };
          const isActive = activeTab === tab;
          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={({ pressed }) => [
                styles.tabItem,
                {
                  opacity: pressed ? 0.7 : 1,
                  borderBottomColor: isActive ? colors.primary : "transparent",
                  borderBottomWidth: isActive ? 3 : 0,
                },
              ]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <LucideIcon name={getTabIcon(tab) as any} size={18} color={isActive ? colors.primary : colors.muted} />
                <Text style={[styles.tabLabel, { color: isActive ? colors.primary : colors.muted }]}>
                  {labels[tab]}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* 탭 콘텐츠 */}
      {activeTab === "overview" && <OverviewTab colors={colors} router={router} setActiveTab={setActiveTab} />}
      {activeTab === "products" && <ProductsTab colors={colors} />}
      {activeTab === "sellers" && <SellerApplicationsTab colors={colors} />}
      {activeTab === "companies" && <CompanyApplicationsTab colors={colors} />}
      {activeTab === "reports" && <ReportsTab colors={colors} />}
      {activeTab === "users" && <UsersTab colors={colors} />}
      {activeTab === "inquiries" && <InquiriesTab colors={colors} />}
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

function OverviewTab({ colors, router, setActiveTab }: { colors: any; router: any; setActiveTab: (tab: TabType) => void }) {
  const { data: stats, isLoading, refetch } = trpc.admin.stats.useQuery();

  const statCards: { label: string; value: number; icon: string; color: string; tab?: TabType }[] = [
    { label: "전체 회원", value: stats?.totalUsers ?? 0, icon: "users", color: colors.primary, tab: "users" },
    { label: "전체 상품", value: stats?.totalProducts ?? 0, icon: "package", color: "#10B981", tab: "products" },
    { label: "전체 신고", value: stats?.totalReports ?? 0, icon: "alert-triangle", color: "#EF4444", tab: "reports" },
    { label: "미처리 신고", value: stats?.pendingReports ?? 0, icon: "alert-circle", color: "#F59E0B", tab: "reports" },
    { label: "판매자 심사 대기", value: stats?.pendingSellers ?? 0, icon: "briefcase", color: "#8B5CF6", tab: "sellers" },
  ];

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
    >
      {/* 플랫폼 현황 */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>플랫폼 현황</Text>

      <View style={styles.statsGrid}>
        {statCards.map((card) => (
          <Pressable
            key={card.label}
            style={({ pressed }) => [
              styles.statCard,
              { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => card.tab && setActiveTab(card.tab)}
          >
            <LucideIcon name={card.icon as any} size={28} color={card.color} />
            <Text style={[styles.statValue, { color: card.color }]}>{card.value.toLocaleString()}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>{card.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* 빠른 메뉴 */}
      <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 28 }]}> 빠른 메뉴</Text>
      <View style={styles.quickMenu}>
        {[
          { label: "판매자 신청 관리", icon: "briefcase", tab: "sellers" as TabType },
          { label: "업체 신청 관리", icon: "building", tab: "companies" as TabType },
          { label: "신고 처리", icon: "alert-triangle", tab: "reports" as TabType },
          { label: "공지사항 작성", icon: "bell", tab: "notices" as TabType },
        ].map((item) => (
          <Pressable
            key={item.label}
            style={({ pressed }) => [
              styles.quickItem,
              { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => setActiveTab(item.tab)}
          >
            <LucideIcon name={item.icon as any} size={24} color={colors.primary} />
            <Text style={[styles.quickLabel, { color: colors.foreground }]}>{item.label}</Text>
            <IconSymbol name="chevron.right" size={18} color={colors.muted} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── 상품 관리 탭 ─────────────────────────────────────────────

function ProductsTab({ colors }: { colors: any }) {
  const { data: products, isLoading, refetch } = trpc.admin.allProducts.useQuery();
  const deleteMutation = trpc.admin.deleteProduct.useMutation({
    onSuccess: () => {
      Alert.alert("완료", "상품이 삭제되었습니다.");
      refetch();
    },
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
    cafe: "카페",
    pcroom: "PC방",
    restaurant: "식당",
    gym: "헬스장",
    office: "사무실",
    warehouse: "창고재고",
    transfer: "사업양도",
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
          <LucideIcon name="package" size={40} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.muted }]}>등록된 상품이 없습니다.</Text>
        </View>
      }
      renderItem={({ item }: { item: any }) => {
        const status = STATUS_LABELS[item.status] ?? { label: item.status, color: "#6B7280" };
        return (
          <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.listCardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.listCardTitle, { color: colors.foreground }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[styles.listCardSub, { color: colors.muted }]}>
                  {CATEGORY_LABELS[item.category] ?? item.category} · {item.sellerName ?? "알 수 없음"}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: status.color + "20" }]}>
                <Text style={{ color: status.color, fontSize: 12, fontWeight: "600" }}>{status.label}</Text>
              </View>
            </View>
            <View style={[styles.listCardFooter, { borderTopColor: colors.border }]}>
              <Text style={[styles.listCardSub, { color: colors.muted }]}>
                {Number(item.price).toLocaleString()}원 · 조회 {item.viewCount}
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.deleteBtn,
                  { borderColor: colors.error, opacity: pressed ? 0.6 : 1 },
                ]}
                onPress={() => handleDelete(item.id, item.title)}
              >
                <Text style={{ color: colors.error, fontSize: 12, fontWeight: "600" }}>삭제</Text>
              </Pressable>
            </View>
          </View>
        );
      }}
    />
  );
}

// ─── 신고 관리 탭 ─────────────────────────────────────────────

function InquiriesTab({ colors }: { colors: any }) {
  const { data: inquiries, isLoading, refetch } = trpc.admin.allInquiries.useQuery();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [answerText, setAnswerText] = useState("");

  const answerMutation = trpc.admin.answerInquiry.useMutation({
    onSuccess: () => {
      Alert.alert("완료", "답변이 등록되었습니다.");
      setExpandedId(null);
      setAnswerText("");
      refetch();
    },
    onError: (e: any) => Alert.alert("오류", e.message),
  });

  const CATEGORY_LABELS: Record<string, string> = {
    account: "계정", product: "상품", payment: "결제", report: "신고",
    seller: "판매회원", company: "업체회원", etc: "기타",
  };

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  }

  return (
    <FlatList
      data={inquiries ?? []}
      keyExtractor={(item: any) => String(item.id)}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      ListEmptyComponent={
        <View style={styles.center}>
          <LucideIcon name="message" size={40} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.muted }]}>문의 내역이 없습니다.</Text>
        </View>
      }
      renderItem={({ item }: { item: any }) => {
        const expanded = expandedId === item.id;
        return (
          <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <View style={[styles.badge, { backgroundColor: colors.border }]}>
                <Text style={{ fontSize: 10, color: colors.muted, fontWeight: "600" }}>
                  {CATEGORY_LABELS[item.category] ?? "기타"}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: (item.status === "answered" ? colors.primary : "#F59E0B") + "20" }]}>
                <Text style={{ fontSize: 10, fontWeight: "700", color: item.status === "answered" ? colors.primary : "#F59E0B" }}>
                  {item.status === "answered" ? "답변완료" : "답변대기"}
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 6 }}>
              {item.title}
            </Text>
            <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 10 }}>{item.content}</Text>

            {item.status === "answered" ? (
              <View style={{ backgroundColor: colors.primary + "08", borderRadius: 8, padding: 10, borderWidth: 1, borderColor: colors.primary }}>
                <Text style={{ fontSize: 12, color: colors.foreground }}>{item.answerContent}</Text>
              </View>
            ) : expanded ? (
              <View>
                <TextInput
                  value={answerText}
                  onChangeText={setAnswerText}
                  placeholder="답변을 입력하세요"
                  placeholderTextColor={colors.muted}
                  multiline
                  style={{
                    borderWidth: 1, borderColor: colors.border, borderRadius: 8,
                    padding: 10, minHeight: 80, color: colors.foreground,
                    backgroundColor: colors.background, fontSize: 13, marginBottom: 8,
                  }}
                />
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Pressable
                    style={{ flex: 1, backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 10, alignItems: "center" }}
                    onPress={() => {
                      if (!answerText.trim()) {
                        Alert.alert("입력 필요", "답변 내용을 입력해주세요.");
                        return;
                      }
                      answerMutation.mutate({ inquiryId: item.id, answerContent: answerText.trim() });
                    }}
                  >
                    <Text style={{ color: "#222222", fontWeight: "700", fontSize: 13 }}>답변 등록</Text>
                  </Pressable>
                  <Pressable
                    style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}
                    onPress={() => { setExpandedId(null); setAnswerText(""); }}
                  >
                    <Text style={{ color: colors.muted, fontWeight: "600", fontSize: 13 }}>취소</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                style={{ alignSelf: "flex-start", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: colors.primary + "15" }}
                onPress={() => { setExpandedId(item.id); setAnswerText(""); }}
              >
                <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 12 }}>답변하기</Text>
              </Pressable>
            )}
          </View>
        );
      }}
    />
  );
}

function ReportsTab({ colors }: { colors: any }) {
  const { data: reports, isLoading, refetch } = trpc.admin.allReports.useQuery();
  const resolveMutation = trpc.admin.resolveReport.useMutation({
    onSuccess: () => {
      Alert.alert("완료", "신고가 처리되었습니다.");
      refetch();
    },
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
    product: "상품",
    user: "회원",
    comment: "댓글",
    chat: "채팅",
  };

  const STATUS_COLORS: Record<string, string> = {
    pending: "#F59E0B",
    resolved: "#10B981",
    dismissed: "#6B7280",
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
          <LucideIcon name="alert-triangle" size={40} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.muted }]}>신고 내역이 없습니다.</Text>
        </View>
      }
      renderItem={({ item }: { item: any }) => (
        <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.listCardHeader}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
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
              <Text style={[styles.listCardSub, { color: colors.muted }]}>신고자: {item.reporterName ?? "알 수 없음"}</Text>
            </View>
          </View>
          {item.status === "pending" && (
            <View style={[styles.actionRow, { borderTopColor: colors.border }]}>
              <Pressable
                style={({ pressed }) => [
                  styles.actionBtn,
                  { backgroundColor: "#10B981", opacity: pressed ? 0.85 : 1 },
                ]}
                onPress={() => handleResolve(item.id, "resolved")}
              >
                <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>처리 완료</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.actionBtn,
                  { backgroundColor: colors.muted, opacity: pressed ? 0.85 : 1 },
                ]}
                onPress={() => handleResolve(item.id, "dismissed")}
              >
                <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>기각</Text>
              </Pressable>
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

  const suspendMutation = trpc.admin.suspendUser.useMutation({
    onSuccess: () => refetch(),
    onError: (err) => Alert.alert("처리 실패", err.message),
  });
  const reactivateMutation = trpc.admin.reactivateUser.useMutation({
    onSuccess: () => refetch(),
    onError: (err) => Alert.alert("처리 실패", err.message),
  });

  const handleSuspend = (userId: number, name: string) => {
    Alert.prompt
      ? Alert.prompt(
          "회원 정지",
          `${name} 님을 정지하시겠습니까? 정지 사유를 입력해주세요. (선택)`,
          [
            { text: "취소", style: "cancel" },
            {
              text: "정지",
              style: "destructive",
              onPress: (reason?: string) => suspendMutation.mutate({ userId, reason: reason || undefined }),
            },
          ],
          "plain-text"
        )
      : Alert.alert("회원 정지", `${name} 님을 정지하시겠습니까?`, [
          { text: "취소", style: "cancel" },
          { text: "정지", style: "destructive", onPress: () => suspendMutation.mutate({ userId }) },
        ]);
  };

  const handleReactivate = (userId: number, name: string) => {
    Alert.alert("정지 해제", `${name} 님의 정지를 해제하시겠습니까?`, [
      { text: "취소", style: "cancel" },
      { text: "해제", onPress: () => reactivateMutation.mutate({ userId }) },
    ]);
  };

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
          <LucideIcon name="users" size={40} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.muted }]}>회원이 없습니다.</Text>
        </View>
      }
      renderItem={({ item }: { item: any }) => {
        const sellerInfo = item.sellerStatus ? SELLER_STATUS[item.sellerStatus] : null;
        const isSuspended = !!item.suspendedAt;
        const isDeleted = !!item.deletedAt;
        return (
          <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.listCardRow}>
              <View style={[styles.avatar, { backgroundColor: colors.primary + "15" }]}>
                <IconSymbol name="person.fill" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                  <Text style={[styles.listCardTitle, { color: colors.foreground }]}>
                    {item.name ?? "이름 없음"}
                  </Text>
                  {item.role === "admin" && (
                    <View style={[styles.badge, { backgroundColor: colors.primary + "15" }]}>
                      <Text style={{ color: colors.primary, fontSize: 10, fontWeight: "600" }}>관리자</Text>
                    </View>
                  )}
                  {sellerInfo && item.isVerified && (
                    <View style={[styles.badge, { backgroundColor: sellerInfo.color + "20" }]}>
                      <Text style={{ color: sellerInfo.color, fontSize: 10, fontWeight: "600" }}>
                        {sellerInfo.label}
                      </Text>
                    </View>
                  )}
                  {isDeleted && (
                    <View style={[styles.badge, { backgroundColor: "#6B728020" }]}>
                      <Text style={{ color: "#6B7280", fontSize: 10, fontWeight: "600" }}>탈퇴</Text>
                    </View>
                  )}
                  {isSuspended && (
                    <View style={[styles.badge, { backgroundColor: "#EF444420" }]}>
                      <Text style={{ color: "#EF4444", fontSize: 10, fontWeight: "600" }}>정지됨</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.listCardSub, { color: colors.muted }]}>{item.email ?? "이메일 없음"}</Text>
                <Text style={[styles.listCardSub, { color: colors.muted }]}>
                  {item.role === "seller"
                    ? "판매회원"
                    : item.role === "company"
                      ? "업체회원"
                      : item.role === "admin"
                        ? "관리자"
                        : "일반회원"}{" "}
                  · {new Date(item.createdAt).toLocaleDateString("ko-KR")}
                </Text>
                {isSuspended && item.suspendedReason && (
                  <Text style={{ color: "#EF4444", fontSize: 11, marginTop: 2 }}>사유: {item.suspendedReason}</Text>
                )}
              </View>
            </View>

            {!isDeleted && item.role !== "admin" && (
              <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 10, gap: 8 }}>
                {isSuspended ? (
                  <TouchableOpacity
                    style={{ paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8, backgroundColor: colors.primary + "15" }}
                    onPress={() => handleReactivate(item.id, item.name ?? "회원")}
                  >
                    <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700" }}>정지 해제</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={{ paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8, backgroundColor: "#EF444415" }}
                    onPress={() => handleSuspend(item.id, item.name ?? "회원")}
                  >
                    <Text style={{ color: "#EF4444", fontSize: 12, fontWeight: "700" }}>정지</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        );
      }}
    />
  );
}

// ─── 판매자 신청 탭 ─────────────────────────────

function SellerApplicationsTab({ colors }: { colors: any }) {
  const { data: applications, isLoading, refetch } = trpc.admin.sellerApplications.useQuery();
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const reviewMutation = trpc.admin.reviewApplication.useMutation({
    onSuccess: () => {
      Alert.alert("완료", "처리되었습니다.");
      setRejectingId(null);
      setRejectReasonInput("");
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
      // Alert.prompt는 iOS 전용 API라 안드로이드/웹에서는 별도 입력 폼으로 대체
      setRejectingId(id);
      setRejectReasonInput("");
    } else {
      Alert.alert("승인 확인", "판매자 신청을 승인하시겠습니까?", [
        { text: "취소", style: "cancel" },
        { text: "승인", onPress: () => reviewMutation.mutate({ applicationId: id, action: "approved" }) },
      ]);
    }
  };

  const submitReject = (id: number) => {
    if (!rejectReasonInput.trim()) {
      Alert.alert("입력 필요", "반려 사유를 입력해주세요.");
      return;
    }
    reviewMutation.mutate({ applicationId: id, action: "rejected", rejectionReason: rejectReasonInput.trim() });
  };

  if (isLoading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;

  return (
    <>
      <FlatList
        data={applications ?? []}
        keyExtractor={(item: any) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        ListEmptyComponent={
          <View style={styles.center}>
            <LucideIcon name="briefcase" size={40} color={colors.primary} />
            <Text style={[styles.emptyTitle, { color: colors.muted }]}>판매자 신청이 없습니다.</Text>
          </View>
        }
        renderItem={({ item }: { item: any }) => {
          const isPending = item.status === "pending";
          const statusColor =
            item.status === "approved" ? "#10B981" : item.status === "rejected" ? "#EF4444" : "#F59E0B";
          const statusLabel =
            item.status === "approved" ? "승인" : item.status === "rejected" ? "반려" : "심사중";
          return (
            <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.listCardHeader}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <View style={{ backgroundColor: "#8B5CF620", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                      <Text style={{ fontSize: 10, fontWeight: "700", color: "#8B5CF6" }}>판매자</Text>
                    </View>
                    <Text style={[styles.listCardTitle, { color: colors.foreground }]}>
                      {item.businessName ?? "상호 없음"}
                    </Text>
                  </View>
                  <Text style={[styles.listCardSub, { color: colors.muted }]}>
                    신청자: {item.name ?? "알 수 없음"} ({item.email ?? "-"})
                  </Text>
                  <Text style={[styles.listCardSub, { color: colors.muted }]}>
                    유형: {SELLER_TYPE_LABELS[item.sellerType] ?? item.sellerType}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: statusColor + "20" }]}>
                  <Text style={{ color: statusColor, fontSize: 11, fontWeight: "700" }}>{statusLabel}</Text>
                </View>
              </View>
              <View style={[styles.listCardFooter, { borderTopColor: colors.border }]}>
                <Text style={[styles.listCardSub, { color: colors.muted }]}>
                  사업자: {item.businessNumber ?? "-"} · 대표: {item.representativeName ?? "-"}
                </Text>
                {item.rejectionReason && (
                  <Text style={[styles.listCardSub, { color: colors.error, marginTop: 4 }]}>
                    반려 사유: {item.rejectionReason}
                  </Text>
                )}
              </View>

              {/* 첨부 서류/사진 */}
              {(item.businessCertUrl || item.businessPhotoUrl) && (
                <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                  {item.businessCertUrl && (
                    <Pressable onPress={() => setPreviewImage(item.businessCertUrl)}>
                      <Image source={{ uri: item.businessCertUrl }} style={{ width: 88, height: 88, borderRadius: 8, backgroundColor: colors.border }} />
                      <Text style={{ fontSize: 10, color: colors.muted, marginTop: 4, textAlign: "center" }}>사업자등록증</Text>
                    </Pressable>
                  )}
                  {item.businessPhotoUrl && (
                    <Pressable onPress={() => setPreviewImage(item.businessPhotoUrl)}>
                      <Image source={{ uri: item.businessPhotoUrl }} style={{ width: 88, height: 88, borderRadius: 8, backgroundColor: colors.border }} />
                      <Text style={{ fontSize: 10, color: colors.muted, marginTop: 4, textAlign: "center" }}>사업장 사진</Text>
                    </Pressable>
                  )}
                </View>
              )}

              {isPending && rejectingId !== item.id && (
                <View style={[styles.actionRow, { borderTopColor: colors.border }]}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.actionBtn,
                      { backgroundColor: "#10B981", opacity: pressed ? 0.85 : 1 },
                    ]}
                    onPress={() => handleReview(item.id, "approve")}
                  >
                    <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>승인</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.actionBtn,
                      { backgroundColor: colors.error, opacity: pressed ? 0.85 : 1 },
                    ]}
                    onPress={() => handleReview(item.id, "reject")}
                  >
                    <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>반려</Text>
                  </Pressable>
                </View>
              )}

              {/* 반려 사유 입력 폼 (Android/웹 호환) */}
              {isPending && rejectingId === item.id && (
                <View style={{ marginTop: 12 }}>
                  <TextInput
                    value={rejectReasonInput}
                    onChangeText={setRejectReasonInput}
                    placeholder="반려 사유를 입력해주세요"
                    placeholderTextColor={colors.muted}
                    multiline
                    style={{
                      borderWidth: 1, borderColor: colors.border, borderRadius: 8,
                      padding: 10, minHeight: 70, color: colors.foreground,
                      backgroundColor: colors.background, fontSize: 13, marginBottom: 8,
                    }}
                  />
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Pressable
                      style={{ flex: 1, backgroundColor: colors.error, borderRadius: 8, paddingVertical: 10, alignItems: "center" }}
                      onPress={() => submitReject(item.id)}
                    >
                      <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>반려 확정</Text>
                    </Pressable>
                    <Pressable
                      style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}
                      onPress={() => { setRejectingId(null); setRejectReasonInput(""); }}
                    >
                      <Text style={{ color: colors.muted, fontWeight: "600", fontSize: 13 }}>취소</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          );
        }}
      />

      {/* 사진 전체화면 미리보기 */}
      {previewImage && (
        <Pressable
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#000000E6", justifyContent: "center", alignItems: "center" }}
          onPress={() => setPreviewImage(null)}
        >
          <Image source={{ uri: previewImage }} style={{ width: "90%", height: "70%" }} resizeMode="contain" />
        </Pressable>
      )}
    </>
  );
}

// ─── 업체 신청 탭 ─────────────────────────────

function CompanyApplicationsTab({ colors }: { colors: any }) {
  const { data: applications, isLoading, refetch } = trpc.admin.companyApplications.useQuery();
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const reviewMutation = trpc.admin.reviewCompanyApplication.useMutation({
    onSuccess: () => {
      Alert.alert("완료", "처리되었습니다.");
      setRejectingId(null);
      setRejectReasonInput("");
      refetch();
    },
    onError: (e: any) => Alert.alert("오류", e.message),
  });

  const COMPANY_TYPE_LABELS: Record<string, string> = {
    demolition: "철거업체",
    interior: "인테리어업체",
    waste: "폐기물처리업체",
    signage: "간판·사인업체",
    pos: "POS·키오스크업체",
    cctv: "CCTV·보안업체",
    kitchen: "주방기기업체",
    cleaning: "청소·방역업체",
    tax: "전문 상담 (세무사)",
    labor: "전문 상담 (노무사)",
    consulting: "창업 컨설팅",
  };

  const handleReview = (id: number, action: "approve" | "reject") => {
    if (action === "reject") {
      // Alert.prompt는 iOS 전용 API라 안드로이드/웹에서는 별도 입력 폼으로 대체
      setRejectingId(id);
      setRejectReasonInput("");
    } else {
      Alert.alert("승인 확인", "업체 등록 신청을 승인하시겠습니까?", [
        { text: "취소", style: "cancel" },
        { text: "승인", onPress: () => reviewMutation.mutate({ userId: id, action: "approved" }) },
      ]);
    }
  };

  const submitReject = (id: number) => {
    if (!rejectReasonInput.trim()) {
      Alert.alert("입력 필요", "반려 사유를 입력해주세요.");
      return;
    }
    reviewMutation.mutate({ userId: id, action: "rejected", rejectionReason: rejectReasonInput.trim() });
  };

  if (isLoading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;

  return (
    <>
      <FlatList
        data={applications ?? []}
        keyExtractor={(item: any) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        ListEmptyComponent={
          <View style={styles.center}>
            <LucideIcon name="building" size={40} color={colors.primary} />
            <Text style={[styles.emptyTitle, { color: colors.muted }]}>업체 등록 신청이 없습니다.</Text>
          </View>
        }
        renderItem={({ item }: { item: any }) => {
          const isPending = item.companyStatus === "pending";
          const statusColor = item.companyStatus === "approved" ? "#10B981" : item.companyStatus === "rejected" ? "#EF4444" : "#F59E0B";
          const statusLabel = item.companyStatus === "approved" ? "승인" : item.companyStatus === "rejected" ? "반려" : "심사중";
          return (
            <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.listCardHeader}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <View style={{ backgroundColor: colors.primary + "20", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                      <Text style={{ fontSize: 10, fontWeight: "700", color: colors.primary }}>업체</Text>
                    </View>
                    <Text style={[styles.listCardTitle, { color: colors.foreground }]}>
                      {item.companyName ?? "업체명 없음"}
                    </Text>
                  </View>
                  <Text style={[styles.listCardSub, { color: colors.muted }]}>
                    신청자: {item.name ?? "알 수 없음"} ({item.email})
                  </Text>
                  <Text style={[styles.listCardSub, { color: colors.muted }]}>
                    유형: {COMPANY_TYPE_LABELS[item.companyType] ?? item.companyType}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: statusColor + "20" }]}>
                  <Text style={{ color: statusColor, fontSize: 11, fontWeight: "700" }}>{statusLabel}</Text>
                </View>
              </View>
              <View style={[styles.listCardFooter, { borderTopColor: colors.border }]}>
                <Text style={[styles.listCardSub, { color: colors.muted }]}>
                  사업자등록번호: {item.businessNumber ?? "-"} · 대표자: {item.representativeName ?? "-"}
                </Text>
                <Text style={[styles.listCardSub, { color: colors.muted }]}>
                  연락: {item.companyPhone ?? "-"} · 주소: {item.companyAddress ?? "-"}
                </Text>
                {item.companyRejectionReason && (
                  <Text style={[styles.listCardSub, { color: colors.error, marginTop: 4 }]}>
                    반려 사유: {item.companyRejectionReason}
                  </Text>
                )}
              </View>

              {/* 업체 로고 & 사업자등록증 */}
              {(item.companyLogoUrl || item.companyBusinessCertUrl) && (
                <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                  {item.companyLogoUrl && (
                    <Pressable onPress={() => setPreviewImage(item.companyLogoUrl)}>
                      <Image source={{ uri: item.companyLogoUrl }} style={{ width: 88, height: 88, borderRadius: 8, backgroundColor: colors.border }} />
                      <Text style={{ fontSize: 10, color: colors.muted, marginTop: 4, textAlign: "center" }}>업체 로고</Text>
                    </Pressable>
                  )}
                  {item.companyBusinessCertUrl && (
                    <Pressable onPress={() => setPreviewImage(item.companyBusinessCertUrl)}>
                      <Image source={{ uri: item.companyBusinessCertUrl }} style={{ width: 88, height: 88, borderRadius: 8, backgroundColor: colors.border }} />
                      <Text style={{ fontSize: 10, color: colors.muted, marginTop: 4, textAlign: "center" }}>사업자등록증</Text>
                    </Pressable>
                  )}
                </View>
              )}

              {isPending && rejectingId !== item.id && (
                <View style={[styles.actionRow, { borderTopColor: colors.border }]}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.actionBtn,
                      { backgroundColor: "#10B981", opacity: pressed ? 0.85 : 1 },
                    ]}
                    onPress={() => handleReview(item.id, "approve")}
                  >
                    <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>승인</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.actionBtn,
                      { backgroundColor: colors.error, opacity: pressed ? 0.85 : 1 },
                    ]}
                    onPress={() => handleReview(item.id, "reject")}
                  >
                    <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>반려</Text>
                  </Pressable>
                </View>
              )}

              {/* 반려 사유 입력 폼 (Android/웹 호환) */}
              {isPending && rejectingId === item.id && (
                <View style={{ marginTop: 12 }}>
                  <TextInput
                    value={rejectReasonInput}
                    onChangeText={setRejectReasonInput}
                    placeholder="반려 사유를 입력해주세요"
                    placeholderTextColor={colors.muted}
                    multiline
                    style={{
                      borderWidth: 1, borderColor: colors.border, borderRadius: 8,
                      padding: 10, minHeight: 70, color: colors.foreground,
                      backgroundColor: colors.background, fontSize: 13, marginBottom: 8,
                    }}
                  />
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Pressable
                      style={{ flex: 1, backgroundColor: colors.error, borderRadius: 8, paddingVertical: 10, alignItems: "center" }}
                      onPress={() => submitReject(item.id)}
                    >
                      <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>반려 확정</Text>
                    </Pressable>
                    <Pressable
                      style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}
                      onPress={() => { setRejectingId(null); setRejectReasonInput(""); }}
                    >
                      <Text style={{ color: colors.muted, fontWeight: "600", fontSize: 13 }}>취소</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          );
        }}
      />

      {/* 사진 전체화면 미리보기 */}
      {previewImage && (
        <Pressable
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#000000E6", justifyContent: "center", alignItems: "center" }}
          onPress={() => setPreviewImage(null)}
        >
          <Image source={{ uri: previewImage }} style={{ width: "90%", height: "70%" }} resizeMode="contain" />
        </Pressable>
      )}
    </>
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
    onSuccess: () => {
      Alert.alert("완료", "공지사항이 삭제되었습니다.");
      refetch();
    },
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
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>공지사항 작성</Text>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: colors.border,
              color: colors.foreground,
              backgroundColor: colors.background,
            },
          ]}
          placeholder="제목"
          placeholderTextColor={colors.muted}
          value={noticeTitle}
          onChangeText={setNoticeTitle}
        />
        <TextInput
          style={[
            styles.input,
            styles.textarea,
            {
              borderColor: colors.border,
              color: colors.foreground,
              backgroundColor: colors.background,
            },
          ]}
          placeholder="내용을 입력하세요..."
          placeholderTextColor={colors.muted}
          value={noticeContent}
          onChangeText={setNoticeContent}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />
        <Pressable
          style={({ pressed }) => [
            styles.pinToggle,
            {
              borderColor: noticePinned ? colors.primary : colors.border,
              backgroundColor: noticePinned ? colors.primary + "10" : "transparent",
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          onPress={() => setNoticePinned(!noticePinned)}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <LucideIcon name="pin" size={14} color={noticePinned ? colors.primary : colors.muted} strokeWidth={1.8} />
            <Text style={{ color: noticePinned ? colors.primary : colors.muted, fontSize: 14, fontWeight: "600" }}>
              {noticePinned ? "상단 고정" : "상단 고정 (비활성)"}
            </Text>
          </View>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.submitBtn,
            {
              backgroundColor: colors.primary,
              opacity: createMutation.isPending ? 0.6 : pressed ? 0.85 : 1,
            },
          ]}
          onPress={handleCreate}
          disabled={createMutation.isPending}
        >
          <Text style={{ color: "#000000", fontWeight: "700", fontSize: 15 }}>
            {createMutation.isPending ? "등록 중..." : "공지사항 등록"}
          </Text>
        </Pressable>
      </View>

      {/* 공지 목록 */}
      <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 28 }]}>공지사항 목록</Text>
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
            <View style={styles.listCardHeader}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  {notice.isPinned && (
                    <View style={[styles.badge, { backgroundColor: colors.primary + "15", flexDirection: "row", alignItems: "center", gap: 3 }]}>
                      <LucideIcon name="pin" size={10} color={colors.primary} strokeWidth={1.8} />
                      <Text style={{ color: colors.primary, fontSize: 10, fontWeight: "600" }}>고정</Text>
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
            </View>
            <View style={[styles.actionRow, { borderTopColor: colors.border }]}>
              <Pressable
                style={({ pressed }) => [
                  styles.deleteBtn,
                  { borderColor: colors.error, opacity: pressed ? 0.6 : 1 },
                ]}
                onPress={() =>
                  Alert.alert("삭제 확인", "이 공지사항을 삭제하시겠습니까?", [
                    { text: "취소", style: "cancel" },
                    {
                      text: "삭제",
                      style: "destructive",
                      onPress: () => deleteMutation.mutate({ noticeId: notice.id }),
                    },
                  ])
                }
              >
                <Text style={{ color: colors.error, fontSize: 12, fontWeight: "600" }}>삭제</Text>
              </Pressable>
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
  backBtn: {
    width: 40,
    alignItems: "flex-start",
    justifyContent: "center",
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  tabBar: {
    borderBottomWidth: 1,
    maxHeight: 48,
  },
  tabItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 4,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    width: "47%",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    gap: 6,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
    fontWeight: "500",
  },
  quickMenu: {
    gap: 12,
  },
  quickItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  quickLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
  listCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
  },
  listCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
  },
  listCardRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
  },
  listCardFooter: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 6,
  },
  listCardTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  listCardSub: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: "500",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  deleteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  formCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: "500",
  },
  textarea: {
    height: 120,
    paddingTop: 12,
  },
  pinToggle: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptyDesc: {
    fontSize: 14,
    marginTop: 6,
  },
});
