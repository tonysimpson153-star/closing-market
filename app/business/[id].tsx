import { ScrollView, Text, View, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

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
  interior: "palette",
  waste: "recycle",
  sign: "🪧",
  pos: "🖥️",
  cctv: "📹",
  cleaning: "🧹",
  tax: "📋",
  labor: "⚖️",
};

export default function BusinessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();

  const { data: business, isLoading } = trpc.businesses.detail.useQuery({ id: Number(id) });

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!business) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>😕</Text>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
            업체를 찾을 수 없습니다.
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
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 }}>
        <Pressable
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, marginRight: 12 }]}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: "600", color: colors.foreground, flex: 1 }}>업체 상세</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* 업체 헤더 */}
        <View style={{ padding: 20, alignItems: "center" }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: colors.surface,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 36 }}>{BUSINESS_TYPE_ICONS[business.type] ?? "🏢"}</Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground, marginBottom: 4 }}>
            {business.name}
          </Text>
          <View
            style={{
              backgroundColor: colors.primary + "20",
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 20,
            }}
          >
            <Text style={{ fontSize: 13, color: colors.primary, fontWeight: "600" }}>
              {BUSINESS_TYPE_LABELS[business.type]}
            </Text>
          </View>
        </View>

        {/* 업체 소개 */}
        {business.description ? (
          <View
            style={{
              marginHorizontal: 16,
              backgroundColor: colors.surface,
              borderRadius: 14,
              padding: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
              업체 소개
            </Text>
            <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 22 }}>
              {business.description}
            </Text>
          </View>
        ) : null}

        {/* 위치 */}
        {business.address ? (
          <View
            style={{
              marginHorizontal: 16,
              backgroundColor: colors.surface,
              borderRadius: 14,
              padding: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
              위치
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <IconSymbol name="location.fill" size={16} color={colors.muted} />
              <Text style={{ fontSize: 14, color: colors.foreground }}>{business.address}</Text>
            </View>
          </View>
        ) : null}
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
        {business.phone ? (
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
            <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}>📞 전화하기</Text>
          </Pressable>
        ) : null}
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
          <Text style={{ fontSize: 15, fontWeight: "700", color: "#FFFFFF" }}>message-circle 문의하기</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
