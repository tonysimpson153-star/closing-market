import { Text, View, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { LucideIcon } from "@/components/ui/icon-lucide";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

const CATEGORY_LABELS: Record<string, string> = {
  account: "계정",
  product: "상품",
  payment: "결제",
  report: "신고",
  seller: "판매회원",
  company: "업체회원",
  etc: "기타",
};

function formatDateTime(date: string | Date) {
  const d = new Date(date);
  return d.toLocaleString("ko-KR", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function InquiryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();

  const { data: inquiry, isLoading } = trpc.inquiries.detail.useQuery({ id: Number(id) });

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
        <Text style={{ fontSize: 17, fontWeight: "600", color: colors.foreground }}>문의 상세</Text>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !inquiry ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
          <LucideIcon name="alert-circle" size={32} color={colors.muted} strokeWidth={1.5} />
          <Text style={{ fontSize: 15, color: colors.foreground, fontWeight: "600", marginTop: 16 }}>
            문의를 찾을 수 없습니다.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <View
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 4,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}
            >
              <Text style={{ fontSize: 11, color: colors.muted, fontWeight: "600" }}>
                {CATEGORY_LABELS[inquiry.category] ?? "기타"}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: inquiry.status === "answered" ? colors.primary + "15" : colors.warning + "15",
                borderRadius: 4,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: inquiry.status === "answered" ? colors.primary : colors.warning,
                }}
              >
                {inquiry.status === "answered" ? "답변완료" : "답변대기"}
              </Text>
            </View>
          </View>

          <Text style={{ fontSize: 19, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
            {inquiry.title}
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 20 }}>
            {formatDateTime(inquiry.createdAt)}
          </Text>

          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 22 }}>{inquiry.content}</Text>
          </View>

          {inquiry.status === "answered" ? (
            <View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <LucideIcon name="check-circle" size={15} color={colors.primary} strokeWidth={1.8} />
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>고객센터 답변</Text>
                {inquiry.answeredAt ? (
                  <Text style={{ fontSize: 11, color: colors.muted }}>{formatDateTime(inquiry.answeredAt)}</Text>
                ) : null}
              </View>
              <View
                style={{
                  backgroundColor: colors.primary + "08",
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: colors.primary,
                }}
              >
                <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 22 }}>{inquiry.answerContent}</Text>
              </View>
            </View>
          ) : (
            <View style={{ alignItems: "center", paddingVertical: 20 }}>
              <LucideIcon name="clock" size={26} color={colors.muted} strokeWidth={1.5} />
              <Text style={{ fontSize: 13, color: colors.muted, marginTop: 10 }}>
                아직 답변 대기중입니다. 확인 후 빠르게 답변 드릴게요.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </ScreenContainer>
  );
}
