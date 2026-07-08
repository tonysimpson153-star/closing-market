const EXPO_PUSH_API = "https://exp.host/--/api/v2/push/send";

/**
 * 채팅 메시지 도착 시 상대방에게 푸시 알림 전송
 */
export async function sendChatPushNotification(
  recipientPushToken: string,
  senderName: string,
  messagePreview: string,
  chatRoomId: number
) {
  if (!recipientPushToken) {
    console.log("푸시 토큰이 없습니다.");
    return false;
  }

  try {
    // Expo 푸시 알림 API 호출
    const response = await fetch(EXPO_PUSH_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: recipientPushToken,
        sound: "default",
        title: `💬 ${senderName}`,
        body: messagePreview.substring(0, 100),
        data: {
          chatRoomId: chatRoomId.toString(),
          type: "chat_message",
        },
        badge: 1,
        priority: "high",
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Expo 푸시 API 오류:", error);
      return false;
    }

    console.log(`푸시 알림 전송 성공: ${senderName}`);
    return true;
  } catch (error) {
    console.error("푸시 알림 전송 실패:", error);
    return false;
  }
}

/**
 * 여러 사용자에게 일괄 푸시 알림 전송 (관리자 공지 등)
 */
export async function sendBulkPushNotification(
  pushTokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
) {
  if (pushTokens.length === 0) {
    console.log("푸시 토큰이 없습니다.");
    return 0;
  }

  try {
    // Expo 푸시 알림 API 호출 (배치)
    const response = await fetch(EXPO_PUSH_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: pushTokens,
        sound: "default",
        title,
        body,
        data: data || {},
        priority: "high",
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Expo 푸시 API 오류:", error);
      return 0;
    }

    console.log(`${pushTokens.length}명에게 푸시 알림 전송 완료`);
    return pushTokens.length;
  } catch (error) {
    console.error("일괄 푸시 알림 전송 실패:", error);
    return 0;
  }
}
