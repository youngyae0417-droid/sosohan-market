import type { NoticeKind } from './types';

/**
 * 공지 5종 기본 문구.
 * 개인화 변수는 {이름}과 {링크} 두 개뿐이다. 참가비·날짜·장소는 플리마켓 단위라
 * 담당자가 문구에 직접 적는다.
 */
export const DEFAULT_TEMPLATES: Record<NoticeKind, string> = {
  선정:
    '{이름}님, 소소한시장 셀러로 확정되셨습니다.\n' +
    '참가비와 입금 계좌, 기한은 아래 링크에서 확인해 주세요.\n{링크}',
  사전안내:
    '{이름}님, 소소한시장 안내드립니다.\n' +
    '셋업 시간과 장소, 주차 안내는 아래 링크를 확인해 주세요.\n{링크}',
  리마인드:
    '{이름}님, 소소한시장이 곧 열립니다.\n날짜와 셋업 시간을 다시 확인해 주세요.\n{링크}',
  변경:
    '{이름}님, 소소한시장 안내가 변경되었습니다.\n' +
    '바뀐 내용을 아래 링크에서 반드시 확인해 주세요.\n{링크}',
  배치도:
    '{이름}님, 소소한시장 배치도가 나왔습니다.\n' +
    '자리를 아래 링크에서 확인해 주세요.\n{링크}',
};

export function renderTemplate(
  body: string,
  vars: { 이름: string; 링크: string },
): string {
  return body
    .replaceAll('{이름}', vars.이름)
    .replaceAll('{링크}', vars.링크);
}

/**
 * 솔라피의 SMS/LMS 판정 기준인 EUC-KR 바이트 수를 센다.
 * 한글 등 ASCII 밖 문자는 2바이트, 나머지는 1바이트로 계산한다.
 */
export function smsByteLength(text: string): number {
  let bytes = 0;
  for (const ch of text) {
    bytes += (ch.codePointAt(0) ?? 0) > 0x7f ? 2 : 1;
  }
  return bytes;
}

/** 90바이트 이하면 SMS, 초과하면 LMS로 자동 발송된다. */
export function messageType(text: string): 'SMS' | 'LMS' {
  return smsByteLength(text) <= 90 ? 'SMS' : 'LMS';
}
