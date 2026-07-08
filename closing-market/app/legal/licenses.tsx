import { ScrollView, Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

type LibraryInfo = { name: string; version: string; license: string };

const LIBRARY_GROUPS: Array<{ group: string; libs: LibraryInfo[] }> = [
  {
    group: "핵심 프레임워크",
    libs: [
      { name: "react", version: "19.1.0", license: "MIT" },
      { name: "react-dom", version: "19.1.0", license: "MIT" },
      { name: "react-native", version: "0.81.5", license: "MIT" },
      { name: "expo", version: "~54.0.29", license: "MIT" },
      { name: "expo-router", version: "~6.0.19", license: "MIT" },
    ],
  },
  {
    group: "Expo SDK 모듈",
    libs: [
      { name: "expo-audio", version: "~1.1.0", license: "MIT" },
      { name: "expo-build-properties", version: "^1.0.10", license: "MIT" },
      { name: "expo-constants", version: "~18.0.12", license: "MIT" },
      { name: "expo-font", version: "~14.0.10", license: "MIT" },
      { name: "expo-haptics", version: "~15.0.8", license: "MIT" },
      { name: "expo-image", version: "~3.0.11", license: "MIT" },
      { name: "expo-image-picker", version: "^17.0.11", license: "MIT" },
      { name: "expo-keep-awake", version: "~15.0.8", license: "MIT" },
      { name: "expo-linking", version: "~8.0.10", license: "MIT" },
      { name: "expo-notifications", version: "~0.32.15", license: "MIT" },
      { name: "expo-secure-store", version: "~15.0.8", license: "MIT" },
      { name: "expo-splash-screen", version: "~31.0.12", license: "MIT" },
      { name: "expo-status-bar", version: "~3.0.9", license: "MIT" },
      { name: "expo-symbols", version: "~1.0.8", license: "MIT" },
      { name: "expo-system-ui", version: "~6.0.9", license: "MIT" },
      { name: "expo-video", version: "~3.0.15", license: "MIT" },
      { name: "expo-web-browser", version: "~15.0.10", license: "MIT" },
      { name: "@expo/vector-icons", version: "^15.0.3", license: "MIT" },
    ],
  },
  {
    group: "내비게이션 & UI",
    libs: [
      { name: "@react-navigation/native", version: "^7.1.25", license: "MIT" },
      { name: "@react-navigation/bottom-tabs", version: "^7.8.12", license: "MIT" },
      { name: "@react-navigation/elements", version: "^2.9.2", license: "MIT" },
      { name: "react-native-screens", version: "~4.16.0", license: "MIT" },
      { name: "react-native-safe-area-context", version: "~5.6.2", license: "MIT" },
      { name: "react-native-gesture-handler", version: "~2.28.0", license: "MIT" },
      { name: "react-native-reanimated", version: "~4.1.6", license: "MIT" },
      { name: "react-native-worklets", version: "0.5.1", license: "MIT" },
      { name: "react-native-svg", version: "15.12.1", license: "MIT" },
      { name: "react-native-web", version: "~0.21.2", license: "MIT" },
      { name: "nativewind", version: "^4.2.1", license: "MIT" },
      { name: "tailwind-merge", version: "^2.6.0", license: "MIT" },
      { name: "lucide-react-native", version: "^0.462.0", license: "ISC" },
      { name: "lucide-react", version: "^1.22.0", license: "ISC" },
      { name: "clsx", version: "^2.1.1", license: "MIT" },
    ],
  },
  {
    group: "데이터 & 상태 관리",
    libs: [
      { name: "@tanstack/react-query", version: "^5.90.12", license: "MIT" },
      { name: "@trpc/client", version: "11.7.2", license: "MIT" },
      { name: "@trpc/react-query", version: "11.7.2", license: "MIT" },
      { name: "@trpc/server", version: "11.7.2", license: "MIT" },
      { name: "zustand", version: "^5.0.14", license: "MIT" },
      { name: "zod", version: "^4.2.1", license: "MIT" },
      { name: "superjson", version: "^1.13.3", license: "MIT" },
      { name: "@react-native-async-storage/async-storage", version: "^2.2.0", license: "MIT" },
    ],
  },
  {
    group: "백엔드 & 데이터베이스",
    libs: [
      { name: "express", version: "^4.22.1", license: "MIT" },
      { name: "drizzle-orm", version: "^0.44.7", license: "Apache-2.0" },
      { name: "mysql2", version: "^3.16.0", license: "MIT" },
      { name: "bcryptjs", version: "^3.0.3", license: "MIT" },
      { name: "jsonwebtoken", version: "^9.0.3", license: "MIT" },
      { name: "jose", version: "6.1.0", license: "MIT" },
      { name: "cookie", version: "^1.1.1", license: "MIT" },
      { name: "dotenv", version: "^16.6.1", license: "BSD-2-Clause" },
      { name: "axios", version: "^1.13.2", license: "MIT" },
    ],
  },
];

export default function LicensesScreen() {
  const colors = useColors();
  const router = useRouter();

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, marginRight: 12 }]} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: "600", color: colors.foreground }}>오픈소스 라이선스</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 20, marginBottom: 24 }}>
          클로징마켓은 아래의 오픈소스 라이브러리를 사용하여 제작되었습니다. 각 라이브러리의 저작권은 해당
          라이브러리의 개발자 및 기여자에게 있습니다.
        </Text>

        {LIBRARY_GROUPS.map((section) => (
          <View key={section.group} style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.primary, marginBottom: 10 }}>
              {section.group}
            </Text>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                overflow: "hidden",
              }}
            >
              {section.libs.map((lib, idx) => (
                <View
                  key={lib.name}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderTopWidth: idx === 0 ? 0 : 1,
                    borderTopColor: colors.border,
                  }}
                >
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={{ fontSize: 13.5, fontWeight: "600", color: colors.foreground }}>{lib.name}</Text>
                    <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>v{lib.version}</Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: colors.primary + "12",
                      borderWidth: 1,
                      borderColor: colors.primary,
                      borderRadius: 4,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                    }}
                  >
                    <Text style={{ fontSize: 10.5, color: colors.primary, fontWeight: "700" }}>{lib.license}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}

        <Text style={{ fontSize: 11, color: colors.muted, lineHeight: 18, marginTop: 8 }}>
          이 목록은 앱 개발에 직접 사용된 주요 오픈소스 패키지를 기준으로 작성되었습니다. MIT, Apache-2.0,
          ISC, BSD-2-Clause 라이선스는 모두 상업적 이용을 허용하는 오픈소스 라이선스입니다.
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
}
