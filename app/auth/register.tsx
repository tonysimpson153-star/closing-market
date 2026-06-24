import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/lib/auth-store";

type UserType = "buyer" | "seller";

export default function RegisterScreen() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [userType, setUserType] = useState<UserType>("buyer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      const msg = data.user.userType === "seller"
        ? `${data.user.name}님, 환영합니다!\n판매자 인증을 완료하면 상품을 등록할 수 있습니다.`
        : `${data.user.name}님, 환영합니다!`;
      Alert.alert("가입 완료", msg, [
        {
          text: "확인",
          onPress: () => {
            if (data.user.userType === "seller") {
              router.replace("/seller/apply" as any);
            } else {
              router.replace("/(tabs)/" as any);
            }
          },
        },
      ]);
    },
    onError: (err) => {
      Alert.alert("가입 실패", err.message);
    },
  });

  const handleRegister = () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert("입력 오류", "이름, 이메일, 비밀번호는 필수 입력입니다.");
      return;
    }
    if (password !== passwordConfirm) {
      Alert.alert("비밀번호 불일치", "비밀번호가 일치하지 않습니다.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("비밀번호 오류", "비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    registerMutation.mutate({
      name: name.trim(),
      email: email.trim(),
      password,
      phone: phone.trim() || undefined,
      userType,
    });
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← 뒤로</Text>
          </TouchableOpacity>
          <Text style={styles.title}>회원가입</Text>
          <Text style={styles.subtitle}>클로징마켓에 오신 것을 환영합니다</Text>
        </View>

        {/* 회원 유형 선택 */}
        <View style={styles.typeSection}>
          <Text style={styles.typeLabel}>회원 유형 선택 <Text style={styles.required}>*</Text></Text>
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeCard, userType === "buyer" && styles.typeCardActive]}
              onPress={() => setUserType("buyer")}
            >
              <Text style={styles.typeEmoji}>🛒</Text>
              <Text style={[styles.typeTitle, userType === "buyer" && styles.typeTitleActive]}>구매자</Text>
              <Text style={[styles.typeDesc, userType === "buyer" && styles.typeDescActive]}>
                사업 정리 물품을{"\n"}구매합니다
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeCard, userType === "seller" && styles.typeCardActive]}
              onPress={() => setUserType("seller")}
            >
              <Text style={styles.typeEmoji}>🏪</Text>
              <Text style={[styles.typeTitle, userType === "seller" && styles.typeTitleActive]}>판매자</Text>
              <Text style={[styles.typeDesc, userType === "seller" && styles.typeDescActive]}>
                사업 정리 물품을{"\n"}판매합니다
              </Text>
            </TouchableOpacity>
          </View>
          {userType === "seller" && (
            <View style={styles.sellerNotice}>
              <Text style={styles.sellerNoticeText}>
                판매자로 가입 후 사업자 인증을 완료해야 상품을 등록할 수 있습니다.
              </Text>
            </View>
          )}
        </View>

        {/* 입력 폼 */}
        <View style={styles.form}>
          <Text style={styles.label}>이름 <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="이름을 입력하세요"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
            returnKeyType="next"
          />

          <Text style={styles.label}>이메일 <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="이메일을 입력하세요"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            returnKeyType="next"
          />

          <Text style={styles.label}>전화번호 (선택)</Text>
          <TextInput
            style={styles.input}
            placeholder="010-0000-0000"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            returnKeyType="next"
          />

          <Text style={styles.label}>비밀번호 <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="6자 이상 입력하세요"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            returnKeyType="next"
          />

          <Text style={styles.label}>비밀번호 확인 <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="비밀번호를 다시 입력하세요"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            value={passwordConfirm}
            onChangeText={setPasswordConfirm}
            returnKeyType="done"
            onSubmitEditing={handleRegister}
          />

          <TouchableOpacity
            style={[styles.registerBtn, registerMutation.isPending && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerBtnText}>
                {userType === "seller" ? "판매자로 가입하기" : "구매자로 가입하기"}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>이미 계정이 있으신가요?</Text>
            <TouchableOpacity onPress={() => router.push("/auth/login" as any)}>
              <Text style={styles.loginLink}> 로그인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    backgroundColor: "#fff",
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
  },
  backBtn: {
    marginBottom: 16,
  },
  backBtnText: {
    fontSize: 15,
    color: "#3B82F6",
    fontWeight: "600",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  typeSection: {
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 10,
  },
  typeRow: {
    flexDirection: "row",
    gap: 12,
  },
  typeCard: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  typeCardActive: {
    borderColor: "#3B82F6",
    backgroundColor: "#EFF6FF",
  },
  typeEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  typeTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 4,
  },
  typeTitleActive: {
    color: "#1D4ED8",
  },
  typeDesc: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 18,
  },
  typeDescActive: {
    color: "#3B82F6",
  },
  sellerNotice: {
    marginTop: 10,
    backgroundColor: "#FEF3C7",
    borderRadius: 10,
    padding: 12,
  },
  sellerNoticeText: {
    fontSize: 12,
    color: "#92400E",
    lineHeight: 18,
  },
  form: {
    gap: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
    marginTop: 12,
  },
  required: {
    color: "#EF4444",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#F9FAFB",
  },
  registerBtn: {
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  registerBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  loginText: {
    fontSize: 14,
    color: "#6B7280",
  },
  loginLink: {
    fontSize: 14,
    color: "#3B82F6",
    fontWeight: "600",
  },
});
