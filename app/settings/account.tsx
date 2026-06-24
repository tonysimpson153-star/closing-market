import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/lib/auth-store";
import { useColors } from "@/hooks/use-colors";

export default function AccountSettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user, setAuth, token } = useAuthStore();

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const updateProfileMutation = trpc.user.updateProfile.useMutation({
    onSuccess: (data) => {
      if (token && user) {
        setAuth(token, { ...user, name: data.name ?? user.name, phone: data.phone ?? user.phone });
      }
      Alert.alert("저장 완료", "프로필이 업데이트되었습니다.");
    },
    onError: (err) => {
      Alert.alert("저장 실패", err.message);
    },
  });

  const changePasswordMutation = trpc.user.changePassword.useMutation({
    onSuccess: () => {
      Alert.alert("변경 완료", "비밀번호가 변경되었습니다.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordSection(false);
    },
    onError: (err) => {
      Alert.alert("변경 실패", err.message);
    },
  });

  const handleSaveProfile = () => {
    if (!name.trim()) {
      Alert.alert("입력 오류", "이름을 입력해주세요.");
      return;
    }
    updateProfileMutation.mutate({
      name: name.trim(),
      phone: phone.trim() || undefined,
    });
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("입력 오류", "모든 비밀번호 항목을 입력해주세요.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("비밀번호 불일치", "새 비밀번호가 일치하지 않습니다.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("비밀번호 오류", "새 비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={[styles.backBtnText, { color: colors.primary }]}>← 뒤로</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>계정 설정</Text>
        </View>

        {/* 프로필 정보 */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>기본 정보</Text>

          <Text style={[styles.label, { color: colors.foreground }]}>이름 <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
            placeholder="이름을 입력하세요"
            placeholderTextColor={colors.muted}
            value={name}
            onChangeText={setName}
            returnKeyType="next"
          />

          <Text style={[styles.label, { color: colors.foreground }]}>전화번호 <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
            placeholder="010-0000-0000"
            placeholderTextColor={colors.muted}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            returnKeyType="done"
          />

          <Text style={[styles.label, { color: colors.foreground }]}>이메일</Text>
          <View style={[styles.input, styles.readonlyInput, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Text style={{ color: colors.muted, fontSize: 15 }}>{user?.email ?? "-"}</Text>
          </View>
          <Text style={[styles.hint, { color: colors.muted }]}>이메일은 변경할 수 없습니다.</Text>

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary }, updateProfileMutation.isPending && styles.btnDisabled]}
            onPress={handleSaveProfile}
            disabled={updateProfileMutation.isPending}
          >
            {updateProfileMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>저장하기</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 비밀번호 변경 */}
        {user?.loginMethod !== "kakao" && (
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 16 }]}>
            <TouchableOpacity
              style={styles.passwordToggleRow}
              onPress={() => setShowPasswordSection(!showPasswordSection)}
            >
              <Text style={[styles.sectionTitle, { color: colors.muted, marginBottom: 0 }]}>비밀번호 변경</Text>
              <Text style={{ color: colors.primary, fontSize: 14, fontWeight: "600" }}>
                {showPasswordSection ? "접기 ▲" : "펼치기 ▼"}
              </Text>
            </TouchableOpacity>

            {showPasswordSection && (
              <View style={{ marginTop: 16 }}>
                <Text style={[styles.label, { color: colors.foreground }]}>현재 비밀번호</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
                  placeholder="현재 비밀번호를 입력하세요"
                  placeholderTextColor={colors.muted}
                  secureTextEntry
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  returnKeyType="next"
                />

                <Text style={[styles.label, { color: colors.foreground }]}>새 비밀번호</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
                  placeholder="6자 이상 입력하세요"
                  placeholderTextColor={colors.muted}
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                  returnKeyType="next"
                />

                <Text style={[styles.label, { color: colors.foreground }]}>새 비밀번호 확인</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
                  placeholder="새 비밀번호를 다시 입력하세요"
                  placeholderTextColor={colors.muted}
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleChangePassword}
                />

                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: "#6B7280" }, changePasswordMutation.isPending && styles.btnDisabled]}
                  onPress={handleChangePassword}
                  disabled={changePasswordMutation.isPending}
                >
                  {changePasswordMutation.isPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveBtnText}>비밀번호 변경</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
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
    paddingTop: 20,
    paddingBottom: 20,
  },
  backBtn: {
    marginBottom: 12,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
  },
  section: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 12,
  },
  required: {
    color: "#EF4444",
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
  readonlyInput: {
    justifyContent: "center",
    paddingVertical: 14,
  },
  saveBtn: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 20,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  passwordToggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
