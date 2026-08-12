-- =====================================================================
--  함께 온(溫)숨 — 데이터베이스 설정
--
--  실행 방법
--    1. https://supabase.com/dashboard 접속 → hamkke-onsum 프로젝트 선택
--    2. 왼쪽 메뉴에서 SQL Editor (</> 아이콘) 클릭
--    3. 이 파일 전체를 복사해 붙여넣고 오른쪽 아래 Run 클릭
--    4. "Success. No rows returned" 이 나오면 완료
--
--  여러 번 실행해도 안전합니다.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. 입장 기록 테이블
--    개인정보는 성명 하나만 저장합니다. (IP · 접속기록 · 기기정보 저장 안 함)
-- ---------------------------------------------------------------------
create table if not exists public.access_logs (
  id         uuid        primary key default gen_random_uuid(),
  full_name  text        not null,
  entered_at timestamptz not null default now(),
  -- 나중에 구글 로그인을 붙일 때 사용할 자리 (지금은 항상 비어 있음)
  user_id    uuid        references auth.users(id) on delete set null
);

create index if not exists access_logs_entered_at_idx
  on public.access_logs (entered_at desc);

-- 행 수준 보안을 켭니다.
-- 정책(policy)을 하나도 만들지 않았으므로 공개 키로는 조회도 입력도 불가능합니다.
-- 기록은 아래 enter_platform() 함수가 대신 넣어 줍니다.
alter table public.access_logs enable row level security;


-- ---------------------------------------------------------------------
-- 2. 인증코드 보관 테이블
--    코드 값을 데이터베이스 안에만 두어 웹사이트 소스에 노출되지 않게 합니다.
--    코드를 바꾸려면 아래 UPDATE 문만 실행하면 되고, 사이트 재배포가 필요 없습니다.
-- ---------------------------------------------------------------------
create table if not exists public.app_config (
  key        text        primary key,
  value      text        not null,
  updated_at timestamptz not null default now()
);

insert into public.app_config (key, value)
values ('access_code', '1234')
on conflict (key) do nothing;

-- 정책 없음 = 공개 키로는 이 표를 읽을 수 없습니다.
alter table public.app_config enable row level security;


-- ---------------------------------------------------------------------
-- 3. 입장 처리 함수
--    인증코드 확인과 입장 기록을 한 번에 처리합니다.
--    security definer = 함수를 만든 사람의 권한으로 실행되므로,
--    사용자는 app_config 를 직접 볼 수 없지만 이 함수는 볼 수 있습니다.
-- ---------------------------------------------------------------------
create or replace function public.enter_platform(p_code text, p_name text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := btrim(p_name);
  v_ok   boolean;
begin
  -- 이름 형식 확인 (2~20자)
  if char_length(v_name) < 2 or char_length(v_name) > 20 then
    return false;
  end if;

  -- 인증코드 대조
  select value = btrim(p_code) into v_ok
  from app_config
  where key = 'access_code';

  if coalesce(v_ok, false) = false then
    return false;
  end if;

  insert into access_logs (full_name) values (v_name);
  return true;
end;
$$;

-- 이 함수만 외부에서 호출할 수 있게 허용합니다.
revoke all on function public.enter_platform(text, text) from public;
grant execute on function public.enter_platform(text, text) to anon, authenticated;


-- ---------------------------------------------------------------------
-- 4. 보유기간(1년) 자동 파기
--    개인정보 동의서에 "수집일로부터 1년 후 파기"라고 안내했으므로
--    실제로 지워지도록 매일 새벽 3시에 자동 삭제를 예약합니다.
--
--    ⚠️ pg_cron 확장이 필요합니다. 아래에서 오류가 나면
--       Database → Extensions 에서 pg_cron 을 켠 뒤 다시 실행하세요.
-- ---------------------------------------------------------------------
create extension if not exists pg_cron;

select cron.unschedule('purge-old-access-logs')
where exists (select 1 from cron.job where jobname = 'purge-old-access-logs');

select cron.schedule(
  'purge-old-access-logs',
  '0 3 * * *',
  $$delete from public.access_logs where entered_at < now() - interval '1 year'$$
);


-- =====================================================================
--  운영용 참고 쿼리 (필요할 때 SQL Editor 에서 실행)
-- =====================================================================

-- 인증코드 바꾸기
--   update public.app_config set value = '새코드', updated_at = now()
--   where key = 'access_code';

-- 총 입장 횟수
--   select count(*) from public.access_logs;

-- 최근 입장 기록 50건
--   select full_name, entered_at from public.access_logs
--   order by entered_at desc limit 50;

-- 날짜별 이용자 수
--   select date(entered_at at time zone 'Asia/Seoul') as 날짜,
--          count(*) as 입장수,
--          count(distinct full_name) as 이용자수
--   from public.access_logs
--   group by 1 order by 1 desc;
