import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Image,
} from "react-native";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { LucideIcon } from "@/components/ui/icon-lucide";
import { trpc } from "@/lib/trpc";

const COMPANY_TYPES = [
  { id: "demolition" as const, label: "철거업체", icon: "hammer", desc: "건물 및 시설 철거 전문" },
  { id: "interior" as const, label: "인테리어업체", icon: "palette", desc: "인테리어 시공 및 리모델링" },
  { id: "waste" as const, label: "폐기물처리업체", icon: "recycle", desc: "산업·생활 폐기물 처리" },
  { id: "signage" as const, label: "간판·사인업체", icon: "signpost", desc: "간판 제작 및 철거" },
  { id: "pos" as const, label: "POS·키오스크업체", icon: "monitor", desc: "POS·키오스크 시스템 구매·판매" },
  { id: "cctv" as const, label: "CCTV·보안업체", icon: "camera", desc: "CCTV 및 보안 시스템 설치" },
  { id: "kitchen" as const, label: "주방기기업체", icon: "utensils", desc: "주방기기 판매 및 설치" },
  { id: "cleaning" as const, label: "청소·방역업체", icon: "waves", desc: "사업장 청소 및 방역" },
  { id: "tax" as const, label: "세무사 (전문 상담)", icon: "file", desc: "세무·회계 전문 서비스" },
  { id: "labor" as const, label: "노무사 (전문 상담)", icon: "scale", desc: "노무·인사 전문 서비스" },
  { id: "consulting" as const, label: "창업 컨설팅", icon: "trending-up", desc: "창업 전략 및 컨설팅 서비스" },
];

type CompanyType = "demolition" | "interior" | "waste" | "signage" | "pos" | "cctv" | "kitchen" | "cleaning" | "tax" | "labor" | "consulting";

export default function CompanyApplyScreen() {
  const colors = useColors();
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1
  const [companyType, setCompanyType] = useState<CompanyType | null>(null);

  // Step 2
  const [companyName, setCompanyName] = useState("");
  const [representativeName, setRepresentativeName] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [businessNumber, setBusinessNumber] = useState("");
  const [companyDesc, setCompanyDesc] = useState("");
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

  const uploadLogoMutation = trpc.upload.companyLogo.useMutation();

  const MAX_GALLERY_IMAGES = 10;
  const handlePickGalleryImages = async () => {
    if (galleryImages.length >= MAX_GALLERY_IMAGES) {
      Alert.alert("업로드 제한", `소개 사진은 최대 ${MAX_GALLERY_IMAGES}장까지 등록할 수 있어요.`);
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
      selectionLimit: MAX_GALLERY_IMAGES - galleryImages.length,
      base64: true,
    });
    if (result.canceled || result.assets.length === 0) return;

    setIsUploadingGallery(true);
    try {
      const uploaded: string[] = [];
      for (const asset of result.assets) {
        if (!asset.base64) continue;
        try {
          const res = await uploadLogoMutation.mutateAsync({
            base64: asset.base64,
            mimeType: asset.mimeType ?? "image/jpeg",
            fileName: asset.fileName ?? "photo.jpg",
          });
          uploaded.push(res.url);
        } catch {
          // 개별 실패는 건너뜀
        }
      }
      setGalleryImages((prev) => [...prev, ...uploaded].slice(0, MAX_GALLERY_IMAGES));
    } finally {
      setIsUploadingGallery(false);
    }
  };
  const handleRemoveGalleryImage = (index: number) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePickLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("권한 필요", "사진 접근 권한이 필요합니다.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });
    if (result.canceled || !result.assets[0]?.base64) return;

    setIsUploadingLogo(true);
    try {
      const uploaded = await uploadLogoMutation.mutateAsync({
        base64: result.assets[0].base64,
        mimeType: result.assets[0].mimeType ?? "image/jpeg",
        fileName: result.assets[0].fileName ?? "logo.jpg",
      });
      setCompanyLogoUrl(uploaded.url);
    } catch (err: any) {
      Alert.alert("업로드 실패", err?.message ?? "사진 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const applyMutation = trpc.company.submit.useMutation({
    onSuccess: () => {
      setStep(3);
    },
    onError: (error) => {
      Alert.alert("신청 오류", error.message);
    },
  });

  const handleNext = () => {
    if (step === 1) {
      if (!companyType) {
        Alert.alert("선택 필요", "업체 유형을 선택해주세요.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!companyName.trim()) {
        Alert.alert("입력 오류", "업체명을 입력해주세요.");
        return;
      }
      if (!representativeName.trim()) {
        Alert.alert("입력 오류", "대표자명을 입력해주세요.");
        return;
      }
      if (!companyPhone.trim()) {
        Alert.alert("입력 오류", "업체 연락처를 입력해주세요.");
        return;
      }
      if (!companyAddress.trim()) {
        Alert.alert("입력 오류", "업체 주소를 입력해주세요.");
        return;
      }
      if (!businessNumber.trim()) {
        Alert.alert("입력 오류", "사업자등록번호를 입력해주세요.");
        return;
      }
      applyMutation.mutate({
        companyType: companyType!,
        companyName: companyName.trim(),
        representativeName: representativeName.trim(),
        companyPhone: companyPhone.trim(),
        companyAddress: companyAddress.trim(),
        businessNumber: businessNumber.trim() || undefined,
        companyDesc: companyDesc.trim() || undefined,
        companyLogoUrl: companyLogoUrl ?? undefined,
        images: galleryImages.length > 0 ? galleryImages : undefined,
      });
    }
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backBtnText: { fontSize: 16, color: colors.primary, fontWeight: "700", marginRight: 8 },
    headerTitle: { fontSize: 20, fontWeight: "800", color: colors.foreground, letterSpacing: 0.5 },
    progressBar: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 16, gap: 8 },
    progressStep: { flex: 1, height: 5, borderRadius: 3 },
    stepTitle: { fontSize: 24, fontWeight: "800", color: colors.foreground, paddingHorizontal: 16, marginBottom: 8, letterSpacing: 0.3 },
    stepDesc: { fontSize: 14, color: colors.muted, paddingHorizontal: 16, marginBottom: 28, lineHeight: 22, fontWeight: "500" },
    typeGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, gap: 10 },
    typeCard: {
      width: "47%",
      borderWidth: 2,
      borderRadius: 16,
      padding: 18,
      alignItems: "center",
      gap: 8,
    },
    typeEmoji: { fontSize: 32 },
    typeLabel: { fontSize: 15, fontWeight: "700", textAlign: "center" },
    typeDesc: { fontSize: 12, textAlign: "center", lineHeight: 18, fontWeight: "500" },
    inputGroup: { paddingHorizontal: 16, marginBottom: 22 },
    label: { fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 10, letterSpacing: 0.3 },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 14,
      fontSize: 15,
      color: colors.foreground,
      backgroundColor: colors.surface,
      fontWeight: "500",
    },
    textArea: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 14,
      fontSize: 15,
      color: colors.foreground,
      backgroundColor: colors.surface,
      height: 110,
      textAlignVertical: "top",
      fontWeight: "500",
    },
    nextBtn: {
      margin: 16,
      backgroundColor: colors.primary,
      borderRadius: 14,
      padding: 16,
      alignItems: "center",
    },
    nextBtnText: { color: "#000000", fontSize: 16, fontWeight: "700", letterSpacing: 0.3 },
    successContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
    successIcon: { fontSize: 64, marginBottom: 28 },
    successTitle: { fontSize: 26, fontWeight: "800", color: colors.foreground, marginBottom: 14, textAlign: "center", letterSpacing: 0.3 },
    successDesc: { fontSize: 15, color: colors.muted, textAlign: "center", lineHeight: 26, marginBottom: 36, fontWeight: "500" },
    statusBadge: {
      backgroundColor: colors.warning + "20",
      borderRadius: 20,
      paddingHorizontal: 24,
      paddingVertical: 12,
      marginBottom: 36,
      borderWidth: 1,
      borderColor: colors.warning + "40",
    },
    statusText: { fontSize: 14, fontWeight: "700", color: colors.warning },
    homeBtn: { backgroundColor: colors.primary, borderRadius: 14, paddingHorizontal: 40, paddingVertical: 16 },
    homeBtnText: { color: "#000000", fontSize: 16, fontWeight: "700", letterSpacing: 0.3 },
  });

  // Step 3: 신청 완료
  if (step === 3) {
    return (
      <ScreenContainer>
        <View style={s.successContainer}>
          <View style={{ marginBottom: 28 }}>
            <LucideIcon name="check-circle" size={56} color={colors.primary} strokeWidth={1.5} />
          </View>
          <Text style={s.successTitle}>업체 등록 신청 완료!</Text>
          <Text style={s.successDesc}>
            업체 등록 신청이 접수되었습니다.{"\n"}
            관리자 검토 후 1~3 영업일 내에{"\n"}
            결과를 알려드립니다.
          </Text>
          <View style={s.statusBadge}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <LucideIcon name="clock" size={16} color={colors.primary} />
              <Text style={s.statusText}>심사 중</Text>
            </View>
          </View>
          <Pressable
            style={({ pressed }) => [s.homeBtn, { opacity: pressed ? 0.8 : 1 }]}
            onPress={() => router.replace("/(tabs)" as any)}
          >
            <Text style={s.homeBtnText}>홈으로 돌아가기</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {/* 헤더 */}
      <View style={s.header}>
        <Pressable onPress={() => (step > 1 ? setStep(step - 1) : router.back())} style={{ padding: 8 }}>
          <Text style={s.backBtnText}>←</Text>
        </Pressable>
        <Text style={s.headerTitle}>업체 등록 신청</Text>
      </View>

      {/* 진행 바 */}
      <View style={s.progressBar}>
        {[1, 2].map((n) => (
          <View
            key={n}
            style={[s.progressStep, { backgroundColor: n <= step ? colors.primary : colors.border }]}
          />
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Step 1: 업체 유형 선택 */}
        {step === 1 && (
          <>
            <Text style={s.stepTitle}>업체 유형을 선택해주세요</Text>
            <Text style={s.stepDesc}>해당하는 업체 유형을 선택해주세요.</Text>
            <View style={s.typeGrid}>
              {COMPANY_TYPES.map((type) => {
                const selected = companyType === type.id;
                return (
                  <Pressable
                    key={type.id}
                    style={[
                      s.typeCard,
                      {
                        borderColor: selected ? colors.primary : colors.border,
                        backgroundColor: selected ? colors.primary + "10" : colors.surface,
                      },
                    ]}
                    onPress={() => setCompanyType(type.id)}
                  >
                    <LucideIcon
                      name={type.icon as any}
                      size={24}
                      color={selected ? colors.primary : colors.muted}
                      strokeWidth={1.5}
                    />
                    <Text style={[s.typeLabel, { color: selected ? colors.primary : colors.foreground }]}>
                      {type.label}
                    </Text>
                    <Text style={[s.typeDesc, { color: colors.muted }]}>{type.desc}</Text>
                    {selected && (
                      <View
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          backgroundColor: colors.primary,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <LucideIcon name="check" size={12} color="#fff" />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {/* Step 2: 업체 정보 입력 */}
        {step === 2 && (
          <>
            <Text style={s.stepTitle}>업체 정보를 입력해주세요</Text>
            <Text style={s.stepDesc}>정확한 정보를 입력하면 심사가 빠르게 진행됩니다.</Text>

            <View style={s.inputGroup}>
              <Text style={s.label}>업체 대표 사진</Text>
              <Pressable
                onPress={handlePickLogo}
                disabled={isUploadingLogo}
                style={{
                  width: "100%",
                  height: 180,
                  borderRadius: 12,
                  backgroundColor: colors.surface,
                  borderWidth: 1.5,
                  borderColor: companyLogoUrl ? colors.primary : colors.border,
                  borderStyle: companyLogoUrl ? "solid" : "dashed",
                  justifyContent: "center",
                  alignItems: "center",
                  overflow: "hidden",
                }}
              >
                {isUploadingLogo ? (
                  <ActivityIndicator color={colors.primary} />
                ) : companyLogoUrl ? (
                  <Image source={{ uri: companyLogoUrl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                ) : (
                  <>
                    <LucideIcon name="camera" size={26} color={colors.muted} strokeWidth={1.5} />
                    <Text style={{ fontSize: 13, color: colors.muted, marginTop: 8 }}>
                      업체 사진 또는 로고 등록
                    </Text>
                  </>
                )}
              </Pressable>
              <Text style={{ fontSize: 11, color: colors.muted, marginTop: 8 }}>
                업체 목록·상세 화면에 크게 표시돼요. 등록하면 신뢰도 있는 프로필로 보여요.
              </Text>
            </View>

            <View style={s.inputGroup}>
              <Text style={s.label}>소개 사진 (시공 사례 등, 여러 장 가능)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  {galleryImages.map((uri, index) => (
                    <View key={uri + index} style={{ width: 74, height: 74 }}>
                      <Image source={{ uri }} style={{ width: 74, height: 74, borderRadius: 8, backgroundColor: colors.surface }} />
                      <Pressable
                        onPress={() => handleRemoveGalleryImage(index)}
                        hitSlop={8}
                        style={{
                          position: "absolute", top: -6, right: -6,
                          width: 20, height: 20, borderRadius: 10,
                          backgroundColor: "#00000099",
                          justifyContent: "center", alignItems: "center",
                        }}
                      >
                        <LucideIcon name="x" size={11} color="#fff" />
                      </Pressable>
                    </View>
                  ))}
                  {galleryImages.length < MAX_GALLERY_IMAGES && (
                    <Pressable
                      onPress={handlePickGalleryImages}
                      disabled={isUploadingGallery}
                      style={{
                        width: 74, height: 74, borderRadius: 8,
                        backgroundColor: colors.surface, borderWidth: 1.5,
                        borderColor: colors.border, borderStyle: "dashed",
                        justifyContent: "center", alignItems: "center",
                      }}
                    >
                      {isUploadingGallery ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <>
                          <LucideIcon name="plus" size={18} color={colors.muted} strokeWidth={1.5} />
                          <Text style={{ fontSize: 9, color: colors.muted, marginTop: 3 }}>추가</Text>
                        </>
                      )}
                    </Pressable>
                  )}
                </View>
              </ScrollView>
            </View>

            <View style={s.inputGroup}>
              <Text style={s.label}>업체명 *</Text>
              <TextInput
                style={s.input}
                placeholder="예: 홍길동 인테리어"
                placeholderTextColor={colors.muted}
                value={companyName}
                onChangeText={setCompanyName}
                maxLength={100}
              />
            </View>

            <View style={s.inputGroup}>
              <Text style={s.label}>대표자명 *</Text>
              <TextInput
                style={s.input}
                placeholder="예: 홍길동"
                placeholderTextColor={colors.muted}
                value={representativeName}
                onChangeText={setRepresentativeName}
                maxLength={50}
              />
            </View>

            <View style={s.inputGroup}>
              <Text style={s.label}>업체 연락처 *</Text>
              <TextInput
                style={s.input}
                placeholder="010-0000-0000"
                placeholderTextColor={colors.muted}
                keyboardType="phone-pad"
                value={companyPhone}
                onChangeText={setCompanyPhone}
                maxLength={20}
              />
            </View>

            <View style={s.inputGroup}>
              <Text style={s.label}>업체 주소 *</Text>
              <TextInput
                style={s.input}
                placeholder="예: 서울시 강남구 테헤란로 123"
                placeholderTextColor={colors.muted}
                value={companyAddress}
                onChangeText={setCompanyAddress}
                maxLength={200}
              />
            </View>

            <View style={s.inputGroup}>
              <Text style={s.label}>사업자등록번호 *</Text>

              <TextInput
                style={s.input}
                placeholder="000-00-00000"
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
                value={businessNumber}
                onChangeText={setBusinessNumber}
                maxLength={12}
              />
            </View>

            <View style={s.inputGroup}>
              <Text style={s.label}>업체 소개 (선택)</Text>
              <TextInput
                style={s.textArea}
                placeholder="업체 소개, 전문 분야, 경력 등을 자유롭게 입력해주세요."
                placeholderTextColor={colors.muted}
                value={companyDesc}
                onChangeText={setCompanyDesc}
                multiline
                maxLength={500}
              />
            </View>
          </>
        )}

        {/* 다음 버튼 */}
        <Pressable
          style={({ pressed }) => [s.nextBtn, { opacity: pressed || applyMutation.isPending ? 0.8 : 1 }]}
          onPress={handleNext}
          disabled={applyMutation.isPending}
        >
          {applyMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.nextBtnText}>
              {step === 2 ? "신청하기" : "다음"}
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
