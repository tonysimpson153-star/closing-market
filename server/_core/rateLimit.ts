// 간단한 메모리 기반 Rate Limiter
// (서버가 재시작되면 초기화되지만, 단일 인스턴스 무료 배포 환경에서는
//  브루트포스/스팸 방어 목적으로 충분합니다.)

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// 오래된 항목 주기적으로 정리 (메모리 누수 방지)
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}, 5 * 60 * 1000).unref?.();

/**
 * key 기준으로 windowMs 시간 동안 maxAttempts 횟수를 넘었는지 확인합니다.
 * 넘었으면 false(거부), 안 넘었으면 true(허용)를 반환하고 카운트를 1 증가시킵니다.
 */
export function checkRateLimit(key: string, maxAttempts: number, windowMs: number): boolean {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (existing.count >= maxAttempts) {
    return false;
  }

  existing.count += 1;
  return true;
}
