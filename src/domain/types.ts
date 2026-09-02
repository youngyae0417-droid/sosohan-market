export type NoticeKind = '선정' | '사전안내' | '리마인드' | '변경' | '배치도';

export const NOTICE_KINDS: readonly NoticeKind[] = [
  '선정',
  '사전안내',
  '리마인드',
  '변경',
  '배치도',
] as const;

export type SellerInput = { name: string; phone: string };
