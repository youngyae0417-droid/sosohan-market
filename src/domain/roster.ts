import { normalizePhone, formatPhone } from './phone';
import type { SellerInput } from './types';

export type RosterIssue = { line: number; raw: string; reason: string };
export type RosterResult = { rows: SellerInput[]; issues: RosterIssue[] };

/** 머리글로 흔히 쓰이는 값. 이 단어만 있는 줄은 데이터가 아니다. */
const HEADER_WORDS = ['이름', '성명', '셀러명', '연락처', '전화번호', '휴대폰', '번호'];

function isHeaderRow(cells: string[]): boolean {
  const filled = cells.filter(c => c !== '');
  return filled.length > 0 && filled.every(c => HEADER_WORDS.includes(c));
}

function splitLine(line: string): string[] {
  // 탭이 있으면 탭 기준(엑셀 복사), 없으면 쉼표 기준으로 나눈다.
  const parts = line.includes('\t') ? line.split('\t') : line.split(',');
  return parts.map(p => p.trim());
}

function collect(rowsRaw: { cells: string[]; line: number; raw: string }[]): RosterResult {
  const rows: SellerInput[] = [];
  const issues: RosterIssue[] = [];
  const seen = new Map<string, number>();

  for (const { cells, line, raw } of rowsRaw) {
    const filled = cells.filter(c => c !== '');
    if (filled.length === 0) continue;
    if (isHeaderRow(cells)) continue;

    // 번호로 파싱되는 칸을 찾는다. 덕분에 열 순서를 몰라도 된다.
    let phone: string | null = null;
    let phoneIndex = -1;
    for (let i = 0; i < filled.length; i++) {
      const parsed = normalizePhone(filled[i]);
      if (parsed.ok) {
        phone = parsed.phone;
        phoneIndex = i;
        break;
      }
    }

    if (phone === null) {
      issues.push({ line, raw, reason: '전화번호를 찾을 수 없음' });
      continue;
    }

    const name = filled.filter((_, i) => i !== phoneIndex).join(' ').trim();
    if (name === '') {
      issues.push({ line, raw, reason: '이름을 찾을 수 없음' });
      continue;
    }

    if (seen.has(phone)) {
      issues.push({ line, raw, reason: `이미 있는 전화번호 (${formatPhone(phone)})` });
      continue;
    }

    seen.set(phone, line);
    rows.push({ name, phone });
  }

  return { rows, issues };
}

export function parsePastedRoster(text: string): RosterResult {
  const lines = (text ?? '').split(/\r?\n/);
  return collect(
    lines.map((raw, i) => ({ cells: splitLine(raw), line: i + 1, raw })),
  );
}

export function parseRosterCells(cells: string[][]): RosterResult {
  return collect(
    cells.map((row, i) => {
      const asStrings = row.map(c => (c === null || c === undefined ? '' : String(c).trim()));
      return { cells: asStrings, line: i + 1, raw: asStrings.join('\t') };
    }),
  );
}
