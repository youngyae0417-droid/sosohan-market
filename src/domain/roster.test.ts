import { describe, it, expect } from 'vitest';
import { parsePastedRoster, parseRosterCells } from './roster';

describe('parsePastedRoster', () => {
  it('탭으로 구분된 이름과 번호를 읽는다', () => {
    const result = parsePastedRoster('김하늘\t010-1111-2222\n박서준\t010-3333-4444');
    expect(result.rows).toEqual([
      { name: '김하늘', phone: '01011112222' },
      { name: '박서준', phone: '01033334444' },
    ]);
    expect(result.issues).toEqual([]);
  });

  it('쉼표로 구분된 명단도 읽는다', () => {
    const result = parsePastedRoster('김하늘, 010-1111-2222');
    expect(result.rows).toEqual([{ name: '김하늘', phone: '01011112222' }]);
  });

  it('열 순서가 뒤바뀌어도 읽는다', () => {
    const result = parsePastedRoster('010-1111-2222\t김하늘');
    expect(result.rows).toEqual([{ name: '김하늘', phone: '01011112222' }]);
  });

  it('빈 줄을 건너뛴다', () => {
    const result = parsePastedRoster('김하늘\t010-1111-2222\n\n\n박서준\t010-3333-4444');
    expect(result.rows).toHaveLength(2);
    expect(result.issues).toEqual([]);
  });

  it('머리글 행을 건너뛴다', () => {
    const result = parsePastedRoster('이름\t연락처\n김하늘\t010-1111-2222');
    expect(result.rows).toEqual([{ name: '김하늘', phone: '01011112222' }]);
    expect(result.issues).toEqual([]);
  });

  it('번호가 없는 줄을 문제로 보고한다', () => {
    const result = parsePastedRoster('김하늘\t번호없음');
    expect(result.rows).toEqual([]);
    expect(result.issues).toEqual([
      { line: 1, raw: '김하늘\t번호없음', reason: '전화번호를 찾을 수 없음' },
    ]);
  });

  it('이름이 없는 줄을 문제로 보고한다', () => {
    const result = parsePastedRoster('010-1111-2222');
    expect(result.rows).toEqual([]);
    expect(result.issues).toEqual([
      { line: 1, raw: '010-1111-2222', reason: '이름을 찾을 수 없음' },
    ]);
  });

  it('같은 번호가 두 번 나오면 첫 줄만 남기고 보고한다', () => {
    const result = parsePastedRoster('김하늘\t010-1111-2222\n김하늘(중복)\t010-1111-2222');
    expect(result.rows).toEqual([{ name: '김하늘', phone: '01011112222' }]);
    expect(result.issues).toEqual([
      { line: 2, raw: '김하늘(중복)\t010-1111-2222', reason: '이미 있는 전화번호 (010-1111-2222)' },
    ]);
  });

  it('줄 번호는 원본 기준으로 센다', () => {
    const result = parsePastedRoster('김하늘\t010-1111-2222\n박서준\t틀림');
    expect(result.issues[0].line).toBe(2);
  });
});

describe('parseRosterCells', () => {
  it('엑셀 셀 배열을 읽는다', () => {
    const result = parseRosterCells([
      ['이름', '연락처'],
      ['김하늘', '010-1111-2222'],
      ['박서준', 1033334444 as unknown as string],
    ]);
    expect(result.rows).toEqual([
      { name: '김하늘', phone: '01011112222' },
      { name: '박서준', phone: '01033334444' },
    ]);
    expect(result.issues).toEqual([]);
  });
});
