import { View, Text, Pressable, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { LucideIcon } from "@/components/ui/icon-lucide";
import { useColors } from "@/hooks/use-colors";

const LEGAL_ITEMS = [
  { id: "privacy", label: "개인정보처리방침", icon: "shield-check" as const },
  { id: "terms", label: "이용약관", icon: "file-text" as const },
  { id: "operating-policy", label: "운영정책", icon: "settings" as const },
  { id: "location-terms", label: "위치기반서비스 이용약관", icon: "map-pin" as const },
  { id: "business-info", label: "사업자 정보", icon: "building-2" as const },
];

export default function LegalScreen() {
  const colors = useColors();
  const router = useRouter();

  return (
    <ScreenContainer>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: colors.border }}>
        <Pressable
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginLeft: 12 }}>약관 및 정책</Text>
      </View>

      <FlatList
        data={LEGAL_ITEMS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item, index }) => (
          <Pressable
            style={({ pressed }) => [
              {
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 14,
                paddingVertical: 14,
                backgroundColor: colors.surface,
                borderRadius: 10,
                marginBottom: index < LEGAL_ITEMS.length - 1 ? 10 : 0,
                opacity: pressed ? 0.7 : 1,
                borderWidth: 1,
                borderColor: colors.border,
              },
            ]}
            onPress={() => router.push(`/legal/${item.id}` as any)}
          >
            <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: colors.primary + "15", justifyContent: "center", alignItems: "center", marginRight: 12 }}>
              <LucideIcon name={item.icon} size={20} color={colors.primary} strokeWidth={1.8} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}>{item.label}</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.muted} />
          </Pressable>
        )}
      />
    </ScreenContainer>
  );
}
