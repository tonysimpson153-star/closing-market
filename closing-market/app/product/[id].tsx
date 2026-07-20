import { useState, useEffect } from "react";
import { View, Text, ScrollView, Image, Pressable, Alert, ActivityIndicator, StyleSheet, Share, useWindowDimensions} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
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

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
    const { width: screenWidth } = useWindowDimensions();

  const router = useRouter();
  const { token, user } = useAuthStore();
  const isAuthenticated = !!token;
  const productId = Number(id);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const { data: product, isLoading, refetch } = trpc.products.detail.useQuery(
    { id: productId },
    { enabled: !!productId }
  );

  const trackViewMutation = trpc.recentViews.track.useMutation();
  useEffect(() => {
    if (isAuthenticated && product?.id) {
      trackViewMutation.mutate({ productId: product.id });
    }
    // product?.id만 의존성으로 두어 같은 상품 재조회 시 중복 호출 방지
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, product?.id]);

  // 찜 여부 조회
  const { data: isFavorited, refetch: refetchFavorited } = trpc.favorites.check.useQuery(
    { productId: product?.id },
    { enabled: isAuthenticated && !!product?.id }
  );

  // 찜하기
  const favMutation = trpc.favorites.toggle.useMutation({
    onSuccess: (data) => {
      refetchFavorited();
      Alert.alert("완료", data.favorited ? "찜 목록에 추가되었습니다." : "찜 목록에서 삭제되었습니다.");
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

  const handleFavorite = () => {
    if (!isAuthenticated) {
      Alert.alert("로그인 필요", "찜하기를 위해 로그인이 필요합니다.");
      return;
    }
    if (!product) return;
    favMutation.mutate({ productId: product.id });
  };

  const handleChat = () => {
    if (!isAuthenticated) {
      Alert.alert("로그인 필요", "채팅을 위해 로그인이 필요합니다.", [
        { text: "취소", style: "cancel" },
        { text: "로그인", onPress: () => router.push("/auth/login" as any) },
      ]);
      return;
    }
    if (!product) return;
        if (product.userId === user?.id) {
      Alert.alert("알림", "본인이 등록한 상품입니다.");
      return;
    }
    getOrCreateChatMutation.mutate({ sellerId: product.userId, productId: product.id });

    }
    getOrCreateChatMutation.mutate({ sellerId: product.sellerId, productId: product.id });
  };

  const handleShare = async () => {
    if (!product) return;
    try {
      await Share.share({
        message: `${product.title} - ${product.price?.toLocaleString()}원`,
      });
    } catch {
      // 공유 취소 시 무시
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
              </View>

      {/* 사진 확대보기 */}
      {fullscreenImage && (
        <Pressable
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#000000F0", justifyContent: "center", alignItems: "center", zIndex: 999 }}
          onPress={() => setFullscreenImage(null)}
        >
          <Image source={{ uri: fullscreenImage }} style={{ width: "100%", height: "80%" }} resizeMode="contain" />
        </Pressable>
      )}
    </ScreenContainer>
  );
}


  if (!product) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
          <LucideIcon name="package" size={40} color={colors.muted} strokeWidth={1.5} />
          <Text style={{ fontSize: 15, color: colors.foreground, fontWeight: "600", marginTop: 16 }}>
            상품을 찾을 수 없습니다
          </Text>
          <Pressable style={{ marginTop: 20 }} onPress={() => router.back()}>
            <Text style={{ color: colors.primary, fontWeight: "700" }}>뒤로 가기</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

    const images = product.images && product.images.length > 0
    ? product.images.map((img: any) => typeof img === "string" ? img : img.imageUrl)
    : [];


  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          onPress={() => {
            Alert.alert("신고하기", "이 상품을 신고하시겠습니까?", [
              { text: "취소", style: "cancel" },
              {
                text: "신고",
                style: "destructive",
                onPress: () => router.push({ pathname: "/report" as any, params: { productId: product.id } }),
              },
            ]);
          }}
        >
          <IconSymbol name="ellipsis" size={22} color={colors.foreground} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          onPress={handleFavorite}
        >
          <IconSymbol name={isFavorited ? "heart.fill" : "heart"} size={24} color={colors.primary} />
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
                  const index = Math.round(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width);
                  setActiveImageIndex(index);
                }}
              >
                {images.map((uri: string, index: number) => (
                  <Pressable key={index} onPress={() => setFullscreenImage(uri)}>
                    <Image
                      source={{ uri }}
                      style={{ width: screenWidth, height: 280 }}
                      resizeMode="cover"
                    />
                  </Pressable>
                ))}
              </ScrollView>

              {images.length > 1 && (
                <View style={{ position: "absolute", bottom: 12, alignSelf: "center", flexDirection: "row", gap: 6 }}>
                  {images.map((_: string, index: number) => (
                    <View
                      key={index}
                      style={{
                        width: 6, height: 6, borderRadius: 3,
                        backgroundColor: index === activeImageIndex ? "#fff" : "rgba(255,255,255,0.5)",
                      }}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={{ width: "100%", height: 280, alignItems: "center", justifyContent: "center" }}>
              <LucideIcon name="image" size={40} color={colors.muted} strokeWidth={1.5} />
            </View>
          )}
        </View>

        <View style={{ padding: 18 }}>
          <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "700", marginBottom: 8 }}>
            {CATEGORY_LABELS[product.category] ?? product.category} · {product.location ?? "지역 미정"}
          </Text>
          <Text style={{ fontSize: 19, fontWeight: "800", color: colors.foreground, lineHeight: 27 }}>
            {product.title}
          </Text>
          <Text style={{ fontSize: 24, fontWeight: "800", color: colors.primary, marginTop: 10 }}>
            {product.price?.toLocaleString()}원
          </Text>

          <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
            <View style={{ backgroundColor: colors.surface, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5 }}>
              <Text style={{ fontSize: 12, color: colors.muted }}>{TRADE_TYPE_LABELS[product.tradeType] ?? product.tradeType}</Text>
            </View>
            {product.status !== "selling" && (
              <View style={{ backgroundColor: colors.error + "15", borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5 }}>
                <Text style={{ fontSize: 12, color: colors.error, fontWeight: "700" }}>
                  {product.status === "reserved" ? "예약중" : "판매완료"}
                </Text>
              </View>
            )}
          </View>

          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 20 }} />

          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
            <Pressable
              style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
              onPress={() =>
                router.push({
                  pathname: "/seller/profile" as any,
                  params: { userId: String(product.sellerId), userName: product.sellerName ?? "판매자" },
                })
              }
            >
              <View
                style={{
                  width: 44, height: 44, borderRadius: 22,
                  backgroundColor: colors.primary + "10", borderWidth: 1, borderColor: colors.primary,
                  alignItems: "center", justifyContent: "center", marginRight: 12,
                }}
              >
                <LucideIcon name="store" size={18} color={colors.primary} strokeWidth={1.5} />
              </View>
              <View>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>
                  {product.sellerName ?? "판매자"}
                </Text>
                {product.sellerIsVerified && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 }}>
                    <LucideIcon name="check-circle" size={11} color={colors.primary} strokeWidth={2} />
                    <Text style={{ fontSize: 11, color: colors.primary, fontWeight: "600" }}>인증판매자</Text>
                  </View>
                )}
              </View>
            </Pressable>
            <Pressable onPress={handleShare} hitSlop={8}>
              <LucideIcon name="share" size={20} color={colors.muted} strokeWidth={1.5} />
            </Pressable>
          </View>

          {product.description ? (
            <>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 10 }}>
                상세 설명
              </Text>
              <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 22 }}>
                {product.description}
              </Text>
            </>
          ) : null}
        </View>
      </ScrollView>

      <View
        style={{
          flexDirection: "row",
          padding: 16,
          gap: 10,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.background,
        }}
      >
                {product.userId !== user?.id && (

          <>
            <Pressable
              style={({ pressed }) => [
                styles.favBtn,
                {
                  backgroundColor: isFavorited ? colors.primary : colors.surface,
                  borderColor: colors.primary,
                  borderWidth: 1.5,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              onPress={handleFavorite}
              disabled={favMutation.isPending}
            >
              <IconSymbol name={isFavorited ? "heart.fill" : "heart"} size={20} color={isFavorited ? "#fff" : colors.primary} />
              <Text style={{ fontSize: 14, fontWeight: "700", color: isFavorited ? "#fff" : colors.primary, marginLeft: 6 }}>
                찜
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.chatBtn,
                { backgroundColor: colors.primary, opacity: pressed || getOrCreateChatMutation.isPending ? 0.85 : 1 },
              ]}
              onPress={handleChat}
              disabled={getOrCreateChatMutation.isPending}
            >
              {getOrCreateChatMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>채팅으로 문의하기</Text>
              )}
            </Pressable>
          </>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  imageArea: {
    width: "100%",
  },
  favBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  chatBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
