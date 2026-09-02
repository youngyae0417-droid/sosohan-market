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

/** 머리글에서 이름 열을 가리키는 말. 공백을 지운 뒤 비교한다. */
const NAME_HEADERS = ['이름', '성명', '성함', '셀러명', '대표자', '대표자명', '작가명', '브랜드명'];

/** 머리글에서 연락처 열을 가리키는 말. */
const PHONE_HEADERS = ['연락처', '전화번호', '휴대폰번호', '휴대폰', '핸드폰', '전화', '번호'];

/**
 * 머리글 행에서 이름 열과 연락처 열의 위치를 찾는다.
 * 둘 중 하나라도 못 찾으면 null을 주고, 호출부는 기존 방식으로 되돌아간다.
 */
function findColumns(header: string[]): { nameIndex: number; phoneIndex: number } | null {
  const normalized = header.map(h => h.replace(/\s/g, ''));
  const nameIndex = normalized.findIndex(h => NAME_HEADERS.includes(h));
  const phoneIndex = normalized.findIndex(h => PHONE_HEADERS.includes(h));
  if (nameIndex === -1 || phoneIndex === -1) return null;
  if (nameIndex === phoneIndex) return null;
  return { nameIndex, phoneIndex };
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

  // 머리글로 이름·연락처 열을 특정할 수 있으면 그 두 열만 넘긴다.
  // 네이버폼 엑셀은 제출시각과 설문 문항 열이 함께 들어 있어, 그대로 넘기면
  // roster.ts가 "전화번호가 아닌 나머지 전부"를 이름으로 합쳐 버린다.
  const columns = cells.length > 0 ? findColumns(cells[0]) : null;
  if (columns) {
    const projected = cells
      .slice(1)
      .map(row => [row[columns.nameIndex] ?? '', row[columns.phoneIndex] ?? '']);
    return parseRosterCells(projected);
  }

  return parseRosterCells(cells);
}
