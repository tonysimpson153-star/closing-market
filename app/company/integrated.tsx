import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { LucideIcon, type IconName } from "@/components/ui/icon-lucide";
import { useColors } from "@/hooks/use-colors";

const SERVICE_TYPES: Array<{ id: string; label: string; icon: IconName }> = [
  { id: "interior", label: "인테리어", icon: "palette" },
  { id: "demolition", label: "철거", icon: "hammer" },
  { id: "pos", label: "POS·키오스크", icon: "monitor" },
  { id: "signage", label: "간판·사인", icon: "signpost" },
  { id: "cctv", label: "CCTV·보안", icon: "camera" },
  { id: "cleaning", label: "청소·방역", icon: "waves" },
  { id: "consult", label: "전문 상담", icon: "file" },
  { id: "consulting", label: "창업 컨설팅", icon: "trending-up" },
];

export default function IntegratedCompanySearchScreen() {
  const colors = useColors();
  const router = useRouter();
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [business, setBusiness] = useState("");
  const [floorSpace, setFloorSpace] = useState("");
  const [region, setRegion] = useState("");
  const [notes, setNotes] = useState("");

  const toggleType = (id: string) => {
    setSelectedTypes((current) =>
      current.includes(id) ? current.filter((type) => type !== id) : [...current, id],
    );
  };

  const submitRequest = () => {
    if (selectedTypes.length === 0 || !business.trim() || !floorSpace.trim() || !region.trim()) {
      Alert.alert("입력 내용을 확인해 주세요", "필요한 업체 업종과 사업장 정보를 모두 입력해 주세요.");
      return;
    }
    Alert.alert(
      "견적 요청 준비 완료",
      "선택한 업체들에게 요청을 전달할 수 있도록 준비했습니다.",
    );
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={10}
              style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1, padding: 4, marginRight: 10 })}
            >
              <LucideIcon name="chevron-left" size={25} color={colors.foreground} strokeWidth={1.8} />
            </Pressable>
            <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "800" }}>통합찾기</Text>
          </View>

          <View
            style={{
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.primary + "55",
              backgroundColor: colors.primary + "0A",
              padding: 22,
              marginBottom: 28,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 13,
                  backgroundColor: colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <LucideIcon name="layers" size={23} color="#FFFFFF" strokeWidth={1.8} />
              </View>
              <Text style={{ color: colors.foreground, fontSize: 19, fontWeight: "800", flex: 1 }}>
                한 번의 요청으로 여러 견적 받기
              </Text>
            </View>
            <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 22 }}>
              필요한 업종과 사업장 정보를 입력하면 해당 업체에 요청이 전달됩니다. 받은 견적을 비교한 뒤 원하는 업체를 선택하세요.
            </Text>
          </View>

          <SectionTitle colors={colors} title="필요한 업체 업종" required />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 28 }}>
            {SERVICE_TYPES.map((service) => {
              const selected = selectedTypes.includes(service.id);
              return (
                <Pressable
                  key={service.id}
                  onPress={() => toggleType(service.id)}
                  style={({ pressed }) => ({
                    width: "48%",
                    minHeight: 66,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected ? colors.primary + "12" : colors.surface,
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 15,
                    opacity: pressed ? 0.75 : 1,
                  })}
                >
                  <LucideIcon name={service.icon} size={21} color={selected ? colors.primary : colors.muted} strokeWidth={1.8} />
                  <Text
                    numberOfLines={1}
                    style={{ color: selected ? colors.primary : colors.foreground, fontSize: 14, fontWeight: "700", marginLeft: 9, flex: 1 }}
                  >
                    {service.label}
                  </Text>
                  {selected ? <LucideIcon name="check-circle" size={17} color={colors.primary} strokeWidth={2} /> : null}
                </Pressable>
              );
            })}
          </View>

          <SectionTitle colors={colors} title="사업장 정보" />
          <Field label="내 업종" value={business} onChangeText={setBusiness} placeholder="예: 카페, 음식점, PC방" colors={colors} />
          <Field label="평수" value={floorSpace} onChangeText={setFloorSpace} placeholder="예: 35" keyboardType="numeric" colors={colors} />
          <Field label="지역" value={region} onChangeText={setRegion} placeholder="예: 부산 남구 용호동" colors={colors} />
          <Field
            label="추가 요청사항 (선택)"
            value={notes}
            onChangeText={setNotes}
            placeholder="희망 일정, 현장 상황, 필요한 내용을 적어주세요."
            multiline
            colors={colors}
          />

          <Pressable
            onPress={submitRequest}
            style={({ pressed }) => ({
              minHeight: 58,
              borderRadius: 16,
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              marginTop: 10,
              opacity: pressed ? 0.82 : 1,
            })}
          >
            <LucideIcon name="send" size={21} color="#FFFFFF" strokeWidth={1.8} />
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "800", marginLeft: 10 }}>
              업체에 견적 요청 보내기
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

type Colors = ReturnType<typeof useColors>;

function SectionTitle({ colors, title, required = false }: { colors: Colors; title: string; required?: boolean }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 13 }}>
      <Text style={{ color: colors.foreground, fontSize: 19, fontWeight: "800" }}>{title}</Text>
      {required ? <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "700", marginLeft: 5 }}>필수</Text> : null}
    </View>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  colors: Colors;
  multiline?: boolean;
  keyboardType?: "default" | "numeric";
};

function Field({ label, value, onChangeText, placeholder, colors, multiline = false, keyboardType = "default" }: FieldProps) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 8 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted + "CC"}
        multiline={multiline}
        keyboardType={keyboardType}
        textAlignVertical={multiline ? "top" : "center"}
        style={{
          minHeight: multiline ? 132 : 58,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          color: colors.foreground,
          fontSize: 15,
          paddingHorizontal: 17,
          paddingVertical: multiline ? 16 : 0,
        }}
      />
    </View>
  );
}
