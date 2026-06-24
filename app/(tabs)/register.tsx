import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

const CATEGORY_OPTIONS = [
  { id: "cafe", name: "카페", emoji: "☕" },
  { id: "pcroom", name: "PC방", emoji: "🎮" },
  { id: "restaurant", name: "식당", emoji: "🍽️" },
  { id: "gym", name: "헬스장", emoji: "🏋️" },
  { id: "office", name: "사무실", emoji: "🏢" },
  { id: "warehouse", name: "창고재고", emoji: "📦" },
  { id: "transfer", name: "사업양도", emoji: "🏪" },
];

const TRADE_TYPE_OPTIONS = [
  { id: "direct", name: "직거래" },
  { id: "delivery", name: "택배" },
  { id: "negotiable", name: "협의" },
];

export default function RegisterScreen() {
  const colors = useColors();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  // 판매자 프로필 조회 (로그인 시에만)
  const { data: sellerProfile } = trpc.seller.myProfile.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const isVerifiedSeller = sellerProfile?.isVerified && sellerProfile?.sellerStatus === "approved";
  const isPendingSeller = sellerProfile?.sellerStatus === "pending";
  const isRejectedSeller = sellerProfile?.sellerStatus === "rejected";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [location, setLocation] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTradeType, setSelectedTradeType] = useState("direct");

  const createMutation = trpc.products.create.useMutation({
    onSuccess: () => {
      Alert.alert("등록 완료", "상품이 성공적으로 등록되었습니다.", [
        { text: "확인", onPress: () => router.push("/" as any) },
      ]);
    },
    onError: (error) => {
      if (error.data?.code === "UNAUTHORIZED") {
        Alert.alert("로그인 필요", "상품 등록을 위해 로그인이 필요합니다.");
        return;
      }
      Alert.alert("오류", "상품 등록에 실패했습니다. 다시 시도해주세요.");
    },
  });

  const handleSubmit = () => {
    if (!isAuthenticated) {
      Alert.alert("로그인 필요", "상품 등록을 위해 로그인이 필요합니다.");
      return;
    }
    if (!isVerifiedSeller) {
      Alert.alert(
        "판매자 인증 필요",
        "상품 등록은 인증된 판매자만 가능합니다.\n판매자 인증을 신청하시겠습니까?",
        [
          { text: "취소", style: "cancel" },
          { text: "인증 신청", onPress: () => router.push("/seller/apply" as any) },
        ]
      );
      return;
    }
    if (!title.trim()) {
      Alert.alert("입력 오류", "상품명을 입력해주세요.");
      return;
    }
    if (!price || isNaN(Number(price))) {
      Alert.alert("입력 오류", "올바른 가격을 입력해주세요.");
      return;
    }
    if (!selectedCategory) {
      Alert.alert("입력 오류", "업종을 선택해주세요.");
      return;
    }

    createMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      price: Number(price),
      quantity: Number(quantity) || 1,
      category: selectedCategory as any,
      tradeType: selectedTradeType as any,
      location: location.trim() || undefined,
    });
  };

  return (
    <ScreenContainer>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: colors.foreground }}>상품 등록</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
        {/* 이미지 업로드 */}
        <View style={{ paddingHorizontal: 16, marginTop: 4 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 10 }}>
            상품 이미지
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable
              style={({ pressed }) => [
                {
                  width: 80,
                  height: 80,
                  borderRadius: 12,
                  backgroundColor: colors.surface,
                  borderWidth: 1.5,
                  borderColor: colors.border,
                  borderStyle: "dashed",
                  justifyContent: "center",
                  alignItems: "center",
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <IconSymbol name="camera.fill" size={24} color={colors.muted} />
              <Text style={{ fontSize: 10, color: colors.muted, marginTop: 4 }}>대표 사진</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                {
                  width: 80,
                  height: 80,
                  borderRadius: 12,
                  backgroundColor: colors.surface,
                  borderWidth: 1.5,
                  borderColor: colors.border,
                  borderStyle: "dashed",
                  justifyContent: "center",
                  alignItems: "center",
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <IconSymbol name="plus.circle.fill" size={24} color={colors.muted} />
              <Text style={{ fontSize: 10, color: colors.muted, marginTop: 4 }}>추가 (0/30)</Text>
            </Pressable>
          </View>
        </View>

        {/* 제목 */}
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
            상품명 <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="상품명을 입력하세요"
            placeholderTextColor={colors.muted}
            returnKeyType="next"
            style={{
              backgroundColor: colors.surface,
              borderRadius: 10,
              padding: 14,
              fontSize: 15,
              color: colors.foreground,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          />
        </View>

        {/* 업종 */}
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 10 }}>
            업종 <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {CATEGORY_OPTIONS.map((cat) => (
              <Pressable
                key={cat.id}
                style={({ pressed }) => [
                  {
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: selectedCategory === cat.id ? colors.primary : colors.surface,
                    borderWidth: 1,
                    borderColor: selectedCategory === cat.id ? colors.primary : colors.border,
                    opacity: pressed ? 0.7 : 1,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                  },
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text style={{ fontSize: 14 }}>{cat.emoji}</Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "500",
                    color: selectedCategory === cat.id ? "#FFFFFF" : colors.foreground,
                  }}
                >
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* 가격 */}
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
            가격 <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.surface,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: 14,
            }}
          >
            <TextInput
              value={price}
              onChangeText={setPrice}
              placeholder="0"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              returnKeyType="done"
              style={{ flex: 1, padding: 14, fontSize: 15, color: colors.foreground }}
            />
            <Text style={{ fontSize: 14, color: colors.muted, fontWeight: "500" }}>원</Text>
          </View>
        </View>

        {/* 수량 */}
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>수량</Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.surface,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: 14,
            }}
          >
            <TextInput
              value={quantity}
              onChangeText={setQuantity}
              placeholder="1"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              returnKeyType="done"
              style={{ flex: 1, padding: 14, fontSize: 15, color: colors.foreground }}
            />
            <Text style={{ fontSize: 14, color: colors.muted, fontWeight: "500" }}>개</Text>
          </View>
        </View>

        {/* 거래 유형 */}
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 10 }}>거래 유형</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {TRADE_TYPE_OPTIONS.map((type) => (
              <Pressable
                key={type.id}
                style={({ pressed }) => [
                  {
                    paddingHorizontal: 16,
                    paddingVertical: 9,
                    borderRadius: 20,
                    backgroundColor: selectedTradeType === type.id ? colors.primary : colors.surface,
                    borderWidth: 1,
                    borderColor: selectedTradeType === type.id ? colors.primary : colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                onPress={() => setSelectedTradeType(type.id)}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "500",
                    color: selectedTradeType === type.id ? "#FFFFFF" : colors.foreground,
                  }}
                >
                  {type.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* 거래 지역 */}
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>거래 지역</Text>
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="예) 서울 강남구, 경기 성남시"
            placeholderTextColor={colors.muted}
            returnKeyType="next"
            style={{
              backgroundColor: colors.surface,
              borderRadius: 10,
              padding: 14,
              fontSize: 15,
              color: colors.foreground,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          />
        </View>

        {/* 상세 설명 */}
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>상세 설명</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="상품에 대한 상세 설명을 입력하세요&#10;(구매 시기, 상태, 특이사항 등)"
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            style={{
              backgroundColor: colors.surface,
              borderRadius: 10,
              padding: 14,
              fontSize: 15,
              color: colors.foreground,
              minHeight: 120,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          />
        </View>

        {/* 등록 버튼 */}
        <View style={{ paddingHorizontal: 16, marginTop: 28 }}>
          <Pressable
            style={({ pressed }) => [
              {
                backgroundColor: createMutation.isPending ? colors.muted : colors.primary,
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
            onPress={handleSubmit}
            disabled={createMutation.isPending}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}>
              {createMutation.isPending ? "등록 중..." : "등록하기"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
