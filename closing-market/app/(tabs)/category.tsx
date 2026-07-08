import { ScrollView, Text, View, Pressable, FlatList, ActivityIndicator, Image } from "react-native";
import { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { LucideIcon } from "@/components/ui/icon-lucide";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

const CATEGORIES = [
  { id: "cafe", name: "카페", icon: "coffee", desc: "카페 집기·장비" },
  { id: "pcroom", name: "PC방", icon: "gamepad2", desc: "PC·게임장비" },
  { id: "restaurant", name: "식당", icon: "utensils", desc: "주방·홀 집기" },
  { id: "gym", name: "헬스장", icon: "dumbbell", desc: "운동기구·장비" },
  { id: "office", name: "사무실", icon: "briefcase", desc: "사무용품·가구" },
  { id: "warehouse", name: "창고재고", icon: "package", desc: "재고·창고물품" },
];

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

export default function CategoryScreen() {
  const colors = useColors();
  const router = useRouter();
  const { category: categoryParam } = useLocalSearchParams<{ category?: string }>();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryParam ?? null);

  // 홈 화면 등 다른 화면에서 category 파라미터를 넘겨 들어온 경우 반영
  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [categoryParam]);

  const { data: products, isLoading } = trpc.products.list.useQuery(
    selectedCategory
      ? { category: selectedCategory as any, status: "selling", limit: 30 }
      : { status: "selling", limit: 30 },
    { enabled: !!selectedCategory }
  );

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: colors.foreground }}>카테고리</Text>
      </View>

      {!selectedCategory ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.id}
                style={({ pressed }) => [
                  {
                    width: "47%",
                    backgroundColor: colors.surface,
                    borderRadius: 14,
                    paddingVertical: 28,
                    paddingHorizontal: 20,
                    alignItems: "center",
                    opacity: pressed ? 0.8 : 1,
                    borderWidth: 1,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    borderWidth: 1,
                    borderColor: colors.primary,
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 14,
                  }}
                >
                  <LucideIcon name={cat.icon as any} size={20} color={colors.primary} strokeWidth={1.5} />
                </View>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 4, letterSpacing: 0.2 }}>
                  {cat.name}
                </Text>
                <Text style={{ fontSize: 11, color: colors.muted, textAlign: "center" }}>{cat.desc}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      ) : (
        <>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Pressable
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, marginRight: 10 }]}
              onPress={() => setSelectedCategory(null)}
            >
              <IconSymbol name="chevron.left" size={22} color={colors.foreground} />
            </Pressable>
            <LucideIcon
              name={(CATEGORIES.find((c) => c.id === selectedCategory)?.icon ?? "package") as any}
              size={18}
              color={colors.primary}
              strokeWidth={1.5}
            />
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginLeft: 10, letterSpacing: 0.2 }}>
              {CATEGORIES.find((c) => c.id === selectedCategory)?.name}
            </Text>
          </View>

          {isLoading ? (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : !products || products.length === 0 ? (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
              <LucideIcon name="package" size={36} color={colors.muted} strokeWidth={1.5} />
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 4 }}>
                등록된 매물이 없습니다.
              </Text>
              <Text style={{ fontSize: 13, color: colors.muted }}>첫 번째 판매자가 되어보세요.</Text>
            </View>
          ) : (
            <FlatList
              data={products}
              keyExtractor={(item) => item.id.toString()}
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
                      <LucideIcon
                        name={(CATEGORIES.find((c) => c.id === item.category)?.icon ?? "package") as any}
                        size={26}
                        color={colors.primary}
                        strokeWidth={1.5}
                      />
                    )}
                  </View>
                  <View style={{ flex: 1, padding: 12 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <View
                        style={{
                          backgroundColor: STATUS_COLORS[item.status] + "20",
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 4,
                        }}
                      >
                        <Text style={{ fontSize: 10, color: STATUS_COLORS[item.status], fontWeight: "600" }}>
                          {STATUS_LABELS[item.status]}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 4 }}
                      numberOfLines={2}
                    >
                      {item.title}
                    </Text>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: colors.primary }}>
                      {formatPrice(item.price)}
                    </Text>
                    {item.location ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginTop: 3 }}>
                        <LucideIcon name="map-pin" size={10} color={colors.muted} />
                        <Text style={{ fontSize: 11, color: colors.muted }}>{item.location}</Text>
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              )}
            />
          )}
        </>
      )}
    </ScreenContainer>
  );
}
