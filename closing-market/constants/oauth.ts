import * as Linking from "expo-linking";
import * as ReactNative from "react-native";
import Constants from "expo-constants";

// app.config.ts와 동일한 방식으로 bundleId 및 scheme 계산
const rawBundleId = "com.app.closingmarket";
const bundleId =
  rawBundleId
    .replace(/[-_]/g, ".")
    .replace(/[^a-zA-Z0-9.]/g, "")
    .replace(/\.+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .toLowerCase()
    .split(".")
    .map((segment) => (/^[a-zA-Z]/.test(segment) ? segment : "x" + segment))
    .join(".") || "space.manus.app";

const timestamp = bundleId.split(".").pop()?.replace(/^t/, "") ?? "";
// app.config.ts의 schemeFromBundleId와 완전히 동일하게 계산
const schemeFromBundleId = `manus${timestamp}`;

const env = {
  portal: process.env.EXPO_PUBLIC_OAUTH_PORTAL_URL ?? "",
  server: process.env.EXPO_PUBLIC_OAUTH_SERVER_URL ?? "",
  appId: process.env.EXPO_PUBLIC_APP_ID ?? "",
  ownerId: process.env.EXPO_PUBLIC_OWNER_OPEN_ID ?? "",
  ownerName: process.env.EXPO_PUBLIC_OWNER_NAME ?? "",
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "",
  deepLinkScheme: schemeFromBundleId,
};

export const OAUTH_PORTAL_URL = env.portal;
export const OAUTH_SERVER_URL = env.server;
export const APP_ID = env.appId;
export const OWNER_OPEN_ID = env.ownerId;
export const OWNER_NAME = env.ownerName;
export const API_BASE_URL = env.apiBaseUrl;

/**
 * Get the API base URL, deriving from current hostname if not set.
 */
export function getApiBaseUrl(): string {
  // Manus 개발 환경(웹) - 터널 서브도메인에서 자동 추론합니다.
  // .env에 남아있을 수 있는 예전/운영용 EXPO_PUBLIC_API_BASE_URL 값보다
  // 이 자동 감지를 먼저 시도해서, Manus에서 테스트할 때 항상 올바른
  // 개발 서버를 바라보도록 합니다. (운영 빌드에는 이런 터널 주소가 없으므로
  // 이 로직은 자연스럽게 건너뛰어지고 아래 명시적 설정값이 사용됩니다.)
  if (ReactNative.Platform.OS === "web" && typeof window !== "undefined" && window.location) {
    const { protocol, hostname } = window.location;
    const apiHostname = hostname.replace(/^8081-/, "3000-");
    if (apiHostname !== hostname) {
      return `${protocol}//${apiHostname}`;
    }
  }

  // 네이티브(Expo Go 등) - Metro 패키저 호스트에서 API 서버 주소를 추론합니다.
  const hostUri: string | undefined =
    (Constants.expoConfig as any)?.hostUri ||
    (Constants as any).expoGoConfig?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;

  if (hostUri) {
    const host = hostUri.split(":")[0];
    if (host.startsWith("8081-")) {
      // Manus 터널 형태의 서브도메인 (예: 8081-xxxx.sg1.manus.computer)
      const apiHost = host.replace(/^8081-/, "3000-");
      return `https://${apiHost}`;
    }
    // LAN IP 등 일반적인 개발 환경 - 포트만 3000으로 교체
    return `http://${host}:3000`;
  }

  // 위 자동 감지가 전부 실패한 경우에만 명시적으로 설정된 값을 사용합니다.
  // (운영 배포 빌드는 여기로만 도달합니다.)
  if (API_BASE_URL) {
    return API_BASE_URL.replace(/\/$/, "");
  }

  return "";
}

export const SESSION_TOKEN_KEY = "app_session_token";
export const USER_INFO_KEY = "manus-runtime-user-info";

const encodeState = (value: string) => {
  if (typeof globalThis.btoa === "function") {
    return globalThis.btoa(value);
  }
  const BufferImpl = (globalThis as Record<string, any>).Buffer;
  if (BufferImpl) {
    return BufferImpl.from(value, "utf-8").toString("base64");
  }
  return value;
};

/**
 * Get the redirect URI for OAuth callback.
 * - Web: uses API server callback endpoint
 * - Native: uses deep link scheme (app.config.ts의 scheme과 동일)
 */
export const getRedirectUri = () => {
  if (ReactNative.Platform.OS === "web") {
    return `${getApiBaseUrl()}/api/oauth/callback`;
  } else {
    // app.config.ts의 scheme과 동일한 값 사용
    return Linking.createURL("/oauth/callback", {
      scheme: env.deepLinkScheme,
    });
  }
};

export const getLoginUrl = () => {
  const redirectUri = getRedirectUri();
  const state = encodeState(redirectUri);

  const url = new URL(`${OAUTH_PORTAL_URL}/app-auth`);
  url.searchParams.set("appId", APP_ID);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};

/**
 * Start OAuth login flow.
 * - Native: 시스템 브라우저를 열어 OAuth 인증 후 딥링크로 복귀
 * - Web: 로그인 URL로 리다이렉트
 */
export async function startOAuthLogin(): Promise<{ success: boolean; error?: string }> {
  try {
    if (!OAUTH_PORTAL_URL || !APP_ID) {
      console.error("[OAuth] Missing portal URL or app ID");
      return { success: false, error: "OAuth 설정이 올바르지 않습니다." };
    }

    const loginUrl = getLoginUrl();
    console.log("[OAuth] Starting login flow, URL:", loginUrl);
    console.log("[OAuth] Redirect URI:", getRedirectUri());
    console.log("[OAuth] Deep link scheme:", env.deepLinkScheme);

    if (ReactNative.Platform.OS === "web") {
      if (typeof window !== "undefined") {
        window.location.href = loginUrl;
      }
      return { success: true };
    }

    const supported = await Linking.canOpenURL(loginUrl);
    if (!supported) {
      console.warn("[OAuth] Cannot open login URL");
      return { success: false, error: "로그인 URL을 열 수 없습니다." };
    }

    await Linking.openURL(loginUrl);
    return { success: true };
  } catch (error) {
    console.error("[OAuth] Failed to start OAuth login:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "로그인 시작에 실패했습니다.",
    };
  }
}
