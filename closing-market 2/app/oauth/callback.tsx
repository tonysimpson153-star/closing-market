import { ThemedView } from "@/components/themed-view";
import * as Api from "@/lib/_core/api";
import * as Auth from "@/lib/_core/auth";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { LucideIcon } from "@/components/ui/icon-lucide";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/use-colors";

type CallbackStatus = "processing" | "success" | "error" | "cancelled";

export default function OAuthCallback() {
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams<{
    code?: string;
    state?: string;
    error?: string;
    error_description?: string;
    sessionToken?: string;
    user?: string;
  }>();

  const [status, setStatus] = useState<CallbackStatus>("processing");
  const [errorMessage, setErrorMessage] = useState<string>("인증 중 오류가 발생했습니다.");
  const handledRef = useRef(false);

  useEffect(() => {
    // 중복 실행 방지
    if (handledRef.current) return;
    handledRef.current = true;

    const handleCallback = async () => {
      console.log("[OAuth] Callback handler triggered");
      console.log("[OAuth] Route params:", {
        hasCode: !!params.code,
        hasState: !!params.state,
        hasError: !!params.error,
        hasSessionToken: !!params.sessionToken,
        hasUser: !!params.user,
      });

      try {
        // ── 1. 사용자 취소 처리 ──────────────────────────────
        if (params.error === "access_denied" || params.error === "user_cancelled") {
          console.log("[OAuth] User cancelled login");
          setStatus("cancelled");
          setTimeout(() => router.replace("/(tabs)" as any), 1500);
          return;
        }

        // ── 2. 기타 error 파라미터 처리 ─────────────────────
        if (params.error) {
          const desc = params.error_description ?? params.error;
          console.error("[OAuth] Error param:", desc);
          setStatus("error");
          setErrorMessage(`로그인 오류: ${desc}`);
          return;
        }

        // ── 3. 웹 콜백: sessionToken이 route param으로 전달된 경우 ──
        if (params.sessionToken) {
          console.log("[OAuth] sessionToken found in params (web callback)");
          await Auth.setSessionToken(params.sessionToken);

          if (params.user) {
            try {
              const userJson =
                typeof atob !== "undefined"
                  ? atob(params.user)
                  : Buffer.from(params.user, "base64").toString("utf-8");
              const userData = JSON.parse(userJson);
              await Auth.setUserInfo({
                id: userData.id,
                openId: userData.openId,
                name: userData.name,
                email: userData.email,
                loginMethod: userData.loginMethod,
                lastSignedIn: new Date(userData.lastSignedIn || Date.now()),
              });
            } catch (e) {
              console.error("[OAuth] Failed to parse user data:", e);
            }
          }

          setStatus("success");
          setTimeout(() => router.replace("/(tabs)" as any), 1000);
          return;
        }

        // ── 4. code + state가 route param으로 전달된 경우 ───
        if (params.code && params.state) {
          console.log("[OAuth] code+state found in route params, exchanging...");
          await exchangeAndStore(params.code, params.state);
          return;
        }

        // ── 5. Linking.getInitialURL() fallback (딥링크) ────
        console.log("[OAuth] No params in route, checking Linking.getInitialURL()...");
        const initialUrl = await Linking.getInitialURL();
        console.log("[OAuth] Linking.getInitialURL():", initialUrl);

        if (initialUrl) {
          const parsed = parseOAuthUrl(initialUrl);
          console.log("[OAuth] Parsed from initialURL:", parsed);

          if (parsed.error === "access_denied" || parsed.error === "user_cancelled") {
            setStatus("cancelled");
            setTimeout(() => router.replace("/(tabs)" as any), 1500);
            return;
          }

          if (parsed.error) {
            setStatus("error");
            setErrorMessage(`로그인 오류: ${parsed.error}`);
            return;
          }

          if (parsed.sessionToken) {
            await Auth.setSessionToken(parsed.sessionToken);
            setStatus("success");
            setTimeout(() => router.replace("/(tabs)" as any), 1000);
            return;
          }

          if (parsed.code && parsed.state) {
            await exchangeAndStore(parsed.code, parsed.state);
            return;
          }
        }

        // ── 6. 아무 파라미터도 없는 경우 ────────────────────
        // 사용자가 로그인을 취소하고 돌아온 경우일 수 있음
        console.warn("[OAuth] No code/state/sessionToken found — treating as cancelled");
        setStatus("cancelled");
        setTimeout(() => router.replace("/(tabs)" as any), 1500);
      } catch (error) {
        console.error("[OAuth] Callback error:", error);
        setStatus("error");
        setErrorMessage(
          error instanceof Error ? error.message : "인증 처리 중 오류가 발생했습니다.",
        );
      }
    };

    handleCallback();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // code를 세션 토큰으로 교환하고 저장
  const exchangeAndStore = async (code: string, state: string) => {
    console.log("[OAuth] Exchanging code for session token...");
    const result = await Api.exchangeOAuthCode(code, state);

    if (!result.sessionToken) {
      throw new Error("세션 토큰을 받지 못했습니다.");
    }

    await Auth.setSessionToken(result.sessionToken);

    if (result.user) {
      await Auth.setUserInfo({
        id: result.user.id,
        openId: result.user.openId,
        name: result.user.name,
        email: result.user.email,
        loginMethod: result.user.loginMethod,
        lastSignedIn: new Date(result.user.lastSignedIn || Date.now()),
      });
    }

    setStatus("success");
    setTimeout(() => router.replace("/(tabs)" as any), 1000);
  };

  // URL에서 OAuth 파라미터 파싱
  const parseOAuthUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return {
        code: urlObj.searchParams.get("code") ?? undefined,
        state: urlObj.searchParams.get("state") ?? undefined,
        error: urlObj.searchParams.get("error") ?? undefined,
        sessionToken: urlObj.searchParams.get("sessionToken") ?? undefined,
      };
    } catch {
      // URL 파싱 실패 시 regex fallback
      const get = (key: string) => {
        const m = url.match(new RegExp(`[?&]${key}=([^&]+)`));
        return m ? decodeURIComponent(m[1]) : undefined;
      };
      return {
        code: get("code"),
        state: get("state"),
        error: get("error"),
        sessionToken: get("sessionToken"),
      };
    }
  };

  const handleGoHome = () => {
    router.replace("/(tabs)" as any);
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom", "left", "right"]}>
      <ThemedView style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
        {status === "processing" && (
          <>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 20, fontSize: 16, color: colors.foreground, textAlign: "center" }}>
              로그인 처리 중입니다...
            </Text>
            <Text style={{ marginTop: 8, fontSize: 13, color: colors.muted, textAlign: "center" }}>
              잠시만 기다려주세요.
            </Text>
          </>
        )}

        {status === "success" && (
          <>
            <View style={{ marginBottom: 16 }}><LucideIcon name="check-circle" size={32} color={colors.primary} strokeWidth={1.5} /></View>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
              로그인 성공!
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center" }}>
              홈 화면으로 이동합니다...
            </Text>
          </>
        )}

        {status === "cancelled" && (
          <>
            <View style={{ marginBottom: 16 }}><LucideIcon name="x-circle" size={32} color={colors.muted} strokeWidth={1.5} /></View>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
              로그인이 취소되었습니다.
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", marginBottom: 24 }}>
              홈 화면으로 돌아갑니다...
            </Text>
          </>
        )}

        {status === "error" && (
          <>
            <View style={{ marginBottom: 16 }}><LucideIcon name="alert-circle" size={32} color={colors.error} strokeWidth={1.5} /></View>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.error, marginBottom: 12, textAlign: "center" }}>
              로그인 실패
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", marginBottom: 32, lineHeight: 22 }}>
              {errorMessage}
            </Text>
            <Pressable
              onPress={handleGoHome}
              style={({ pressed }) => ({
                backgroundColor: colors.primary,
                paddingHorizontal: 32,
                paddingVertical: 14,
                borderRadius: 12,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}>
                홈으로 돌아가기
              </Text>
            </Pressable>
          </>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}
