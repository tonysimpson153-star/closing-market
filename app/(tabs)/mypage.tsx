import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { startOAuthLogin } from "@/constants/oauth";
import { trpc } from "@/lib/trpc";

const MENU_ITEMS = [
  { id: "products", label: "내 상품", icon: "tag.fill" as const, badge: null },
  { id: "purchases", label: "내 구매내역", icon: "list.bullet" as const, badge: null },
  { id: "favorites", label: "찜 목록", icon: "heart.fill" as const, badge: null },
  { id: "chatlist", label: "채팅 목록", icon: "bubble.left.fill" as const, badge: null },
  { id: "recent", label: "최근 본 상품", icon: "clock.fill" as const, badge: null },
  { id: "reviews", label: "거래 후기", icon: "star.fill" as const, badge: null },
];

const SETTINGS_ITEMS = [
  { id: "notification", label: "알림 설정", icon: "bell.fill" as const },
  { id: "account", label: "계정 설정", icon: "gear" as const },
];

export default function MyPageScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, isAuthenticated, loading, logout } = useAuth();

  // 판매자 프로필 조회
  const { data: sellerProfile } = trpc.seller.myProfile.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const isVerifiedSeller = sellerProfile?.isVerified && sellerProfile?.sellerStatus === "approved";
  const isPendingSeller = sellerProfile?.sellerStatus === "pending";
  const isRejectedSeller = sellerProfile?.sellerStatus === "rejected";

  const handleLogin = async () => {
    try {
      const result = await startOAuthLogin();
      if (!result.success && result.error) {
        Alert.alert("로그인 오류", result.error);
      }
    } catch (error) {
      Alert.alert("로그인 오류", "로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <ScreenContainer>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: colors.foreground }}>마이페이지</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* 프로필 영역 */}
        <View style={{ paddingHorizontal: 16, marginTop: 4 }}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 20,
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: isAuthenticated ? colors.primary + "20" : colors.border,
                justifyContent: "center",
                alignItems: "center",
                marginRight: 16,
              }}
            >
              <IconSymbol name="person.fill" size={32} color={isAuthenticated ? colors.primary : colors.muted} />
            </View>
            <View style={{ flex: 1 }}>
              {isAuthenticated && user ? (
                <>
                  <Text style={{ fontSize: 17, fontWeight: "700", color: colors.foreground }}>
                    {user.name ?? "사용자"}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>
                    {user.email ?? ""}
                  </Text>
                  {/* 판매자 인증 배지 */}
                  {isVerifiedSeller && (
                    <View style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "#22C55E20",
                      borderRadius: 8,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      marginTop: 6,
                      alignSelf: "flex-start",
                      gap: 4,
                    }}>
                      <Text style={{ fontSize: 11 }}>✅</Text>
                      <Text style={{ fontSize: 11, fontWeight: "700", color: "#22C55E" }}>인증 판매자</Text>
                    </View>
                  )}
                  {isPendingSeller && (
                    <View style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "#F59E0B20",
                      borderRadius: 8,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      marginTop: 6,
                      alignSelf: "flex-start",
                      gap: 4,
                    }}>
                      <Text style={{ fontSize: 11 }}>⏳</Text>
                      <Text style={{ fontSize: 11, fontWeight: "700", color: "#F59E0B" }}>심사 중</Text>
                    </View>
                  )}
                  {isRejectedSeller && (
                    <View style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "#EF444420",
                      borderRadius: 8,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      marginTop: 6,
                      alignSelf: "flex-start",
                      gap: 4,
                    }}>
                      <Text style={{ fontSize: 11 }}>❌</Text>
                      <Text style={{ fontSize: 11, fontWeight: "700", color: "#EF4444" }}>반려</Text>
                    </View>
                  )}
                </>
              ) : (
                <>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
                    로그인이 필요합니다
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>
                    로그인하고 클로징마켓을 이용하세요
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* 판매자 인증 신청 버튼 (로그인 + 미인증 시 표시) */}
        {isAuthenticated && !isVerifiedSeller && !isPendingSeller && (
          <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
            <Pressable
              style={({ pressed }) => [{
                backgroundColor: "#F59E0B",
                borderRadius: 12,
                padding: 14,
                alignItems: "center",
                opacity: pressed ? 0.9 : 1,
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              }]}
              onPress={() => router.push("/seller/apply" as any)}
            >
              <Text style={{ fontSize: 15 }}>🏪</Text>
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>
                {isRejectedSeller ? "판매자 재신청하기" : "판매자 인증 신청"}
              </Text>
            </Pressable>
          </View>
        )}

        {/* 로그인/로그아웃 버튼 */}
        <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
          {isAuthenticated ? (
            <Pressable
              style={({ pressed }) => [
                {
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 14,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              onPress={logout}
            >
              <Text style={{ fontSize: 15, fontWeight: "600", color: colors.muted }}>로그아웃</Text>
            </Pressable>
          ) : (
            <Pressable
              style={({ pressed }) => [
                {
                  backgroundColor: colors.primary,
                  borderRadius: 12,
                  padding: 14,
                  alignItems: "center",
                  opacity: pressed ? 0.9 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
              onPress={handleLogin}
            >
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#FFFFFF" }}>로그인 / 회원가입</Text>
            </Pressable>
          )}
        </View>

        {/* 나의 활동 메뉴 */}
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 10 }}>나의 활동</Text>
          <View style={{ backgroundColor: colors.surface, borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: colors.border }}>
            {MENU_ITEMS.map((item, index) => (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 16,
                    borderBottomWidth: index < MENU_ITEMS.length - 1 ? 0.5 : 0,
                    borderBottomColor: colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    backgroundColor: colors.primary + "15",
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 12,
                  }}
                >
                  <IconSymbol name={item.icon} size={18} color={colors.primary} />
                </View>
                <Text style={{ fontSize: 15, color: colors.foreground, flex: 1 }}>{item.label}</Text>
                <IconSymbol name="chevron.right" size={16} color={colors.muted} />
              </Pressable>
            ))}
          </View>
        </View>

        {/* 설정 */}
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 10 }}>설정</Text>
          <View style={{ backgroundColor: colors.surface, borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: colors.border }}>
            {SETTINGS_ITEMS.map((item, index) => (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 16,
                    borderBottomWidth: index < SETTINGS_ITEMS.length - 1 ? 0.5 : 0,
                    borderBottomColor: colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    backgroundColor: colors.surface,
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <IconSymbol name={item.icon} size={18} color={colors.muted} />
                </View>
                <Text style={{ fontSize: 15, color: colors.foreground, flex: 1 }}>{item.label}</Text>
                <IconSymbol name="chevron.right" size={16} color={colors.muted} />
              </Pressable>
            ))}
          </View>
        </View>

        {/* 앱 버전 */}
        <View style={{ alignItems: "center", marginTop: 32 }}>
          <Text style={{ fontSize: 12, color: colors.muted }}>클로징마켓 v1.0.0</Text>
          <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>사업의 끝, 가치의 시작</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
