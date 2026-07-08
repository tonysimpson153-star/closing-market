import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { LucideIcon } from "@/components/ui/icon-lucide";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "심사 중", color: "#F59E0B" },
  approved: { label: "인증 완료", color: "#22C55E" },
  rejected: { label: "반려", color: "#EF4444" },
  suspended: { label: "정지", color: "#6B7280" },
};

const SELLER_TYPE_LABELS: Record<string, string> = {
  closing_soon: "폐업 예정",
  closed: "폐업 완료",
  relocating: "사업장 이전",
  inventory: "재고 정리",
  transfer: "사업 양도",
};

export default function AdminSellerApplicationsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState<"pending" | "approved" | "rejected" | "suspended" | undefined>("pending");
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: applications, isLoading, refetch } = trpc.admin.sellerApplications.useQuery(
    filterStatus ? { status: filterStatus } : {}
  );

  const reviewMutation = (trpc.admin as any).reviewApplication.useMutation({
    onSuccess: () => {
      Alert.alert("처리 완료", "신청이 처리되었습니다.");
      setSelectedId(null);
      setRejectionReason("");
      refetch();
    },
    onError: (error: any) => {
      Alert.alert("오류", error.message);
    },
  });

  const handleApprove = (id: number) => {
    Alert.alert("승인 확인", "이 판매자 신청을 승인하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "승인",
        onPress: () => reviewMutation.mutate({ applicationId: id, action: "approved" }),
      },
    ]);
  };

  const handleReject = (id: number) => {
    setSelectedId(id);
  };

  const confirmReject = () => {
    if (!selectedId) return;
    if (!rejectionReason.trim()) {
      Alert.alert("입력 필요", "반려 사유를 입력해주세요.");
      return;
    }
    reviewMutation.mutate({
      applicationId: selectedId,
      action: "rejected",
      rejectionReason: rejectionReason.trim(),
    });
  };

  const handleSuspend = (id: number) => {
    Alert.alert("정지 확인", "이 판매자를 정지하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "정지",
        style: "destructive",
        onPress: () => reviewMutation.mutate({ applicationId: id, action: "suspended", rejectionReason: "관리자 정지" }),
      },
    ]);
  };

  const s = StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backBtn: { padding: 4, marginRight: 12 },
    headerTitle: { fontSize: 18, fontWeight: "700", color: colors.foreground },
    filterRow: {
      flexDirection: "row",
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
    },
    filterBtn: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 1,
    },
    filterText: { fontSize: 13, fontWeight: "600" },
    card: {
      marginHorizontal: 16,
      marginBottom: 12,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
    },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    businessName: { fontSize: 17, fontWeight: "700" },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { fontSize: 12, fontWeight: "700" },
    infoRow: { flexDirection: "row", marginBottom: 6 },
    infoLabel: { fontSize: 13, color: "#6B7280", width: 80 },
    infoValue: { fontSize: 13, flex: 1 },
    actionRow: { flexDirection: "row", gap: 8, marginTop: 12 },
    approveBtn: { flex: 1, backgroundColor: "#22C55E", borderRadius: 10, padding: 10, alignItems: "center" },
    rejectBtn: { flex: 1, backgroundColor: "#EF4444", borderRadius: 10, padding: 10, alignItems: "center" },
    suspendBtn: { flex: 1, backgroundColor: "#6B7280", borderRadius: 10, padding: 10, alignItems: "center" },
    actionBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
    emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
    emptyText: { fontSize: 15, color: "#6B7280", marginTop: 12 },
    rejectModal: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 24,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    rejectTitle: { fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 16 },
    rejectInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 14,
      fontSize: 14,
      color: colors.foreground,
      backgroundColor: colors.surface,
      minHeight: 80,
      textAlignVertical: "top",
      marginBottom: 16,
    },
    rejectConfirmBtn: {
      backgroundColor: "#EF4444",
      borderRadius: 12,
      padding: 14,
      alignItems: "center",
    },
    rejectCancelBtn: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 14,
      alignItems: "center",
      marginTop: 8,
    },
  });

  return (
    <ScreenContainer>
      {/* 헤더 */}
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={s.headerTitle}>판매자 신청 관리</Text>
      </View>

      {/* 필터 탭 */}
      <View style={s.filterRow}>
        {[
          { value: "pending" as const, label: "심사 중" },
          { value: "approved" as const, label: "승인" },
          { value: "rejected" as const, label: "반려" },
          { value: "suspended" as const, label: "정지" },
        ].map((f) => {
          const active = filterStatus === f.value;
          const statusInfo = STATUS_LABELS[f.value];
          return (
            <Pressable
              key={f.value}
              style={[
                s.filterBtn,
                {
                  borderColor: active ? statusInfo.color : colors.border,
                  backgroundColor: active ? statusInfo.color + "15" : colors.surface,
                },
              ]}
              onPress={() => setFilterStatus(f.value)}
            >
              <Text style={[s.filterText, { color: active ? statusInfo.color : colors.muted }]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <View style={s.emptyContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : !applications || applications.length === 0 ? (
        <View style={s.emptyContainer}>
          <LucideIcon name="file" size={30} color={colors.muted} strokeWidth={1.5} />
          <Text style={s.emptyText}>신청 내역이 없습니다.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 8, paddingBottom: 40 }}>
          {applications.map((app: any) => {
            const statusInfo = STATUS_LABELS[app.status];
            return (
              <View
                key={app.id}
                style={[s.card, { borderColor: colors.border, backgroundColor: colors.surface }]}
              >
                <View style={s.cardHeader}>
                  <Text style={[s.businessName, { color: colors.foreground }]}>{app.businessName}</Text>
                  <View style={[s.statusBadge, { backgroundColor: statusInfo.color + "20" }]}>
                    <Text style={[s.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                  </View>
                </View>

                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>판매 유형</Text>
                  <Text style={[s.infoValue, { color: colors.foreground }]}>
                    {SELLER_TYPE_LABELS[app.sellerType]}
                  </Text>
                </View>
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>사업자번호</Text>
                  <Text style={[s.infoValue, { color: colors.foreground }]}>{app.businessNumber}</Text>
                </View>
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>대표자명</Text>
                  <Text style={[s.infoValue, { color: colors.foreground }]}>{app.representativeName}</Text>
                </View>
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>신청일</Text>
                  <Text style={[s.infoValue, { color: colors.muted }]}>
                    {new Date(app.createdAt).toLocaleDateString("ko-KR")}
                  </Text>
                </View>
                {app.rejectionReason && (
                  <View style={s.infoRow}>
                    <Text style={s.infoLabel}>반려 사유</Text>
                    <Text style={[s.infoValue, { color: "#EF4444" }]}>{app.rejectionReason}</Text>
                  </View>
                )}

                {app.status === "pending" && (
                  <View style={s.actionRow}>
                    <Pressable
                      style={({ pressed }) => [s.approveBtn, { opacity: pressed ? 0.8 : 1 }]}
                      onPress={() => handleApprove(app.id)}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <LucideIcon name="check" size={13} color="#fff" strokeWidth={2} />
                        <Text style={s.actionBtnText}>승인</Text>
                      </View>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [s.rejectBtn, { opacity: pressed ? 0.8 : 1 }]}
                      onPress={() => handleReject(app.id)}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <LucideIcon name="x" size={13} color="#fff" strokeWidth={2} />
                        <Text style={s.actionBtnText}>반려</Text>
                      </View>
                    </Pressable>
                  </View>
                )}
                {app.status === "approved" && (
                  <View style={s.actionRow}>
                    <Pressable
                      style={({ pressed }) => [s.suspendBtn, { opacity: pressed ? 0.8 : 1 }]}
                      onPress={() => handleSuspend(app.id)}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <LucideIcon name="x-circle" size={13} color="#fff" strokeWidth={2} />
                        <Text style={s.actionBtnText}>판매자 정지</Text>
                      </View>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* 반려 사유 입력 모달 */}
      {selectedId !== null && (
        <View style={s.rejectModal}>
          <Text style={s.rejectTitle}>반려 사유 입력</Text>
          <TextInput
            style={s.rejectInput}
            placeholder="반려 사유를 입력해주세요..."
            placeholderTextColor={colors.muted}
            value={rejectionReason}
            onChangeText={setRejectionReason}
            multiline
            numberOfLines={3}
          />
          <Pressable
            style={({ pressed }) => [s.rejectConfirmBtn, { opacity: pressed ? 0.8 : 1 }]}
            onPress={confirmReject}
            disabled={reviewMutation.isPending}
          >
            {reviewMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.actionBtnText}>반려 처리</Text>
            )}
          </Pressable>
          <Pressable
            style={({ pressed }) => [s.rejectCancelBtn, { opacity: pressed ? 0.8 : 1 }]}
            onPress={() => { setSelectedId(null); setRejectionReason(""); }}
          >
            <Text style={[s.actionBtnText, { color: colors.foreground }]}>취소</Text>
          </Pressable>
        </View>
      )}
    </ScreenContainer>
  );
}
