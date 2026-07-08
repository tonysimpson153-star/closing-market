// Resend(https://resend.com)를 이용한 트랜잭션 이메일 발송 헬퍼
//
// 필요한 환경변수:
//   RESEND_API_KEY    - Resend 대시보드에서 발급받은 API 키
//   RESEND_FROM_EMAIL  - 발신자 이메일. Resend에 도메인을 인증하기 전에는
//                        기본값(onboarding@resend.dev)으로만 발송 가능(테스트용, 수신자 제한 있음)
//   WEB_APP_URL        - 비밀번호 재설정 링크가 가리킬 웹 배포 주소
//
// 추가 라이브러리 설치 없이 Resend REST API를 fetch로 직접 호출합니다.

import { ENV } from "./env";

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!ENV.resendApiKey) {
    console.error("[이메일 발송 실패] RESEND_API_KEY가 설정되지 않았습니다.");
    return { success: false, error: "이메일 발송 설정이 되어 있지 않습니다." };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: ENV.resendFromEmail,
        to: [params.to],
        subject: params.subject,
        html: params.html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[이메일 발송 실패]", res.status, errText);
      return { success: false, error: errText };
    }

    return { success: true };
  } catch (err) {
    console.error("[이메일 발송 오류]", err);
    return { success: false, error: err instanceof Error ? err.message : "알 수 없는 오류" };
  }
}

export function buildPasswordResetEmailHtml(resetUrl: string): string {
  return `
  <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
    <div style="color: #D4AF37; font-size: 20px; font-weight: 700; letter-spacing: 2px; margin-bottom: 24px;">
      클로징마켓
    </div>
    <h2 style="color: #222222; font-size: 18px; margin-bottom: 12px;">비밀번호 재설정 요청</h2>
    <p style="color: #555555; font-size: 14px; line-height: 1.6;">
      비밀번호 재설정을 요청하셨습니다. 아래 버튼을 눌러 새 비밀번호를 설정해주세요.
      이 링크는 <strong>1시간 동안만</strong> 유효합니다.
    </p>
    <div style="margin: 28px 0;">
      <a href="${resetUrl}"
         style="background: #D4AF37; color: #ffffff; text-decoration: none; padding: 14px 28px;
                border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">
        새 비밀번호 설정하기
      </a>
    </div>
    <p style="color: #999999; font-size: 12px; line-height: 1.6;">
      본인이 요청하지 않으셨다면 이 이메일을 무시하셔도 됩니다. 비밀번호는 변경되지 않습니다.
    </p>
    <p style="color: #bbbbbb; font-size: 11px; margin-top: 24px; word-break: break-all;">
      버튼이 눌리지 않는다면 아래 링크를 복사해서 브라우저에 붙여넣어주세요.<br>
      ${resetUrl}
    </p>
  </div>`;
}
