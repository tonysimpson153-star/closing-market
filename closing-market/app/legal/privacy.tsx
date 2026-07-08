import { ScrollView, Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

function Section({ title, children, colors }: { title: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={{ marginBottom: 22 }}>
      <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>{title}</Text>
      <Text style={{ fontSize: 13.5, color: colors.muted, lineHeight: 21 }}>{children}</Text>
    </View>
  );
}

export default function PrivacyPolicyScreen() {
  const colors = useColors();
  const router = useRouter();

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, marginRight: 12 }]} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: "600", color: colors.foreground }}>개인정보처리방침</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 20 }}>
          시행일자: 2026년 7월 4일{"\n"}
          클로징마켓(이하 "회사")은 이용자의 개인정보를 중요시하며, 「개인정보 보호법」 등 관련 법령을 준수합니다.
          본 개인정보처리방침은 회사가 운영하는 클로징마켓 앱(이하 "서비스")에 적용됩니다.
        </Text>

        <Section title="1. 수집하는 개인정보 항목" colors={colors}>
          가. 일반 회원가입 시 (필수){"\n"}
          - 이메일, 비밀번호(암호화 저장), 이름{"\n\n"}
          나. 카카오 로그인 시{"\n"}
          - 카카오 계정 식별정보, 이름, 프로필 사진(카카오 제공 동의 항목에 한함){"\n\n"}
          다. 선택 입력 항목{"\n"}
          - 휴대폰 번호, 프로필 사진{"\n\n"}
          라. 판매회원(개인/사업자) 인증 신청 시{"\n"}
          - 사업자등록번호, 상호명, 대표자명, 사업자등록증 사본 이미지, 사업장 사진{"\n\n"}
          마. 업체회원 인증 신청 시{"\n"}
          - 업체명, 대표자명, 업체 연락처, 사업장 주소, 업체 소개, 업체 대표 사진 및 소개 사진,
          사업자등록번호(선택){"\n\n"}
          바. 서비스 이용 과정에서 자동으로 생성·수집되는 정보{"\n"}
          - 등록 상품 정보 및 사진, 채팅 메시지 및 첨부 이미지, 찜·최근 본 상품 이용기록, 거래 후기,
          신고 및 1:1 문의 내용, 접속 로그, 기기 푸시 알림 토큰
        </Section>

        <Section title="2. 개인정보의 수집 및 이용 목적" colors={colors}>
          - 회원 가입 의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증{"\n"}
          - 판매회원·업체회원의 실제 사업자 여부 확인 및 부정 이용 방지{"\n"}
          - 중고 물품 거래 중개, 채팅·알림 등 서비스 제공{"\n"}
          - 거래 후기, 신고, 1:1 문의 접수 및 처리{"\n"}
          - 공지사항 전달 및 고객 상담{"\n"}
          - 서비스 부정 이용 방지 및 이용자 보호
        </Section>

        <Section title="3. 개인정보의 보유 및 이용 기간" colors={colors}>
          회사는 원칙적으로 개인정보 수집·이용 목적이 달성된 후 또는 회원 탈퇴 시 해당 정보를 지체 없이
          파기합니다. 다만, 아래의 정보는 명시한 사유로 명시한 기간 동안 보존합니다.{"\n\n"}
          - 관계 법령 위반에 따른 수사·조사 등이 진행 중인 경우: 해당 절차 종료 시까지{"\n"}
          - 서비스 이용 관련 분쟁 해결을 위해 필요한 경우: 분쟁 해결 시까지{"\n\n"}
          탈퇴 회원의 채팅 내역, 거래 후기 등 다른 이용자와 연결된 기록은 거래 신뢰도 유지를 위해
          보존될 수 있으나, 탈퇴 회원 본인을 식별할 수 있는 이름·이메일·전화번호 등은 즉시 익명화 처리됩니다.
        </Section>

        <Section title="4. 개인정보의 제3자 제공" colors={colors}>
          회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만 아래의 경우에는 예외로 합니다.{"\n\n"}
          - 이용자가 사전에 동의한 경우{"\n"}
          - 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우
        </Section>

        <Section title="5. 개인정보 처리업무의 위탁" colors={colors}>
          회사는 원활한 서비스 제공을 위해 아래와 같이 개인정보 처리업무를 위탁하고 있습니다.{"\n\n"}
          - 소셜 로그인 인증: 카카오{"\n"}
          - 클라우드 서버 및 데이터 저장: 클라우드 인프라 제공업체{"\n"}
          - 푸시 알림 발송: Expo(Expo Push Notification Service){"\n\n"}
          회사는 위탁계약 체결 시 개인정보 보호법 등 관련 법령에 따라 위탁업무 수행 목적 외 개인정보의
          처리 금지, 기술적·관리적 보호조치 등을 계약서 등 문서에 명시하고 있습니다.
        </Section>

        <Section title="6. 이용자의 권리와 행사 방법" colors={colors}>
          이용자는 언제든지 등록되어 있는 본인의 개인정보를 조회하거나 수정할 수 있으며, 아래 방법을 통해
          권리를 행사할 수 있습니다.{"\n\n"}
          - 마이페이지 &gt; 계정 설정에서 이름, 전화번호, 프로필 사진 등을 직접 수정{"\n"}
          - 마이페이지 &gt; 계정 설정 &gt; 회원 탈퇴를 통한 개인정보 삭제 요청{"\n"}
          - 마이페이지 &gt; 고객센터 문의를 통한 열람·정정·삭제·처리정지 요구{"\n\n"}
          회원 탈퇴 시 개인 식별 정보(이름, 이메일, 전화번호, 비밀번호, 프로필 사진 등)는 즉시 삭제·익명화되며,
          되돌릴 수 없습니다.
        </Section>

        <Section title="7. 개인정보의 파기 절차 및 방법" colors={colors}>
          회사는 개인정보 보유기간의 경과, 처리 목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이
          해당 개인정보를 파기합니다.{"\n\n"}
          - 전자적 파일 형태: 복구 및 재생이 불가능한 방법으로 영구 삭제{"\n"}
          - 종이 문서: 분쇄 또는 소각
        </Section>

        <Section title="8. 개인정보의 안전성 확보 조치" colors={colors}>
          회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.{"\n\n"}
          - 비밀번호 등 주요 정보의 암호화 저장{"\n"}
          - 개인정보에 대한 접근 권한 관리 및 통제{"\n"}
          - 해킹 등에 대비한 보안 프로그램 설치 및 갱신
        </Section>

        <Section title="9. 아동의 개인정보 보호" colors={colors}>
          본 서비스는 만 14세 이상의 이용자를 대상으로 합니다. 회사는 만 14세 미만 아동의 개인정보를
          의도적으로 수집하지 않습니다.
        </Section>

        <Section title="10. 개인정보 보호책임자" colors={colors}>
          회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 이용자의 불만처리 및
          피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.{"\n\n"}
          - 담당 부서: [운영팀]{"\n"}
          - 성명: [김찬영]{"\n"}
          - 이메일: [closingmarket.help@gmail.com]{"\n"}
          - 전화번호: [0507-0177-4656]{"\n\n"}
          이용자는 서비스 이용 중 발생한 모든 개인정보 관련 문의를 위 담당자 또는 마이페이지의
          "고객센터 문의"를 통해 문의하실 수 있습니다.
        </Section>

        <Section title="11. 개인정보처리방침의 변경" colors={colors}>
          이 개인정보처리방침은 법령, 정책 또는 보안 기술의 변경에 따라 내용의 추가·삭제 및 수정이 있을 시에는
          시행 최소 7일 전에 앱 내 공지사항을 통하여 고지할 것입니다.
        </Section>

        <View style={{ height: 20 }} />
      </ScrollView>
    </ScreenContainer>
  );
}
