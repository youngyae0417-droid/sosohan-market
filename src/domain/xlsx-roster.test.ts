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
});
