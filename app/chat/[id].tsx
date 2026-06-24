import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState, useEffect, useCallback } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuthStore } from "@/lib/auth-store";
import { trpc } from "@/lib/trpc";
import * as ImagePicker from "expo-image-picker";

function formatTime(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

function isSameDay(a: Date | string, b: Date | string) {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate();
}

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = parseInt(id ?? "0", 10);
  const colors = useColors();
  const router = useRouter();
  const { user, token } = useAuthStore();
  const isAuthenticated = !!token;
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const utils = trpc.useUtils();

  // 채팅방 정보
  const { data: room, isLoading: roomLoading } = trpc.chats.room.useQuery(
    { roomId },
    { enabled: isAuthenticated && roomId > 0 }
  );

  // 메시지 목록 (3초 폴링)
  const { data: messages, isLoading: messagesLoading } = trpc.chats.messages.useQuery(
    { roomId, limit: 100 },
    {
      enabled: isAuthenticated && roomId > 0,
      refetchInterval: 3000,
    }
  );

  // 읽음 처리
  const markReadMutation = trpc.chats.markRead.useMutation();

  // 메시지 전송
  const sendMutation = trpc.chats.send.useMutation({
    onSuccess: () => {
      utils.chats.messages.invalidate({ roomId });
      utils.chats.list.invalidate();
      setInputText("");
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    },
    onError: (err) => {
      Alert.alert("오류", err.message);
    },
  });

  // 거래 완료/취소
  const updateStatusMutation = trpc.chats.updateStatus.useMutation({
    onSuccess: () => {
      utils.chats.room.invalidate({ roomId });
      Alert.alert("완료", "거래 상태가 변경되었습니다.");
    },
  });

  // 새 메시지 도착 시 읽음 처리 및 스크롤
  useEffect(() => {
    if (messages && messages.length > 0) {
      markReadMutation.mutate({ roomId });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 50);
    }
  }, [messages?.length]);

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text || isSending) return;
    setIsSending(true);
    sendMutation.mutate(
      { roomId, content: text },
      { onSettled: () => setIsSending(false) }
    );
  }, [inputText, isSending, roomId]);

  const uploadImageMutation = trpc.upload.chatImage.useMutation();

  const handleImagePick = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("권한 필요", "사진 전송을 위해 갤러리 접근 권한이 필요합니다.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: false,
      base64: true,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    if (!asset.base64) {
      Alert.alert("오류", "이미지를 읽을 수 없습니다.");
      return;
    }

    try {
      setIsSending(true);
      const uploadResult = await uploadImageMutation.mutateAsync({
        base64: asset.base64,
        mimeType: asset.mimeType ?? "image/jpeg",
        fileName: asset.fileName ?? "photo.jpg",
      });
      sendMutation.mutate({ roomId, imageUrl: uploadResult.url });
    } catch {
      // 업로드 실패 시 로컬 URI로 전송 (오프라인 폴백)
      sendMutation.mutate({ roomId, imageUrl: asset.uri });
    } finally {
      setIsSending(false);
    }
  }, [roomId]);

  const handleTradeAction = () => {
    Alert.alert(
      "거래 관리",
      "거래 상태를 변경하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "거래 완료",
          onPress: () => updateStatusMutation.mutate({ roomId, status: "completed" }),
        },
        {
          text: "거래 취소",
          style: "destructive",
          onPress: () => updateStatusMutation.mutate({ roomId, status: "cancelled" }),
        },
      ]
    );
  };

  if (!isAuthenticated) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: colors.muted }}>로그인이 필요합니다.</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (roomLoading || messagesLoading) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  const myId = (user as any)?.id;

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* 헤더 */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </Pressable>

        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }} numberOfLines={1}>
            {room?.otherUser?.name ?? "채팅"}
            {room?.otherUser?.isVerified && (
              <Text style={{ fontSize: 12, color: "#22C55E" }}> ✓</Text>
            )}
          </Text>
          {room?.product && (
            <Text style={{ fontSize: 11, color: colors.primary }} numberOfLines={1}>
              📦 {room.product.title}
            </Text>
          )}
        </View>

        {/* 거래 관리 버튼 */}
        {room?.status === "active" && (
          <Pressable
            style={({ pressed }) => [styles.tradeBtn, { backgroundColor: colors.surface, opacity: pressed ? 0.7 : 1 }]}
            onPress={handleTradeAction}
          >
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.foreground }}>거래관리</Text>
          </Pressable>
        )}

        {room?.status === "completed" && (
          <View style={[styles.tradeBtn, { backgroundColor: "#22C55E20" }]}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: "#22C55E" }}>거래완료</Text>
          </View>
        )}
        {/* 구매자 후기 작성 버튼 */}
        {room?.status === "completed" && room?.myRole === "buyer" && (
          <Pressable
            style={({ pressed }) => [styles.tradeBtn, { backgroundColor: "#F59E0B20", opacity: pressed ? 0.7 : 1 }]}
            onPress={() =>
              router.push({
                pathname: "/review/write" as any,
                params: {
                  chatRoomId: roomId.toString(),
                  targetUserId: room.otherUser?.id?.toString() ?? "",
                  targetName: room.otherUser?.name ?? "판매자",
                  productTitle: room.product?.title ?? "",
                },
              })
            }
          >
            <Text style={{ fontSize: 12, fontWeight: "600", color: "#F59E0B" }}>⭐ 후기작성</Text>
          </Pressable>
        )}
        {room?.status === "cancelled" && (
          <View style={[styles.tradeBtn, { backgroundColor: "#EF444420" }]}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: "#EF4444" }}>거래취소</Text>
          </View>
        )}
      </View>

      {/* 연결 상품 카드 */}
      {room?.product && (
        <View style={[styles.productCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {room.product.mainImageUrl ? (
            <Image source={{ uri: room.product.mainImageUrl }} style={styles.productImg} />
          ) : (
            <View style={[styles.productImg, { backgroundColor: colors.border, justifyContent: "center", alignItems: "center" }]}>
              <Text style={{ fontSize: 18 }}>📦</Text>
            </View>
          )}
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }} numberOfLines={1}>
              {room.product.title}
            </Text>
            <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "700", marginTop: 2 }}>
              {room.product.price?.toLocaleString()}원
            </Text>
          </View>
          <View style={[styles.statusBadge, {
            backgroundColor: room.product.status === "sold" ? "#EF444420" : "#22C55E20"
          }]}>
            <Text style={{ fontSize: 11, fontWeight: "600", color: room.product.status === "sold" ? "#EF4444" : "#22C55E" }}>
              {room.product.status === "selling" ? "판매중" : room.product.status === "reserved" ? "예약중" : "판매완료"}
            </Text>
          </View>
        </View>
      )}

      {/* 메시지 목록 */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages ?? []}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={{ flex: 1, alignItems: "center", paddingTop: 60 }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>👋</Text>
              <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center" }}>
                {room?.otherUser?.name ?? "상대방"}님과의 대화를{"\n"}시작해보세요.
              </Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const isMine = item.senderId === myId;
            const prevMsg = messages?.[index - 1];
            const showDate = !prevMsg || !isSameDay(prevMsg.createdAt, item.createdAt);

            return (
              <View>
                {/* 날짜 구분선 */}
                {showDate && (
                  <View style={styles.dateDivider}>
                    <View style={[styles.dateLine, { backgroundColor: colors.border }]} />
                    <Text style={[styles.dateText, { color: colors.muted, backgroundColor: colors.background }]}>
                      {formatDate(item.createdAt)}
                    </Text>
                    <View style={[styles.dateLine, { backgroundColor: colors.border }]} />
                  </View>
                )}

                {/* 메시지 버블 */}
                <View style={[styles.msgRow, isMine ? styles.msgRowMine : styles.msgRowOther]}>
                  {/* 상대방 아바타 */}
                  {!isMine && (
                    <View style={[styles.avatar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      {room?.otherUser?.profileImageUrl ? (
                        <Image source={{ uri: room.otherUser.profileImageUrl }} style={styles.avatarImg} />
                      ) : (
                        <IconSymbol name="person.fill" size={16} color={colors.muted} />
                      )}
                    </View>
                  )}

                  <View style={[styles.msgContent, isMine ? styles.msgContentMine : styles.msgContentOther]}>
                    {/* 이미지 메시지 */}
                    {item.imageUrl ? (
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.msgImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={[
                        styles.msgText,
                        { color: isMine ? "#FFFFFF" : colors.foreground }
                      ]}>
                        {item.content}
                      </Text>
                    )}
                  </View>

                  {/* 시간 + 읽음 표시 */}
                  <View style={[styles.msgMeta, isMine ? styles.msgMetaMine : styles.msgMetaOther]}>
                    {isMine && !item.isRead && (
                      <Text style={{ fontSize: 10, color: "#F59E0B", fontWeight: "700" }}>1</Text>
                    )}
                    <Text style={{ fontSize: 10, color: colors.muted }}>
                      {formatTime(item.createdAt)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          }}
        />

        {/* 입력창 */}
        <View style={[styles.inputBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          {/* 이미지 버튼 */}
          <Pressable
            style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }]}
            onPress={handleImagePick}
            disabled={isSending}
          >
            <IconSymbol name="photo" size={22} color={colors.muted} />
          </Pressable>

          {/* 텍스트 입력 */}
          <TextInput
            style={[styles.textInput, {
              backgroundColor: colors.surface,
              color: colors.foreground,
              borderColor: colors.border,
            }]}
            placeholder="메시지를 입력하세요"
            placeholderTextColor={colors.muted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
            returnKeyType="default"
          />

          {/* 전송 버튼 */}
          <Pressable
            style={({ pressed }) => [
              styles.sendBtn,
              {
                backgroundColor: inputText.trim() ? colors.primary : colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <IconSymbol name="paperplane.fill" size={18} color="#FFFFFF" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  backBtn: {
    padding: 4,
  },
  tradeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  productImg: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  dateDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  dateLine: {
    flex: 1,
    height: 0.5,
  },
  dateText: {
    fontSize: 11,
    paddingHorizontal: 10,
  },
  msgRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 6,
  },
  msgRowMine: {
    justifyContent: "flex-end",
  },
  msgRowOther: {
    justifyContent: "flex-start",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
    borderWidth: 1,
    overflow: "hidden",
  },
  avatarImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  msgContent: {
    maxWidth: "68%",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    overflow: "hidden",
  },
  msgContentMine: {
    backgroundColor: "#3B82F6",
    borderBottomRightRadius: 4,
  },
  msgContentOther: {
    backgroundColor: "#F3F4F6",
    borderBottomLeftRadius: 4,
  },
  msgText: {
    fontSize: 14,
    lineHeight: 20,
  },
  msgImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  msgMeta: {
    flexDirection: "column",
    alignItems: "flex-end",
    marginBottom: 2,
    gap: 2,
  },
  msgMetaMine: {
    marginRight: 6,
    alignItems: "flex-end",
  },
  msgMetaOther: {
    marginLeft: 6,
    alignItems: "flex-start",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: 12,
    borderTopWidth: 0.5,
    gap: 8,
  },
  iconBtn: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  textInput: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 100,
    minHeight: 40,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
