-- 셀러: 전화번호가 유일 키다. 같은 번호면 같은 셀러다.
-- 이름과 전화번호만 저장한다(SPEC "셀러").
create table seller (
  id           uuid primary key default gen_random_uuid(),
  phone        text not null unique,
  name         text not null,
  created_at   timestamptz not null default now(),
  last_entry_on date not null default current_date  -- 1년 보관 기준
);

-- 플리마켓: 날짜와 장소가 매번 다르다. 참가비는 플리마켓 단위다.
create table market (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,   -- 공개 페이지 주소. 끝까지 바뀌지 않는다.
  title         text not null,
  held_on       date not null,
  place         text not null,
  place_detail  text,                   -- 주차, 짐 하차 위치
  setup_at      text,                   -- '08:00'
  open_at       text,
  close_at      text,
  fee           integer,                -- null이면 참가비를 받지 않는 플리마켓
  bank_account  text,
  fee_due_on    date,
  notes         text,                   -- 준비물, 우천 방침 등
  layout_path   text,                   -- 배치도 이미지의 Storage 경로
  created_at    timestamptz not null default now()
);

-- 확정 셀러: 특정 플리마켓에 선정된 셀러
create table entry (
  id         uuid primary key default gen_random_uuid(),
  market_id  uuid not null references market(id) on delete cascade,
  seller_id  uuid not null references seller(id) on delete cascade,
  paid_at    timestamptz,               -- null이면 미입금 셀러
  created_at timestamptz not null default now(),
  unique (market_id, seller_id)
);

create table notice (
  id         uuid primary key default gen_random_uuid(),
  market_id  uuid not null references market(id) on delete cascade,
  kind       text not null check (kind in ('선정','사전안내','리마인드','변경','배치도')),
  sms_body   text not null,             -- 문자 본문. {이름}, {링크}를 포함할 수 있다.
  page_body  text,                      -- 공개 페이지에 실릴 상세
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (market_id, kind)              -- 플리마켓당 공지 종류별 1건
);

-- 발송: 공지 1건을 확정 셀러 1명에게 보낸 시도. 재발송하면 행이 하나 더 쌓인다.
create table dispatch (
  id          uuid primary key default gen_random_uuid(),
  notice_id   uuid not null references notice(id) on delete cascade,
  entry_id    uuid not null references entry(id) on delete cascade,
  sent_by     text not null,            -- 발송자 이름. 문자는 취소가 불가능하므로 반드시 남긴다.
  status      text not null check (status in ('성공','실패')),
  message_id  text,                     -- 솔라피가 준 식별자
  error       text,
  created_at  timestamptz not null default now()
);

create index entry_market_idx on entry (market_id);
create index dispatch_notice_idx on dispatch (notice_id, created_at desc);
create index seller_last_entry_idx on seller (last_entry_on);
