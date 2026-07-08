import { Text, View, Pressable, FlatList, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { LucideIcon } from "@/components/ui/icon-lucide";
import { useColors } from "@/hooks/use-colors";
import { useAuthStore } from "@/lib/auth-store";
import { trpc } from "@/lib/trpc";

function formatDate(date: string | Date) {
  const d = new Date(date);
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}

export default function ReceivedReviewsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: ratingSummary, isLoading: isLoadingSummary } = trpc.reviews.ratingSummary.useQuery(
    { targetUserId: user?.id ?? 0 },
    { enabled: !!user?.id }
  );
  const { data: reviews, isLoading } = trpc.reviews.listBySeller.useQuery(
    { targetUserId: user?.id ?? 0, limit: 50 },
    { enabled: !!user?.id }
  );

  // 별점 분포 계산
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews?.filter((r: any) => r.rating === star).length ?? 0,
  }));
  const maxCount = Math.max(1, ...distribution.map((d) => d.count));

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, marginRight: 12 }]} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: "600", color: colors.foreground }}>받은 후기</Text>
      </View>

      {isLoadingSummary || isLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={reviews ?? []}
          keyExtractor={(item: any) => String(item.id)}
          contentContainerStyle={{ padding: 16 }}
          ListHeaderComponent={
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 20,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <LucideIcon name="star" size={24} color={colors.primary} strokeWidth={1.5} />
                <Text style={{ fontSize: 32, fontWeight: "800", color: colors.foreground, marginLeft: 8 }}>
                  {ratingSummary?.averageRating?.toFixed(1) ?? "0.0"}
                </Text>
              </View>
              <Text style={{ fontSize: 13, color: colors.muted, textAlign: "center", marginBottom: 20 }}>
                총 {ratingSummary?.totalCount ?? 0}개의 후기
              </Text>

              {distribution.map((d) => (
                <View key={d.star} style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                  <Text style={{ fontSize: 11, color: colors.muted, width: 30 }}>{d.star}점</Text>
                  <View style={{ flex: 1, height: 6, backgroundColor: colors.border, borderRadius: 3, marginHorizontal: 8, overflow: "hidden" }}>
                    <View
                      style={{
                        width: `${(d.count / maxCount) * 100}%`,
                        height: "100%",
                        backgroundColor: colors.primary,
                        borderRadius: 3,
                      }}
                    />
                  </View>
                  <Text style={{ fontSize: 11, color: colors.muted, width: 20, textAlign: "right" }}>{d.count}</Text>
                </View>
              ))}
            </View>
          }
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <LucideIcon name="star" size={30} color={colors.muted} strokeWidth={1.5} />
              <Text style={{ fontSize: 13, color: colors.muted, marginTop: 12 }}>아직 받은 후기가 없습니다.</Text>
            </View>
          }
          renderItem={({ item }: { item: any }) => (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 10,
                padding: 14,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Text style={{ color: colors.primary, fontSize: 13 }}>{"★".repeat(item.rating)}</Text>
                <Text style={{ color: colors.border, fontSize: 13 }}>{"★".repeat(5 - item.rating)}</Text>
                <Text style={{ fontSize: 11, color: colors.muted, marginLeft: 4 }}>{formatDate(item.createdAt)}</Text>
              </View>
              {item.reviewerName ? (
                <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>{item.reviewerName}</Text>
              ) : null}
              {item.content ? (
                <Text style={{ fontSize: 13, color: colors.foreground, lineHeight: 19 }}>{item.content}</Text>
              ) : null}
            </View>
          )}
        />
      )}
    </ScreenContainer>
  );
}
