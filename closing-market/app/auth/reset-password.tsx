import { useState } from "react";
import { View, Text, TextInput, Pressable, Alert, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function ResetPasswordScreen() {
  const colors = useColors();
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [done, setDone] = useState(false);

  const resetPasswordMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      setDone(true);
    },
    onError: (err) => {
      Alert.alert("재설정 실패", err.message);
    },
  });

  const handleSubmit = () => {
    if (!token) {
      Alert.alert("오류", "재설정 링크가 올바르지 않습니다. 이메일의 링크를 다시 확인해주세요.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("입력 오류", "비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("입력 오류", "비밀번호가 일치하지 않습니다.");
      return;
    }
    resetPasswordMutation.mutate({ token, newPassword });
  };

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
        <Text style={{ fontSize: 17, fontWeight: "600", color: colors.foreground }}>새 비밀번호 설정</Text>
      </View>

      <View style={{ padding: 24 }}>
        {!token ? (
          <View style={{ alignItems: "center", paddingTop: 40 }}>
            <IconSymbol name="exclamationmark.triangle.fill" size={40} color={colors.error} />
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground, marginTop: 16, textAlign: "center" }}>
              올바르지 않은 링크입니다
            </Text>
            <Text style={{ fontSize: 13, color: colors.muted, marginTop: 8, textAlign: "center" }}>
              이메일에서 받으신 링크를 다시 확인해주세요.
            </Text>
          </View>
        ) : done ? (
          <View style={{ alignItems: "center", paddingTop: 40 }}>
            <IconSymbol name="checkmark.circle.fill" size={44} color={colors.primary} />
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginTop: 18, textAlign: "center" }}>
              비밀번호가 변경되었습니다
            </Text>
            <Text style={{ fontSize: 13, color: colors.muted, marginTop: 8, textAlign: "center" }}>
              새 비밀번호로 다시 로그인해주세요.
            </Text>
            <Pressable
              style={({ pressed }) => [
                {
                  marginTop: 24,
                  backgroundColor: colors.primary,
                  borderRadius: 12,
                  paddingVertical: 14,
                  paddingHorizontal: 32,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
              onPress={() => router.replace("/auth/login" as any)}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>로그인하러 가기</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground, marginBottom: 20 }}>
              사용하실 새 비밀번호를 입력해주세요
            </Text>

            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>새 비밀번호</Text>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="6자 이상 입력"
              placeholderTextColor={colors.muted}
              secureTextEntry
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                padding: 14,
                color: colors.foreground,
                backgroundColor: colors.surface,
                fontSize: 15,
                marginBottom: 16,
              }}
            />

            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>새 비밀번호 확인</Text>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="비밀번호 다시 입력"
              placeholderTextColor={colors.muted}
              secureTextEntry
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                padding: 14,
                color: colors.foreground,
                backgroundColor: colors.surface,
                fontSize: 15,
                marginBottom: 24,
              }}
            />

            <Pressable
              onPress={handleSubmit}
              disabled={resetPasswordMutation.isPending}
              style={({ pressed }) => [
                {
                  backgroundColor: colors.primary,
                  borderRadius: 12,
                  paddingVertical: 15,
                  alignItems: "center",
                  opacity: pressed || resetPasswordMutation.isPending ? 0.85 : 1,
                },
              ]}
            >
              {resetPasswordMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>비밀번호 변경하기</Text>
              )}
            </Pressable>
          </>
        )}
      </View>
    </ScreenContainer>
  );
}
