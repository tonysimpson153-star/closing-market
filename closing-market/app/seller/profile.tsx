import React from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LucideIcon } from "@/components/ui/icon-lucide";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

function StarDisplay({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Text key={star} style={{ fontSize: size, color: star <= Math.round(rating) ? "#F59E0B" : "#D1D5DB" }}>
          ★
        </Text>
      ))}
    </View>
  );
}

function ReviewCard({ item }: { item: any }) {
  const colors = useColors();
  const date = new Date(item.createdAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <View style={[styles.reviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <View style={[styles.reviewAvatar, { backgroundColor: colors.primary + "20" }]}>
          <LucideIcon name="user" size={16} color={colors.primary} strokeWidth={1.5} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
            {item.reviewerName ?? "익명"}
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted }}>{date}</Text>
        </View>
        <StarDisplay rating={item.rating} size={14} />
      </View>
      {item.content ? (
        <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 20 }}>
          {item.content}
        </Text>
      ) : (
        <Text style={{ fontSize: 13, color: colors.muted, fontStyle: "italic" }}>
          내용 없음
        </Text>
      )}
    </View>
  );
}

export default function SellerProfileScreen() {
  const { userId, userName } = useLocalSearchParams<{ userId: string; userName?: string }>();
  const router = useRouter();
  const colors = useColors();

  const targetUserId = Number(userId);

  const { data: summary, isLoading: summaryLoading } = trpc.reviews.ratingSummary.useQuery(
    { targetUserId },
    { enabled: !!targetUserId }
  );

  const { data: reviews, isLoading: reviewsLoading } = trpc.reviews.listBySeller.useQuery(
    { targetUserId, limit: 30 },
    { enabled: !!targetUserId }
  );

  const isLoading = summaryLoading || reviewsLoading;

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* 헤더 */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, marginRight: 12 }]}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: "600", color: colors.foreground }}>
          판매자 프로필
        </Text>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={reviews ?? []}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View>
              {/* 판매자 정보 카드 */}
              <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.bigAvatar, { backgroundColor: colors.primary + "20" }]}>
                  <LucideIcon name="user" size={32} color={colors.primary} strokeWidth={1.5} />
                </View>
                <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground, marginTop: 12 }}>
                  {userName ?? "판매자"}
                </Text>

                {/* 평균 별점 */}
                {summary && summary.totalCount > 0 ? (
                  <View style={{ alignItems: "center", marginTop: 12 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={{ fontSize: 36, fontWeight: "800", color: "#F59E0B" }}>
                        {summary.averageRating.toFixed(1)}
                      </Text>
                      <View>
                        <StarDisplay rating={summary.averageRating} size={20} />
                        <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
                          후기 {summary.totalCount}개
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={{ alignItems: "center", marginTop: 12 }}>
                    <Text style={{ fontSize: 14, color: colors.muted }}>아직 후기가 없습니다.</Text>
                  </View>
                )}

                {/* 별점 분포 */}
                {summary && summary.totalCount > 0 && (
                  <View style={[styles.ratingBar, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = (reviews ?? []).filter((r) => r.rating === star).length;
                      const pct = summary.totalCount > 0 ? (count / summary.totalCount) * 100 : 0;
                      return (
                        <View key={star} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <Text style={{ fontSize: 12, color: colors.muted, width: 16, textAlign: "right" }}>{star}</Text>
                          <Text style={{ fontSize: 12, color: "#F59E0B" }}>★</Text>
                          <View style={[styles.barBg, { backgroundColor: colors.border }]}>
                            <View style={[styles.barFill, { width: `${pct}%` as any, backgroundColor: "#F59E0B" }]} />
                          </View>
                          <Text style={{ fontSize: 11, color: colors.muted, width: 24 }}>{count}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* 후기 섹션 헤더 */}
              <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>
                  거래 후기 {summary?.totalCount ? `(${summary.totalCount})` : ""}
                </Text>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
              <ReviewCard item={item} />
            </View>
          )}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingVertical: 48 }}>
              <LucideIcon name="file" size={30} color={colors.muted} strokeWidth={1.5} />
              <Text style={{ fontSize: 15, color: colors.muted, marginTop: 12 }}>아직 거래 후기가 없습니다.</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  profileCard: {
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
  },
  bigAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  ratingBar: {
    width: "100%",
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  barBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 4,
  },
  reviewCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
