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
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/lib/auth-store";
import { useColors } from "@/hooks/use-colors";

export default function AccountSettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user, setAuth, token, clearAuth } = useAuthStore();

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(user?.profileImageUrl ?? null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const uploadPhotoMutation = trpc.upload.profilePhoto.useMutation();

  const handlePickProfilePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("권한 필요", "사진 접근 권한이 필요합니다.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });
    if (result.canceled || !result.assets[0]?.base64) return;

    setIsUploadingPhoto(true);
    try {
      const uploaded = await uploadPhotoMutation.mutateAsync({
        base64: result.assets[0].base64,
        mimeType: result.assets[0].mimeType ?? "image/jpeg",
        fileName: result.assets[0].fileName ?? "profile.jpg",
      });
      setProfileImageUrl(uploaded.url);
      // 업로드 즉시 서버에 반영
      updateProfileMutation.mutate({ profileImageUrl: uploaded.url });
    } catch (err: any) {
      Alert.alert("업로드 실패", err?.message ?? "사진 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showDeleteSection, setShowDeleteSection] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  const updateProfileMutation = trpc.user.updateProfile.useMutation({
    onSuccess: (data) => {
      if (token && user) {
        setAuth(token, { ...user, name: data.name ?? user.name, phone: data.phone ?? user.phone, profileImageUrl: data.profileImageUrl ?? user.profileImageUrl });
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

  const deleteAccountMutation = trpc.user.deleteAccount.useMutation({
    onSuccess: async () => {
      await clearAuth();
      Alert.alert("탈퇴 완료", "그동안 클로징마켓을 이용해주셔서 감사합니다.", [
        { text: "확인", onPress: () => router.replace("/" as any) },
      ]);
    },
    onError: (err) => {
      Alert.alert("탈퇴 실패", err.message);
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

  const handleDeleteAccount = () => {
    if (user?.loginMethod !== "kakao" && !deletePassword) {
      Alert.alert("입력 오류", "비밀번호를 입력해주세요.");
      return;
    }
    Alert.alert(
      "정말 탈퇴하시겠습니까?",
      "탈퇴 시 로그인 정보와 개인정보는 삭제되며 되돌릴 수 없습니다.\n(등록한 상품, 채팅, 후기 등 다른 이용자와 연결된 기록은 유지됩니다.)",
      [
        { text: "취소", style: "cancel" },
        {
          text: "탈퇴하기",
          style: "destructive",
          onPress: () => {
            deleteAccountMutation.mutate({ password: deletePassword || undefined });
          },
        },
      ]
    );
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

          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <TouchableOpacity onPress={handlePickProfilePhoto} disabled={isUploadingPhoto}>
              <View
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: 42,
                  backgroundColor: colors.background,
                  borderWidth: 1.5,
                  borderColor: colors.primary,
                  justifyContent: "center",
                  alignItems: "center",
                  overflow: "hidden",
                }}
              >
                {isUploadingPhoto ? (
                  <ActivityIndicator color={colors.primary} />
                ) : profileImageUrl ? (
                  <Image source={{ uri: profileImageUrl }} style={{ width: 84, height: 84 }} resizeMode="cover" />
                ) : (
                  <Text style={{ fontSize: 30, color: colors.muted }}>{(name || "?").charAt(0).toUpperCase()}</Text>
                )}
              </View>
            </TouchableOpacity>
            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "600", marginTop: 10 }} onPress={handlePickProfilePhoto}>
              프로필 사진 {profileImageUrl ? "변경" : "등록"}
            </Text>
          </View>

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

        {/* 회원 탈퇴 */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 16 }]}>
          <TouchableOpacity
            style={styles.passwordToggleRow}
            onPress={() => setShowDeleteSection(!showDeleteSection)}
          >
            <Text style={[styles.sectionTitle, { color: "#EF4444", marginBottom: 0 }]}>회원 탈퇴</Text>
            <Text style={{ color: colors.muted, fontSize: 14, fontWeight: "600" }}>
              {showDeleteSection ? "접기 ▲" : "펼치기 ▼"}
            </Text>
          </TouchableOpacity>

          {showDeleteSection && (
            <View style={{ marginTop: 16 }}>
              <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 20, marginBottom: 16 }}>
                탈퇴 시 로그인에 사용되는 개인정보(이메일, 전화번호, 비밀번호 등)는 즉시 삭제되며 복구할 수 없습니다.{"\n"}
                다만 등록한 상품, 채팅 내역, 거래 후기 등 다른 이용자와 연결된 기록은 서비스 신뢰도 유지를 위해 보존됩니다.
              </Text>

              {user?.loginMethod !== "kakao" && (
                <>
                  <Text style={[styles.label, { color: colors.foreground }]}>비밀번호 확인</Text>
                  <TextInput
                    style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
                    placeholder="현재 비밀번호를 입력하세요"
                    placeholderTextColor={colors.muted}
                    secureTextEntry
                    value={deletePassword}
                    onChangeText={setDeletePassword}
                    returnKeyType="done"
                  />
                </>
              )}

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: "#EF4444" }, deleteAccountMutation.isPending && styles.btnDisabled]}
                onPress={handleDeleteAccount}
                disabled={deleteAccountMutation.isPending}
              >
                {deleteAccountMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>탈퇴하기</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
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
