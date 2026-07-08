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

const STATUS_ORDER: Array<"selling" | "reserved" | "sold"> = ["selling", "reserved", "sold"];

function formatPrice(price: number) {
  return price.toLocaleString("ko-KR") + "원";
}

export default function MyProductsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { token } = useAuthStore();
  const isAuthenticated = !!token;

  const { data: myProducts, isLoading, refetch } = trpc.products.myProducts.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const updateStatusMutation = trpc.products.updateStatus.useMutation({
    onSuccess: () => refetch(),
    onError: () => Alert.alert("오류", "상태 변경에 실패했습니다."),
  });

  const cycleStatus = (id: number, current: string) => {
    const idx = STATUS_ORDER.indexOf(current as any);
    const next = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
    updateStatusMutation.mutate({ id, status: next });
  };

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
        <Text style={{ fontSize: 18, fontWeight: "800", color: colors.foreground }}>내 상품</Text>
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
      ) : !myProducts || myProducts.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
          <LucideIcon name="tag" size={32} color={colors.muted} strokeWidth={1.5} />
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginTop: 16, marginBottom: 4 }}>
            등록한 상품이 없습니다
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted, textAlign: "center" }}>
            등록하기 탭에서 첫 상품을 등록해보세요.
          </Text>
        </View>
      ) : (
        <FlatList
          data={myProducts}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          renderItem={({ item }) => (
            <View
              style={{
                flexDirection: "row",
                backgroundColor: colors.surface,
                borderRadius: 14,
                marginBottom: 10,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Pressable
                style={({ pressed }) => [{ flexDirection: "row", flex: 1, opacity: pressed ? 0.8 : 1 }]}
                onPress={() => router.push(`/product/${item.id}` as any)}
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
                  {item.mainImageUrl ? (
                    <Image source={{ uri: item.mainImageUrl }} style={{ width: 90, height: 90 }} resizeMode="cover" />
                  ) : (
                    <LucideIcon name={(CATEGORY_ICONS[item.category] ?? "package") as any} size={26} color={colors.primary} strokeWidth={1.5} />
                  )}
                </View>
                <View style={{ flex: 1, padding: 12, justifyContent: "center" }}>
                  <Text
                    style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 4 }}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.primary, marginBottom: 4 }}>
                    {formatPrice(item.price)}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.muted }}>
                    조회 {item.viewCount} · 찜 {item.favoriteCount}
                  </Text>
                </View>
              </Pressable>
              <Pressable
                onPress={() => cycleStatus(item.id, item.status)}
                style={{
                  justifyContent: "center",
                  alignItems: "center",
                  paddingHorizontal: 12,
                  borderLeftWidth: 1,
                  borderLeftColor: colors.border,
                }}
              >
                <View
                  style={{
                    backgroundColor: STATUS_COLORS[item.status] + "20",
                    paddingHorizontal: 8,
                    paddingVertical: 6,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ fontSize: 11, color: STATUS_COLORS[item.status], fontWeight: "700" }}>
                    {STATUS_LABELS[item.status]}
                  </Text>
                </View>
                <Text style={{ fontSize: 9, color: colors.muted, marginTop: 4 }}>탭하여 변경</Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </ScreenContainer>
  );
}
