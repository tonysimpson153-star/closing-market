/** @type {const} */
const themeColors = {
  // 골드 포인트 컬러 (프리미엄 느낌)
  primary: { light: '#D4AF37', dark: '#D4AF37' },
  // 배경 - 다크 차콜
  background: { light: '#ffffff', dark: '#121212' },
  // 카드 배경 - 조금 밝은 다크 그레이
  surface: { light: '#F5F5F5', dark: '#1E1E1E' },
  // 텍스트 - 화이트 (다크 모드)
  foreground: { light: '#1A1A1A', dark: '#FFFFFF' },
  // 보조 텍스트 - 밝은 그레이
  muted: { light: '#687076', dark: '#B0B0B0' },
  // 테두리 - 어두운 그레이
  border: { light: '#E5E7EB', dark: '#2A2A2A' },
  // 성공 상태
  success: { light: '#22C55E', dark: '#4ADE80' },
  // 경고 상태
  warning: { light: '#F5A623', dark: '#FBBF24' },
  // 에러 상태
  error: { light: '#EF4444', dark: '#F87171' },
};

module.exports = { themeColors };
