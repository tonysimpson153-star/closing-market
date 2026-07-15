import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { LucideIcon } from "@/components/ui/icon-lucide";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

// 판매 유형 정의
const SELLER_TYPES = [
  {
    id: "closing_soon" as const,
    label: "폐업 예정",
    desc: "폐업을 앞두고 물품을 정리하려는 사업자",
    icon: "clock",
  },
  {
    id: "closed" as const,
    label: "폐업 완료",
    desc: "이미 폐업한 사업자",
    icon: "lock",
  },
  {
    id: "relocating" as const,
    label: "사업장 이전",
    desc: "이전으로 인해 물품을 처분하려는 사업자",
    icon: "truck",
  },
  {
    id: "inventory" as const,
    label: "재고 정리",
    desc: "잉여 재고를 처분하려는 사업자",
    icon: "package",
  },
  {
];

type SellerType = "closing_soon" | "closed" | "relocating" | "inventory" | "transfer";

export default function SellerApplyScreen() {
  const colors = useColors();
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1
  const [sellerType, setSellerType] = useState<SellerType | null>(null);

  // Step 2
  const [businessNumber, setBusinessNumber] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [representativeName, setRepresentativeName] = useState("");

  // Step 3
  const [businessCertUrl, setBusinessCertUrl] = useState("");
  const [businessPhotoUrl, setBusinessPhotoUrl] = useState("");
  const [uploadingCert, setUploadingCert] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const applyMutation = trpc.seller.submit.useMutation({
    onSuccess: () => {
      setStep(4);
    },
    onError: (error) => {
      Alert.alert("신청 오류", error.message);
    },
  });

  const formatBusinessNumber = (text: string) => {
    const digits = text.replace(/\D/g, "");
    if (digits.length <= 3) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 10)}`;
  };

  const uploadDocMutation = trpc.upload.sellerDocument.useMutation();

  const uploadImage = async (type: "cert" | "photo") => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("권한 필요", "사진 접근 권한이 필요합니다.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    if (!asset.base64) {
      Alert.alert("업로드 실패", "이미지를 읽을 수 없습니다. 다시 시도해주세요.");
      return;
    }

    const setUploading = type === "cert" ? setUploadingCert : setUploadingPhoto;
    const setUrl = type === "cert" ? setBusinessCertUrl : setBusinessPhotoUrl;

    setUploading(true);
    try {
      const uploaded = await uploadDocMutation.mutateAsync({
        base64: asset.base64,
        mimeType: asset.mimeType ?? "image/jpeg",
        fileName: asset.fileName ?? "photo.jpg",
        docType: type,
      });
      setUrl(uploaded.url);
    } catch (err: any) {
      Alert.alert("업로드 실패", err?.message ?? "이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!sellerType) {
        Alert.alert("선택 필요", "판매 유형을 선택해주세요.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const rawNum = businessNumber.replace(/\D/g, "");
      if (rawNum.length !== 10) {
        Alert.alert("입력 오류", "사업자등록번호 10자리를 입력해주세요.");
        return;
      }
      if (!businessName.trim()) {
        Alert.alert("입력 오류", "상호명을 입력해주세요.");
        return;
      }
      if (!representativeName.trim()) {
        Alert.alert("입력 오류", "대표자명을 입력해주세요.");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!businessCertUrl) {
        Alert.alert("입력 오류", "사업자등록증 사진을 업로드해주세요.");
        return;
      }
      applyMutation.mutate({
        sellerType: sellerType!,
        businessNumber: businessNumber.replace(/\D/g, ""),
        businessName: businessName.trim(),
        representativeName: representativeName.trim(),
        businessCertUrl,
        businessPhotoUrl: businessPhotoUrl || undefined,
      });
    }
  };

  const     s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backBtn: { padding: 8, marginRight: 12 },
    headerTitle: { fontSize: 20, fontWeight: "800", color: colors.foreground, letterSpacing: 0.5 },
    progressBar: {
      flexDirection: "row",
      paddingHorizontal: 16,
      paddingVertical: 16,
      gap: 8,
    },
    progressStep: {
      flex: 1,
      height: 5,
      borderRadius: 3,
    },
    stepTitle: {
      fontSize: 24,
      fontWeight: "800",
      color: colors.foreground,
      paddingHorizontal: 16,
      marginBottom: 8,
      letterSpacing: 0.3,
    },
    stepDesc: {
      fontSize: 14,
      color: colors.muted,
      paddingHorizontal: 16,
      marginBottom: 28,
      lineHeight: 22,
      fontWeight: "500",
    },
    typeCard: {
      marginHorizontal: 16,
      marginBottom: 12,
      borderRadius: 16,
      borderWidth: 2,
      padding: 18,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    typeEmoji: { fontSize: 32 },
    typeLabel: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
    typeDesc: { fontSize: 13, lineHeight: 19, fontWeight: "500" },
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
    uploadBtn: {
      marginHorizontal: 16,
      marginBottom: 16,
      borderWidth: 2,
      borderStyle: "dashed",
      borderRadius: 16,
      padding: 28,
      alignItems: "center",
      gap: 10,
    },
    uploadLabel: { fontSize: 15, fontWeight: "700" },
    uploadSub: { fontSize: 12, fontWeight: "500" },
    uploadedUri: { fontSize: 11, marginTop: 6 },
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
    homeBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingHorizontal: 40,
      paddingVertical: 16,
    },
    homeBtnText: { color: "#000000", fontSize: 16, fontWeight: "700", letterSpacing: 0.3 },
  });

  // Step 4: 승인 대기
  if (step === 4) {
    return (
      <ScreenContainer>
        <View style={s.successContainer}>
          <LucideIcon name="clipboard" size={48} color={colors.primary} />
          <Text style={s.successTitle}>신청이 완료되었습니다!</Text>
          <Text style={s.successDesc}>
            사업자 인증 신청이 접수되었습니다.{"\n"}
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
        <Pressable style={s.backBtn} onPress={() => (step > 1 ? setStep(step - 1) : router.back())}>
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={s.headerTitle}>판매자 인증 신청</Text>
      </View>

      {/* 진행 바 */}
      <View style={s.progressBar}>
        {[1, 2, 3].map((n) => (
          <View
            key={n}
            style={[s.progressStep, { backgroundColor: n <= step ? colors.primary : colors.border }]}
          />
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Step 1: 판매 유형 선택 */}
        {step === 1 && (
          <>
            <Text style={s.stepTitle}>판매 유형을 선택해주세요</Text>
            <Text style={s.stepDesc}>해당하는 유형을 선택하면 적합한 서비스를 제공해드립니다.</Text>
            {SELLER_TYPES.map((type) => {
              const selected = sellerType === type.id;
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
                  onPress={() => setSellerType(type.id)}
                >
                  <LucideIcon name={type.icon as any} size={24} color={sellerType === type.id ? colors.primary : colors.muted} strokeWidth={1.5} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.typeLabel, { color: selected ? colors.primary : colors.foreground }]}>
                      {type.label}
                    </Text>
                    <Text style={[s.typeDesc, { color: colors.muted }]}>{type.desc}</Text>
                  </View>
                  {selected && (
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        backgroundColor: colors.primary,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <LucideIcon name="check" size={14} color="#fff" />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </>
        )}

        {/* Step 2: 사업자 정보 입력 */}
        {step === 2 && (
          <>
            <Text style={s.stepTitle}>사업자 정보를 입력해주세요</Text>
            <Text style={s.stepDesc}>사업자등록증에 기재된 정보를 정확히 입력해주세요.</Text>

            <View style={s.inputGroup}>
              <Text style={s.label}>사업자등록번호 *</Text>
              <TextInput
                style={s.input}
                placeholder="000-00-00000"
                placeholderTextColor={colors.muted}
                value={businessNumber}
                onChangeText={(t) => setBusinessNumber(formatBusinessNumber(t))}
                keyboardType="numeric"
                maxLength={12}
              />
            </View>

            <View style={s.inputGroup}>
              <Text style={s.label}>상호명 *</Text>
              <TextInput
                style={s.input}
                placeholder="예: 홍길동 카페"
                placeholderTextColor={colors.muted}
                value={businessName}
                onChangeText={setBusinessName}
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
          </>
        )}

        {/* Step 3: 증빙자료 업로드 */}
        {step === 3 && (
          <>
            <Text style={s.stepTitle}>증빙자료를 업로드해주세요</Text>
            <Text style={s.stepDesc}>
              사업자등록증은 필수입니다.{"\n"}
              사업장 사진은 선택 사항입니다.
            </Text>

            {/* 사업자등록증 업로드 */}
            <Text style={[s.label, { paddingHorizontal: 16, marginBottom: 8 }]}>
              사업자등록증 * (필수)
            </Text>
            <Pressable
              style={[
                s.uploadBtn,
                {
                  borderColor: businessCertUrl ? colors.success : colors.primary,
                  backgroundColor: businessCertUrl ? colors.success + "10" : colors.primary + "08",
                },
              ]}
              onPress={() => uploadImage("cert")}
            >
              {uploadingCert ? (
                <ActivityIndicator color={colors.primary} />
              ) : businessCertUrl ? (
                <>
                  <LucideIcon name="check-circle" size={32} color={colors.success} />
                  <Text style={[s.uploadLabel, { color: colors.success }]}>업로드 완료</Text>
                  <Text style={[s.uploadedUri, { color: colors.muted }]} numberOfLines={1}>
                    {businessCertUrl.split("/").pop()}
                  </Text>
                  <Text style={[s.uploadSub, { color: colors.muted }]}>다시 선택하려면 탭하세요</Text>
                </>
              ) : (
                <>
                  <LucideIcon name="file" size={32} color={colors.primary} />
                  <Text style={[s.uploadLabel, { color: colors.primary }]}>사업자등록증 업로드</Text>
                  <Text style={[s.uploadSub, { color: colors.muted }]}>JPG, PNG 파일 지원</Text>
                </>
              )}
            </Pressable>

            {/* 사업장 사진 업로드 (선택) */}
            <Text style={[s.label, { paddingHorizontal: 16, marginBottom: 8, marginTop: 8 }]}>
              사업장 사진 (선택)
            </Text>
            <Pressable
              style={[
                s.uploadBtn,
                {
                  borderColor: businessPhotoUrl ? colors.success : colors.border,
                  backgroundColor: businessPhotoUrl ? colors.success + "10" : colors.surface,
                },
              ]}
              onPress={() => uploadImage("photo")}
            >
              {uploadingPhoto ? (
                <ActivityIndicator color={colors.primary} />
              ) : businessPhotoUrl ? (
                <>
                  <LucideIcon name="check-circle" size={32} color={colors.success} />
                  <Text style={[s.uploadLabel, { color: colors.success }]}>업로드 완료</Text>
                  <Text style={[s.uploadSub, { color: colors.muted }]}>다시 선택하려면 탭하세요</Text>
                </>
              ) : (
                <>
                  <LucideIcon name="store" size={28} color={colors.muted} strokeWidth={1.5} />
                  <Text style={[s.uploadLabel, { color: colors.muted }]}>사업장 사진 업로드</Text>
                  <Text style={[s.uploadSub, { color: colors.muted }]}>선택 사항입니다</Text>
                </>
              )}
            </Pressable>
          </>
        )}
      </ScrollView>

      {/* 다음 버튼 */}
      <Pressable
        style={({ pressed }) => [s.nextBtn, { opacity: pressed ? 0.85 : 1 }]}
        onPress={handleNext}
        disabled={applyMutation.isPending || uploadingCert || uploadingPhoto}
      >
        {applyMutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={s.nextBtnText}>
            {step === 3 ? "신청 완료" : "다음 단계"}
          </Text>
        )}
      </Pressable>
    </ScreenContainer>
  );
}
