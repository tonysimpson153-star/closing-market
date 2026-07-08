import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LucideIcon } from "@/components/ui/icon-lucide";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

function StarRating({
  rating,
  onRate,
  size = 40,
}: {
  rating: number;
  onRate: (r: number) => void;
  size?: number;
}) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          onPress={() => onRate(star)}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={{ fontSize: size, color: star <= rating ? "#F59E0B" : colors.border }}>
            ★
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const RATING_LABELS: Record<number, string> = {
  1: "별로예요",
  2: "아쉬워요",
  3: "보통이에요",
  4: "좋아요",
  5: "최고예요!",
};

export default function WriteReviewScreen() {
  const { chatRoomId, targetUserId, targetName, productTitle } =
    useLocalSearchParams<{
      chatRoomId: string;
      targetUserId: string;
      targetName: string;
      productTitle?: string;
    }>();
  const router = useRouter();
  const colors = useColors();

  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");

  const createMutation = trpc.reviews.create.useMutation({
    onSuccess: () => {
      Alert.alert("후기 작성 완료", "후기가 성공적으로 등록되었습니다.", [
        { text: "확인", onPress: () => router.back() },
      ]);
    },
    onError: (err) => {
      Alert.alert("오류", err.message);
    },
  });

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert("별점 필요", "별점을 선택해주세요.");
      return;
    }
    createMutation.mutate({
      targetUserId: Number(targetUserId),
      chatRoomId: chatRoomId ? Number(chatRoomId) : undefined,
      rating,
      content: content.trim() || undefined,
    });
  };

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
          거래 후기 작성
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24 }}>
        {/* 대상 정보 */}
        <View style={[styles.targetCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
            <LucideIcon name="user" size={20} color={colors.primary} strokeWidth={1.5} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}>
              {targetName ?? "판매자"}
            </Text>
            {productTitle ? (
              <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }} numberOfLines={1}>
                {productTitle}
              </Text>
            ) : null}
          </View>
        </View>

        {/* 별점 */}
        <View style={{ alignItems: "center", marginTop: 32, marginBottom: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 16 }}>
            거래는 어떠셨나요?
          </Text>
          <StarRating rating={rating} onRate={setRating} size={44} />
          {rating > 0 && (
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#F59E0B", marginTop: 12 }}>
              {RATING_LABELS[rating]}
            </Text>
          )}
        </View>

        {/* 텍스트 후기 */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground, marginBottom: 10 }}>
            후기 내용 <Text style={{ color: colors.muted, fontWeight: "400" }}>(선택)</Text>
          </Text>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="거래 경험을 자유롭게 작성해주세요. (최대 500자)"
            placeholderTextColor={colors.muted}
            multiline
            maxLength={500}
            style={[
              styles.textArea,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
            returnKeyType="default"
          />
          <Text style={{ fontSize: 12, color: colors.muted, textAlign: "right", marginTop: 4 }}>
            {content.length}/500
          </Text>
        </View>

        {/* 제출 버튼 */}
        <Pressable
          style={({ pressed }) => [
            styles.submitBtn,
            {
              backgroundColor: rating === 0 ? colors.muted : colors.primary,
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
          onPress={handleSubmit}
          disabled={createMutation.isPending || rating === 0}
        >
          {createMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>
              후기 등록하기
            </Text>
          )}
        </Pressable>
      </ScrollView>
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
  targetCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    lineHeight: 22,
    minHeight: 140,
    textAlignVertical: "top",
  },
  submitBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
