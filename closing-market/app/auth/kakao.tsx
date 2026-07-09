import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/lib/auth-store";

// 카카오 로그인은 실제 앱에서는 expo-web-browser + 카카오 OAuth를 사용합니다.
// 현재는 카카오 액세스 토큰을 직접 입력하는 개발용 화면으로 구현합니다.
// 실제 배포 시에는 카카오 SDK 또는 OAuth 웹뷰로 교체하세요.

export default function KakaoLoginScreen() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [accessToken, setAccessToken] = useState("");

  const kakaoMutation = trpc.auth.kakaoLogin.useMutation({
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      router.replace("/(tabs)/" as any);
    },
    onError: (err) => {
      Alert.alert("카카오 로그인 실패", err.message);
    },
  });

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
              카카오 개발자 콘솔에서 발급받은{"\n"}액세스 토큰을 입력하세요
            </Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>카카오 로그인 설정 방법</Text>
            <Text style={styles.infoText}>
              1. 카카오 개발자 콘솔(developers.kakao.com)에서 앱 등록{"\n"}
              2. 플랫폼 설정에서 Android/iOS 번들 ID 등록{"\n"}
              3. 카카오 로그인 활성화 및 동의항목 설정{"\n"}
              4. REST API 키를 환경변수에 설정
            </Text>
          </View>

          <Text style={styles.label}>카카오 액세스 토큰</Text>
          <TextInput
            style={styles.input}
            placeholder="카카오 액세스 토큰 입력"
            placeholderTextColor="#9CA3AF"
            value={accessToken}
            onChangeText={setAccessToken}
            multiline
            numberOfLines={3}
            returnKeyType="done"
          />

          <TouchableOpacity
            style={[styles.kakaoBtn, kakaoMutation.isPending && styles.btnDisabled]}
            onPress={() => {
              if (!accessToken.trim()) {
                Alert.alert("입력 오류", "액세스 토큰을 입력해주세요.");
                return;
              }
              kakaoMutation.mutate({ accessToken: accessToken.trim() });
            }}
            disabled={kakaoMutation.isPending}
          >
            {kakaoMutation.isPending ? (
              <ActivityIndicator color="#191919" />
            ) : (
              <Text style={styles.kakaoBtnText}>카카오로 로그인</Text>
            )}
          </TouchableOpacity>
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
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 13,
    color: "#111827",
    backgroundColor: "#F9FAFB",
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  kakaoBtn: {
    backgroundColor: "#FEE500",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  btnDisabled: {
    opacity: 0.6,
  },
  kakaoBtnText: {
    color: "#191919",
    fontSize: 16,
    fontWeight: "700",
  },
});
