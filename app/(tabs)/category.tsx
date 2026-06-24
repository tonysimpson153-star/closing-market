import { ScrollView, Text, View, Pressable, FlatList, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

const CATEGORIES = [
  { id: "cafe", name: "카페", emoji: "☕", desc: "카페 집기·장비" },
  { id: "pcroom", name: "PC방", emoji: "🎮", desc: "PC·게임장비" },
  { id: "restaurant", name: "식당", emoji: "🍽️", desc: "주방·홀 집기" },
  { id: "gym", name: "헬스장", emoji: "🏋️", desc: "운동기구·장비" },
  { id: "office", name: "사무실", emoji: "🏢", desc: "사무용품·가구" },
  { id: "warehouse", name: "창고재고", emoji: "📦", desc: "재고·창고물품" },
  { id: "transfer", name: "사업양도", emoji: "🏪", desc: "권리금·보증금" },
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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
                    borderRadius: 16,
                    padding: 20,
                    alignItems: "center",
                    opacity: pressed ? 0.75 : 1,
                    borderWidth: 1,
                    borderColor: colors.border,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  },
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text style={{ fontSize: 40, marginBottom: 10 }}>{cat.emoji}</Text>
                <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground, marginBottom: 4 }}>
                  {cat.name}
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted, textAlign: "center" }}>{cat.desc}</Text>
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
              <Text style={{ fontSize: 22, color: colors.foreground }}>←</Text>
            </Pressable>
            <Text style={{ fontSize: 20 }}>
              {CATEGORIES.find((c) => c.id === selectedCategory)?.emoji}
            </Text>
            <Text style={{ fontSize: 17, fontWeight: "700", color: colors.foreground, marginLeft: 8 }}>
              {CATEGORIES.find((c) => c.id === selectedCategory)?.name}
            </Text>
          </View>

          {isLoading ? (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : !products || products.length === 0 ? (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>📦</Text>
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
                    <Text style={{ fontSize: 32 }}>
                      {CATEGORIES.find((c) => c.id === item.category)?.emoji ?? "📦"}
                    </Text>
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
                      <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
                        📍 {item.location}
                      </Text>
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
