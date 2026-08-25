import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function LocationTermsScreen() {
  const colors = useColors();
  const router = useRouter();

  const content = `클로징마켓 위치기반서비스 이용약관

1. 목적
본 약관은 클로징마켓이 제공하는 위치기반서비스 이용과 관련하여 회사와 회원의 권리, 의무 및 책임사항을 정합니다.

2. 위치정보의 수집
회사는 회원이 상품 등록 시 "현재 위치로 채우기" 기능을 직접 선택한 경우에 한하여 위치정보를 수집합니다.
위치정보는 회원의 동의 없이 자동으로 수집되지 않습니다.

3. 위치정보의 이용목적
수집된 위치정보는 상품 등록 시 거래 지역을 자동으로 표시하는 용도로만 사용됩니다.

4. 위치정보의 보유 및 이용기간
위치정보는 별도로 저장되지 않으며, 변환된 주소 텍스트만 상품 정보에 포함되어 저장됩니다.

5. 위치정보 제3자 제공
회사는 회원의 위치정보를 제3자에게 제공하지 않습니다.

6. 이용자의 권리
회원은 언제든지 폰 설정에서 위치정보 제공 동의를 철회할 수 있으며, 이 경우 위치 자동입력 기능만 제한되고 다른 서비스 이용에는 영향이 없습니다.

7. 문의처
위치기반서비스 관련 문의는 아래로 연락 주시기 바랍니다.
이메일: closingmarket.help@gmail.com

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
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginLeft: 12 }}>위치기반서비스 이용약관</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <Text style={{ fontSize: 14, lineHeight: 22, color: colors.foreground, whiteSpace: "pre-wrap" }}>{content}</Text>
      </ScrollView>
    </ScreenContainer>
  );
}
