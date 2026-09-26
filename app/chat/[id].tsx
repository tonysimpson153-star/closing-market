import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { LucideIcon } from "@/components/ui/icon-lucide";
import { useColors } from "@/hooks/use-colors";
import { useAuthStore } from "@/lib/auth-store";
import { trpc } from "@/lib/trpc";
import type { ChatMessage } from "@/drizzle/schema";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";

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

function createOptimisticMessage(
  roomId: number,
  senderId: number,
  temporaryId: number,
  content?: string,
  imageUrl?: string,
): ChatMessage {
  return {
    id: temporaryId,
    roomId,
    senderId,
    content: content ?? null,
    imageUrl: imageUrl ?? null,
    isRead: false,
    createdAt: new Date(),
  };
}

type PendingChatImage = {
  uri: string;
  base64: string;
  mimeType?: string | null;
  fileName?: string | null;
};

function ChatInputLayout({ children }: { children: React.ReactNode }) {
  // 웹 미리보기와 Android는 화면 자체가 resize되므로 별도 보정을 하면 입력창이 두 번 움직인다.
  if (Platform.OS !== "ios") {
    return <View style={{ flex: 1 }}>{children}</View>;
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={0}>
      {children}
    </KeyboardAvoidingView>
  );
}

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = parseInt(id ?? "0", 10);
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, token } = useAuthStore();
  const isAuthenticated = !!token;
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [pendingChatImage, setPendingChatImage] = useState<PendingChatImage | null>(null);
  const [fullscreenChatImage, setFullscreenChatImage] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const utils = trpc.useUtils();

  useEffect(() => {
    if (Platform.OS !== "ios") return;

    const showSubscription = Keyboard.addListener("keyboardWillShow", () => setIsKeyboardOpen(true));
    const hideSubscription = Keyboard.addListener("keyboardWillHide", () => setIsKeyboardOpen(false));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

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
  // FlatList를 inverted로 사용하면 첫 화면이 항상 아래(최신 메시지)에 고정된다.
  // 서버 응답은 오래된 순서이므로 렌더링용 배열만 뒤집는다.
  const displayMessages = useMemo(() => [...(messages ?? [])].reverse(), [messages]);

  // 읽음 처리
  const markReadMutation = trpc.chats.markRead.useMutation({
    onSuccess: () => {
      // 배지 초기화
      if (Platform.OS === "ios" || Platform.OS === "android") {
        Notifications.setBadgeCountAsync(0);
      }
    },
  });

  // 메시지 전송
  const sendMutation = trpc.chats.send.useMutation({
    onMutate: async (input) => {
      const queryInput = { roomId: input.roomId, limit: 100 };
      await utils.chats.messages.cancel(queryInput);

      const temporaryId = -Date.now();
      const optimisticMessage = createOptimisticMessage(
        input.roomId,
        user?.id ?? 0,
        temporaryId,
        input.content,
        input.imageUrl,
      );

      utils.chats.messages.setData(queryInput, (current) => [
        ...(current ?? []),
        optimisticMessage,
      ]);

      return { queryInput, temporaryId };
    },
    onSuccess: (message, _input, context) => {
      if (!context) return;

      utils.chats.messages.setData(context.queryInput, (current) => [
        ...(current ?? []).filter((item) => item.id !== context.temporaryId && item.id !== message.id),
        message,
      ]);
    },
    onError: (err, input, context) => {
      if (context) {
        utils.chats.messages.setData(context.queryInput, (current) =>
          (current ?? []).filter((item) => item.id !== context.temporaryId),
        );
      }
      if (input.content) {
        setInputText((current) => current || input.content || "");
      }
      requestAnimationFrame(() => inputRef.current?.focus());
      Alert.alert("오류", err.message);
    },
    onSettled: (_message, _error, input) => {
      utils.chats.messages.invalidate({ roomId: input.roomId, limit: 100 });
      utils.chats.list.invalidate();
    },
  });

  // 거래 완료/취소
  const updateStatusMutation = trpc.chats.updateStatus.useMutation({
    onSuccess: () => {
      utils.chats.room.invalidate({ roomId });
      Alert.alert("완료", "거래 상태가 변경되었습니다.");
    },
  });

  useEffect(() => {
    const hasUnreadIncomingMessage = messages?.some(
      (message) => message.senderId !== user?.id && !message.isRead,
    );

    if (hasUnreadIncomingMessage) {
      markReadMutation.mutate({ roomId });
    }
  }, [messages, markReadMutation, roomId, user?.id]);

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;

    // 네트워크 응답을 기다리지 않고 입력칸을 비운 뒤, 키보드 포커스를 그대로 유지한다.
    setInputText("");
    sendMutation.mutate({ roomId, content: text });
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [inputText, roomId, sendMutation]);

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

    // 갤러리에서 고른 즉시 전송하지 않고, 미리보기에서 사용자가 전송을 확정한다.
    setPendingChatImage({
      uri: asset.uri,
      base64: asset.base64,
      mimeType: asset.mimeType,
      fileName: asset.fileName,
    });
  }, []);

  const handleSendPendingImage = useCallback(async () => {
    if (!pendingChatImage || isSending) return;

    try {
      setIsSending(true);
      const uploadResult = await uploadImageMutation.mutateAsync({
        base64: pendingChatImage.base64,
        mimeType: pendingChatImage.mimeType ?? "image/jpeg",
        fileName: pendingChatImage.fileName ?? "photo.jpg",
      });
      sendMutation.mutate({ roomId, imageUrl: uploadResult.url });
      setPendingChatImage(null);
    } catch {
      // 업로드 실패 시 로컬 URI로 전송 (오프라인 폴백)
      sendMutation.mutate({ roomId, imageUrl: pendingChatImage.uri });
      setPendingChatImage(null);
    } finally {
      setIsSending(false);
    }
  }, [isSending, pendingChatImage, roomId, sendMutation, uploadImageMutation]);

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
    <ScreenContainer edges={["top", "left", "right"]} className="bg-background">
      {/* 헤더 - 고급스러운 디자인 */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </Pressable>

        <View style={{ flex: 1, marginHorizontal: 14 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, letterSpacing: 0.5 }} numberOfLines={1}>
            {room?.otherUser?.name ?? "채팅"}
            {room?.otherUser?.isVerified && (
              <Text style={{ fontSize: 12, color: colors.primary }}> ✓</Text>
            )}
          </Text>
          {room?.product && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
              <LucideIcon name="package" size={10} color={colors.muted} strokeWidth={1.8} />
              <Text style={{ fontSize: 11, color: colors.muted }} numberOfLines={1}>
                {room.product.title}
              </Text>
            </View>
          )}
        </View>

        {/* 신고하기 */}
        {room?.otherUser?.id && (
          <Pressable
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, marginRight: 8 }]}
            onPress={() => {
              Alert.alert("채팅방 옵션", undefined, [
                {
                  text: `${room.otherUser?.name ?? "상대방"} 신고하기`,
                  style: "destructive",
                  onPress: () => router.push(`/report?targetType=user&targetId=${room.otherUser?.id}` as any),
                },
                { text: "취소", style: "cancel" },
              ]);
            }}
          >
            <IconSymbol name="ellipsis" size={22} color={colors.foreground} />
          </Pressable>
        )}

                {/* 거래 관리 버튼 - 판매자만 거래완료/취소를 결정할 수 있음 */}
        {room?.status === "active" && room?.myRole === "seller" && (

          <Pressable
            style={({ pressed }) => [styles.tradeBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
            onPress={handleTradeAction}
          >
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#000000" }}>거래관리</Text>
          </Pressable>
        )}

        {room?.status === "completed" && (
          <View style={[styles.tradeBtn, { backgroundColor: colors.primary + "12", borderWidth: 1, borderColor: colors.primary, flexDirection: "row", alignItems: "center", gap: 4 }]}>
            <LucideIcon name="check" size={12} color={colors.primary} strokeWidth={2} />
            <Text style={{ fontSize: 12, fontWeight: "700", color: colors.primary }}>거래완료</Text>
          </View>
        )}
        {/* 구매자 후기 작성 버튼 */}
        {room?.status === "completed" && room?.myRole === "buyer" && (
          <Pressable
            style={({ pressed }) => [styles.tradeBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
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
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <LucideIcon name="star" size={12} color="#0E0E10" strokeWidth={2} />
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#000000" }}>후기작성</Text>
            </View>
          </Pressable>
        )}
        {room?.status === "cancelled" && (
          <View style={[styles.tradeBtn, { backgroundColor: colors.muted + "20", borderWidth: 1, borderColor: colors.muted }]}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: colors.muted }}>거래취소</Text>
          </View>
        )}
      </View>

      {/* 연결 상품 카드 - 고급스럽게 개편 */}
      {room?.product && (
        <View style={[styles.productCard, { backgroundColor: colors.surface, borderColor: colors.primary, borderWidth: 1.5 }]}>
          {room.product.mainImageUrl ? (
            <Image source={{ uri: room.product.mainImageUrl }} style={styles.productImg} />
          ) : (
            <View style={[styles.productImg, { backgroundColor: colors.border, justifyContent: "center", alignItems: "center" }]}>
              <LucideIcon name="package" size={18} color={colors.muted} strokeWidth={1.5} />
            </View>
          )}
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.foreground }} numberOfLines={1}>
              {room.product.title}
            </Text>
            <Text style={{ fontSize: 14, color: colors.primary, fontWeight: "800", marginTop: 4 }}>
              {room.product.price?.toLocaleString()}원
            </Text>
          </View>
          <View style={[styles.statusBadge, {
            backgroundColor: room.product.status === "sold" ? colors.muted + "20" : colors.primary + "20",
            borderWidth: 1,
            borderColor: room.product.status === "sold" ? colors.muted : colors.primary,
          }]}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: room.product.status === "sold" ? colors.muted : colors.primary }}>
              {room.product.status === "selling" ? "판매중" : room.product.status === "reserved" ? "예약중" : "판매완료"}
            </Text>
          </View>
        </View>
      )}

      {/* 메시지 목록 */}
      <ChatInputLayout>

        <FlatList
          // 목록이 남은 화면 높이를 모두 차지해야 입력창이 키보드 바로 위에 고정된다.
          style={styles.messageList}
          data={displayMessages}
          inverted
          keyExtractor={(item) => item.id.toString()}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 0,
          }}
          contentContainerStyle={{ padding: 16, paddingTop: 8 }}
          ListEmptyComponent={
            <View style={{ flex: 1, alignItems: "center", paddingTop: 60 }}>
              <LucideIcon name="message-circle" size={32} color={colors.muted} strokeWidth={1.5} />
              <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", fontWeight: "500", marginTop: 10 }}>
                {room?.otherUser?.name ?? "상대방"}님과의 대화를{"\n"}시작해보세요.
              </Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const isMine = item.senderId === myId;
            const olderMessage = displayMessages[index + 1];
            const showDate = !olderMessage || !isSameDay(olderMessage.createdAt, item.createdAt);

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
                    <View style={[styles.avatar, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
                      {room?.otherUser?.profileImageUrl ? (
                        <Image source={{ uri: room.otherUser.profileImageUrl }} style={styles.avatarImg} />
                      ) : (
                        <IconSymbol name="person.fill" size={16} color={colors.muted} />
                      )}
                    </View>
                  )}

                  <View style={[styles.msgContent, isMine ? styles.msgContentMine : styles.msgContentOther, { backgroundColor: isMine ? colors.primary : colors.surface, borderColor: isMine ? colors.primary : colors.border, borderWidth: 1 }]}>
                    {/* 이미지 메시지 */}
                    {item.imageUrl ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="채팅 사진 전체 화면으로 보기"
                        style={({ pressed }) => [styles.chatImageButton, { opacity: pressed ? 0.82 : 1 }]}
                        onPress={() => setFullscreenChatImage(item.imageUrl)}
                      >
                        <Image
                          source={{ uri: item.imageUrl }}
                          style={styles.msgImage}
                          resizeMode="cover"
                        />
                      </Pressable>
                    ) : (
                      <Text style={[
                        styles.msgText,
                        { color: isMine ? "#000000" : colors.foreground, fontWeight: "500" }
                      ]}>
                        {item.content}
                      </Text>
                    )}
                  </View>

                  {/* 시간 + 읽음 표시 */}
                  <View style={[styles.msgMeta, isMine ? styles.msgMetaMine : styles.msgMetaOther]}>
                    {isMine && !item.isRead && (
                      <Text style={{ fontSize: 10, color: colors.primary, fontWeight: "700" }}>1</Text>
                    )}
                    <Text style={{ fontSize: 10, color: colors.muted, fontWeight: "500" }}>
                      {formatTime(item.createdAt)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          }}
        />

        {/* 입력창 */}
        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              // 키보드가 열린 iPhone에서는 안전 여백을 빼서 전송칸 하단을 키보드에 바로 붙인다.
              paddingBottom: Platform.OS === "ios" && isKeyboardOpen ? 0 : insets.bottom,
            },
          ]}
        >
          {/* 이미지 버튼 */}
          <Pressable
            style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }]}
            onPress={handleImagePick}
            disabled={isSending}
          >
            <IconSymbol name="photo" size={22} color={colors.primary} />
          </Pressable>

          {/* 텍스트 입력 */}
          <TextInput
            ref={inputRef}
            style={[styles.textInput, {
              backgroundColor: colors.surface,
              color: colors.foreground,
              borderColor: colors.border,
              borderWidth: 1,
            }]}
            placeholder="메시지를 입력하세요"
            placeholderTextColor={colors.muted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            blurOnSubmit={false}
            maxLength={1000}
            returnKeyType="default"
          />

          {/* 전송 버튼 */}
          <Pressable
            style={({ pressed }) => [
              styles.sendBtn,
              {
                backgroundColor: colors.primary,
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.95 : 1 }],
              },
            ]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <IconSymbol name="paperplane.fill" size={18} color="#000000" />
          </Pressable>
        </View>
      </ChatInputLayout>

      <Modal
        visible={fullscreenChatImage !== null}
        animationType="fade"
        transparent={false}
        onRequestClose={() => setFullscreenChatImage(null)}
        statusBarTranslucent
      >
        <View style={styles.fullscreenPhotoViewer}>
          <View style={[styles.fullscreenPhotoHeader, { paddingTop: Math.max(insets.top, 18) }]}>
            <Text style={styles.fullscreenPhotoTitle}>사진 전체 보기</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="사진 전체 보기 닫기"
              style={({ pressed }) => [styles.fullscreenCloseButton, { opacity: pressed ? 0.65 : 1 }]}
              onPress={() => setFullscreenChatImage(null)}
            >
              <LucideIcon name="x" size={26} color="#FFFFFF" strokeWidth={2} />
            </Pressable>
          </View>
          {fullscreenChatImage ? (
            <Image source={{ uri: fullscreenChatImage }} style={styles.fullscreenChatImage} resizeMode="contain" />
          ) : null}
        </View>
      </Modal>

      <Modal
        visible={pendingChatImage !== null}
        animationType="fade"
        transparent
        onRequestClose={() => !isSending && setPendingChatImage(null)}
      >
        <View style={[styles.imagePreviewOverlay, { paddingTop: Math.max(insets.top, 24), paddingBottom: Math.max(insets.bottom, 24) }]}>
          <View style={[styles.imagePreviewCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.imagePreviewTitle, { color: colors.foreground }]}>선택한 사진</Text>
            <Text style={[styles.imagePreviewDescription, { color: colors.muted }]}>확인 후 사진 보내기를 누르면 전송됩니다.</Text>
            {pendingChatImage ? (
              <Image source={{ uri: pendingChatImage.uri }} style={styles.imagePreview} resizeMode="contain" />
            ) : null}
            <View style={styles.imagePreviewActions}>
              <Pressable
                style={({ pressed }) => [styles.imagePreviewCancelButton, { borderColor: colors.border, opacity: pressed || isSending ? 0.6 : 1 }]}
                onPress={() => setPendingChatImage(null)}
                disabled={isSending}
              >
                <Text style={[styles.imagePreviewCancelText, { color: colors.foreground }]}>취소</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.imagePreviewSendButton, { backgroundColor: colors.primary, opacity: pressed || isSending ? 0.78 : 1 }]}
                onPress={handleSendPendingImage}
                disabled={isSending}
              >
                {isSending ? (
                  <ActivityIndicator color="#000000" size="small" />
                ) : (
                  <Text style={styles.imagePreviewSendText}>사진 보내기</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  messageList: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    marginRight: 8,
  },
  tradeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginLeft: 8,
  },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    margin: 12,
    padding: 12,
    borderRadius: 14,
  },
  productImg: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
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
    fontWeight: "600",
    marginHorizontal: 8,
    paddingHorizontal: 4,
  },
  msgRow: {
    flexDirection: "row",
    marginVertical: 4,
    alignItems: "flex-end",
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
    borderRadius: 10,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImg: {
    width: 32,
    height: 32,
    borderRadius: 10,
  },
  msgContent: {
    maxWidth: "70%",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  msgContentMine: {
    borderBottomRightRadius: 4,
  },
  msgContentOther: {
    borderBottomLeftRadius: 4,
  },
  msgText: {
    fontSize: 14,
    lineHeight: 20,
  },
  msgImage: {
    width: 180,
    height: 180,
    borderRadius: 10,
  },
  chatImageButton: {
    borderRadius: 10,
    overflow: "hidden",
  },
  msgMeta: {
    marginHorizontal: 6,
    alignItems: "center",
    gap: 2,
  },
  msgMetaMine: {
    flexDirection: "row-reverse",
  },
  msgMetaOther: {
    flexDirection: "row",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  iconBtn: {
    padding: 8,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    maxHeight: 100,
    fontSize: 14,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenPhotoViewer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  fullscreenPhotoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 10,
  },
  fullscreenPhotoTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  fullscreenCloseButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  fullscreenChatImage: {
    flex: 1,
    width: "100%",
  },
  imagePreviewOverlay: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.68)",
  },
  imagePreviewCard: {
    maxHeight: "100%",
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  imagePreviewTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  imagePreviewDescription: {
    fontSize: 13,
    marginTop: 6,
    marginBottom: 16,
  },
  imagePreview: {
    width: "100%",
    height: 340,
    borderRadius: 12,
    backgroundColor: "#000000",
  },
  imagePreviewActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  imagePreviewCancelButton: {
    flex: 1,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 12,
  },
  imagePreviewCancelText: {
    fontSize: 15,
    fontWeight: "700",
  },
  imagePreviewSendButton: {
    flex: 1.25,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  imagePreviewSendText: {
    color: "#000000",
    fontSize: 15,
    fontWeight: "800",
  },
});
