import { ScrollView, Text, View, Pressable, TextInput, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

const CATEGORIES = [
  { id: "cafe", name: "카페" },
  { id: "pcroom", name: "PC방" },
  { id: "restaurant", name: "식당" },
  { id: "gym", name: "헬스장" },
  { id: "office", name: "사무실" },
  { id: "warehouse", name: "창고재고" },
  { id: "transfer", name: "사업양도" },
];

const CATEGORY_EMOJIS: Record<string, string> = {
  cafe: "☕", pcroom: "🎮", restaurant: "🍽️", gym: "🏋️",
  office: "🏢", warehouse: "📦", transfer: "🏪",
};

function formatPrice(price: number) {
  return price.toLocaleString("ko-KR") + "원";
}

export default function SearchScreen() {
  const colors = useColors();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);

  const { data: products, isLoading } = trpc.products.list.useQuery({
    category: selectedCategory as any,
    status: "selling",
    limit: 30,
  });

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}>
        <Pressable
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </Pressable>
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.surface,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <IconSymbol name="magnifyingglass" size={16} color={colors.muted} />
          <TextInput
            placeholder="상품명, 업종, 지역 검색"
            placeholderTextColor={colors.muted}
            style={{ flex: 1, marginLeft: 8, fontSize: 15, color: colors.foreground }}
          />
        </View>
      </View>

      {/* 카테고리 필터 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}
      >
        <Pressable
          style={({ pressed }) => [
            {
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 20,
              backgroundColor: !selectedCategory ? colors.primary : colors.surface,
              borderWidth: 1,
              borderColor: !selectedCategory ? colors.primary : colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          onPress={() => setSelectedCategory(undefined)}
        >
          <Text style={{ fontSize: 13, fontWeight: "600", color: !selectedCategory ? "#FFFFFF" : colors.foreground }}>
            전체
          </Text>
        </Pressable>
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat.id}
            style={({ pressed }) => [
              {
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 20,
                backgroundColor: selectedCategory === cat.id ? colors.primary : colors.surface,
                borderWidth: 1,
                borderColor: selectedCategory === cat.id ? colors.primary : colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: selectedCategory === cat.id ? "#FFFFFF" : colors.foreground,
              }}
            >
              {cat.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* 결과 */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {isLoading ? (
          <View style={{ padding: 48, alignItems: "center" }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : !products || products.length === 0 ? (
          <View style={{ padding: 48, alignItems: "center" }}>
            <Text style={{ fontSize: 44, marginBottom: 12 }}>🔍</Text>
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 4 }}>
              검색 결과가 없습니다.
            </Text>
            <Text style={{ fontSize: 13, color: colors.muted, textAlign: "center" }}>
              다른 키워드나 카테고리로 검색해보세요.
            </Text>
          </View>
        ) : (
          <>
            <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 12 }}>
              총 {products.length}개의 상품
            </Text>
            {products.map((product) => (
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
                onPress={() => router.push(`/product/${product.id}` as any)}
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
                  <Text style={{ fontSize: 32 }}>{CATEGORY_EMOJIS[product.category] ?? "📦"}</Text>
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
                  {product.location ? (
                    <Text style={{ fontSize: 11, color: colors.muted }}>📍 {product.location}</Text>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
