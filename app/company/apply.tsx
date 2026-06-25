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
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

const COMPANY_TYPES = [
  { id: "demolition" as const, label: "철거업체", icon: "🏗️", desc: "건물 및 시설 철거 전문" },
  { id: "interior" as const, label: "인테리어업체", icon: "🎨", desc: "인테리어 시공 및 리모델링" },
  { id: "waste" as const, label: "폐기물처리업체", icon: "♻️", desc: "산업·생활 폐기물 처리" },
  { id: "signage" as const, label: "간판업체", icon: "🪧", desc: "간판 제작 및 철거" },
  { id: "pos" as const, label: "POS업체", icon: "🖥️", desc: "POS 시스템 구매·판매" },
  { id: "cleaning" as const, label: "청소업체", icon: "🧹", desc: "사업장 청소 및 정리" },
  { id: "tax" as const, label: "세무사", icon: "📊", desc: "세무·회계 전문 서비스" },
  { id: "labor" as const, label: "노무사", icon: "⚖️", desc: "노무·인사 전문 서비스" },
];

type CompanyType = "demolition" | "interior" | "waste" | "signage" | "pos" | "cleaning" | "tax" | "labor";

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
      applyMutation.mutate({
        companyType: companyType!,
        companyName: companyName.trim(),
        representativeName: representativeName.trim(),
        companyPhone: companyPhone.trim(),
        companyAddress: companyAddress.trim(),
        businessNumber: businessNumber.trim() || undefined,
        companyDesc: companyDesc.trim() || undefined,
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
    backBtnText: { fontSize: 15, color: colors.primary, fontWeight: "600" },
    headerTitle: { fontSize: 18, fontWeight: "700", color: colors.foreground, marginLeft: 12 },
    progressBar: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 16, gap: 8 },
    progressStep: { flex: 1, height: 4, borderRadius: 2 },
    stepTitle: { fontSize: 22, fontWeight: "800", color: colors.foreground, paddingHorizontal: 16, marginBottom: 8 },
    stepDesc: { fontSize: 14, color: colors.muted, paddingHorizontal: 16, marginBottom: 24, lineHeight: 20 },
    typeGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, gap: 10 },
    typeCard: {
      width: "47%",
      borderWidth: 2,
      borderRadius: 14,
      padding: 16,
      alignItems: "center",
      gap: 6,
    },
    typeEmoji: { fontSize: 28 },
    typeLabel: { fontSize: 14, fontWeight: "700", textAlign: "center" },
    typeDesc: { fontSize: 11, textAlign: "center", lineHeight: 16 },
    inputGroup: { paddingHorizontal: 16, marginBottom: 20 },
    label: { fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 8 },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 14,
      fontSize: 15,
      color: colors.foreground,
      backgroundColor: colors.surface,
    },
    textArea: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 14,
      fontSize: 15,
      color: colors.foreground,
      backgroundColor: colors.surface,
      height: 100,
      textAlignVertical: "top",
    },
    nextBtn: {
      margin: 16,
      backgroundColor: colors.primary,
      borderRadius: 14,
      padding: 16,
      alignItems: "center",
    },
    nextBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
    successContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
    successIcon: { fontSize: 64, marginBottom: 24 },
    successTitle: { fontSize: 24, fontWeight: "800", color: colors.foreground, marginBottom: 12, textAlign: "center" },
    successDesc: { fontSize: 15, color: colors.muted, textAlign: "center", lineHeight: 24, marginBottom: 32 },
    statusBadge: {
      backgroundColor: colors.warning + "20",
      borderRadius: 20,
      paddingHorizontal: 20,
      paddingVertical: 10,
      marginBottom: 32,
    },
    statusText: { fontSize: 14, fontWeight: "700", color: colors.warning },
    homeBtn: { backgroundColor: colors.primary, borderRadius: 14, paddingHorizontal: 40, paddingVertical: 14 },
    homeBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  });

  // Step 3: 신청 완료
  if (step === 3) {
    return (
      <ScreenContainer>
        <View style={s.successContainer}>
          <Text style={s.successIcon}>🏢</Text>
          <Text style={s.successTitle}>업체 등록 신청 완료!</Text>
          <Text style={s.successDesc}>
            업체 등록 신청이 접수되었습니다.{"\n"}
            관리자 검토 후 1~3 영업일 내에{"\n"}
            결과를 알려드립니다.
          </Text>
          <View style={s.statusBadge}>
            <Text style={s.statusText}>⏳ 심사 중</Text>
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
        <Pressable onPress={() => (step > 1 ? setStep(step - 1) : router.back())}>
          <Text style={s.backBtnText}>← 뒤로</Text>
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
                    <Text style={s.typeEmoji}>{type.icon}</Text>
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
                        <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>✓</Text>
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
              <Text style={s.label}>사업자등록번호 (선택)</Text>
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
