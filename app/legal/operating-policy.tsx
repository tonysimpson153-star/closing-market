import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function OperatingPolicyScreen() {
  const colors = useColors();
  const router = useRouter();

  const content = `클로징마켓 운영정책

1. 목적
본 운영정책은 클로징마켓 서비스 이용 시 회원이 지켜야 할 사항과 운영자의 관리 기준을 정합니다.

2. 회원 등급
- 일반회원: 상품 조회, 찜, 채팅 문의 가능
- 판매회원: 사업자등록증 심사를 거쳐 상품 등록 가능
- 업체회원: 사업자등록증 심사를 거쳐 전문 서비스 등록 가능

3. 게시물 관리 기준
다음의 게시물은 사전 통보 없이 삭제되거나 작성자가 이용 제한될 수 있습니다.
- 허위 매물, 과장 광고
- 타인의 권리를 침해하는 게시물
- 욕설, 비방, 혐오 표현
- 불법 물품 판매 게시물
- 개인정보를 무단으로 노출하는 게시물

4. 신고 처리
- 신고 접수 시 운영자는 내용을 확인 후 조치합니다.
- 반복 신고 대상 회원은 서비스 이용이 제한될 수 있습니다.

5. 회원 자격 정지 및 박탈
다음의 경우 회원 자격이 정지되거나 박탈될 수 있습니다.
- 허위 사업자 정보로 신청한 경우
- 타인에게 명의를 대여한 경우
- 반복적으로 신고를 받은 경우
- 본 운영정책을 위반한 경우

6. 정책 변경
본 정책은 서비스 개선을 위해 사전 공지 후 변경될 수 있습니다.

시행일: 2026년 8월 6일`;

  return (
    <ScreenContainer>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: colors.border }}>
        <Pressable
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginLeft: 12 }}>운영정책</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <Text style={{ fontSize: 14, lineHeight: 22, color: colors.foreground, whiteSpace: "pre-wrap" }}>{content}</Text>
      </ScrollView>
    </ScreenContainer>
  );
}
