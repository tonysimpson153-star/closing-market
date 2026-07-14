import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { LucideIcon } from "@/components/ui/icon-lucide";
import { useColors } from "@/hooks/use-colors";
import { useAuthStore } from "@/lib/auth-store";
import { trpc } from "@/lib/trpc";

const CATEGORY_OPTIONS = [
  { id: "cafe", name: "카페", icon: "coffee" },
  { id: "pcroom", name: "PC방", icon: "gamepad2" },
  { id: "restaurant", name: "식당", icon: "utensils" },
  { id: "gym", name: "헬스장", icon: "dumbbell" },
  { id: "office", name: "사무실", icon: "briefcase" },
  { id: "warehouse", name: "창고재고", icon: "package" },
];

const TRADE_TYPE_OPTIONS = [
  { id: "direct", name: "직거래" },
  { id: "delivery", name: "택배" },
  { id: "negotiable", name: "협의" },
];

type RegisterMode = "select" | "product";

export default function RegisterScreen() {
  const colors = useColors();
  const router = useRouter();
  const { token, user } = useAuthStore();
  const isAuthenticated = !!token;
  const [mode, setMode] = useState<RegisterMode>("select");

  // 판매자 프로필 조회 (로그인 시에만)
  const { data: sellerProfile } = trpc.seller.myProfile.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const isVerifiedSeller =
    (sellerProfile?.isVerified && sellerProfile?.sellerStatus === "approved") ||
    sellerProfile?.role === "admin";
  const isPendingSeller = sellerProfile?.sellerStatus === "pending";


  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [location, setLocation] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTradeType, setSelectedTradeType] = useState("direct");
  const [images, setImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const MAX_IMAGES = 10;
  const uploadImageMutation = trpc.upload.productImage.useMutation();

  const handlePickImages = async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert("업로드 제한", `이미지는 최대 ${MAX_IMAGES}장까지 등록할 수 있어요.`);
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("권한 필요", "사진 접근 권한이 필요합니다.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - images.length,
      base64: true,
    });
    if (result.canceled || result.assets.length === 0) return;

    setIsUploadingImage(true);
    try {
      const uploadedUrls: string[] = [];
      for (const asset of result.assets) {
        if (!asset.base64) continue;
        try {
          const uploadResult = await uploadImageMutation.mutateAsync({
            base64: asset.base64,
            mimeType: asset.mimeType ?? "image/jpeg",
            fileName: asset.fileName ?? "photo.jpg",
          });
          uploadedUrls.push(uploadResult.url);
        } catch {
          // 개별 이미지 업로드 실패 시 건너뛰고 계속 진행
        }
      }
      if (uploadedUrls.length < result.assets.length) {
        Alert.alert("일부 실패", "일부 이미지 업로드에 실패했어요. 나머지만 등록됩니다.");
      }
      setImages((prev) => [...prev, ...uploadedUrls].slice(0, MAX_IMAGES));
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const createMutation = trpc.products.create.useMutation({
    onSuccess: () => {
      Alert.alert("등록 완료", "상품이 성공적으로 등록되었습니다.", [
        { text: "확인", onPress: () => {
          setTitle(""); setDescription(""); setPrice(""); setQuantity("1");
          setLocation(""); setSelectedCategory(""); setSelectedTradeType("direct");
          setImages([]);
          setMode("select"); router.push("/" as any);
        } },
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

  const handleProductRegisterPress = () => {
    if (!isAuthenticated) {
      Alert.alert("로그인 필요", "상품 등록을 위해 로그인이 필요합니다.", [
        { text: "취소", style: "cancel" },
        { text: "로그인", onPress: () => router.push("/auth/login" as any) },
      ]);
      return;
    }
    if (isPendingSeller) {
      Alert.alert("심사 중", "판매자 인증 신청이 심사 중입니다.\n승인 후 상품 등록이 가능합니다.");
      return;
    }
    if (!isVerifiedSeller) {
      Alert.alert(
        "판매회원 신청 필요",
        "상품 등록은 판매회원만 가능합니다.\n판매회원 신청을 하시겠습니까?",
        [
          { text: "취소", style: "cancel" },
          { text: "신청하기", onPress: () => router.push("/seller/apply" as any) },
        ]
      );
      return;
    }
    setMode("product");
  };

  const handleCompanyRegisterPress = () => {
    if (!isAuthenticated) {
      Alert.alert("로그인 필요", "업체 등록을 위해 로그인이 필요합니다.", [
        { text: "취소", style: "cancel" },
        { text: "로그인", onPress: () => router.push("/auth/login" as any) },
      ]);
      return;
    }
    // 이미 업체회원이면 바로 프로필 관리로
    if (user?.role === "company") {
      Alert.alert("업체회원", "이미 업체회원으로 등록되어 있습니다.");
      return;
    }
    router.push("/company/apply" as any);
  };

  const handleSubmit = () => {
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
    if (images.length === 0) {
      Alert.alert("입력 오류", "상품 이미지를 1장 이상 등록해주세요.");
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
      images,
    });
  };

  // 선택 화면
  if (mode === "select") {
    return (
      <ScreenContainer>
        <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: "800", color: colors.foreground }}>등록하기</Text>
          <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>
            원하는 등록 유형을 선택해주세요
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          {/* 물품 등록 카드 */}
          <Pressable
            style={({ pressed }) => [
              {
                backgroundColor: colors.surface,
                borderRadius: 20,
                padding: 24,
                borderWidth: 1.5,
                borderColor: colors.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            onPress={handleProductRegisterPress}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 16 }}>
              <View style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                backgroundColor: colors.primary + "10",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: colors.primary,
              }}>
                <LucideIcon name="package" size={22} color={colors.primary} strokeWidth={1.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>물품 등록</Text>
                <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>사업장 물품을 판매하세요</Text>
              </View>
              <Text style={{ fontSize: 20, color: colors.muted }}>›</Text>
            </View>
            <View style={{ gap: 6 }}>
              {["폐업·이전 사업장 물품 판매", "집기·비품·재고 등록", "판매회원 인증 후 이용 가능"].map((item, i) => (
                <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary }} />
                  <Text style={{ fontSize: 13, color: colors.muted }}>{item}</Text>
                </View>
              ))}
            </View>
            {/* 상태 배지 */}
            {isAuthenticated && (
              <View style={{ marginTop: 16, alignSelf: "flex-start" }}>
                {isVerifiedSeller ? (
                  <View style={{ backgroundColor: colors.success + "20", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <LucideIcon name="check" size={12} color={colors.success} strokeWidth={2} />
                    <Text style={{ fontSize: 12, fontWeight: "700", color: colors.success }}>판매회원 인증 완료</Text>
                  </View>
                  </View>
                ) : isPendingSeller ? (
                  <View style={{ backgroundColor: colors.warning + "20", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 }}>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: colors.warning }}>⏳ 심사 중</Text>
                  </View>
                ) : (
                  <View style={{ backgroundColor: colors.border, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 }}>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted }}>판매회원 신청 필요</Text>
                  </View>
                )}
              </View>
            )}
          </Pressable>

          {/* 업체 등록 카드 */}
          <Pressable
            style={({ pressed }) => [
              {
                backgroundColor: colors.surface,
                borderRadius: 20,
                padding: 24,
                borderWidth: 1.5,
                borderColor: colors.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            onPress={handleCompanyRegisterPress}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 16 }}>
              <View style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                backgroundColor: colors.primary + "12",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: colors.primary,
              }}>
                <LucideIcon name="building" size={22} color={colors.primary} strokeWidth={1.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>업체 등록</Text>
                <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>전문 업체 서비스를 홍보하세요</Text>
              </View>
              <Text style={{ fontSize: 20, color: colors.muted }}>›</Text>
            </View>
            <View style={{ gap: 6 }}>
              {["철거·인테리어·폐기물 등 전문 업체", "포트폴리오 및 견적 관리", "업체회원 인증 후 이용 가능"].map((item, i) => (
                <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary }} />
                  <Text style={{ fontSize: 13, color: colors.muted }}>{item}</Text>
                </View>
              ))}
            </View>
            {/* 상태 배지 */}
            {isAuthenticated && user?.role === "company" && (
              <View style={{ marginTop: 16, alignSelf: "flex-start" }}>
                <View style={{ backgroundColor: colors.success + "20", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <LucideIcon name="check" size={12} color={colors.success} strokeWidth={2} />
                  <Text style={{ fontSize: 12, fontWeight: "700", color: colors.success }}>업체회원 인증 완료</Text>
                </View>
                </View>
              </View>
            )}
          </Pressable>

          {/* 비로그인 안내 */}
          {!isAuthenticated && (
            <View style={{
              backgroundColor: colors.primary + "10",
              borderRadius: 14,
              padding: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}>
              <Text style={{ fontSize: 20 }}>ℹ️</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, color: colors.foreground, fontWeight: "600", marginBottom: 2 }}>
                  로그인이 필요합니다
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>
                  등록 서비스 이용을 위해 로그인해주세요
                </Text>
              </View>
              <Pressable
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                onPress={() => router.push("/auth/login" as any)}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.primary }}>로그인</Text>
              </Pressable>
            </View>
          )}
            </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );

  }

   // 상품 등록 폼
  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}>

        <Pressable onPress={() => setMode("select")}>
          <Text style={{ fontSize: 15, color: colors.primary, fontWeight: "600" }}>← 뒤로</Text>
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: "800", color: colors.foreground }}>상품 등록</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
        {/* 이미지 업로드 */}
        <View style={{ paddingHorizontal: 16, marginTop: 4 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 10 }}>
            상품 이미지 <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {images.map((uri, index) => (
                <View key={uri + index} style={{ width: 80, height: 80 }}>
                  <Image
                    source={{ uri }}
                    style={{ width: 80, height: 80, borderRadius: 12, backgroundColor: colors.surface }}
                  />
                  {index === 0 && (
                    <View
                      style={{
                        position: "absolute", bottom: 4, left: 4,
                        backgroundColor: colors.primary, borderRadius: 4,
                        paddingHorizontal: 5, paddingVertical: 2,
                      }}
                    >
                      <Text style={{ fontSize: 9, color: "#fff", fontWeight: "700" }}>대표</Text>
                    </View>
                  )}
                  <Pressable
                    onPress={() => handleRemoveImage(index)}
                    hitSlop={8}
                    style={{
                      position: "absolute", top: -6, right: -6,
                      width: 22, height: 22, borderRadius: 11,
                      backgroundColor: "#00000099",
                      justifyContent: "center", alignItems: "center",
                    }}
                  >
                    <IconSymbol name="xmark" size={12} color="#fff" />
                  </Pressable>
                </View>
              ))}

              {images.length < MAX_IMAGES && (
                <Pressable
                  onPress={handlePickImages}
                  disabled={isUploadingImage}
                  style={({ pressed }) => [{
                    width: 80, height: 80, borderRadius: 12,
                    backgroundColor: colors.surface, borderWidth: 1.5,
                    borderColor: colors.border, borderStyle: "dashed",
                    justifyContent: "center", alignItems: "center",
                    opacity: pressed || isUploadingImage ? 0.7 : 1,
                  }]}
                >
                  {isUploadingImage ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <>
                      <IconSymbol name={images.length === 0 ? "camera.fill" : "plus.circle.fill"} size={24} color={colors.muted} />
                      <Text style={{ fontSize: 10, color: colors.muted, marginTop: 4 }}>
                        {images.length === 0 ? "사진 등록" : `추가 (${images.length}/${MAX_IMAGES})`}
                      </Text>
                    </>
                  )}
                </Pressable>
              )}
            </View>
          </ScrollView>
          <Text style={{ fontSize: 11, color: colors.muted, marginTop: 8 }}>
            첫 번째 사진이 대표 이미지로 사용됩니다. 최대 {MAX_IMAGES}장까지 등록 가능해요.
          </Text>
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
              backgroundColor: colors.surface, borderRadius: 10,
              padding: 14, fontSize: 15, color: colors.foreground,
              borderWidth: 1, borderColor: colors.border,
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
                style={({ pressed }) => [{
                  paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                  backgroundColor: selectedCategory === cat.id ? colors.primary : colors.surface,
                  borderWidth: 1,
                  borderColor: selectedCategory === cat.id ? colors.primary : colors.border,
                  opacity: pressed ? 0.7 : 1,
                  flexDirection: "row", alignItems: "center", gap: 4,
                }]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <LucideIcon name={cat.icon as any} size={13} color={selectedCategory === cat.id ? "#0E0E10" : colors.muted} strokeWidth={1.8} />
                <Text style={{
                  fontSize: 13, fontWeight: "500",
                  color: selectedCategory === cat.id ? "#FFFFFF" : colors.foreground,
                }}>
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
          <View style={{
            flexDirection: "row", alignItems: "center",
            backgroundColor: colors.surface, borderRadius: 10,
            borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14,
          }}>
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
          <View style={{
            flexDirection: "row", alignItems: "center",
            backgroundColor: colors.surface, borderRadius: 10,
            borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14,
          }}>
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
                style={({ pressed }) => [{
                  paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20,
                  backgroundColor: selectedTradeType === type.id ? colors.primary : colors.surface,
                  borderWidth: 1,
                  borderColor: selectedTradeType === type.id ? colors.primary : colors.border,
                  opacity: pressed ? 0.7 : 1,
                }]}
                onPress={() => setSelectedTradeType(type.id)}
              >
                <Text style={{
                  fontSize: 13, fontWeight: "500",
                  color: selectedTradeType === type.id ? "#FFFFFF" : colors.foreground,
                }}>
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
              backgroundColor: colors.surface, borderRadius: 10,
              padding: 14, fontSize: 15, color: colors.foreground,
              borderWidth: 1, borderColor: colors.border,
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
              backgroundColor: colors.surface, borderRadius: 10,
              padding: 14, fontSize: 15, color: colors.foreground,
              minHeight: 120, borderWidth: 1, borderColor: colors.border,
            }}
          />
        </View>

        {/* 등록 버튼 */}
        <View style={{ paddingHorizontal: 16, marginTop: 28 }}>
          <Pressable
            style={({ pressed }) => [{
              backgroundColor: createMutation.isPending ? colors.muted : colors.primary,
              borderRadius: 12, padding: 16, alignItems: "center",
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            }]}
            onPress={handleSubmit}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}>등록하기</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
