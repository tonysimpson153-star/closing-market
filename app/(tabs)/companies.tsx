import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { LucideIcon } from "@/components/ui/icon-lucide";
import { useColors } from "@/hooks/use-colors";

export default function CompaniesEntryScreen() {
  const colors = useColors();
  const router = useRouter();

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={{ padding: 28, paddingBottom: 44, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingTop: 8 }}>
          <Text
            style={{
              color: colors.foreground,
              fontSize: 30,
              fontWeight: "800",
              letterSpacing: -0.8,
            }}
          >
            업체 찾기
          </Text>
          <Text
            style={{
              color: colors.muted,
              fontSize: 16,
              lineHeight: 24,
              marginTop: 10,
            }}
          >
            필요한 방식에 맞춰 업체를 찾아보세요.
          </Text>
        </View>

        <View style={{ gap: 18, marginTop: 54 }}>
          <SearchModeCard
            colors={colors}
            icon="building"
            eyebrow="업종별 탐색"
            title="개별찾기"
            description="업종별 업체를 직접 살펴보고, 필요한 업체를 하나씩 비교해 보세요."
            onPress={() => router.push("/company/directory" as any)}
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

type SearchModeCardProps = {
  colors: ReturnType<typeof useColors>;
  icon: "building" | "layers";
  eyebrow: string;
  title: string;
  description: string;
  onPress: () => void;
};

function SearchModeCard({
  colors,
  icon,
  eyebrow,
  title,
  description,
  onPress,
}: SearchModeCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 236,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        padding: 28,
        opacity: pressed ? 0.82 : 1,
      })}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View
          style={{
            width: 58,
            height: 58,
            borderRadius: 17,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.background,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <LucideIcon
            name={icon}
            size={30}
            color={colors.primary}
            strokeWidth={1.8}
          />
        </View>
        <LucideIcon name="arrow-right" size={27} color={colors.muted} strokeWidth={1.6} />
      </View>
      <View style={{ marginTop: 30 }}>
        <Text style={{ color: colors.primary, fontSize: 14, fontWeight: "700", marginBottom: 7 }}>
          {eyebrow}
        </Text>
        <Text style={{ color: colors.foreground, fontSize: 27, fontWeight: "800", letterSpacing: -0.5 }}>
          {title}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 9 }}>
          {description}
        </Text>
      </View>
    </Pressable>
  );
}
