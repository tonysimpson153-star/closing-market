import { Text, View, Pressable, FlatList, ActivityIndicator, Image } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { LucideIcon } from "@/components/ui/icon-lucide";
import { useColors } from "@/hooks/use-colors";
import { useAuthStore } from "@/lib/auth-store";
import { trpc } from "@/lib/trpc";

function formatTime(date: Date | null | string) {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) {
    return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  } else if (days === 1) {
    return "어제";
  } else if (days < 7) {
    return `${days}일 전`;
  } else {
    return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  }
}

export default function ChatScreen() {
  const colors = useColors();
  const router = useRouter();
  const { token } = useAuthStore();
  const isAuthenticated = !!token;

  const { data: chats, isLoading, refetch } = trpc.chats.list.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 5000, // 5초마다 폴링
  });

  return (
    <ScreenContainer>
      {/* 헤더 */}
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.border,
      }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: colors.foreground }}>채팅</Text>
        {chats && chats.length > 0 && (
          <View style={{
            backgroundColor: colors.primary,
            borderRadius: 12,
            paddingHorizontal: 10,
            paddingVertical: 3,
          }}>
            <Text style={{ fontSize: 12, color: "#fff", fontWeight: "700" }}>
              {chats.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0) > 0
                ? `${chats.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0)}개 안읽음`
                : "전체"}
            </Text>
          </View>
        )}
      </View>

      {!isAuthenticated ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
          <LucideIcon name="message-circle" size={48} color={colors.primary} />
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
            로그인이 필요합니다
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted, textAlign: "center" }}>
            로그인하면 판매자와 1:1 채팅을{"\n"}이용할 수 있습니다.
          </Text>
        </View>
      ) : isLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !chats || chats.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
          <LucideIcon name="message-circle" size={48} color={colors.primary} />
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 4 }}>
            채팅 내역이 없습니다
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted, textAlign: "center" }}>
            관심 있는 상품에서 채팅하기를{"\n"}눌러 대화를 시작해보세요.
          </Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            const hasUnread = (item.unreadCount ?? 0) > 0;
            return (
              <Pressable
                style={({ pressed }) => [{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderBottomWidth: 0.5,
                  borderBottomColor: colors.border,
                  backgroundColor: hasUnread ? `${colors.primary}08` : "transparent",
                  opacity: pressed ? 0.75 : 1,
                }]}
                onPress={() => router.push(`/chat/${item.id}` as any)}
              >
                {/* 프로필 이미지 */}
                <View style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: colors.surface,
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  overflow: "hidden",
                }}>
                  {item.otherUser?.profileImageUrl ? (
                    <Image
                      source={{ uri: item.otherUser.profileImageUrl }}
                      style={{ width: 52, height: 52, borderRadius: 26 }}
                    />
                  ) : (
                    <IconSymbol name="person.fill" size={24} color={colors.muted} />
                  )}
                </View>

                {/* 채팅 정보 */}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
                    <Text style={{
                      fontSize: 15,
                      fontWeight: hasUnread ? "700" : "600",
                      color: colors.foreground,
                    }}>
                      {item.otherUser?.name ?? "사용자"}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.muted }}>
                      {formatTime(item.lastMessageAt)}
                    </Text>
                  </View>

                  {/* 연결된 상품 */}
                  {item.product && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 }}>
                      <LucideIcon name="package" size={11} color={colors.primary} strokeWidth={1.8} />
                      <Text style={{ fontSize: 11, color: colors.primary }} numberOfLines={1}>
                        {item.product.title}
                      </Text>
                    </View>
                  )}

                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{
                      fontSize: 13,
                      color: hasUnread ? colors.foreground : colors.muted,
                      fontWeight: hasUnread ? "500" : "400",
                      flex: 1,
                    }} numberOfLines={1}>
                      {item.lastMessage ?? "채팅을 시작해보세요"}
                    </Text>
                    {hasUnread && (
                      <View style={{
                        backgroundColor: colors.primary,
                        borderRadius: 10,
                        minWidth: 20,
                        height: 20,
                        justifyContent: "center",
                        alignItems: "center",
                        paddingHorizontal: 6,
                        marginLeft: 8,
                      }}>
                        <Text style={{ fontSize: 11, color: "#FFFFFF", fontWeight: "700" }}>
                          {item.unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </ScreenContainer>
  );
}
