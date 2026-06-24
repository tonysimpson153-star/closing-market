import { ScrollView, Text, View, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

const CATEGORY_LABELS: Record<string, string> = {
  cafe: "카페",
  pcroom: "PC방",
  restaurant: "식당",
  gym: "헬스장",
  office: "사무실",
  warehouse: "창고재고",
  transfer: "사업양도",
};

const TRADE_TYPE_LABELS: Record<string, string> = {
  direct: "직거래",
  delivery: "택배",
  negotiable: "협의",
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

const CATEGORY_EMOJIS: Record<string, string> = {
  cafe: "☕",
  pcroom: "🎮",
  restaurant: "🍽️",
  gym: "🏋️",
  office: "🏢",
  warehouse: "📦",
  transfer: "🏪",
};

function formatPrice(price: number) {
  return price.toLocaleString("ko-KR") + "원";
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();

  const { data: product, isLoading } = trpc.products.detail.useQuery({ id: Number(id) });

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!product) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>😕</Text>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
            상품을 찾을 수 없습니다.
          </Text>
          <Pressable
            style={({ pressed }) => [{ marginTop: 20, opacity: pressed ? 0.7 : 1 }]}
            onPress={() => router.back()}
          >
            <Text style={{ color: colors.primary, fontWeight: "600" }}>뒤로 가기</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <Pressable
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, marginRight: 12 }]}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: "600", color: colors.foreground, flex: 1 }}>
          상품 상세
        </Text>
        <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
          <IconSymbol name="heart" size={24} color={colors.foreground} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 이미지 영역 */}
        <View
          style={{
            height: 280,
            backgroundColor: colors.surface,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 80 }}>{CATEGORY_EMOJIS[product.category] ?? "📦"}</Text>
        </View>

        {/* 상품 정보 */}
        <View style={{ padding: 16 }}>
          {/* 상태 배지 */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <View
              style={{
                backgroundColor: STATUS_COLORS[product.status] + "20",
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 20,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: STATUS_COLORS[product.status],
                }}
              >
                {STATUS_LABELS[product.status]}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: colors.surface,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 12, color: colors.muted }}>
                {CATEGORY_LABELS[product.category]}
              </Text>
            </View>
          </View>

          <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
            {product.title}
          </Text>
          <Text style={{ fontSize: 24, fontWeight: "800", color: colors.primary, marginBottom: 12 }}>
            {formatPrice(product.price)}
          </Text>

          {/* 메타 정보 */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 12,
              paddingVertical: 12,
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderColor: colors.border,
              marginBottom: 16,
            }}
          >
            {product.location ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <IconSymbol name="location.fill" size={14} color={colors.muted} />
                <Text style={{ fontSize: 13, color: colors.muted }}>{product.location}</Text>
              </View>
            ) : null}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <IconSymbol name="shippingbox.fill" size={14} color={colors.muted} />
              <Text style={{ fontSize: 13, color: colors.muted }}>
                {TRADE_TYPE_LABELS[product.tradeType]}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <IconSymbol name="number" size={14} color={colors.muted} />
              <Text style={{ fontSize: 13, color: colors.muted }}>수량 {product.quantity}개</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <IconSymbol name="eye.fill" size={14} color={colors.muted} />
              <Text style={{ fontSize: 13, color: colors.muted }}>조회 {product.viewCount}</Text>
            </View>
          </View>

          {/* 상품 설명 */}
          {product.description ? (
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
                상품 설명
              </Text>
              <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 22 }}>
                {product.description}
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* 하단 버튼 */}
      <View
        style={{
          flexDirection: "row",
          padding: 16,
          gap: 12,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.background,
        }}
      >
        <Pressable
          style={({ pressed }) => [
            {
              flex: 1,
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: "center",
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}>찜하기</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            {
              flex: 2,
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: "center",
              backgroundColor: colors.primary,
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <Text style={{ fontSize: 15, fontWeight: "700", color: "#FFFFFF" }}>채팅하기</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
