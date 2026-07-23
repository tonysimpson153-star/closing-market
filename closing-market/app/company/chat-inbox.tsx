import { Text, View, Pressable, FlatList, ActivityIndicator, Image } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { LucideIcon } from "@/components/ui/icon-lucide";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

function formatTime(date: string | Date | null) {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "어제";
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

export default function CompanyChatInboxScreen() {
  const colors = useColors();
  const router = useRouter();

  const { data: chats, isLoading, refetch } = trpc.chats.myInquiryChats.useQuery();

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, marginRight: 12 }]} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: "600", color: colors.foreground }}>업체 문의함</Text>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !chats || chats.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
          <LucideIcon name="message" size={32} color={colors.muted} strokeWidth={1.5} />
          <Text style={{ fontSize: 15, color: colors.foreground, fontWeight: "600", marginTop: 16 }}>
            받은 문의가 없습니다
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 6, textAlign: "center" }}>
            고객이 업체 상세 화면에서 "채팅으로 문의하기"를 누르면{"\n"}여기에 모여요.
          </Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item: any) => String(item.id)}
          refreshing={isLoading}
          onRefresh={refetch}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }: { item: any }) => (
            <Pressable
              style={({ pressed }) => [
                {
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
              onPress={() => router.push(`/chat/${item.id}` as any)}
            >
              <View
                style={{
                  width: 46, height: 46, borderRadius: 23, backgroundColor: colors.background,
                  borderWidth: 1, borderColor: colors.border, justifyContent: "center", alignItems: "center",
                  marginRight: 12, overflow: "hidden",
                }}
              >
                {item.otherUser?.profileImageUrl ? (
                  <Image source={{ uri: item.otherUser.profileImageUrl }} style={{ width: 46, height: 46 }} />
                ) : (
                  <LucideIcon name="user" size={18} color={colors.muted} strokeWidth={1.5} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 3 }}>
                  {item.otherUser?.name ?? "고객"}
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted }} numberOfLines={1}>
                  {item.lastMessage || "새로운 문의"}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ fontSize: 10.5, color: colors.muted, marginBottom: 6 }}>
                  {formatTime(item.lastMessageAt)}
                </Text>
                {item.unreadCount > 0 && (
                  <View style={{ backgroundColor: colors.primary, borderRadius: 10, minWidth: 18, height: 18, justifyContent: "center", alignItems: "center", paddingHorizontal: 5 }}>
                    <Text style={{ fontSize: 10, fontWeight: "700", color: "#222222" }}>{item.unreadCount}</Text>
                  </View>
                )}
              </View>
            </Pressable>
          )}
        />
      )}
    </ScreenContainer>
  );
}
