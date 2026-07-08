/** @type {const} */
// 화이트 + 골드 라이트 테마
// 일반 사용자와 사업자 모두에게 편안하고 신뢰감 있는 밝은 톤을 위해
// light/dark 값을 동일한 팔레트로 통일했습니다.
const themeColors = {
  // 골드 포인트 컬러 (로고, 하단 네비 선택 아이콘, 주요 버튼에만 사용)
  primary: { light: '#D4AF37', dark: '#D4AF37' },
  // 배경 - 화이트
  background: { light: '#FFFFFF', dark: '#FFFFFF' },
  // 카드/패널 배경 - 배경보다 살짝 톤 다운된 화이트
  surface: { light: '#FAFAFA', dark: '#FAFAFA' },
  // 본문 텍스트 - 짙은 블랙 계열 (완전한 검정보다 부드럽게)
  foreground: { light: '#222222', dark: '#222222' },
  // 보조 텍스트 - 중간 그레이
  muted: { light: '#8A8A8A', dark: '#8A8A8A' },
  // 테두리/구분선 - 옅은 그레이
  border: { light: '#E5E5E5', dark: '#E5E5E5' },
  // 성공 상태
  success: { light: '#3FAE68', dark: '#3FAE68' },
  // 경고 상태
  warning: { light: '#D9A441', dark: '#D9A441' },
  // 에러 상태
  error: { light: '#E0554F', dark: '#E0554F' },
};

module.exports = { themeColors };
