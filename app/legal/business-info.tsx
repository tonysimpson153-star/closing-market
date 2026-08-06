import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function BusinessInfoScreen() {
  const colors = useColors();
  const router = useRouter();

  const content = `클로징마켓 사업자 정보

상호명: 클로징마켓
대표자명: 김찬영
사업자등록번호: 347-70-00504
통신판매업 신고번호: 신고 예정
사업장 소재지: [사업자등록증 상 주소로 채워주세요]
전화번호: [고객센터 연락처]
이메일: closingmarket.help@gmail.com
개인정보보호책임자: 김찬영

본 서비스는 통신판매중개자로서, 회원 간 거래에 대한 직접적인 책임을 지지 않습니다.`;

  return (
    <ScreenContainer>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: colors.border }}>
        <Pressable
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginLeft: 12 }}>사업자 정보</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <Text style={{ fontSize: 14, lineHeight: 22, color: colors.foreground, whiteSpace: "pre-wrap" }}>{content}</Text>
      </ScrollView>
    </ScreenContainer>
  );
}
