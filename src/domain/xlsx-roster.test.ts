import { describe, it, expect } from 'vitest';
import ExcelJS from 'exceljs';
import { parseXlsxRoster } from './xlsx-roster';

async function makeXlsx(rows: (string | number)[][]): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('응답');
  for (const row of rows) sheet.addRow(row);
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as ArrayBuffer;
}

describe('parseXlsxRoster', () => {
  it('머리글이 있는 시트를 읽는다', async () => {
    const buf = await makeXlsx([
      ['이름', '연락처'],
      ['김하늘', '010-1111-2222'],
      ['박서준', '010-3333-4444'],
    ]);
    const result = await parseXlsxRoster(buf);
    expect(result.rows).toEqual([
      { name: '김하늘', phone: '01011112222' },
      { name: '박서준', phone: '01033334444' },
    ]);
    expect(result.issues).toEqual([]);
  });

  it('전화번호가 숫자 셀이어서 앞자리 0이 사라진 경우도 읽는다', async () => {
    const buf = await makeXlsx([
      ['이름', '연락처'],
      ['김하늘', 1011112222],
    ]);
    const result = await parseXlsxRoster(buf);
    expect(result.rows).toEqual([{ name: '김하늘', phone: '01011112222' }]);
  });

  it('첫 시트만 읽는다', async () => {
    const workbook = new ExcelJS.Workbook();
    const first = workbook.addWorksheet('응답');
    first.addRow(['김하늘', '010-1111-2222']);
    const second = workbook.addWorksheet('기타');
    second.addRow(['박서준', '010-3333-4444']);
    const buf = (await workbook.xlsx.writeBuffer()) as ArrayBuffer;

    const result = await parseXlsxRoster(buf);
    expect(result.rows).toEqual([{ name: '김하늘', phone: '01011112222' }]);
  });

  it('빈 시트는 빈 결과를 준다', async () => {
    const buf = await makeXlsx([]);
    const result = await parseXlsxRoster(buf);
    expect(result).toEqual({ rows: [], issues: [] });
  });

  it('네이버폼 형태의 다열 시트에서 이름과 연락처만 골라낸다', async () => {
    const buf = await makeXlsx([
      ['제출시각', '이름', '연락처', '판매 품목', 'SNS 계정'],
      ['2026-08-15 14:32', '김하늘', '010-1111-2222', '수공예 액세서리', '@kimhaneul'],
      ['2026-08-15 15:07', '박서준', '010-3333-4444', '드라이플라워', '@parkseojun'],
    ]);
    const result = await parseXlsxRoster(buf);
    expect(result.rows).toEqual([
      { name: '김하늘', phone: '01011112222' },
      { name: '박서준', phone: '01033334444' },
    ]);
    expect(result.issues).toEqual([]);
  });

  it('머리글에 공백이 섞여 있어도 열을 찾는다', async () => {
    const buf = await makeXlsx([
      ['성명', '휴대폰 번호', '비고'],
      ['김하늘', '010-1111-2222', '전기 필요'],
    ]);
    const result = await parseXlsxRoster(buf);
    expect(result.rows).toEqual([{ name: '김하늘', phone: '01011112222' }]);
    expect(result.issues).toEqual([]);
  });

  it('머리글을 못 찾으면 기존 방식으로 되돌아간다', async () => {
    const buf = await makeXlsx([
      ['김하늘', '010-1111-2222'],
      ['박서준', '010-3333-4444'],
    ]);
    const result = await parseXlsxRoster(buf);
    expect(result.rows).toEqual([
      { name: '김하늘', phone: '01011112222' },
      { name: '박서준', phone: '01033334444' },
    ]);
  });

  it('이름 열만 있고 연락처 열이 없으면 기존 방식으로 되돌아간다', async () => {
    const buf = await makeXlsx([
      ['이름', '메모'],
      ['김하늘', '010-1111-2222'],
    ]);
    const result = await parseXlsxRoster(buf);
    expect(result.rows).toEqual([{ name: '김하늘', phone: '01011112222' }]);
  });

  it('다열 시트에서 전화번호가 빠진 행을 보고한다', async () => {
    const buf = await makeXlsx([
      ['제출시각', '이름', '연락처', '판매 품목'],
      ['2026-08-15 14:32', '김하늘', '010-1111-2222', '수공예'],
      ['2026-08-15 15:07', '박서준', '', '드라이플라워'],
    ]);
    const result = await parseXlsxRoster(buf);
    expect(result.rows).toEqual([{ name: '김하늘', phone: '01011112222' }]);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].reason).toBe('전화번호를 찾을 수 없음');
  });

  it('머리글에 부가 표기가 붙어 있어도 열을 찾는다', async () => {
    const buf = await makeXlsx([
      ['제출시각', '이름 (필수)', "휴대폰 번호('-' 없이)", '판매 품목'],
      ['2026-08-15 14:32', '김하늘', '010-1111-2222', '수공예 액세서리'],
    ]);
    const result = await parseXlsxRoster(buf);
    expect(result.rows).toEqual([{ name: '김하늘', phone: '01011112222' }]);
    expect(result.issues).toEqual([]);
  });

  it('대괄호와 별표가 붙은 머리글도 찾는다', async () => {
    const buf = await makeXlsx([
      ['성함*', '휴대전화[선택]'],
      ['김하늘', '010-1111-2222'],
    ]);
    const result = await parseXlsxRoster(buf);
    expect(result.rows).toEqual([{ name: '김하늘', phone: '01011112222' }]);
  });

  it('열이 셋 이상인데 이름·연락처 열을 못 찾으면 조용히 넘어가지 않고 알린다', async () => {
    const buf = await makeXlsx([
      ['타임스탬프', '응답1', '응답2', '응답3'],
      ['2026-08-15', '김하늘', '010-1111-2222', '수공예'],
    ]);
    const result = await parseXlsxRoster(buf);
    expect(result.rows).toEqual([]);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].reason).toContain('열 이름을 확인');
  });

  it('열을 골라낸 경우 줄 번호가 담당자의 엑셀 행과 맞는다', async () => {
    const buf = await makeXlsx([
      ['이름', '연락처'],
      ['김하늘', '010-1111-2222'],
      ['박서준', '번호없음'],
    ]);
    const result = await parseXlsxRoster(buf);
    expect(result.rows).toEqual([{ name: '김하늘', phone: '01011112222' }]);
    expect(result.issues).toHaveLength(1);
    // 박서준은 엑셀에서 3번째 줄이다 (머리글이 1번째).
    expect(result.issues[0].line).toBe(3);
  });
});
