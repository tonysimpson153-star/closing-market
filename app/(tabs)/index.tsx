import { ScrollView, Text, View, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

const CATEGORIES = [
  { id: "cafe", name: "카페", emoji: "☕" },
  { id: "pcroom", name: "PC방", emoji: "🎮" },
  { id: "restaurant", name: "식당", emoji: "🍽️" },
  { id: "gym", name: "헬스장", emoji: "🏋️" },
  { id: "office", name: "사무실", emoji: "🏢" },
  { id: "warehouse", name: "창고재고", emoji: "📦" },
  { id: "transfer", name: "사업양도", emoji: "🏪" },
];

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  demolition: "철거업체",
  interior: "인테리어업체",
  waste: "폐기물처리업체",
  sign: "간판업체",
  pos: "POS업체",
  cctv: "CCTV업체",
  cleaning: "청소업체",
  tax: "세무사",
  labor: "노무사",
};

const BUSINESS_TYPE_ICONS: Record<string, string> = {
  demolition: "🚧",
  interior: "🎨",
  waste: "♻️",
  sign: "🪧",
  pos: "🖥️",
  cctv: "📹",
  cleaning: "🧹",
  tax: "📋",
  labor: "⚖️",
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

function formatPrice(price: number) {
  return price.toLocaleString("ko-KR") + "원";
}

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();

  const { data: products, isLoading: productsLoading } = trpc.products.list.useQuery({
    status: "selling",
    limit: 10,
  });

  const { data: businesses, isLoading: bizLoading } = trpc.businesses.list.useQuery({});

  return (
    <ScreenContainer>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: "800", color: colors.foreground }}>
          클로징마켓
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <Pressable
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
            onPress={() => router.push("/search" as any)}
          >
            <IconSymbol name="magnifyingglass" size={24} color={colors.foreground} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
            onPress={() => router.push("/notifications" as any)}
          >
            <View>
              <IconSymbol name="bell.fill" size={24} color={colors.foreground} />
            </View>
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 카테고리 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 12 }}
        >
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              style={({ pressed }) => [
                {
                  alignItems: "center",
                  opacity: pressed ? 0.7 : 1,
                  width: 64,
                },
              ]}
            >
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 16,
                  backgroundColor: colors.surface,
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 6,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 28 }}>{cat.emoji}</Text>
              </View>
              <Text style={{ fontSize: 11, color: colors.foreground, fontWeight: "500", textAlign: "center" }}>
                {cat.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* 추천 사업정리 물품 */}
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
            추천 사업정리 물품
          </Text>
          {productsLoading ? (
            <View style={{ padding: 32, alignItems: "center" }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : !products || products.length === 0 ? (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 36,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 44, marginBottom: 12 }}>📦</Text>
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 4 }}>
                아직 등록된 매물이 없습니다.
              </Text>
              <Text style={{ fontSize: 13, color: colors.muted }}>첫 번째 판매자가 되어보세요.</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ gap: 12 }}>
              {products.map((product) => (
                <Pressable
                  key={product.id}
                  style={({ pressed }) => [
                    {
                      width: 160,
                      backgroundColor: colors.surface,
                      borderRadius: 12,
                      marginRight: 12,
                      overflow: "hidden",
                      opacity: pressed ? 0.8 : 1,
                      borderWidth: 1,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => router.push(`/product/${product.id}`)}
                >
                  <View
                    style={{
                      height: 120,
                      backgroundColor: colors.border,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: 32 }}>
                      {CATEGORIES.find((c) => c.id === product.category)?.emoji ?? "📦"}
                    </Text>
                  </View>
                  <View style={{ padding: 10 }}>
                    <Text
                      style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 4 }}
                      numberOfLines={2}
                    >
                      {product.title}
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: colors.primary }}>
                      {formatPrice(product.price)}
                    </Text>
                    {product.location ? (
                      <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
                        📍 {product.location}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {/* 추천 업체 */}
        <View style={{ paddingHorizontal: 16, marginTop: 28 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
            추천 업체
          </Text>
          {bizLoading ? (
            <View style={{ padding: 32, alignItems: "center" }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : !businesses || businesses.length === 0 ? (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 24,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 13, color: colors.muted }}>등록된 업체가 없습니다.</Text>
            </View>
          ) : (
            businesses.map((biz) => (
              <Pressable
                key={biz.id}
                style={({ pressed }) => [
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: colors.surface,
                    borderRadius: 14,
                    padding: 14,
                    marginBottom: 10,
                    opacity: pressed ? 0.8 : 1,
                    borderWidth: 1,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => router.push(`/business/${biz.id}`)}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: colors.background,
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ fontSize: 22 }}>{BUSINESS_TYPE_ICONS[biz.type] ?? "🏢"}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}>
                    {biz.name}
                  </Text>
                  {biz.description ? (
                    <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }} numberOfLines={1}>
                      {biz.description}
                    </Text>
                  ) : null}
                </View>
                <View
                  style={{
                    backgroundColor: colors.primary,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 13 }}>문의</Text>
                </View>
              </Pressable>
            ))
          )}
        </View>

        {/* 최신 등록 물품 */}
        <View style={{ paddingHorizontal: 16, marginTop: 28, marginBottom: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
            최신 등록 물품
          </Text>
          {productsLoading ? (
            <View style={{ padding: 32, alignItems: "center" }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : !products || products.length === 0 ? (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 36,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 44, marginBottom: 12 }}>📋</Text>
              <Text style={{ fontSize: 15, fontWeight: "500", color: colors.foreground }}>
                등록된 물품이 없습니다.
              </Text>
            </View>
          ) : (
            products.map((product) => (
              <Pressable
                key={product.id}
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
                onPress={() => router.push(`/product/${product.id}`)}
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
                  <Text style={{ fontSize: 32 }}>
                    {CATEGORIES.find((c) => c.id === product.category)?.emoji ?? "📦"}
                  </Text>
                </View>
                <View style={{ flex: 1, padding: 12 }}>
                  <Text
                    style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 4 }}
                    numberOfLines={2}
                  >
                    {product.title}
                  </Text>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.primary, marginBottom: 4 }}>
                    {formatPrice(product.price)}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    {product.location ? (
                      <Text style={{ fontSize: 11, color: colors.muted }}>📍 {product.location}</Text>
                    ) : null}
                    <Text style={{ fontSize: 11, color: colors.muted }}>
                      {CATEGORY_LABELS[product.category]}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
