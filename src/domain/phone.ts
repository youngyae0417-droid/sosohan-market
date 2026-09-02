export type PhoneErrorReason = '빈값' | '숫자없음' | '휴대폰번호아님' | '자릿수오류';

export type PhoneResult =
  | { ok: true; phone: string }
  | { ok: false; reason: PhoneErrorReason };

/**
 * 전화번호를 `01012345678` 형태로 정규화한다.
 * 솔라피는 특수문자가 섞인 번호를 거부하므로 발송·저장 전에 반드시 통과시켜야 한다.
 */
export function normalizePhone(raw: string): PhoneResult {
  const trimmed = (raw ?? '').trim();
  if (trimmed === '') return { ok: false, reason: '빈값' };

  const digits = trimmed.replace(/\D/g, '');
  if (digits === '') return { ok: false, reason: '숫자없음' };

  let local = digits;

  // 국가번호: +82 10... → 010..., +82 010... → 010...
  // 국가번호 뒤에 국내 0이 남아 있는 표기도 흔하므로 둘 다 받는다.
  if (local.startsWith('820')) local = local.slice(2);
  else if (local.startsWith('82')) local = '0' + local.slice(2);

  // 엑셀이 전화번호를 숫자로 해석하면 앞자리 0이 사라진다: 1012345678 → 01012345678
  if (local.length === 10 && local.startsWith('10')) local = '0' + local;

  if (!local.startsWith('010')) return { ok: false, reason: '휴대폰번호아님' };
  if (local.length !== 11) return { ok: false, reason: '자릿수오류' };

  return { ok: true, phone: local };
}

export function formatPhone(phone: string): string {
  return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
}
