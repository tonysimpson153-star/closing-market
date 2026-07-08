import { Text, View, Pressable, FlatList, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { LucideIcon } from "@/components/ui/icon-lucide";
import { useColors } from "@/hooks/use-colors";
import { useAuthStore } from "@/lib/auth-store";
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

function formatDate(date: string | Date) {
  const d = new Date(date);
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}

export default function InquiriesScreen() {
  const colors = useColors();
  const router = useRouter();
  const { token } = useAuthStore();
  const isAuthenticated = !!token;

  const { data: inquiries, isLoading, refetch } = trpc.inquiries.myList.useQuery(undefined, {
    enabled: isAuthenticated,
  });

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
        <Text style={{ fontSize: 17, fontWeight: "600", color: colors.foreground, flex: 1 }}>고객센터 문의</Text>
        <Pressable
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          onPress={() => {
            if (!isAuthenticated) {
              router.push("/auth/login" as any);
              return;
            }
            router.push("/support/write" as any);
          }}
        >
          <LucideIcon name="plus" size={22} color={colors.primary} strokeWidth={1.8} />
        </Pressable>
      </View>

      {!isAuthenticated ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
          <Text style={{ fontSize: 15, color: colors.foreground, fontWeight: "600" }}>로그인이 필요합니다</Text>
        </View>
      ) : isLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !inquiries || inquiries.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
          <LucideIcon name="message" size={32} color={colors.muted} strokeWidth={1.5} />
          <Text style={{ fontSize: 15, color: colors.foreground, fontWeight: "600", marginTop: 16 }}>
            문의 내역이 없습니다
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 6, textAlign: "center" }}>
            궁금한 점이나 불편한 점을{"\n"}고객센터에 1:1로 문의해보세요.
          </Text>
          <Pressable
            style={({ pressed }) => [
              {
                marginTop: 20,
                backgroundColor: colors.primary,
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 10,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            onPress={() => router.push("/support/write" as any)}
          >
            <Text style={{ color: "#222222", fontWeight: "700", fontSize: 14 }}>문의하기</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={inquiries}
          keyExtractor={(item: any) => String(item.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshing={isLoading}
          onRefresh={refetch}
          renderItem={({ item }: { item: any }) => (
            <Pressable
              style={({ pressed }) => [
                {
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
              onPress={() => router.push(`/support/${item.id}` as any)}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <View
                  style={{
                    backgroundColor: colors.background,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 4,
                    paddingHorizontal: 7,
                    paddingVertical: 2,
                  }}
                >
                  <Text style={{ fontSize: 10, color: colors.muted, fontWeight: "600" }}>
                    {CATEGORY_LABELS[item.category] ?? "기타"}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: item.status === "answered" ? colors.primary + "15" : colors.warning + "15",
                    borderRadius: 4,
                    paddingHorizontal: 7,
                    paddingVertical: 2,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: item.status === "answered" ? colors.primary : colors.warning,
                    }}
                  >
                    {item.status === "answered" ? "답변완료" : "답변대기"}
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 4 }} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={{ fontSize: 11, color: colors.muted }}>{formatDate(item.createdAt)}</Text>
            </Pressable>
          )}
        />
      )}
    </ScreenContainer>
  );
}
