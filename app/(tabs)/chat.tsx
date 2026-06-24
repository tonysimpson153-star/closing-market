import { Text, View, Pressable, FlatList, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

export default function ChatScreen() {
  const colors = useColors();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const { data: chats, isLoading } = trpc.chats.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  return (
    <ScreenContainer>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: colors.foreground }}>채팅</Text>
      </View>

      {!isAuthenticated ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>💬</Text>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
            로그인이 필요합니다.
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
          <Text style={{ fontSize: 48, marginBottom: 16 }}>💬</Text>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 4 }}>
            채팅 내역이 없습니다.
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted, textAlign: "center" }}>
            관심 있는 상품에서 채팅하기를{"\n"}눌러 대화를 시작해보세요.
          </Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                {
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderBottomWidth: 0.5,
                  borderBottomColor: colors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
              onPress={() => router.push(`/chat/${item.id}` as any)}
            >
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: colors.surface,
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <IconSymbol name="person.fill" size={24} color={colors.muted} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}>
                    {item.otherUserName ?? "사용자"}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.muted }}>
                    {item.lastMessageAt ? new Date(item.lastMessageAt).toLocaleDateString("ko-KR") : ""}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontSize: 13, color: colors.muted, flex: 1 }} numberOfLines={1}>
                    {item.lastMessage ?? "채팅을 시작해보세요"}
                  </Text>
                  {item.unreadCount && item.unreadCount > 0 ? (
                    <View
                      style={{
                        backgroundColor: colors.primary,
                        borderRadius: 10,
                        minWidth: 20,
                        height: 20,
                        justifyContent: "center",
                        alignItems: "center",
                        paddingHorizontal: 6,
                        marginLeft: 8,
                      }}
                    >
                      <Text style={{ fontSize: 11, color: "#FFFFFF", fontWeight: "700" }}>
                        {item.unreadCount}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </ScreenContainer>
  );
}
