"use client";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Pressable,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/lib/auth-store";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { LucideIcon } from "@/components/ui/icon-lucide";

export default function RegisterScreen() {
  const router = useRouter();
  const colors = useColors();
  const { setAuth } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      Alert.alert("가입 완료", `${data.user.name}님, 환영합니다!\n클로징마켓에 오신 것을 환영합니다.`, [
        {
          text: "확인",
          onPress: () => router.replace("/(tabs)/" as any),
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
    if (!agreedToPrivacy) {
      Alert.alert("동의 필요", "이용약관 및 개인정보처리방침에 동의해주세요.");
      return;
    }
    registerMutation.mutate({
      name: name.trim(),
      email: email.trim(),
      password,
      phone: phone.trim() || undefined,
    });
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]} className="bg-background">
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* 헤더 */}
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={24} color={colors.primary} />
          </Pressable>
          <Text style={[styles.title, { color: colors.foreground }]}>회원가입</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>클로징마켓에 오신 것을 환영합니다</Text>
        </View>

        {/* 안내 배너 - 프리미엄 스타일 */}
        <View style={[styles.infoBanner, { backgroundColor: colors.primary + "10", borderColor: colors.primary }]}>
          <View style={[styles.infoIconBg, { backgroundColor: colors.primary + "20" }]}>
            <LucideIcon name="info" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoTitle, { color: colors.primary }]}>일반회원으로 가입됩니다</Text>
            <Text style={[styles.infoText, { color: colors.muted }]}>
              모든 신규 회원은 일반회원으로 가입됩니다. 가입 후 마이페이지에서 판매회원 또는 업체회원으로 전환할 수 있습니다.
            </Text>
          </View>
        </View>

        {/* 입력 폼 */}
        <View style={styles.form}>
          {/* 이름 */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              이름 <Text style={[styles.required, { color: colors.error }]}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.foreground,
                  backgroundColor: colors.surface,
                },
              ]}
              placeholder="이름을 입력하세요"
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
              returnKeyType="next"
            />
          </View>

          {/* 이메일 */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              이메일 <Text style={[styles.required, { color: colors.error }]}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.foreground,
                  backgroundColor: colors.surface,
                },
              ]}
              placeholder="example@email.com"
              placeholderTextColor={colors.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              returnKeyType="next"
            />
          </View>

          {/* 전화번호 */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>전화번호 (선택)</Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.foreground,
                  backgroundColor: colors.surface,
                },
              ]}
              placeholder="010-0000-0000"
              placeholderTextColor={colors.muted}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              returnKeyType="next"
            />
          </View>

          {/* 비밀번호 */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              비밀번호 <Text style={[styles.required, { color: colors.error }]}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.foreground,
                  backgroundColor: colors.surface,
                },
              ]}
              placeholder="6자 이상 입력하세요"
              placeholderTextColor={colors.muted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              returnKeyType="next"
            />
          </View>

          {/* 비밀번호 확인 */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              비밀번호 확인 <Text style={[styles.required, { color: colors.error }]}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.foreground,
                  backgroundColor: colors.surface,
                },
              ]}
              placeholder="비밀번호를 다시 입력하세요"
              placeholderTextColor={colors.muted}
              secureTextEntry
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />
          </View>

          {/* 이용약관 및 개인정보처리방침 동의 */}
          <Pressable
            style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}
            onPress={() => setAgreedToPrivacy(!agreedToPrivacy)}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                borderWidth: 1.5,
                borderColor: agreedToPrivacy ? colors.primary : colors.border,
                backgroundColor: agreedToPrivacy ? colors.primary + "20" : "transparent",
                justifyContent: "center",
                alignItems: "center",
                marginRight: 10,
              }}
            >
              {agreedToPrivacy && <LucideIcon name="check" size={13} color={colors.primary} strokeWidth={2.5} />}
            </View>
            <Text style={{ fontSize: 13, color: colors.foreground }}>
              (필수){" "}
              <Text
                style={{ color: colors.primary, fontWeight: "700", textDecorationLine: "underline" }}
                onPress={() => router.push("/legal/terms" as any)}
              >
                이용약관
              </Text>
              {" "}및{" "}
              <Text
                style={{ color: colors.primary, fontWeight: "700", textDecorationLine: "underline" }}
                onPress={() => router.push("/legal/privacy" as any)}
              >
                개인정보처리방침
              </Text>
              에 동의합니다
            </Text>
          </Pressable>

          {/* 가입 버튼 */}
          <Pressable
            style={({ pressed }) => [
              styles.registerBtn,
              {
                backgroundColor: colors.primary,
                opacity: registerMutation.isPending ? 0.6 : pressed ? 0.85 : 1,
              },
            ]}
            onPress={handleRegister}
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <Text style={styles.registerBtnText}>일반회원으로 가입하기</Text>
            )}
          </Pressable>

          {/* 로그인 링크 */}
          <View style={styles.loginRow}>
            <Text style={[styles.loginText, { color: colors.muted }]}>이미 계정이 있으신가요?</Text>
            <Pressable onPress={() => router.push("/auth/login" as any)}>
              <Text style={[styles.loginLink, { color: colors.primary }]}> 로그인</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "flex-start",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  infoIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  infoIcon: {
    fontSize: 20,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 20,
  },
  form: {
    gap: 0,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  required: {
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: "500",
  },
  registerBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 28,
  },
  registerBtnText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  loginText: {
    fontSize: 14,
    fontWeight: "500",
  },
  loginLink: {
    fontSize: 14,
    fontWeight: "700",
  },
});
