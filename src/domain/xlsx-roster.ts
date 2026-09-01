import ExcelJS from 'exceljs';
import { parseRosterCells, type RosterResult } from './roster';

/**
 * exceljs의 셀 값은 문자열·숫자만이 아니라 리치텍스트, 수식 결과,
 * 하이퍼링크 객체일 수도 있다. 전부 문자열로 눌러 담는다.
 */
function cellText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    const v = value as {
      text?: unknown;
      result?: unknown;
      richText?: { text: string }[];
    };
    if (Array.isArray(v.richText)) return v.richText.map(r => r.text).join('');
    if (v.text !== undefined) return String(v.text);
    if (v.result !== undefined) return String(v.result);
    return '';
  }
  return String(value);
}

/**
 * 네이버폼에서 내려받은 엑셀을 읽는다. 첫 시트만 본다.
 * 전화번호가 숫자 셀로 저장되어 앞자리 0이 사라진 경우는 normalizePhone이 복원한다.
 */
export async function parseXlsxRoster(buffer: ArrayBuffer): Promise<RosterResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) return { rows: [], issues: [] };

  const cells: string[][] = [];
  sheet.eachRow({ includeEmpty: false }, row => {
    // row.values는 1-기반 배열이라 0번 자리가 비어 있다.
    const values = Array.isArray(row.values) ? row.values.slice(1) : [];
    cells.push(values.map(v => cellText(v).trim()));
  });

  return parseRosterCells(cells);
}
