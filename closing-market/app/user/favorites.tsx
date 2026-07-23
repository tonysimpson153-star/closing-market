import { Text, View, Pressable, FlatList, ActivityIndicator, Alert, Image } from "react-native";
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

const STATUS_LABELS: Record<string, string> = {
  selling: "판매중",
  reserved: "예약중",
  sold: "판매완료",
};

const STATUS_COLORS: Record<string, string> = {
  selling: "#3B82F6",
  reserved: "#F59E0B",
  sold: "#6B7280",
};

function formatPrice(price: number) {
  return price.toLocaleString("ko-KR") + "원";
}

export default function FavoritesScreen() {
  const colors = useColors();
  const router = useRouter();
  const { token } = useAuthStore();
  const isAuthenticated = !!token;

  const { data: favorites, isLoading, refetch } = trpc.favorites.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const utils = trpc.useUtils();
  const toggleMutation = trpc.favorites.toggle.useMutation({
    onSuccess: () => {
      refetch();
      utils.favorites.list.invalidate();
    },
    onError: () => {
      Alert.alert("오류", "찜 해제에 실패했습니다.");
    },
  });

  const items = (favorites ?? []).filter((f) => f.product !== null);

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
        <Text style={{ fontSize: 18, fontWeight: "800", color: colors.foreground }}>찜 목록</Text>
      </View>

      {!isAuthenticated ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
            로그인이 필요합니다
          </Text>
        </View>
      ) : isLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : items.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
          <LucideIcon name="heart" size={32} color={colors.muted} strokeWidth={1.5} />
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginTop: 16, marginBottom: 4 }}>
            찜한 상품이 없습니다
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted, textAlign: "center" }}>
            마음에 드는 상품을 찜해보세요.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          renderItem={({ item }) => {
            const p = item.product!;
            return (
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
                onPress={() => router.push(`/product/${p.id}` as any)}
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
                  {p.mainImageUrl ? (
                    <Image source={{ uri: p.mainImageUrl }} style={{ width: 90, height: 90 }} resizeMode="cover" />
                  ) : (
                    <LucideIcon name={(CATEGORY_ICONS[p.category] ?? "package") as any} size={26} color={colors.primary} strokeWidth={1.5} />
                  )}
                </View>
                <View style={{ flex: 1, padding: 12, justifyContent: "center" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <View
                      style={{
                        backgroundColor: STATUS_COLORS[p.status] + "20",
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 4,
                      }}
                    >
                      <Text style={{ fontSize: 10, color: STATUS_COLORS[p.status], fontWeight: "600" }}>
                        {STATUS_LABELS[p.status]}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 4 }}
                    numberOfLines={2}
                  >
                    {p.title}
                  </Text>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.primary }}>
                    {formatPrice(p.price)}
                  </Text>
                </View>
                <Pressable
                  hitSlop={10}
                  style={{ justifyContent: "center", paddingHorizontal: 12 }}
                  onPress={() => toggleMutation.mutate({ productId: p.id })}
                >
                  <LucideIcon name="heart" size={18} color={colors.primary} strokeWidth={1.5} />
                </Pressable>
              </Pressable>
            );
          }}
        />
      )}
    </ScreenContainer>
  );
}
