import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import { LucideIcon } from "@/components/ui/icon-lucide";

interface NotifSettings {
  chatNotification: boolean;
  priceDropNotification: boolean;
  tradeNotification: boolean;
  marketingNotification: boolean;
}

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const colors = useColors();

  const [settings, setSettings] = useState<NotifSettings>({
    chatNotification: true,
    priceDropNotification: true,
    tradeNotification: true,
    marketingNotification: false,
  });
  const [isDirty, setIsDirty] = useState(false);

  const { data, isLoading } = trpc.user.getNotificationSettings.useQuery();
  const updateMutation = trpc.user.updateNotificationSettings.useMutation({
    onSuccess: () => {
      Alert.alert("저장 완료", "알림 설정이 저장되었습니다.");
      setIsDirty(false);
    },
    onError: (err) => {
      Alert.alert("저장 실패", err.message);
    },
  });

  useEffect(() => {
    if (data) {
      setSettings(data);
    }
  }, [data]);

  const handleToggle = (key: keyof NotifSettings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    updateMutation.mutate(settings);
  };

  const notifItems = [
    {
      key: "chatNotification" as const,
      label: "채팅 알림",
      desc: "새 채팅 메시지가 도착하면 알림을 받습니다.",
      emoji: "message-circle",
    },
    {
      key: "priceDropNotification" as const,
      label: "찜 가격 변동 알림",
      desc: "찜한 상품의 가격이 변경되면 알림을 받습니다.",
      emoji: "dollar",
    },
    {
      key: "tradeNotification" as const,
      label: "거래 알림",
      desc: "거래 상태 변경(예약, 완료 등) 시 알림을 받습니다.",
      emoji: "handshake",
    },
    {
      key: "marketingNotification" as const,
      label: "마케팅 알림",
      desc: "이벤트, 프로모션 등 마케팅 정보를 받습니다.",
      emoji: "megaphone",
    },
  ];

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={[styles.backBtnText, { color: colors.primary }]}>← 뒤로</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>알림 설정</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>받고 싶은 알림을 선택하세요</Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {notifItems.map((item, index) => (
              <View
                key={item.key}
                style={[
                  styles.row,
                  index < notifItems.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: colors.border },
                ]}
              >
                <View style={styles.rowLeft}>
                  <View style={[styles.emojiBox, { backgroundColor: colors.primary + "15" }]}>
                    <LucideIcon name={item.emoji as any} size={18} color={colors.primary} strokeWidth={1.5} />
                  </View>
                  <View style={styles.rowText}>
                    <Text style={[styles.rowLabel, { color: colors.foreground }]}>{item.label}</Text>
                    <Text style={[styles.rowDesc, { color: colors.muted }]}>{item.desc}</Text>
                  </View>
                </View>
                <Switch
                  value={settings[item.key]}
                  onValueChange={(val) => handleToggle(item.key, val)}
                  trackColor={{ false: colors.border, true: colors.primary + "80" }}
                  thumbColor={settings[item.key] ? colors.primary : "#f4f3f4"}
                />
              </View>
            ))}
          </View>
        )}

        {isDirty && (
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary }, updateMutation.isPending && styles.btnDisabled]}
            onPress={handleSave}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>변경사항 저장</Text>
            )}
          </TouchableOpacity>
        )}

        <Text style={[styles.notice, { color: colors.muted }]}>
          알림을 받으려면 기기의 알림 권한도 허용되어 있어야 합니다.
        </Text>
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
    paddingBottom: 24,
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
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  emojiBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  emoji: {
    fontSize: 20,
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  rowDesc: {
    fontSize: 12,
    lineHeight: 16,
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
  notice: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 16,
    lineHeight: 18,
  },
});
