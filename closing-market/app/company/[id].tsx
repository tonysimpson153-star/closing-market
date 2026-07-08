import { ScrollView, Text, View, Pressable, ActivityIndicator, Linking, Alert, Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { LucideIcon } from "@/components/ui/icon-lucide";
import { useColors } from "@/hooks/use-colors";
import { useAuthStore } from "@/lib/auth-store";
import { trpc } from "@/lib/trpc";

const COMPANY_TYPE_LABELS: Record<string, string> = {
  demolition: "철거업체",
  interior: "인테리어업체",
  waste: "폐기물처리업체",
  signage: "간판·사인업체",
  pos: "POS·키오스크업체",
  cctv: "CCTV·보안업체",
  cleaning: "청소·방역업체",
  tax: "전문 상담 (세무사)",
  labor: "전문 상담 (노무사)",
  kitchen: "주방기기업체",
  consulting: "창업 컨설팅",
};

const COMPANY_TYPE_ICONS: Record<string, string> = {
  demolition: "hammer",
  interior: "palette",
  waste: "recycle",
  signage: "signpost",
  pos: "monitor",
  cctv: "camera",
  cleaning: "waves",
  tax: "file",
  labor: "scale",
  kitchen: "utensils",
  consulting: "trending-up",
};

function formatDate(date: string | Date) {
  const d = new Date(date);
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}

export default function CompanyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { token } = useAuthStore();
  const isAuthenticated = !!token;
  const companyId = Number(id);

  const { data: company, isLoading } = trpc.companies.detail.useQuery({ id: companyId });
  const { data: ratingSummary } = trpc.reviews.ratingSummary.useQuery({ targetUserId: companyId });
  const { data: reviewList } = trpc.reviews.listBySeller.useQuery({ targetUserId: companyId, limit: 5 });

  const startChatMutation = trpc.chats.getOrCreate.useMutation({
    onSuccess: (room) => {
      router.push(`/chat/${room.id}` as any);
    },
    onError: (err) => {
      Alert.alert("오류", err.message);
    },
  });

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!company) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
          <LucideIcon name="alert-circle" size={36} color={colors.muted} strokeWidth={1.5} />
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginTop: 16 }}>
            업체를 찾을 수 없습니다.
          </Text>
          <Pressable
            style={({ pressed }) => [{ marginTop: 20, opacity: pressed ? 0.7 : 1 }]}
            onPress={() => router.back()}
          >
            <Text style={{ color: colors.primary, fontWeight: "600" }}>뒤로 가기</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  const callPhone = () => {
    if (!company.phone) {
      Alert.alert("안내", "등록된 연락처가 없습니다.");
      return;
    }
    Linking.openURL(`tel:${company.phone}`).catch(() =>
      Alert.alert("오류", "전화 앱을 열 수 없습니다.")
    );
  };

  const handleChatInquiry = () => {
    if (!isAuthenticated) {
      Alert.alert("로그인 필요", "채팅 문의는 로그인이 필요합니다.");
      return;
    }
    startChatMutation.mutate({ sellerId: company.id });
  };

  const handleWriteReview = () => {
    if (!isAuthenticated) {
      Alert.alert("로그인 필요", "후기 작성은 로그인이 필요합니다.");
      return;
    }
    router.push(
      `/review/write?targetUserId=${company.id}&targetName=${encodeURIComponent(company.name ?? "업체")}` as any
    );
  };

  const images: any[] = (company as any).images ?? [];

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 }}>
        <Pressable
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, marginRight: 12 }]}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: "600", color: colors.foreground, flex: 1 }}>업체 상세</Text>
        <Pressable
          onPress={() =>
            router.push(`/report?targetType=user&targetId=${company.id}` as any)
          }
        >
          <LucideIcon name="alert-circle" size={20} color={colors.muted} strokeWidth={1.5} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ width: "100%", height: 220, backgroundColor: colors.surface }}>
          {company.logoUrl ? (
            <Image source={{ uri: company.logoUrl }} style={{ width: "100%", height: 220 }} resizeMode="cover" />
          ) : (
            <View style={{ width: "100%", height: 220, justifyContent: "center", alignItems: "center" }}>
              <LucideIcon
                name={(COMPANY_TYPE_ICONS[company.type as string] ?? "building") as any}
                size={40}
                color={colors.muted}
                strokeWidth={1.5}
              />
            </View>
          )}
        </View>
        <View style={{ padding: 20, alignItems: "center" }}>
          <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground, marginBottom: 6 }}>
            {company.name ?? "업체명 미등록"}
          </Text>

          {company.phone ? (
            <Pressable onPress={callPhone} style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 10 }}>
              <LucideIcon name="phone" size={13} color={colors.muted} strokeWidth={1.5} />
              <Text style={{ fontSize: 13, color: colors.muted }}>{company.phone}</Text>
            </Pressable>
          ) : null}

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View
              style={{
                backgroundColor: colors.primary + "12",
                borderWidth: 1,
                borderColor: colors.primary,
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 4,
              }}
            >
              <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "700" }}>
                {COMPANY_TYPE_LABELS[company.type as string] ?? "업체"}
              </Text>
            </View>
            {ratingSummary && ratingSummary.totalCount > 0 ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                <LucideIcon name="star" size={13} color={colors.primary} strokeWidth={1.5} />
                <Text style={{ fontSize: 13, color: colors.foreground, fontWeight: "600" }}>
                  {ratingSummary.averageRating?.toFixed(1)}
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>({ratingSummary.totalCount})</Text>
              </View>
            ) : null}
          </View>
        </View>

        {images.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 10, marginHorizontal: 16 }}>
              소개 사진
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: "flex-start" }}>
              {images.map((img: any) => (
                <Image
                  key={img.id}
                  source={{ uri: img.imageUrl }}
                  style={{ width: 140, height: 100, borderRadius: 8, backgroundColor: colors.surface }}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          </View>
        )}

        {company.description ? (
          <View
            style={{
              marginHorizontal: 16,
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 18,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 10 }}>
              업체 소개
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted, lineHeight: 22 }}>
              {company.description}
            </Text>
          </View>
        ) : null}

        {company.address ? (
          <View
            style={{
              marginHorizontal: 16,
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 18,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 10 }}>
              위치
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <LucideIcon name="map-pin" size={15} color={colors.muted} strokeWidth={1.5} />
              <Text style={{ fontSize: 14, color: colors.foreground }}>{company.address}</Text>
            </View>
          </View>
        ) : null}

        {/* 후기 */}
        <View
          style={{
            marginHorizontal: 16,
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 18,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>
              이용 후기 {ratingSummary?.totalCount ? `(${ratingSummary.totalCount})` : ""}
            </Text>
            <Pressable onPress={handleWriteReview}>
              <Text style={{ fontSize: 13, color: colors.primary, fontWeight: "600" }}>후기 작성</Text>
            </Pressable>
          </View>

          {!reviewList || reviewList.length === 0 ? (
            <Text style={{ fontSize: 13, color: colors.muted }}>아직 등록된 후기가 없습니다.</Text>
          ) : (
            reviewList.map((review: any, idx: number) => (
              <View
                key={review.id}
                style={{
                  paddingVertical: 10,
                  borderTopWidth: idx === 0 ? 0 : 1,
                  borderTopColor: colors.border,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Text style={{ color: colors.primary, fontSize: 12 }}>{"★".repeat(review.rating)}</Text>
                  <Text style={{ color: colors.border, fontSize: 12 }}>{"★".repeat(5 - review.rating)}</Text>
                  <Text style={{ fontSize: 11, color: colors.muted, marginLeft: 4 }}>{formatDate(review.createdAt)}</Text>
                </View>
                {review.content ? (
                  <Text style={{ fontSize: 13, color: colors.foreground, lineHeight: 19 }}>{review.content}</Text>
                ) : null}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <View
        style={{
          flexDirection: "row",
          padding: 16,
          gap: 12,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.background,
        }}
      >
        <Pressable
          style={({ pressed }) => [
            {
              width: 50,
              paddingVertical: 15,
              borderRadius: 10,
              alignItems: "center",
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
          onPress={callPhone}
        >
          <LucideIcon name="phone" size={18} color={colors.foreground} strokeWidth={1.8} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            {
              flex: 1,
              paddingVertical: 15,
              borderRadius: 10,
              alignItems: "center",
              backgroundColor: colors.primary,
              opacity: pressed || startChatMutation.isPending ? 0.85 : 1,
            },
          ]}
          onPress={handleChatInquiry}
          disabled={startChatMutation.isPending}
        >
          {startChatMutation.isPending ? (
            <ActivityIndicator color="#222222" />
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <LucideIcon name="message" size={15} color="#222222" strokeWidth={1.8} />
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#222222" }}>채팅으로 문의하기</Text>
            </View>
          )}
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
