import { useState } from "react";
import { Text, View, Pressable, TextInput, Alert, ActivityIndicator, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

const CATEGORIES: Array<{ id: string; label: string }> = [
  { id: "account", label: "계정" },
  { id: "product", label: "상품" },
  { id: "payment", label: "결제" },
  { id: "report", label: "신고" },
  { id: "seller", label: "판매회원" },
  { id: "company", label: "업체회원" },
  { id: "etc", label: "기타" },
];

export default function WriteInquiryScreen() {
  const colors = useColors();
  const router = useRouter();
  const [category, setCategory] = useState("etc");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const createMutation = trpc.inquiries.create.useMutation({
    onSuccess: () => {
      Alert.alert("접수 완료", "문의가 접수되었습니다. 확인 후 답변 드릴게요.", [
        { text: "확인", onPress: () => router.replace("/support/inquiries" as any) },
      ]);
    },
    onError: (err) => {
      Alert.alert("접수 실패", err.message);
    },
  });

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert("입력 오류", "제목을 입력해주세요.");
      return;
    }
    if (content.trim().length < 1) {
      Alert.alert("입력 오류", "문의 내용을 입력해주세요.");
      return;
    }
    createMutation.mutate({ category: category as any, title: title.trim(), content: content.trim() });
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, marginRight: 12 }]} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: "600", color: colors.foreground }}>문의하기</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.foreground, marginBottom: 10 }}>문의 유형</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 22 }}>
          {CATEGORIES.map((c) => {
            const selected = category === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => setCategory(c.id)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primary + "12" : "transparent",
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: selected ? colors.primary : colors.muted }}>
                  {c.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.foreground, marginBottom: 10 }}>제목</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="문의 제목을 입력해주세요"
          placeholderTextColor={colors.muted}
          maxLength={100}
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            padding: 12,
            color: colors.foreground,
            backgroundColor: colors.surface,
            fontSize: 14,
            marginBottom: 22,
          }}
        />

        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.foreground, marginBottom: 10 }}>문의 내용</Text>
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="문의하실 내용을 자세히 적어주시면 빠르게 도와드릴 수 있어요."
          placeholderTextColor={colors.muted}
          multiline
          numberOfLines={8}
          maxLength={2000}
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            padding: 12,
            minHeight: 160,
            textAlignVertical: "top",
            color: colors.foreground,
            backgroundColor: colors.surface,
            fontSize: 14,
            marginBottom: 24,
          }}
        />

        <Pressable
          onPress={handleSubmit}
          disabled={createMutation.isPending}
          style={({ pressed }) => [
            {
              backgroundColor: colors.primary,
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: "center",
              opacity: pressed || createMutation.isPending ? 0.85 : 1,
            },
          ]}
        >
          {createMutation.isPending ? (
            <ActivityIndicator color="#222222" />
          ) : (
            <Text style={{ color: "#222222", fontWeight: "700", fontSize: 15 }}>문의 접수하기</Text>
          )}
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
