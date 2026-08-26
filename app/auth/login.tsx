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
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { LucideIcon } from "@/components/ui/icon-lucide";
import { useAuthStore } from "@/lib/auth-store";
import { trpc } from "@/lib/trpc";
import { startOAuthLogin } from "@/constants/oauth";
import * as AppleAuthentication from "expo-apple-authentication";

export default function LoginScreen() {
  const colors = useColors();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { setAuth } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      queryClient.clear();
      setAuth(data.token, data.user);
      router.replace("/(tabs)/" as any);
    },

    onError: (err) => {
      if (Platform.OS === "web") {
        window.alert(`로그인 실패: ${err.message}`);
      } else {
        Alert.alert("로그인 실패", err.message);
      }
    },
  });

  const appleLoginMutation = trpc.auth.appleLogin.useMutation({
    onSuccess: (data) => {
      queryClient.clear();
      setAuth(data.token, data.user);
      router.replace("/(tabs)/" as any);
    },
    onError: (err) => {
      if (Platform.OS === "web") {
        window.alert(`Apple 로그인 실패: ${err.message}`);
      } else {
        Alert.alert("Apple 로그인 실패", err.message);
      }
    },
  });

  const handleLogin = () => {
    if (!agreedToTerms) {
      if (Platform.OS === "web") {
        window.alert("이용약관 및 운영정책에 동의해주세요.");
      } else {
        Alert.alert("동의 필요", "이용약관 및 운영정책에 동의해주세요.");
      }
      return;
    }
    if (!email.trim() || !password.trim()) {
      if (Platform.OS === "web") {
        window.alert("이메일과 비밀번호를 입력해주세요.");
      } else {
        Alert.alert("입력 오류", "이메일과 비밀번호를 입력해주세요.");
      }
      return;
    }
    loginMutation.mutate({ email: email.trim(), password });
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]} className="bg-background">
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: 24,
          justifyContent: "center",
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: "center", marginBottom: 40 }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "800",
              color: colors.primary,
              letterSpacing: 1,
            }}
          >
            클로징마켓
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 8 }}>
            사업의 끝, 가치의 시작
          </Text>
        </View>

        <Pressable
          style={{
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            backgroundColor: colors.surface,
          }}
          onPress={() => setAgreedToTerms((current) => !current)}
        >
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              borderWidth: 1.5,
              borderColor: agreedToTerms ? colors.primary : colors.border,
              backgroundColor: agreedToTerms
                ? colors.primary + "20"
                : "transparent",
              justifyContent: "center",
              alignItems: "center",
              marginRight: 12,
            }}
          >
            {agreedToTerms && (
              <LucideIcon
                name="check"
                size={14}
                color={colors.primary}
                strokeWidth={2.5}
              />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 14,
                color: colors.foreground,
                marginBottom: 8,
              }}
            >
              이용약관 및 운영정책에 동의합니다.
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text
                style={{
                  color: colors.primary,
                  fontWeight: "700",
                  fontSize: 13,
                }}
                onPress={() => router.push("/legal/terms" as any)}
              >
                이용약관 보기
              </Text>
              <Text style={{ color: colors.muted, marginHorizontal: 12 }}>
                ·
              </Text>
              <Text
                style={{
                  color: colors.primary,
                  fontWeight: "700",
                  fontSize: 13,
                }}
                onPress={() => router.push("/legal/operating-policy" as any)}
              >
                운영정책 보기
              </Text>
            </View>
          </View>
        </Pressable>

        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: colors.foreground,
              marginBottom: 16,
            }}
          >
            이메일로 로그인
          </Text>

          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: colors.foreground,
                marginBottom: 8,
              }}
            >
              이메일
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="example@email.com"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              keyboardType="email-address"
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                padding: 14,
                color: colors.foreground,
                backgroundColor: colors.surface,
                fontSize: 15,
              }}
            />
          </View>

          <View style={{ marginBottom: 8 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: colors.foreground,
                marginBottom: 8,
              }}
            >
              비밀번호
            </Text>
            <View style={{ position: "relative" }}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="비밀번호를 입력하세요"
                placeholderTextColor={colors.muted}
                secureTextEntry={!showPassword}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 10,
                  padding: 14,
                  paddingRight: 44,
                  color: colors.foreground,
                  backgroundColor: colors.surface,
                  fontSize: 15,
                }}
              />
              <Pressable
                style={{ position: "absolute", right: 14, top: 14 }}
                onPress={() => setShowPassword(!showPassword)}
              >
                <LucideIcon
                  name={showPassword ? "eye-off" : "eye"}
                  size={18}
                  color={colors.muted}
                />
              </Pressable>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              {
                alignSelf: "flex-end",
                marginTop: 10,
                opacity: pressed ? 0.6 : 1,
              },
            ]}
            onPress={() => router.push("/auth/forgot-password" as any)}
          >
            <Text style={{ fontSize: 12.5, color: colors.muted }}>
              비밀번호를 잊으셨나요?
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              {
                backgroundColor: colors.primary,
                borderRadius: 12,
                paddingVertical: 15,
                alignItems: "center",
                marginTop: 20,
                opacity: pressed || loginMutation.isPending ? 0.7 : 1,
              },
            ]}
            onPress={handleLogin}
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
                이메일로 로그인
              </Text>
            )}
          </Pressable>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginVertical: 16,
          }}
        >
          <View
            style={{ flex: 1, height: 1, backgroundColor: colors.border }}
          />
          <Text
            style={{ marginHorizontal: 12, fontSize: 12, color: colors.muted }}
          >
            또는
          </Text>
          <View
            style={{ flex: 1, height: 1, backgroundColor: colors.border }}
          />
        </View>

        <Pressable
          style={({ pressed }) => [
            {
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#FEE500",
              borderRadius: 12,
              paddingVertical: 15,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          onPress={() => startOAuthLogin()}
        >
          <Text style={{ color: "#000000", fontWeight: "700", fontSize: 15 }}>
            카카오로 로그인
          </Text>
        </Pressable>

        {Platform.OS === "ios" && (
          <Pressable
            style={({ pressed }) => [
              {
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#000000",
                borderRadius: 12,
                paddingVertical: 15,
                marginTop: 12,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            disabled={appleLoginMutation.isPending}
            onPress={async () => {
              if (!agreedToTerms) {
                Alert.alert("동의 필요", "이용약관 및 운영정책에 동의해주세요.");
                return;
              }
              try {
                const credential = await AppleAuthentication.signInAsync({
                  requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                  ],
                });
                if (!credential.identityToken) {
                  throw new Error("Apple 인증 토큰을 받지 못했습니다.");
                }
                appleLoginMutation.mutate({ identityToken: credential.identityToken });
              } catch (e: any) {
                if (e.code !== "ERR_REQUEST_CANCELED" && e.code !== "ERR_CANCELED") {
                  Alert.alert("Apple 로그인 실패", e.message || "Apple 로그인 중 오류가 발생했습니다.");
                }
              }
            }}
          >
            {appleLoginMutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 15 }}>
                Apple로 로그인
              </Text>
            )}
          </Pressable>
        )}

        <Pressable
          style={({ pressed }) => [
            { marginTop: 24, alignSelf: "center", opacity: pressed ? 0.6 : 1 },
          ]}
          onPress={() => router.push("/auth/register" as any)}
        >
          <Text style={{ fontSize: 13, color: colors.muted }}>
            아직 회원이 아니신가요?{" "}
            <Text style={{ color: colors.primary, fontWeight: "700" }}>
              회원가입
            </Text>
          </Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
