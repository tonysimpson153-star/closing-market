import { useState } from "react";
import { View, Text, TextInput, Pressable, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const forgotPasswordMutation = trpc.auth.forgotPassword.useMutation({
    onSuccess: () => {
      setSent(true);
    },
    onError: (err) => {
      Alert.alert("오류", err.message);
    },
  });

  const handleSubmit = () => {
    if (!email.trim()) {
      Alert.alert("입력 오류", "이메일을 입력해주세요.");
      return;
    }
    forgotPasswordMutation.mutate({ email: email.trim() });
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
        <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, marginRight: 12 }]} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: "600", color: colors.foreground }}>비밀번호 찾기</Text>
      </View>

      <View style={{ padding: 24 }}>
        {sent ? (
          <View style={{ alignItems: "center", paddingTop: 40 }}>
            <IconSymbol name="checkmark.circle.fill" size={44} color={colors.primary} />
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginTop: 18, textAlign: "center" }}>
              이메일을 확인해주세요
            </Text>
            <Text style={{ fontSize: 13, color: colors.muted, marginTop: 10, textAlign: "center", lineHeight: 20 }}>
              입력하신 이메일이 가입되어 있다면{"\n"}비밀번호 재설정 링크를 보내드렸어요.{"\n"}
              (카카오로 가입한 계정은 재설정 링크가 발송되지 않아요)
            </Text>
            <Pressable
              style={({ pressed }) => [{ marginTop: 28, opacity: pressed ? 0.7 : 1 }]}
              onPress={() => router.back()}
            >
              <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 14 }}>로그인으로 돌아가기</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
              가입하신 이메일을 입력해주세요
            </Text>
            <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 24, lineHeight: 19 }}>
              비밀번호 재설정 링크를 보내드려요. 카카오 로그인으로 가입하신 경우에는 이 기능을 이용하실 수 없어요.
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
                marginBottom: 20,
              }}
            />
            <Pressable
              onPress={handleSubmit}
              disabled={forgotPasswordMutation.isPending}
              style={({ pressed }) => [
                {
                  backgroundColor: colors.primary,
                  borderRadius: 12,
                  paddingVertical: 15,
                  alignItems: "center",
                  opacity: pressed || forgotPasswordMutation.isPending ? 0.85 : 1,
                },
              ]}
            >
              {forgotPasswordMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>재설정 링크 받기</Text>
              )}
            </Pressable>
          </>
        )}
      </View>
    </ScreenContainer>
  );
}
