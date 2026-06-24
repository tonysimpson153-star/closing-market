import { Text, View, Pressable, FlatList, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/lib/auth-store";

const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  chat: "채팅",
  favorite: "찜",
  comment: "댓글",
  sold: "판매완료",
  price_change: "가격변경",
  business_reply: "업체답변",
  notice: "공지사항",
};

const NOTIFICATION_TYPE_ICONS: Record<string, string> = {
  chat: "💬",
  favorite: "❤️",
  comment: "💭",
  sold: "✅",
  price_change: "💰",
  business_reply: "🏢",
  notice: "📢",
};

export default function NotificationsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { token } = useAuthStore();
  const isAuthenticated = !!token;

  const { data: notifications, isLoading } = trpc.notifications.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 }}>
        <Pressable
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, marginRight: 12 }]}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: "600", color: colors.foreground, flex: 1 }}>알림</Text>
      </View>

      {!isAuthenticated ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🔔</Text>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
            로그인이 필요합니다.
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted, textAlign: "center" }}>
            로그인하면 채팅, 찜, 댓글 알림을{"\n"}받을 수 있습니다.
          </Text>
        </View>
      ) : isLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !notifications || notifications.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🔔</Text>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 4 }}>
            새로운 알림이 없습니다.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                {
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  backgroundColor: item.isRead ? colors.background : colors.primary + "08",
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text style={{ fontSize: 28, marginRight: 12 }}>
                {NOTIFICATION_TYPE_ICONS[item.type] ?? "🔔"}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 2 }}>
                  {item.title}
                </Text>
                {item.body ? (
                  <Text style={{ fontSize: 13, color: colors.muted }} numberOfLines={2}>
                    {item.body}
                  </Text>
                ) : null}
              </View>
              {!item.isRead && (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.primary,
                    marginLeft: 8,
                  }}
                />
              )}
            </Pressable>
          )}
        />
      )}
    </ScreenContainer>
  );
}
