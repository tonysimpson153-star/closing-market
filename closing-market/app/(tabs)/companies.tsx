import { useState } from "react";
import { ScrollView, Text, View, Pressable, FlatList, ActivityIndicator, Image } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { LucideIcon } from "@/components/ui/icon-lucide";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

// 사용자에게 보여주는 큐레이션된 업체 카테고리 (기존 데이터 유형은 그대로 유지하고,
// 화면에서만 세무사·노무사를 "전문 상담"으로 함께 묶어서 보여줍니다.
// "폐기물처리업체"는 메뉴에는 노출하지 않지만 데이터/신청 기능은 그대로 유지됩니다.)
const CATEGORY_GROUPS: Array<{ id: string; label: string; icon: string; types: string[] }> = [
  { id: "interior", label: "인테리어", icon: "palette", types: ["interior"] },
  { id: "demolition", label: "철거", icon: "hammer", types: ["demolition"] },
  { id: "pos", label: "POS·키오스크", icon: "monitor", types: ["pos"] },
  { id: "signage", label: "간판·사인", icon: "signpost", types: ["signage"] },
  { id: "cctv", label: "CCTV·보안", icon: "camera", types: ["cctv"] },
  { id: "kitchen", label: "주방기기", icon: "utensils", types: ["kitchen"] },
  { id: "cleaning", label: "청소·방역", icon: "waves", types: ["cleaning"] },
  { id: "consult", label: "전문 상담", icon: "file", types: ["tax", "labor"] },
  { id: "consulting", label: "창업 컨설팅", icon: "trending-up", types: ["consulting"] },
];

export default function CompanyDirectoryScreen() {
  const colors = useColors();
  const router = useRouter();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const activeGroup = CATEGORY_GROUPS.find((g) => g.id === selectedGroup);

  // 세무사·노무사처럼 한 그룹에 실제 타입이 2개 묶인 경우가 있어, 고정된 두 개의 훅 슬롯으로
  // 조회합니다 (훅 호출 개수가 렌더링마다 바뀌면 안 되므로 배열 map으로 훅을 호출하지 않습니다).
  const type1 = activeGroup?.types[0];
  const type2 = activeGroup?.types[1];
  const query1 = trpc.companies.list.useQuery({ type: type1 });
  const query2 = trpc.companies.list.useQuery({ type: type2 }, { enabled: !!type2 });

  const isLoading = query1.isLoading || (!!type2 && query2.isLoading);
  const companies = [...(query1.data ?? []), ...(type2 ? query2.data ?? [] : [])];

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 }}>
        <Text style={{ fontSize: 17, fontWeight: "700", color: colors.foreground, flex: 1, letterSpacing: 0.3 }}>
          업체 찾기
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8, alignItems: "flex-start" }}
        style={{ flexGrow: 0 }}
      >
        <Pressable
          onPress={() => setSelectedGroup(null)}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 4,
            borderWidth: 1,
            borderColor: selectedGroup === null ? colors.primary : colors.border,
            backgroundColor: selectedGroup === null ? colors.primary + "12" : "transparent",
            marginRight: 8,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: "600", color: selectedGroup === null ? colors.primary : colors.muted }}>
            전체
          </Text>
        </Pressable>
        {CATEGORY_GROUPS.map((group) => {
          const active = selectedGroup === group.id;
          return (
            <Pressable
              key={group.id}
              onPress={() => setSelectedGroup(group.id)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 4,
                borderWidth: 1,
                borderColor: active ? colors.primary : colors.border,
                backgroundColor: active ? colors.primary + "12" : "transparent",
                marginRight: 8,
              }}
            >
              <LucideIcon name={group.icon as any} size={13} color={active ? colors.primary : colors.muted} strokeWidth={1.8} />
              <Text style={{ fontSize: 13, fontWeight: "600", color: active ? colors.primary : colors.muted }}>
                {group.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : companies.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
          <LucideIcon name="building" size={32} color={colors.muted} strokeWidth={1.5} />
          <Text style={{ fontSize: 15, color: colors.muted, marginTop: 14 }}>등록된 업체가 없습니다.</Text>
        </View>
      ) : (
        <FlatList
          data={companies}
          keyExtractor={(item: any) => String(item.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          renderItem={({ item }: { item: any }) => (
            <Pressable
              style={({ pressed }) => [
                {
                  backgroundColor: colors.surface,
                  borderRadius: 14,
                  marginBottom: 14,
                  borderWidth: 1,
                  borderColor: colors.border,
                  overflow: "hidden",
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
              onPress={() => router.push(`/company/${item.id}` as any)}
            >
              <View style={{ width: "100%", height: 160, backgroundColor: colors.background }}>
                {item.logoUrl ? (
                  <Image source={{ uri: item.logoUrl }} style={{ width: "100%", height: 160 }} resizeMode="cover" />
                ) : (
                  <View style={{ width: "100%", height: 160, justifyContent: "center", alignItems: "center" }}>
                    <LucideIcon
                      name={(CATEGORY_GROUPS.find((g) => g.types.includes(item.type))?.icon ?? "building") as any}
                      size={32}
                      color={colors.muted}
                      strokeWidth={1.5}
                    />
                  </View>
                )}
              </View>
              <View style={{ padding: 16 }}>
                <View
                  style={{
                    alignSelf: "flex-start",
                    backgroundColor: colors.primary + "12",
                    borderWidth: 1,
                    borderColor: colors.primary,
                    borderRadius: 4,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ fontSize: 10, color: colors.primary, fontWeight: "700" }}>
                    {CATEGORY_GROUPS.find((g) => g.types.includes(item.type))?.label ?? "업체"}
                  </Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 4 }}>
                  {item.name ?? "업체명 미등록"}
                </Text>
                {item.description ? (
                  <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 19 }} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          )}
        />
      )}
    </ScreenContainer>
  );
}
