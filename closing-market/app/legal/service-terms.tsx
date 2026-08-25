import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function ServiceTermsScreen() {
  const colors = useColors();
  const router = useRouter();

  const content = `클로징마켓 서비스 이용약관

제1조 (목적)
이 약관은 클로징마켓(이하 "회사")이 제공하는 서비스의 이용조건 및 절차, 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (정의)
1. "서비스"란 회사가 제공하는 사업장 물품 거래 및 전문 업체 연결 플랫폼을 말합니다.
2. "회원"이란 본 약관에 동의하고 서비스를 이용하는 자를 말합니다.
3. "판매회원"이란 사업자등록증 심사를 거쳐 상품을 등록할 수 있는 회원을 말합니다.
4. "업체회원"이란 사업자등록증 심사를 거쳐 전문 서비스를 등록할 수 있는 회원을 말합니다.

제3조 (약관의 효력 및 변경)
1. 본 약관은 서비스 화면에 게시함으로써 효력이 발생합니다.
2. 회사는 필요한 경우 관련 법령을 위반하지 않는 범위 내에서 약관을 변경할 수 있으며, 변경 시 사전 공지합니다.

제4조 (회원가입)
1. 이용자는 회사가 정한 절차에 따라 회원가입을 신청합니다.
2. 회사는 다음 각 호에 해당하는 경우 가입을 거절할 수 있습니다.
   - 허위 정보로 가입 신청한 경우
   - 이미 가입된 회원과 동일한 정보로 재가입하는 경우

제5조 (서비스의 제공)
회사는 다음과 같은 서비스를 제공합니다.
1. 사업장 물품 거래 중개 서비스
2. 전문 업체(철거, 인테리어, 폐기물처리 등) 연결 서비스
3. 회원 간 채팅 및 후기 서비스

제6조 (회원의 의무)
1. 회원은 허위 정보를 등록해서는 안 됩니다.
2. 회원은 타인의 권리를 침해하는 게시물을 등록해서는 안 됩니다.
3. 회원은 불법 물품을 거래해서는 안 됩니다.

제7조 (거래의 당사자)
회사는 회원 간 거래를 중개하는 통신판매중개자이며, 거래 당사자가 아닙니다. 거래로 인해 발생하는 분쟁에 대한 책임은 거래 당사자에게 있습니다.

제8조 (계약해지 및 이용제한)
회사는 회원이 본 약관을 위반한 경우 사전 통보 후 서비스 이용을 제한할 수 있습니다.

제9조 (면책조항)
회사는 천재지변, 회원의 귀책사유 등으로 인한 서비스 중단에 대해 책임을 지지 않습니다.

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
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginLeft: 12 }}>이용약관</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <Text style={{ fontSize: 14, lineHeight: 22, color: colors.foreground, whiteSpace: "pre-wrap" }}>{content}</Text>
      </ScrollView>
    </ScreenContainer>
  );
}
