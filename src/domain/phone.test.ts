import { describe, it, expect } from 'vitest';
import { normalizePhone, formatPhone } from './phone';

describe('normalizePhone', () => {
  it('하이픈을 제거한다', () => {
    expect(normalizePhone('010-1234-5678')).toEqual({ ok: true, phone: '01012345678' });
  });

  it('공백과 점을 제거한다', () => {
    expect(normalizePhone(' 010 1234 5678 ')).toEqual({ ok: true, phone: '01012345678' });
    expect(normalizePhone('010.1234.5678')).toEqual({ ok: true, phone: '01012345678' });
  });

  it('이미 정규화된 번호는 그대로 통과한다', () => {
    expect(normalizePhone('01012345678')).toEqual({ ok: true, phone: '01012345678' });
  });

  it('엑셀이 앞자리 0을 지운 10자리 번호를 복원한다', () => {
    expect(normalizePhone('1012345678')).toEqual({ ok: true, phone: '01012345678' });
  });

  it('엑셀이 숫자로 바꾼 값도 복원한다', () => {
    expect(normalizePhone(String(1012345678))).toEqual({ ok: true, phone: '01012345678' });
  });

  it('국가번호 +82를 국내 형식으로 바꾼다', () => {
    expect(normalizePhone('+82 10-1234-5678')).toEqual({ ok: true, phone: '01012345678' });
    expect(normalizePhone('821012345678')).toEqual({ ok: true, phone: '01012345678' });
  });

  it('국가번호 뒤에 국내 0이 남아 있어도 받는다', () => {
    expect(normalizePhone('+82 010-1234-5678')).toEqual({ ok: true, phone: '01012345678' });
    expect(normalizePhone('8201012345678')).toEqual({ ok: true, phone: '01012345678' });
  });

  it('빈 문자열을 거부한다', () => {
    expect(normalizePhone('')).toEqual({ ok: false, reason: '빈값' });
    expect(normalizePhone('   ')).toEqual({ ok: false, reason: '빈값' });
  });

  it('숫자가 없는 값을 거부한다', () => {
    expect(normalizePhone('없음')).toEqual({ ok: false, reason: '숫자없음' });
  });

  it('휴대폰 번호가 아닌 것을 거부한다', () => {
    expect(normalizePhone('02-123-4567')).toEqual({ ok: false, reason: '휴대폰번호아님' });
  });

  it('자릿수가 틀린 번호를 거부한다', () => {
    expect(normalizePhone('010-1234-567')).toEqual({ ok: false, reason: '자릿수오류' });
    expect(normalizePhone('010-1234-56789')).toEqual({ ok: false, reason: '자릿수오류' });
  });
});

describe('formatPhone', () => {
  it('화면 표시용으로 하이픈을 넣는다', () => {
    expect(formatPhone('01012345678')).toBe('010-1234-5678');
  });
});
