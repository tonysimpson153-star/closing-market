import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { LucideIcon } from "@/components/ui/icon-lucide";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAuthStore } from "@/lib/auth-store";
import { prepareProductImageForUpload } from "@/lib/product-image-upload";
import { trpc } from "@/lib/trpc";

const MAX_IMAGES = 10;

const CATEGORY_OPTIONS = [
  { id: "cafe", name: "카페", icon: "coffee" },
  { id: "pcroom", name: "PC방", icon: "gamepad2" },
  { id: "restaurant", name: "식당", icon: "utensils" },
  { id: "gym", name: "헬스장", icon: "dumbbell" },
  { id: "office", name: "사무실", icon: "briefcase" },
  { id: "warehouse", name: "창고재고", icon: "package" },
  { id: "transfer", name: "사업양도", icon: "store" },
] as const;

const TRADE_TYPE_OPTIONS = [
  { id: "direct", name: "직거래" },
  { id: "delivery", name: "택배" },
  { id: "negotiable", name: "협의" },
] as const;

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = Number(id);
  const router = useRouter();
  const colors = useColors();
  const { token, user } = useAuthStore();
  const utils = trpc.useUtils();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState<string>("");
  const [tradeType, setTradeType] = useState<string>("direct");
  const [images, setImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const hydratedProductId = useRef<number | null>(null);
  const formScrollRef = useRef<ScrollView>(null);
  const fieldPositions = useRef<Record<string, number>>({});

  const scrollFocusedFieldIntoView = useCallback((field: string) => {
    requestAnimationFrame(() => {
      const y = fieldPositions.current[field];
      if (typeof y !== "number") return;
      formScrollRef.current?.scrollTo({
        y: Math.max(0, y - 24),
        animated: true,
      });
    });
  }, []);

  const { data: product, isLoading } = trpc.products.detail.useQuery(
    { id: productId },
    { enabled: !!token && productId > 0 },
  );

  useEffect(() => {
    if (!product || hydratedProductId.current === product.id) return;

    hydratedProductId.current = product.id;
    setTitle(product.title);
    setDescription(product.description ?? "");
    setPrice(String(product.price));
    setQuantity(String(product.quantity ?? 1));
    setLocation(product.location ?? "");
    setCategory(product.category);
    setTradeType(product.tradeType);
    setImages(product.images.map((image) => image.imageUrl));
  }, [product]);

  const updateMutation = trpc.products.update.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.products.detail.invalidate({ id: productId }),
        utils.products.myProducts.invalidate(),
        utils.products.list.invalidate(),
      ]);
      Alert.alert("수정 완료", "상품 정보가 수정되었습니다.", [
        {
          text: "확인",
          onPress: () => router.replace(`/product/${productId}` as any),
        },
      ]);
    },
    onError: (error) =>
      Alert.alert("수정 실패", error.message || "상품을 수정하지 못했습니다."),
  });

  const uploadImageMutation = trpc.upload.productImage.useMutation();

  const handlePickImages = useCallback(async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert(
        "업로드 제한",
        `이미지는 최대 ${MAX_IMAGES}장까지 등록할 수 있어요.`,
      );
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
      base64: Platform.OS === "web",
    });
    if (result.canceled || result.assets.length === 0) return;

    setIsUploadingImage(true);
    try {
      const uploadedUrls: string[] = [];
      let failedCount = 0;
      let firstFailureMessage: string | undefined;
      for (const asset of result.assets) {
        try {
          const uploadImage = await prepareProductImageForUpload(asset);
          const uploaded = await uploadImageMutation.mutateAsync({
            ...uploadImage,
          });
          uploadedUrls.push(uploaded.url);
        } catch (error) {
          failedCount += 1;
          firstFailureMessage =
            firstFailureMessage ??
            (error instanceof Error ? error.message : undefined);
          console.warn("[product.image.upload.failed]", {
            message: error instanceof Error ? error.message : "unknown",
          });
        }
      }
      if (failedCount > 0) {
        Alert.alert(
          uploadedUrls.length > 0 ? "일부 사진 업로드 실패" : "사진 업로드 실패",
          `${failedCount}장 업로드에 실패했습니다.${firstFailureMessage ? `\n\n원인: ${firstFailureMessage}` : ""}\n\n사진은 자동으로 줄여서 전송됩니다. 네트워크를 확인한 뒤 다시 시도해주세요.`,
        );
      }
      setImages((current) =>
        [...current, ...uploadedUrls].slice(0, MAX_IMAGES),
      );
    } finally {
      setIsUploadingImage(false);
    }
  }, [images.length, uploadImageMutation]);

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert("입력 오류", "상품명을 입력해주세요.");
      return;
    }
    if (!price || !Number.isFinite(Number(price)) || Number(price) < 0) {
      Alert.alert("입력 오류", "올바른 가격을 입력해주세요.");
      return;
    }
    if (!category) {
      Alert.alert("입력 오류", "업종을 선택해주세요.");
      return;
    }
    if (images.length === 0) {
      Alert.alert("입력 오류", "상품 이미지를 1장 이상 등록해주세요.");
      return;
    }

    updateMutation.mutate({
      id: productId,
      title: title.trim(),
      description: description.trim() || undefined,
      price: Number(price),
      quantity: Math.max(1, Number(quantity) || 1),
      category: category as
        | "cafe"
        | "pcroom"
        | "restaurant"
        | "gym"
        | "office"
        | "warehouse"
        | "transfer",
      tradeType: tradeType as "direct" | "delivery" | "negotiable",
      location: location.trim() || undefined,
      images,
    });
  };

  if (!token) {
    return (
      <ScreenContainer>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <Text
            style={{
              color: colors.foreground,
              fontSize: 16,
              fontWeight: "700",
            }}
          >
            로그인이 필요합니다
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  if (isLoading) {
    return (
      <ScreenContainer>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!product || product.userId !== user?.id) {
    return (
      <ScreenContainer>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <LucideIcon
            name="alert-circle"
            size={36}
            color={colors.muted}
            strokeWidth={1.5}
          />
          <Text
            style={{
              color: colors.foreground,
              fontSize: 16,
              fontWeight: "700",
              marginTop: 14,
            }}
          >
            수정할 수 있는 상품이 아닙니다
          </Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 18 }}>
            <Text style={{ color: colors.primary, fontWeight: "700" }}>
              뒤로 가기
            </Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </Pressable>
        <Text
          style={{
            marginLeft: 12,
            color: colors.foreground,
            fontSize: 18,
            fontWeight: "800",
          }}
        >
          상품 수정
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          ref={formScrollRef}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          contentContainerStyle={{ padding: 16, paddingBottom: 168 }}
        >
        <Text
          style={{
            fontSize: 14,
            fontWeight: "700",
            color: colors.foreground,
            marginBottom: 10,
          }}
        >
          상품 이미지 <Text style={{ color: colors.error }}>*</Text>
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {images.map((uri, index) => (
              <View key={`${uri}-${index}`} style={{ width: 88, height: 88 }}>
                <Image
                  source={{ uri }}
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: 12,
                    backgroundColor: colors.surface,
                  }}
                />
                {index === 0 && (
                  <View
                    style={{
                      position: "absolute",
                      left: 4,
                      bottom: 4,
                      backgroundColor: colors.primary,
                      borderRadius: 4,
                      paddingHorizontal: 5,
                      paddingVertical: 2,
                    }}
                  >
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontSize: 9,
                        fontWeight: "700",
                      }}
                    >
                      대표
                    </Text>
                  </View>
                )}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${index + 1}번 사진 삭제`}
                  onPress={() =>
                    setImages((current) =>
                      current.filter((_, imageIndex) => imageIndex !== index),
                    )
                  }
                  style={{
                    position: "absolute",
                    right: -6,
                    top: -6,
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#000000A8",
                  }}
                >
                  <IconSymbol name="xmark" size={13} color="#FFFFFF" />
                </Pressable>
              </View>
            ))}
            {images.length < MAX_IMAGES && (
              <Pressable
                disabled={isUploadingImage}
                onPress={handlePickImages}
                style={({ pressed }) => [
                  {
                    width: 88,
                    height: 88,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: 1.5,
                    borderStyle: "dashed",
                    opacity: pressed || isUploadingImage ? 0.7 : 1,
                  },
                ]}
              >
                {isUploadingImage ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <IconSymbol
                      name="plus.circle.fill"
                      size={24}
                      color={colors.muted}
                    />
                    <Text
                      style={{
                        marginTop: 4,
                        fontSize: 10,
                        color: colors.muted,
                      }}
                    >
                      사진 추가
                    </Text>
                  </>
                )}
              </Pressable>
            )}
          </View>
        </ScrollView>
        <Text style={{ fontSize: 11, color: colors.muted, marginTop: 8 }}>
          첫 번째 사진이 대표 이미지로 사용됩니다. 최대 {MAX_IMAGES}장까지
          등록할 수 있어요.
        </Text>

        <FormLabel label="상품명" required colors={colors} />
          <View
            onLayout={(event) => {
              fieldPositions.current.title = event.nativeEvent.layout.y;
            }}
          >
            <TextInput
              value={title}
              onChangeText={setTitle}
              onFocus={() => scrollFocusedFieldIntoView("title")}
              placeholder="상품명을 입력하세요"
              placeholderTextColor={colors.muted}
              style={inputStyle(colors)}
            />
          </View>

        <FormLabel label="업종" required colors={colors} />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {CATEGORY_OPTIONS.map((option) => {
            const selected = category === option.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => setCategory(option.id)}
                style={({ pressed }) => [
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    paddingHorizontal: 13,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: selected ? colors.primary : colors.surface,
                    borderWidth: 1,
                    borderColor: selected ? colors.primary : colors.border,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <LucideIcon
                  name={option.icon as any}
                  size={13}
                  color={selected ? "#FFFFFF" : colors.muted}
                  strokeWidth={1.8}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: selected ? "#FFFFFF" : colors.foreground,
                  }}
                >
                  {option.name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <FormLabel label="가격" required colors={colors} />
          <View
            onLayout={(event) => {
              fieldPositions.current.price = event.nativeEvent.layout.y;
            }}
            style={inputRowStyle(colors)}
          >
            <TextInput
              value={price}
              onChangeText={setPrice}
              onFocus={() => scrollFocusedFieldIntoView("price")}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.muted}
              style={{
                flex: 1,
                paddingVertical: 14,
                color: colors.foreground,
                fontSize: 15,
              }}
            />
            <Text style={{ color: colors.muted, fontWeight: "600" }}>원</Text>
          </View>

        <FormLabel label="수량" colors={colors} />
          <View
            onLayout={(event) => {
              fieldPositions.current.quantity = event.nativeEvent.layout.y;
            }}
            style={inputRowStyle(colors)}
          >
            <TextInput
              value={quantity}
              onChangeText={setQuantity}
              onFocus={() => scrollFocusedFieldIntoView("quantity")}
              keyboardType="numeric"
              placeholder="1"
              placeholderTextColor={colors.muted}
              style={{
                flex: 1,
                paddingVertical: 14,
                color: colors.foreground,
                fontSize: 15,
              }}
            />
            <Text style={{ color: colors.muted, fontWeight: "600" }}>개</Text>
          </View>

        <FormLabel label="거래 유형" colors={colors} />
        <View style={{ flexDirection: "row", gap: 8 }}>
          {TRADE_TYPE_OPTIONS.map((option) => {
            const selected = tradeType === option.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => setTradeType(option.id)}
                style={({ pressed }) => [
                  {
                    paddingHorizontal: 16,
                    paddingVertical: 9,
                    borderRadius: 20,
                    backgroundColor: selected ? colors.primary : colors.surface,
                    borderWidth: 1,
                    borderColor: selected ? colors.primary : colors.border,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: selected ? "#FFFFFF" : colors.foreground,
                  }}
                >
                  {option.name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <FormLabel label="거래 지역" colors={colors} />
          <View
            onLayout={(event) => {
              fieldPositions.current.location = event.nativeEvent.layout.y;
            }}
          >
            <TextInput
              value={location}
              onChangeText={setLocation}
              onFocus={() => scrollFocusedFieldIntoView("location")}
              placeholder="예) 서울 강남구, 경기 성남시"
              placeholderTextColor={colors.muted}
              style={inputStyle(colors)}
            />
          </View>

        <FormLabel label="상세 설명" colors={colors} />
          <View
            onLayout={(event) => {
              fieldPositions.current.description = event.nativeEvent.layout.y;
            }}
          >
            <TextInput
              value={description}
              onChangeText={setDescription}
              onFocus={() => scrollFocusedFieldIntoView("description")}
              placeholder="상품 상태, 구매 시기, 특이사항 등을 입력하세요"
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              style={[inputStyle(colors), { minHeight: 120 }]}
            />
          </View>

        <Pressable
          disabled={updateMutation.isPending}
          onPress={handleSubmit}
          style={({ pressed }) => [
            {
              marginTop: 30,
              alignItems: "center",
              borderRadius: 12,
              padding: 16,
              backgroundColor: updateMutation.isPending
                ? colors.muted
                : colors.primary,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          {updateMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "800" }}>
              수정 완료
            </Text>
          )}
        </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function FormLabel({
  label,
  required,
  colors,
}: {
  label: string;
  required?: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Text
      style={{
        fontSize: 14,
        fontWeight: "700",
        color: colors.foreground,
        marginTop: 22,
        marginBottom: 8,
      }}
    >
      {label}
      {required ? <Text style={{ color: colors.error }}> *</Text> : null}
    </Text>
  );
}

function inputStyle(colors: ReturnType<typeof useColors>) {
  return {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    color: colors.foreground,
    fontSize: 15,
  } as const;
}

function inputRowStyle(colors: ReturnType<typeof useColors>) {
  return {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
  } as const;
}
