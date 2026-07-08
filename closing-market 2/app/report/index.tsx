import { useState } from "react";
import { Text, View, Pressable, TextInput, Alert, ActivityIndicator, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

const TARGET_LABELS: Record<string, string> = {
  product: "상품",
  user: "사용자",
  comment: "댓글",
  chat: "채팅",
};

const REASON_PRESETS = [
  "허위 매물 / 사기 의심",
  "욕설, 비방 등 부적절한 언행",
  "음란물 또는 불법 콘텐츠",
  "중복/스팸 게시",
  "가격 및 거래 정보 허위 기재",
  "기타",
];

export default function ReportScreen() {
  const colors = useColors();
  const router = useRouter();
  const { targetType, targetId } = useLocalSearchParams<{ targetType?: string; targetId?: string }>();

  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [detail, setDetail] = useState("");

  const createReportMutation = trpc.reports.create.useMutation({
    onSuccess: () => {
      Alert.alert("접수 완료", "신고가 접수되었습니다. 검토 후 조치할게요.", [
        { text: "확인", onPress: () => router.back() },
      ]);
    },
    onError: (err) => {
      Alert.alert("접수 실패", err.message);
    },
  });

  const targetLabel = targetType ? TARGET_LABELS[targetType] ?? "대상" : "대상";

  const handleSubmit = () => {
    if (!targetType || !targetId) {
      Alert.alert("오류", "신고 대상 정보를 확인할 수 없습니다.");
      return;
    }
    const reasonText = [selectedPreset, detail.trim()].filter(Boolean).join(" - ");
    if (!selectedPreset && detail.trim().length < 5) {
      Alert.alert("입력 필요", "신고 사유를 선택하거나 5자 이상 입력해주세요.");
      return;
    }
    createReportMutation.mutate({
      targetType: targetType as any,
      targetId: Number(targetId),
      reason: reasonText,
    });
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border,
        }}
      >
        <Pressable onPress={() => router.back()} style={{ marginRight: 12 }}>
          <IconSymbol name="chevron.left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: "800", color: colors.foreground }}>
          {targetLabel} 신고하기
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 20, lineHeight: 20 }}>
          허위 신고는 서비스 이용에 제한이 있을 수 있어요. 신고 내용은 운영팀이 검토 후 조치합니다.
        </Text>

        <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 10 }}>
          신고 사유를 선택해주세요
        </Text>
        <View style={{ marginBottom: 20 }}>
          {REASON_PRESETS.map((preset) => {
            const selected = selectedPreset === preset;
            return (
              <Pressable
                key={preset}
                onPress={() => setSelectedPreset(preset)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primary + "12" : colors.surface,
                  marginBottom: 8,
                }}
              >
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    borderWidth: 2,
                    borderColor: selected ? colors.primary : colors.border,
                    marginRight: 10,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {selected && (
                    <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary }} />
                  )}
                </View>
                <Text style={{ fontSize: 14, color: colors.foreground, fontWeight: selected ? "700" : "400" }}>
                  {preset}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 10 }}>
          상세 내용 {selectedPreset ? "(선택)" : ""}
        </Text>
        <TextInput
          value={detail}
          onChangeText={setDetail}
          placeholder="상황을 구체적으로 알려주시면 처리에 도움이 됩니다."
          placeholderTextColor={colors.muted}
          multiline
          numberOfLines={5}
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            padding: 12,
            minHeight: 110,
            textAlignVertical: "top",
            color: colors.foreground,
            backgroundColor: colors.surface,
            fontSize: 14,
            marginBottom: 24,
          }}
        />

        <Pressable
          onPress={handleSubmit}
          disabled={createReportMutation.isPending}
          style={({ pressed }) => [
            {
              backgroundColor: colors.primary,
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: "center",
              opacity: pressed || createReportMutation.isPending ? 0.8 : 1,
            },
          ]}
        >
          {createReportMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>신고 접수하기</Text>
          )}
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
