import { View, Text, ScrollView, Pressable, Alert, StyleSheet, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { LucideIcon } from "@/components/ui/icon-lucide";
import { useColors } from "@/hooks/use-colors";
import { useAuthStore } from "@/lib/auth-store";
import { trpc } from "@/lib/trpc";

const BASE_MENU_ITEMS = [
  { id: "products", label: "내 상품", icon: "tag.fill" as const },
  { id: "purchases", label: "내 구매내역", icon: "list.bullet" as const },
  { id: "favorites", label: "찜 목록", icon: "heart.fill" as const },
  { id: "chatlist", label: "채팅 목록", icon: "bubble.left.fill" as const },
  { id: "recent", label: "최근 본 상품", icon: "clock.fill" as const },
  { id: "reviews", label: "받은 후기", icon: "star.fill" as const },
];

const COMPANY_MENU_ITEMS = [
  { id: "companyEdit", label: "업체 정보 수정", icon: "building.2.fill" as const },
  { id: "companyInquiries", label: "업체 문의함", icon: "bubble.left.fill" as const },
];

const SETTINGS_ITEMS = [
  { id: "notification", label: "알림 설정", icon: "bell.fill" as const },
  { id: "support", label: "고객센터 문의", icon: "questionmark.circle.fill" as const },
  { id: "account", label: "계정 설정", icon: "gear" as const },
  { id: "terms", label: "이용약관", icon: "doc.text" as const },
  { id: "privacy", label: "개인정보처리방침", icon: "doc.text" as const },
  { id: "licenses", label: "오픈소스 라이선스", icon: "doc.text" as const },
];

export default function MyPageScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, token, clearAuth } = useAuthStore();
  const isAuthenticated = !!token && !!user;

  const { data: sellerProfile } = trpc.seller.myProfile.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const isVerifiedSeller = sellerProfile?.isVerified && sellerProfile?.sellerStatus === "approved";
  const isPendingSeller = sellerProfile?.sellerStatus === "pending";
  const isRejectedSeller = sellerProfile?.sellerStatus === "rejected";
  const isApprovedCompany = user?.role === "company" && user?.companyStatus === "approved";

  const MENU_ITEMS = isApprovedCompany ? [...COMPANY_MENU_ITEMS, ...BASE_MENU_ITEMS] : BASE_MENU_ITEMS;

  const handleLogout = () => {
    if (Platform.OS === "web") {
      // react-native-web에서는 Alert.alert의 버튼 콜백이 동작하지 않는 경우가 있어
      // 브라우저 기본 confirm으로 대체합니다.
      if (window.confirm("정말 로그아웃하시겠습니까?")) {
        clearAuth().then(() => router.replace("/" as any));
      }
      return;
    }
    Alert.alert("로그아웃", "정말 로그아웃하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "로그아웃",
        style: "destructive",
        onPress: async () => {
          await clearAuth();
          router.replace("/" as any);
        },
      },
    ]);
  };

  const handleLogin = () => {
    router.push("/auth/login" as any);
  };

  // 회원 유형 배지 렌더링
  const renderRoleBadge = () => {
    if (user?.role === "admin") {
      return (
        <View style={[styles.badge, { backgroundColor: colors.primary + "12", borderColor: colors.primary, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 5 }]}>
          <LucideIcon name="lock" size={11} color={colors.primary} strokeWidth={2} />
          <Text style={{ fontSize: 11, fontWeight: "700", color: colors.primary }}>관리자</Text>
        </View>
      );
    }
    if (user?.role === "seller" && isVerifiedSeller) {
      return (
        <View style={[styles.badge, { backgroundColor: colors.success + "15", borderColor: colors.success, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 5 }]}>
          <LucideIcon name="check-circle" size={11} color={colors.success} strokeWidth={2} />
          <Text style={{ fontSize: 11, fontWeight: "700", color: colors.success }}>인증 판매회원</Text>
        </View>
      );
    }
    if (user?.role === "seller" && isPendingSeller) {
      return (
        <View style={[styles.badge, { backgroundColor: colors.warning + "15", borderColor: colors.warning, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 5 }]}>
          <LucideIcon name="clock" size={11} color={colors.warning} strokeWidth={2} />
          <Text style={{ fontSize: 11, fontWeight: "700", color: colors.warning }}>판매회원 심사중</Text>
        </View>
      );
    }
    if (user?.role === "seller" && isRejectedSeller) {
      return (
        <View style={[styles.badge, { backgroundColor: colors.error + "15", borderColor: colors.error, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 5 }]}>
          <LucideIcon name="x-circle" size={11} color={colors.error} strokeWidth={2} />
          <Text style={{ fontSize: 11, fontWeight: "700", color: colors.error }}>판매회원 반려</Text>
        </View>
      );
    }
    if (user?.role === "company") {
      return (
        <View style={[styles.badge, { backgroundColor: colors.primary + "12", borderColor: colors.primary, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 5 }]}>
          <LucideIcon name="building" size={11} color={colors.primary} strokeWidth={2} />
          <Text style={{ fontSize: 11, fontWeight: "700", color: colors.primary }}>업체회원</Text>
        </View>
      );
    }
    return (
      <View style={[styles.badge, { backgroundColor: colors.border, borderColor: colors.border, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 5 }]}>
        <LucideIcon name="user" size={11} color={colors.muted} strokeWidth={2} />
        <Text style={{ fontSize: 11, fontWeight: "700", color: colors.muted }}>일반회원</Text>
      </View>
    );
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]} className="bg-background">
      {/* 헤더 */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>마이페이지</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* 프로필 카드 - 고급스러운 디자인 */}
        <View style={styles.profileCardContainer}>
          <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* 프로필 이미지 */}
            <View style={[styles.profileImageBg, { backgroundColor: isAuthenticated ? colors.primary + "15" : colors.border }]}>
              <IconSymbol
                name="person.fill"
                size={32}
                color={isAuthenticated ? colors.primary : colors.muted}
              />
            </View>

            {/* 프로필 정보 */}
            <View style={styles.profileInfo}>
              {isAuthenticated && user ? (
                <>
                  <Text style={[styles.profileName, { color: colors.foreground }]}>
                    {user.name ?? "사용자"}
                  </Text>
                  <Text style={[styles.profileEmail, { color: colors.muted }]}>
                    {user.email ?? ""}
                  </Text>
                  <View style={styles.badgeContainer}>
                    {renderRoleBadge()}
                  </View>
                </>
              ) : (
                <>
                  <Text style={[styles.profileName, { color: colors.foreground }]}>
                    로그인이 필요합니다
                  </Text>
                  <Text style={[styles.profileEmail, { color: colors.muted }]}>
                    로그인하고 클로징마켓을 이용하세요
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* 판매/업체 회원 신청 버튼 */}
        {isAuthenticated && user?.role === "user" && (
          <View style={styles.actionButtonsContainer}>
            {!isPendingSeller && (
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
                ]}
                onPress={() => router.push("/seller/apply" as any)}
              >
                <LucideIcon name="store" size={16} color="#0E0E10" strokeWidth={1.8} />
                <Text style={[styles.actionButtonText, { color: "#000000" }]}>
                  {isRejectedSeller ? "판매회원 재신청" : "판매회원 신청"}
                </Text>
              </Pressable>
            )}
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={() => router.push("/company/apply" as any)}
            >
              <LucideIcon name="building" size={16} color="#0E0E10" strokeWidth={1.8} />
              <Text style={[styles.actionButtonText, { color: "#000000" }]}>업체회원 신청</Text>
            </Pressable>
          </View>
        )}

        {/* 관리자 대시보드 버튼 */}
        {isAuthenticated && user?.role === "admin" && (
          <View style={styles.adminButtonContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.adminButton,
                { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={() => router.push("/admin/dashboard" as any)}
            >
              <IconSymbol name="gear" size={18} color="#000000" />
              <Text style={[styles.adminButtonText, { color: "#000000" }]}>관리자 대시보드</Text>
            </Pressable>
          </View>
        )}

        {/* 로그인/로그아웃 버튼 */}
        <View style={styles.authButtonsContainer}>
          {isAuthenticated ? (
            <Pressable
              style={({ pressed }) => [
                styles.logoutButton,
                { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={handleLogout}
            >
              <Text style={[styles.logoutButtonText, { color: colors.muted }]}>로그아웃</Text>
            </Pressable>
          ) : (
            <View style={styles.loginButtonsGroup}>
              <Pressable
                style={({ pressed }) => [
                  styles.loginButton,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
                ]}
                onPress={handleLogin}
              >
                <Text style={styles.loginButtonText}>이메일로 로그인</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.kakaoButton,
                  { opacity: pressed ? 0.85 : 1 },
                ]}
                onPress={() => router.push("/auth/kakao" as any)}
              >
                <Text style={styles.kakaoButtonText}>카카오로 로그인</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.registerButton,
                  { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={() => router.push("/auth/register" as any)}
              >
                <Text style={[styles.registerButtonText, { color: colors.foreground }]}>회원가입</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* 나의 활동 메뉴 */}
        <View style={styles.menuSection}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>나의 활동</Text>
          <View style={[styles.menuContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {MENU_ITEMS.map((item, index) => (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.menuItem,
                  {
                    borderBottomColor: colors.border,
                    borderBottomWidth: index < MENU_ITEMS.length - 1 ? 1 : 0,
                    opacity: pressed ? 0.6 : 1,
                  },
                ]}
                onPress={() => {
                  if (!isAuthenticated) {
                    Alert.alert("로그인 필요", "로그인 후 이용할 수 있습니다.", [
                      { text: "취소", style: "cancel" },
                      { text: "로그인", onPress: handleLogin },
                    ]);
                    return;
                  }
                  switch (item.id) {
                    case "companyEdit":
                      router.push("/company/edit" as any);
                      break;
                    case "companyInquiries":
                      router.push("/company/chat-inbox" as any);
                      break;
                    case "products":
                      router.push("/seller/products" as any);
                      break;
                    case "purchases":
                      router.push("/user/purchases" as any);
                      break;
                    case "favorites":
                      router.push("/user/favorites" as any);
                      break;
                    case "chatlist":
                      router.push("/(tabs)/chat" as any);
                      break;
                    case "recent":
                      router.push("/user/recent" as any);
                      break;
                    case "reviews":
                      router.push("/reviews/received" as any);
                      break;
                  }
                }}
              >
                <View style={[styles.menuIconBg, { backgroundColor: colors.primary + "10" }]}>
                  <IconSymbol name={item.icon} size={18} color={colors.primary} />
                </View>
                <Text style={[styles.menuLabel, { color: colors.foreground }]}>{item.label}</Text>
                <IconSymbol name="chevron.right" size={16} color={colors.muted} />
              </Pressable>
            ))}
          </View>
        </View>

        {/* 설정 메뉴 */}
        <View style={styles.menuSection}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>설정</Text>
          <View style={[styles.menuContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {SETTINGS_ITEMS.map((item, index) => (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.menuItem,
                  {
                    borderBottomColor: colors.border,
                    borderBottomWidth: index < SETTINGS_ITEMS.length - 1 ? 1 : 0,
                    opacity: pressed ? 0.6 : 1,
                  },
                ]}
                onPress={() => {
                  if (item.id === "privacy") {
                    router.push("/legal/privacy" as any);
                    return;
                  }
                  if (item.id === "terms") {
                    router.push("/legal/terms" as any);
                    return;
                  }
                  if (item.id === "licenses") {
                    router.push("/legal/licenses" as any);
                    return;
                  }
                  if (!isAuthenticated) {
                    Alert.alert("로그인 필요", "로그인 후 이용할 수 있습니다.", [
                      { text: "취소", style: "cancel" },
                      { text: "로그인", onPress: handleLogin },
                    ]);
                    return;
                  }
                  if (item.id === "notification") router.push("/settings/notifications" as any);
                  if (item.id === "support") router.push("/support/inquiries" as any);
                  if (item.id === "account") router.push("/settings/account" as any);
                }}
              >
                <View style={[styles.menuIconBg, { backgroundColor: colors.primary + "10" }]}>
                  <IconSymbol name={item.icon} size={18} color={colors.primary} />
                </View>
                <Text style={[styles.menuLabel, { color: colors.foreground }]}>{item.label}</Text>
                <IconSymbol name="chevron.right" size={16} color={colors.muted} />
              </Pressable>
            ))}
          </View>
        </View>

        {/* 앱 정보 */}
        <View style={styles.infoSection}>
          <Text style={[styles.infoText, { color: colors.muted }]}>클로징마켓 v1.0.0</Text>
          <Text style={[styles.infoText, { color: colors.muted }]}>© 2026 Closing Market. All rights reserved.</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  profileCardContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  profileImageBg: {
    width: 72,
    height: 72,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  profileEmail: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: "500",
  },
  badgeContainer: {
    marginTop: 10,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  actionButtonsContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  actionButtonIcon: {
    fontSize: 18,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  adminButtonContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  adminButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  adminButtonText: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  authButtonsContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  logoutButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  loginButtonsGroup: {
    gap: 10,
  },
  loginButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  loginButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000000",
    letterSpacing: 0.3,
  },
  kakaoButton: {
    backgroundColor: "#FEE500",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  kakaoButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#191919",
    letterSpacing: 0.3,
  },
  registerButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  registerButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  menuSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  menuContainer: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  menuLabel: {
    fontSize: 15,
    flex: 1,
    fontWeight: "500",
  },
  infoSection: {
    paddingHorizontal: 16,
    marginTop: 24,
    alignItems: "center",
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
