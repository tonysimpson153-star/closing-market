import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import Constants from "expo-constants";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/lib/auth-store";

// 카카오 OAuth 설정
const KAKAO_APP_ID = process.env.EXPO_PUBLIC_KAKAO_APP_ID || Constants.expoConfig?.extra?.kakaoAppId;
const KAKAO_CLIENT_SECRET = process.env.EXPO_PUBLIC_KAKAO_CLIENT_SECRET || Constants.expoConfig?.extra?.kakaoClientSecret;
const SCHEME = Constants.expoConfig?.scheme || "manus";

// 카카오 OAuth 엔드포인트
const KAKAO_OAUTH_URL = "https://kauth.kakao.com/oauth/authorize";
const KAKAO_TOKEN_URL = "https://kauth.kakao.com/oauth/token";

// Deep linking 설정
const redirectUrl = AuthSession.makeRedirectUri({
  scheme: SCHEME,
  path: "oauth/kakao",
});

WebBrowser.maybeCompleteAuthSession();

export default function KakaoLoginScreen() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const params = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const kakaoMutation = trpc.auth.kakaoLogin.useMutation({
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      router.replace("/(tabs)/" as any);
    },
    onError: (err) => {
      Alert.alert("카카오 로그인 실패", err.message);
      setIsLoading(false);
    },
  });

  // Deep link로 돌아온 경우 처리
  useEffect(() => {
    const handleDeepLink = async () => {
      if (params.code) {
        const code = Array.isArray(params.code) ? params.code[0] : params.code;
        await exchangeCodeForToken(code);
      }
    };

    handleDeepLink();
  }, [params.code]);

  // 카카오 로그인 시작
  const handleKakaoLogin = async () => {
    if (!KAKAO_APP_ID) {
      Alert.alert("오류", "카카오 앱 ID가 설정되지 않았습니다.");
      return;
    }

    setIsLoading(true);

    try {
      // 카카오 OAuth 인증 URL 구성
      const authUrl = new URL(KAKAO_OAUTH_URL);
      authUrl.searchParams.append("client_id", KAKAO_APP_ID);
      authUrl.searchParams.append("redirect_uri", redirectUrl);
      authUrl.searchParams.append("response_type", "code");
      authUrl.searchParams.append("scope", "profile_image,profile_nickname,account_email");

      // 웹 브라우저에서 카카오 로그인 페이지 열기
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl.toString(),
        redirectUrl,
        { showInRecents: true }
      );

      if (result.type === "success") {
        const url = new URL(result.url);
        const code = url.searchParams.get("code");

        if (code) {
          await exchangeCodeForToken(code);
        }
      } else if (result.type === "cancel") {
        Alert.alert("취소됨", "카카오 로그인이 취소되었습니다.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("카카오 로그인 오류:", error);
      Alert.alert("오류", "카카오 로그인 중 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  // 인증 코드를 액세스 토큰으로 교환
  const exchangeCodeForToken = async (code: string) => {
    try {
      const tokenResponse = await fetch(KAKAO_TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: KAKAO_APP_ID!,
          redirect_uri: redirectUrl,
          code,
          client_secret: KAKAO_CLIENT_SECRET || "",
        }).toString(),
      });

      if (!tokenResponse.ok) {
        throw new Error("토큰 발급 실패");
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      if (!accessToken) {
        throw new Error("액세스 토큰을 받지 못했습니다.");
      }

      // 서버로 액세스 토큰 전달
      kakaoMutation.mutate({ accessToken });
    } catch (error) {
      console.error("토큰 교환 오류:", error);
      Alert.alert("오류", "토큰 발급 중 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← 뒤로</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          {/* 카카오 로고 영역 */}
          <View style={styles.kakaoLogoArea}>
            <View style={styles.kakaoIcon}>
              <Text style={styles.kakaoIconText}>K</Text>
            </View>
            <Text style={styles.title}>카카오 로그인</Text>
            <Text style={styles.subtitle}>
              카카오 계정으로 간편하게{"\n"}로그인하세요
            </Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>카카오 로그인 방식</Text>
            <Text style={styles.infoText}>
              아래 버튼을 누르면 카카오 로그인 페이지가 열립니다.{"\n"}
              카카오 계정으로 로그인하면 자동으로 앱으로 돌아옵니다.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.kakaoBtn, (isLoading || kakaoMutation.isPending) && styles.btnDisabled]}
            onPress={handleKakaoLogin}
            disabled={isLoading || kakaoMutation.isPending}
          >
            {isLoading || kakaoMutation.isPending ? (
              <ActivityIndicator color="#191919" />
            ) : (
              <Text style={styles.kakaoBtnText}>카카오로 로그인</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.disclaimerText}>
            로그인 시 개인정보 수집 및 이용에 동의합니다.
          </Text>
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
  backBtn: {
    paddingTop: 20,
    marginBottom: 8,
  },
  backBtnText: {
    fontSize: 15,
    color: "#3B82F6",
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  kakaoLogoArea: {
    alignItems: "center",
    paddingVertical: 32,
  },
  kakaoIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#FEE500",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  kakaoIconText: {
    fontSize: 32,
    fontWeight: "800",
    color: "#191919",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  infoBox: {
    backgroundColor: "#FFF9E6",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FEE500",
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#92400E",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: "#78350F",
    lineHeight: 20,
  },
  kakaoBtn: {
    backgroundColor: "#FEE500",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  kakaoBtnText: {
    color: "#191919",
    fontSize: 16,
    fontWeight: "700",
  },
  disclaimerText: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 18,
  },
});
