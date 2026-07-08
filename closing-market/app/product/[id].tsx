import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Image,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { LucideIcon } from "@/components/ui/icon-lucide";
import { useColors } from "@/hooks/use-colors";
import { useAuthStore } from "@/lib/auth-store";
import { trpc } from "@/lib/trpc";

const CATEGORY_LABELS: Record<string, string> = {
  cafe: "카페",
  pcroom: "PC방",
  restaurant: "식당",
  gym: "헬스장",
  office: "사무실",
  warehouse: "창고재고",
  transfer: "사업양도",
};

const TRADE_TYPE_LABELS: Record<string, string> = {
  direct: "직거래",
  delivery: "택배",
  negotiable: "협의",
};

const STATUS_LABELS: Record<string, string> = {
  selling: "판매중",
  reserved: "예약중",
  sold: "판매완료",
};

const STATUS_COLORS: Record<string, string> = {
  selling: "#D4AF37",
  reserved: "#B0B0B0",
  sold: "#808080",
};

const CATEGORY_ICONS: Record<string, string> = {
  cafe: "coffee",
  pcroom: "gamepad2",
  restaurant: "utensils",
  gym: "dumbbell",
  office: "briefcase",
  warehouse: "package",
  transfer: "store",
};

function formatPrice(price: number) {
  return price.toLocaleString("ko-KR") + "원";
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { user, token } = useAuthStore();
  const isAuthenticated = !!token;
  const [galleryIndex, setGalleryIndex] = useState(0);
  const screenWidth = Dimensions.get("window").width;

  const { data: product, isLoading } = trpc.products.detail.useQuery({ id: Number(id) });

  // 최근 본 상품 기록
  const trackViewMutation = trpc.recentViews.track.useMutation();
  useEffect(() => {
    if (isAuthenticated && product?.id) {
      trackViewMutation.mutate({ productId: product.id });
    }
    // product?.id만 의존성으로 두어 같은 상품 재조회 시 중복 호출 방지
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, product?.id]);

  // 찜하기
  const favMutation = trpc.favorites.toggle.useMutation({
    onSuccess: () => {
      Alert.alert("완료", "찜 목록이 업데이트되었습니다.");
    },
    onError: () => {
      Alert.alert("오류", "로그인이 필요합니다.");
    },
  });

  // 채팅방 생성
  const getOrCreateChatMutation = trpc.chats.getOrCreate.useMutation({
    onSuccess: (room) => {
      router.push(`/chat/${room.id}` as any);
    },
    onError: (err) => {
      Alert.alert("오류", err.message);
    },
  });

  const handleChat = () => {
    if (!isAuthenticated) {
      Alert.alert("로그인 필요", "채팅을 시작하려면 로그인이 필요합니다.");
      return;
    }
    if (!product) return;

    const myId = (user as any)?.id;
    if (myId === product.userId) {
      Alert.alert("알림", "본인의 상품에는 채팅할 수 없습니다.");
      return;
    }
    if (product.status === "sold") {
      Alert.alert("알림", "이미 판매 완료된 상품입니다.");
      return;
    }

    getOrCreateChatMutation.mutate({
      sellerId: product.userId,
      productId: product.id,
    });
  };

  const handleFavorite = () => {
    if (!isAuthenticated) {
      Alert.alert("로그인 필요", "찜하기는 로그인이 필요합니다.");
      return;
    }
    favMutation.mutate({ productId: Number(id) });
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!product) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
          <LucideIcon name="alert-circle" size={36} color={colors.muted} strokeWidth={1.5} />
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
            상품을 찾을 수 없습니다
          </Text>
          <Pressable
            style={({ pressed }) => [{ marginTop: 24, opacity: pressed ? 0.7 : 1 }]}
            onPress={() => router.back()}
          >
            <Text style={{ color: colors.primary, fontWeight: "700" }}>← 뒤로 가기</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  const isMine = (user as any)?.id === product.userId;

  return (
    <ScreenContainer edges={["top", "left", "right"]} className="bg-background">
      {/* 헤더 */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, marginRight: 16 }]}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, flex: 1, letterSpacing: 0.5 }}>
          상품 상세
        </Text>
        <Pressable
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, marginRight: 16 }]}
          onPress={() => {
            Alert.alert("상품 옵션", undefined, [
              {
                text: "신고하기",
                style: "destructive",
                onPress: () => router.push(`/report?targetType=product&targetId=${product.id}` as any),
              },
              { text: "취소", style: "cancel" },
            ]);
          }}
        >
          <IconSymbol name="ellipsis" size={22} color={colors.foreground} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          onPress={handleFavorite}
        >
          <IconSymbol name="heart" size={24} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 이미지 영역 */}
        <View style={[styles.imageArea, { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, padding: 0 }]}>
          {product.images && product.images.length > 0 ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const idx = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
                  setGalleryIndex(idx);
                }}
              >
                {product.images.map((img: any) => (
                  <Image
                    key={img.id}
                    source={{ uri: img.imageUrl }}
                    style={{ width: screenWidth, height: 280 }}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
              {product.images.length > 1 && (
                <View style={{
                  position: "absolute", bottom: 12, alignSelf: "center",
                  flexDirection: "row", gap: 6,
                }}>
                  {product.images.map((img: any, i: number) => (
                    <View
                      key={img.id}
                      style={{
                        width: i === galleryIndex ? 16 : 6, height: 6, borderRadius: 3,
                        backgroundColor: i === galleryIndex ? "#fff" : "#ffffff80",
                      }}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={{ width: "100%", height: 280, justifyContent: "center", alignItems: "center" }}>
              <LucideIcon name={(CATEGORY_ICONS[product.category] ?? "package") as any} size={64} color={colors.muted} strokeWidth={1} />
            </View>
          )}
        </View>

        {/* 상품 정보 */}
        <View style={{ padding: 20 }}>
          {/* 상태 배지 */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <View style={[styles.badge, { backgroundColor: STATUS_COLORS[product.status] + "20", borderWidth: 1, borderColor: STATUS_COLORS[product.status] }]}>
              <Text style={[styles.badgeText, { color: STATUS_COLORS[product.status], fontWeight: "700" }]}>
                {STATUS_LABELS[product.status]}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}>
              <Text style={[styles.badgeText, { color: colors.muted }]}>
                {CATEGORY_LABELS[product.category]}
              </Text>
            </View>
          </View>

          {/* 제목 */}
          <Text style={{ fontSize: 22, fontWeight: "800", color: colors.foreground, marginBottom: 12, lineHeight: 32 }}>
            {product.title}
          </Text>

          {/* 가격 - 골드 강조 */}
          <Text style={{ fontSize: 28, fontWeight: "800", color: colors.primary, marginBottom: 20, letterSpacing: 1 }}>
            {formatPrice(product.price)}
          </Text>

          {/* 메타 정보 - 구분선 추가 */}
          <View style={[styles.metaRow, { borderColor: colors.border }]}>
            {product.location ? (
              <View style={styles.metaItem}>
                <IconSymbol name="location.fill" size={14} color={colors.primary} />
                <Text style={[styles.metaText, { color: colors.foreground, fontWeight: "600" }]}>{product.location}</Text>
              </View>
            ) : null}
            <View style={styles.metaItem}>
              <IconSymbol name="shippingbox.fill" size={14} color={colors.primary} />
              <Text style={[styles.metaText, { color: colors.foreground, fontWeight: "600" }]}>
                {TRADE_TYPE_LABELS[product.tradeType]}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <IconSymbol name="number" size={14} color={colors.primary} />
              <Text style={[styles.metaText, { color: colors.foreground, fontWeight: "600" }]}>수량 {product.quantity}개</Text>
            </View>
            <View style={styles.metaItem}>
              <IconSymbol name="eye.fill" size={14} color={colors.primary} />
              <Text style={[styles.metaText, { color: colors.foreground, fontWeight: "600" }]}>조회 {product.viewCount}</Text>
            </View>
          </View>

          {/* 판매자 정보 카드 - 고급스럽게 개편 */}
          <Pressable
            style={({ pressed }) => [{
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              padding: 16,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: colors.primary,
              backgroundColor: colors.surface,
              marginBottom: 28,
              marginTop: 12,
              opacity: pressed ? 0.85 : 1,
            }]}
            onPress={() =>
              router.push({
                pathname: "/seller/profile" as any,
                params: {
                  userId: product.userId?.toString() ?? "",
                  userName: product.sellerName ?? "판매자",
                },
              })
            }
          >
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primary + "12", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: colors.primary }}>
              <LucideIcon name="user" size={22} color={colors.primary} strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>
                  {product.sellerName ?? "판매자"}
                </Text>
                {product.isSellerVerified && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.primary + "12", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, borderWidth: 1, borderColor: colors.primary }}>
                    <LucideIcon name="check" size={11} color={colors.primary} strokeWidth={2} />
                    <Text style={{ fontSize: 11, fontWeight: "700", color: colors.primary, letterSpacing: 0.2 }}>인증판매자</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 12, color: colors.muted }}>후기 보기 ›</Text>
            </View>
            <IconSymbol name="chevron.right" size={18} color={colors.primary} />
          </Pressable>

          {/* 상품 설명 */}
          {product.description ? (
            <View style={{ marginBottom: 32, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground, marginBottom: 12, letterSpacing: 0.5 }}>
                상품 설명
              </Text>
              <Text style={{ fontSize: 14, color: colors.muted, lineHeight: 24, fontWeight: "500" }}>
                {product.description}
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* 하단 버튼 - 고급스러운 스타일 */}
      <View style={[styles.bottomBar, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
        {isMine ? (
          <View style={[styles.myProductBanner, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}>
            <Text style={{ fontSize: 14, color: colors.muted, fontWeight: "600" }}>
              내가 등록한 상품입니다
            </Text>
          </View>
        ) : (
          <>
            <Pressable
              style={({ pressed }) => [
                styles.favBtn,
                { backgroundColor: colors.surface, borderColor: colors.primary, borderWidth: 1.5, opacity: pressed ? 0.8 : 1 },
              ]}
              onPress={handleFavorite}
              disabled={favMutation.isPending}
            >
              <IconSymbol name="heart" size={20} color={colors.primary} />
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.primary, marginLeft: 6 }}>
                찜
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.chatBtn,
                {
                  backgroundColor: product.status === "sold" ? colors.muted : colors.primary,
                  opacity: pressed ? 0.9 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
              onPress={handleChat}
              disabled={getOrCreateChatMutation.isPending || product.status === "sold"}
            >
              {getOrCreateChatMutation.isPending ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Text style={{ fontSize: 15, fontWeight: "700", color: "#000000" }}>
                  {product.status === "sold" ? "판매완료" : "채팅하기"}
                </Text>
              )}
            </Pressable>
          </>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  imageArea: {
    height: 280,
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 13,
  },
  bottomBar: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  favBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  chatBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  myProductBanner: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
});
