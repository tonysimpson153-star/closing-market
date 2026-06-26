import * as Notifications from "expo-notifications";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

// 로컬 알림 설정
export async function setupLocalNotifications() {
  // Android: 채널 생성
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("chat-messages", {
      name: "Chat Messages",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#3B82F6",
      sound: "default",
      enableVibrate: true,
    });
  }

  // iOS: 권한 요청
  if (Platform.OS === "ios") {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      console.warn("알림 권한이 거부되었습니다.");
    }
  }
}

// 채팅 메시지 로컬 알림 발송
export async function sendChatNotification(
  senderName: string,
  messagePreview: string,
  roomId: number
) {
  try {
    // 진동 + 사운드
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // 로컬 알림 발송
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `💬 ${senderName}`,
        body: messagePreview.substring(0, 100),
        data: { roomId: roomId.toString(), type: "chat_message" },
        sound: "default",
        badge: 1,
      },
      trigger: null, // 즉시 발송
    });
  } catch (error) {
    console.error("로컬 알림 발송 실패:", error);
  }
}

// 기기 토큰 가져오기 (FCM용)
export async function getDeviceToken(): Promise<string | null> {
  try {
    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch (error) {
    console.error("기기 토큰 조회 실패:", error);
    return null;
  }
}

// 푸시 알림 핸들러 설정
export function setupPushNotificationHandlers(onNotification: (notification: Notifications.Notification) => void) {
  // 포그라운드 알림 처리
  const subscription = Notifications.addNotificationReceivedListener((notification) => {
    onNotification(notification);
  });

  // 알림 클릭 처리
  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    if (data.type === "chat_message" && data.roomId) {
      // 채팅방으로 이동 (라우터 필요)
      console.log("채팅방으로 이동:", data.roomId);
    }
  });

  return () => {
    subscription.remove();
    responseSubscription.remove();
  };
}
