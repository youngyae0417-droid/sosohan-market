import { describe, it, expect } from 'vitest';
import { DEFAULT_TEMPLATES, renderTemplate, smsByteLength, messageType } from './template';
import { NOTICE_KINDS } from './types';

describe('DEFAULT_TEMPLATES', () => {
  it('공지 5종 모두에 기본 문구가 있다', () => {
    for (const kind of NOTICE_KINDS) {
      expect(DEFAULT_TEMPLATES[kind]).toBeTruthy();
    }
  });

  it('모든 기본 문구가 이름과 링크를 쓴다', () => {
    for (const kind of NOTICE_KINDS) {
      expect(DEFAULT_TEMPLATES[kind]).toContain('{이름}');
      expect(DEFAULT_TEMPLATES[kind]).toContain('{링크}');
    }
  });

  it('금지어를 쓰지 않는다', () => {
    for (const kind of NOTICE_KINDS) {
      expect(DEFAULT_TEMPLATES[kind]).not.toMatch(/참가자|어드민/);
    }
  });
});

describe('renderTemplate', () => {
  it('이름과 링크를 치환한다', () => {
    const out = renderTemplate('{이름}님, 안내드립니다. {링크}', {
      이름: '김하늘',
      링크: 'https://example.com/m/abc',
    });
    expect(out).toBe('김하늘님, 안내드립니다. https://example.com/m/abc');
  });

  it('같은 변수가 여러 번 나와도 모두 치환한다', () => {
    const out = renderTemplate('{이름} {이름}', { 이름: '김하늘', 링크: '' });
    expect(out).toBe('김하늘 김하늘');
  });

  it('알 수 없는 중괄호는 그대로 둔다', () => {
    const out = renderTemplate('{이름} {부스번호}', { 이름: '김하늘', 링크: '' });
    expect(out).toBe('김하늘 {부스번호}');
  });

  it('이름에 $ 패턴이 있어도 그대로 넣는다', () => {
    expect(renderTemplate('{이름}님', { 이름: '$&', 링크: '' })).toBe('$&님');
    expect(renderTemplate('{이름}님', { 이름: "$'", 링크: '' })).toBe("$'님");
    expect(renderTemplate('{이름}님', { 이름: '$$', 링크: '' })).toBe('$$님');
  });

  it('이름에 다른 변수 이름이 들어 있어도 다시 치환하지 않는다', () => {
    expect(renderTemplate('{이름}', { 이름: '{링크}x', 링크: 'URL' })).toBe('{링크}x');
  });

  it('링크에 $ 패턴이 있어도 그대로 넣는다', () => {
    expect(renderTemplate('{링크}', { 이름: '', 링크: 'https://a.b/?x=$&y' })).toBe(
      'https://a.b/?x=$&y',
    );
  });
});

describe('smsByteLength', () => {
  it('영문과 숫자는 1바이트로 센다', () => {
    expect(smsByteLength('abc123')).toBe(6);
  });

  it('한글은 2바이트로 센다', () => {
    expect(smsByteLength('가나다')).toBe(6);
  });

  it('섞인 문자열을 더한다', () => {
    expect(smsByteLength('가나다abc')).toBe(9);
  });

  it('빈 문자열은 0이다', () => {
    expect(smsByteLength('')).toBe(0);
  });
});

describe('messageType', () => {
  it('한글 45자는 SMS다', () => {
    expect(messageType('가'.repeat(45))).toBe('SMS');
  });

  it('한글 46자는 LMS다', () => {
    expect(messageType('가'.repeat(46))).toBe('LMS');
  });

  it('영문 90자는 SMS, 91자는 LMS다', () => {
    expect(messageType('a'.repeat(90))).toBe('SMS');
    expect(messageType('a'.repeat(91))).toBe('LMS');
  });
});
