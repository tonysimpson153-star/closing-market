import { Text, View, Pressable, FlatList, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { LucideIcon } from "@/components/ui/icon-lucide";
import { useColors } from "@/hooks/use-colors";
import { useAuthStore } from "@/lib/auth-store";
import { trpc } from "@/lib/trpc";

const CATEGORY_ICONS: Record<string, string> = {
  cafe: "coffee",
  pcroom: "gamepad2",
  restaurant: "utensils",
  gym: "dumbbell",
  office: "briefcase",
  warehouse: "package",
  transfer: "store",
};

function formatPrice(price: number) {
  return price.toLocaleString("ko-KR") + "원";
}

function formatDate(date: Date | null | string) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}

export default function PurchasesScreen() {
  const colors = useColors();
  const router = useRouter();
  const { token } = useAuthStore();
  const isAuthenticated = !!token;

  const { data: purchases, isLoading } = trpc.purchases.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border,
        }}
      >
        <Pressable onPress={() => router.back()} style={{ marginRight: 12 }}>
          <IconSymbol name="chevron.left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: "800", color: colors.foreground }}>내 구매내역</Text>
      </View>

      {!isAuthenticated ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
            로그인이 필요합니다
          </Text>
        </View>
      ) : isLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !purchases || purchases.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
          <LucideIcon name="file" size={32} color={colors.muted} strokeWidth={1.5} />
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginTop: 16, marginBottom: 4 }}>
            구매내역이 없습니다
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted, textAlign: "center" }}>
            채팅에서 거래를 완료하면{"\n"}여기에 기록됩니다.
          </Text>
        </View>
      ) : (
        <FlatList
          data={purchases}
          keyExtractor={(item) => item.chatRoomId.toString()}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                {
                  flexDirection: "row",
                  backgroundColor: colors.surface,
                  borderRadius: 14,
                  marginBottom: 10,
                  overflow: "hidden",
                  opacity: pressed ? 0.8 : 1,
                  borderWidth: 1,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => router.push(`/chat/${item.chatRoomId}` as any)}
            >
              <View
                style={{
                  width: 90,
                  height: 90,
                  backgroundColor: colors.border,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <LucideIcon
                  name={(item.product ? CATEGORY_ICONS[item.product.category] : "package") as any ?? "package"}
                  size={26}
                  color={colors.primary}
                  strokeWidth={1.5}
                />
              </View>
              <View style={{ flex: 1, padding: 12, justifyContent: "center" }}>
                <Text style={{ fontSize: 10, color: colors.muted, marginBottom: 4 }}>
                  {formatDate(item.purchasedAt)} 거래완료 · 판매자 {item.seller?.name ?? "탈퇴회원"}
                </Text>
                <Text
                  style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 4 }}
                  numberOfLines={2}
                >
                  {item.product?.title ?? "삭제된 상품"}
                </Text>
                {item.product && (
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.primary }}>
                    {formatPrice(item.product.price)}
                  </Text>
                )}
              </View>
            </Pressable>
          )}
        />
      )}
    </ScreenContainer>
  );
}
