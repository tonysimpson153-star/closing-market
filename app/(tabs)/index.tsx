import { ScrollView, Text, View, Pressable, ActivityIndicator, Image } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { LucideIcon } from "@/components/ui/icon-lucide";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

const CATEGORIES = [
  { id: "cafe", name: "카페", icon: "coffee" },
  { id: "pcroom", name: "PC방", icon: "gamepad2" },
  { id: "restaurant", name: "식당", icon: "utensils" },
  { id: "gym", name: "헬스장", icon: "dumbbell" },
  { id: "office", name: "사무실", icon: "briefcase" },
  { id: "warehouse", name: "창고재고", icon: "package" },
];

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  demolition: "철거업체",
  interior: "인테리어업체",
  waste: "폐기물처리업체",
  signage: "간판·사인업체",
  pos: "POS·키오스크업체",
  cctv: "CCTV·보안업체",
  cleaning: "청소·방역업체",
  tax: "전문 상담 (세무사)",
  labor: "전문 상담 (노무사)",
  kitchen: "주방기기업체",
  consulting: "창업 컨설팅",
};

const BUSINESS_TYPE_ICONS: Record<string, string> = {
  demolition: "hammer",
  interior: "palette",
  waste: "recycle",
  signage: "signpost",
  pos: "monitor",
  cctv: "camera",
  cleaning: "waves",
  tax: "file",
  labor: "scale",
  kitchen: "utensils",
  consulting: "trending-up",
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

  const { data: businesses, isLoading: bizLoading } = trpc.companies.list.useQuery({});

  return (
    <ScreenContainer className="bg-background">
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: "700", color: colors.primary, letterSpacing: 2 }}>
          클로징마켓
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
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
            <IconSymbol name="bell.fill" size={24} color={colors.foreground} />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 카테고리 섹션 */}
        <View style={{ paddingHorizontal: 20, paddingVertical: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 16, letterSpacing: 0.5 }}>
            카테고리
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0 }}
            contentContainerStyle={{ gap: 12, alignItems: "flex-start" }}
          >
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => router.push(`/(tabs)/category?category=${cat.id}` as any)}
                style={({ pressed }) => [
                  {
                    alignItems: "center",
                    opacity: pressed ? 0.7 : 1,
                    width: 72,
                  },
                ]}
              >
                <View
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 14,
                    backgroundColor: colors.surface,
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 8,
                    borderWidth: 1.5,
                    borderColor: colors.border,
                  }}
                >
                  <LucideIcon name={cat.icon as any} size={32} color={colors.primary} />
                </View>
                <Text style={{ fontSize: 12, color: colors.foreground, fontWeight: "600", textAlign: "center" }}>
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* 추천 사업정리 물품 */}
        <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, letterSpacing: 0.5 }}>
              추천 물품
            </Text>
            <Pressable onPress={() => router.push("/search" as any)}>
              <Text style={{ fontSize: 13, color: colors.primary, fontWeight: "600" }}>더보기 →</Text>
            </Pressable>
          </View>
          {productsLoading ? (
            <View style={{ padding: 32, alignItems: "center" }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : !products || products.length === 0 ? (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 14,
                padding: 40,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <LucideIcon name="package" size={36} color={colors.muted} strokeWidth={1.5} />
              <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground, marginBottom: 4 }}>
                아직 등록된 물품이 없습니다
              </Text>
              <Text style={{ fontSize: 13, color: colors.muted }}>첫 번째 판매자가 되어보세요</Text>
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
                      borderRadius: 14,
                      marginRight: 0,
                      overflow: "hidden",
                      opacity: pressed ? 0.85 : 1,
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
                      overflow: "hidden",
                    }}
                  >
                    {product.mainImageUrl ? (
                      <Image source={{ uri: product.mainImageUrl }} style={{ width: "100%", height: 120 }} resizeMode="cover" />
                    ) : (
                      <LucideIcon name={(CATEGORIES.find((c) => c.id === product.category)?.icon ?? "package") as any} size={32} color={colors.primary} />
                    )}
                  </View>
                  <View style={{ padding: 12 }}>
                    <Text
                      style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}
                      numberOfLines={2}
                    >
                      {product.title}
                    </Text>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: colors.primary, marginBottom: 6 }}>
                      {formatPrice(product.price)}
                    </Text>
                    {product.location ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                        <LucideIcon name="map-pin" size={10} color={colors.muted} />
                        <Text style={{ fontSize: 11, color: colors.muted }}>{product.location}</Text>
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {/* 추천 업체 */}
        <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, letterSpacing: 0.5 }}>
              추천 업체
            </Text>
            <Pressable onPress={() => router.push("/(tabs)/companies" as any)}>
              <Text style={{ fontSize: 13, color: colors.primary, fontWeight: "600" }}>더보기 →</Text>
            </Pressable>
          </View>
          {bizLoading ? (
            <View style={{ padding: 32, alignItems: "center" }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : !businesses || businesses.length === 0 ? (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 14,
                padding: 24,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 13, color: colors.muted }}>등록된 업체가 없습니다</Text>
            </View>
          ) : (
            businesses.slice(0, 3).map((biz) => (
              <Pressable
                key={biz.id}
                style={({ pressed }) => [
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: colors.surface,
                    borderRadius: 14,
                    padding: 16,
                    marginBottom: 12,
                    opacity: pressed ? 0.85 : 1,
                    borderWidth: 1,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => router.push(`/company/${biz.id}` as any)}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    backgroundColor: colors.background,
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 14,
                    borderWidth: 1,
                    borderColor: colors.border,
                    overflow: "hidden",
                  }}
                >
                  {biz.logoUrl ? (
                    <Image source={{ uri: biz.logoUrl }} style={{ width: 56, height: 56 }} resizeMode="cover" />
                  ) : (
                    <LucideIcon
                      name={(BUSINESS_TYPE_ICONS[biz.type] ?? "building") as any}
                      size={22}
                      color={colors.primary}
                    />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>
                    {biz.name}
                  </Text>
                  {biz.description ? (
                    <Text style={{ fontSize: 12, color: colors.muted, marginTop: 3 }} numberOfLines={1}>
                      {biz.description}
                    </Text>
                  ) : null}
                </View>
                <View
                  style={{
                    backgroundColor: colors.primary,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 10,
                  }}
                >
                  <Text style={{ color: "#000000", fontWeight: "700", fontSize: 12 }}>문의</Text>
                </View>
              </Pressable>
            ))
          )}
        </View>

        {/* 최신 등록 물품 */}
        <View style={{ paddingHorizontal: 20, marginBottom: 40 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 16, letterSpacing: 0.5 }}>
            최신 물품
          </Text>
          {productsLoading ? (
            <View style={{ padding: 32, alignItems: "center" }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : !products || products.length === 0 ? (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 14,
                padding: 40,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <LucideIcon name="file" size={36} color={colors.muted} strokeWidth={1.5} />
              <Text style={{ fontSize: 15, fontWeight: "500", color: colors.foreground }}>
                등록된 물품이 없습니다
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
                    marginBottom: 12,
                    overflow: "hidden",
                    opacity: pressed ? 0.85 : 1,
                    borderWidth: 1,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => router.push(`/product/${product.id}`)}
              >
                <View
                  style={{
                    width: 100,
                    height: 100,
                    backgroundColor: colors.border,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {product.mainImageUrl ? (
                    <Image source={{ uri: product.mainImageUrl }} style={{ width: 100, height: 100 }} resizeMode="cover" />
                  ) : (
                    <LucideIcon name={(CATEGORIES.find((c) => c.id === product.category)?.icon ?? "package") as any} size={32} color={colors.primary} />
                  )}
                </View>
                <View style={{ flex: 1, padding: 14 }}>
                  <Text
                    style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 6 }}
                    numberOfLines={2}
                  >
                    {product.title}
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: "800", color: colors.primary, marginBottom: 6 }}>
                    {formatPrice(product.price)}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    {product.location ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                        <LucideIcon name="map-pin" size={10} color={colors.muted} />
                        <Text style={{ fontSize: 11, color: colors.muted }}>{product.location}</Text>
                      </View>
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
