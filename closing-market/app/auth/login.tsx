import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { LucideIcon } from "@/components/ui/icon-lucide";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/lib/auth-store";

export default function LoginScreen() {
  const router = useRouter();
  const colors = useColors();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      router.replace("/(tabs)/" as any);
    },
    onError: (err) => {
      Alert.alert("로그인 실패", err.message);
    },
  });

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("입력 오류", "이메일과 비밀번호를 입력해주세요.");
      return;
    }
    loginMutation.mutate({ email: email.trim(), password });
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]} className="bg-background">
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 - 뒤로가기 버튼 */}
        <Pressable
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </Pressable>

        {/* 로고 및 타이틀 영역 */}
        <View style={styles.logoArea}>
          <View style={[styles.logoBg, { backgroundColor: colors.primary + "15" }]}>
            <Image
              source={require("@/assets/images/icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.appName, { color: colors.foreground }]}>클로징마켓</Text>
          <Text style={[styles.tagline, { color: colors.muted }]}>폐업 물품의 새로운 가치</Text>
        </View>

        {/* 입력 폼 */}
        <View style={styles.form}>
          {/* 이메일 로그인 섹션 */}
          <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>이메일로 로그인</Text>
          </View>

          {/* 이메일 입력 */}
          <View style={{ marginTop: 16 }}>
            <Text style={[styles.label, { color: colors.foreground }]}>이메일 주소</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="envelope" size={18} color={colors.muted} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="이메일을 입력하세요"
                placeholderTextColor={colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* 비밀번호 입력 */}
          <View style={{ marginTop: 16 }}>
            <Text style={[styles.label, { color: colors.foreground }]}>비밀번호</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="lock" size={18} color={colors.muted} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="비밀번호를 입력하세요"
                placeholderTextColor={colors.muted}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
              >
                <IconSymbol
                  name={showPassword ? "eye" : "eye.slash"}
                  size={18}
                  color={colors.muted}
                />
              </Pressable>
            </View>
          </View>

          {/* 비밀번호 찾기 링크 */}
          <Pressable
            style={({ pressed }) => [{ alignSelf: "flex-end", marginTop: 10, opacity: pressed ? 0.6 : 1 }]}
            onPress={() => router.push("/auth/forgot-password" as any)}
          >
            <Text style={{ fontSize: 12.5, color: colors.muted }}>비밀번호를 잊으셨나요?</Text>
          </Pressable>

          {/* 이메일 로그인 버튼 */}
          <Pressable
            style={({ pressed }) => [
              styles.loginBtn,
              {
                backgroundColor: "transparent",
                borderWidth: 1.5,
                borderColor: colors.primary,
                opacity: pressed || loginMutation.isPending ? 0.7 : 1,
              },
            ]}
            onPress={handleLogin}
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <Text style={[styles.loginBtnText, { color: colors.primary }]}>이메일로 로그인</Text>
            )}
          </Pressable>

          {/* 소셜 로그인 구분선 */}
          <View style={styles.dividerContainer}>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.muted }]}>또는 소셜 로그인</Text>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
          </View>

          {/* 카카오 로그인 */}
          <Pressable
            style={({ pressed }) => [
              styles.kakaoBtn,
              { opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => router.push("/auth/kakao" as any)}
          >
            <LucideIcon name="send" size={18} color="#191919" />
            <Text style={styles.kakaoBtnText}>카카오로 로그인</Text>
          </Pressable>

          {/* 회원가입 링크 */}
          <View style={styles.registerRow}>
            <Text style={[styles.registerText, { color: colors.muted }]}>아직 계정이 없으신가요?</Text>
            <Pressable onPress={() => router.push("/auth/register" as any)}>
              <Text style={[styles.registerLink, { color: colors.primary }]}> 회원가입</Text>
            </Pressable>
          </View>
        </View>

        {/* 하단 안내 */}
        <View style={[styles.infoBox, { flexDirection: "row", alignItems: "flex-start", gap: 10 }]}>
          <LucideIcon name="lock" size={16} color={colors.muted} />
          <Text style={[styles.infoText, { color: colors.muted }]}>
            안전한 로그인{"\n"}
            당신의 정보는 암호화되어 안전하게 보호됩니다.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  logoArea: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 32,
  },
  logoBg: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  logo: {
    width: 50,
    height: 50,
  },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  tagline: {
    fontSize: 14,
    marginTop: 6,
    fontWeight: "500",
  },
  form: {
    gap: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  loginBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 24,
  },
  loginBtnText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    gap: 12,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  kakaoBtn: {
    backgroundColor: "#FEE500",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  kakaoBtnIcon: {
    fontSize: 18,
  },
  kakaoBtnText: {
    color: "#191919",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    gap: 2,
  },
  registerText: {
    fontSize: 14,
    fontWeight: "500",
  },
  registerLink: {
    fontSize: 14,
    fontWeight: "700",
  },
  infoBox: {
    marginTop: 32,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(212, 175, 55, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.1)",
  },
  infoText: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
    textAlign: "center",
  },
});
