# Supabase 프로젝트 만들기 & 키 전달 방법

소요 시간 약 10분. 브라우저만 있으면 됩니다.

---

## 1단계 · 프로젝트 만들기

1. https://supabase.com 접속 → 우측 상단 **Start your project**
2. **Continue with GitHub** 로 가입 (GitHub 계정이 어차피 필요하므로 같은 계정 권장)
3. **New project** 클릭 후 아래처럼 입력

   | 항목 | 입력값 |
   |---|---|
   | Organization | 개인 계정 그대로 두기 |
   | Name | `hamkke-onsum` |
   | Database Password | **자동 생성 버튼**을 누르고 그 값을 안전한 곳에 보관 <br>(DB 직접 접속용. 웹앱에서는 안 씁니다) |
   | Region | ⚠️ **Northeast Asia (Seoul)** — 반드시 확인 |
   | Plan | Free |

   > **리전(Region)은 나중에 변경할 수 없습니다.** 공공기관 개인정보 보관 위치 문제와
   > 직결되므로 반드시 **Seoul**을 선택하세요.

4. **Create new project** → 2분 정도 기다리면 준비 완료

---

## 2단계 · 키 확인하기

프로젝트 화면 왼쪽 맨 아래 **⚙️ Project Settings → API** 메뉴로 들어가면
아래 두 가지가 보입니다. (계정 생성 시기에 따라 화면 명칭이 조금 다를 수 있습니다)

| 화면에 보이는 이름 | 생김새 | 용도 |
|---|---|---|
| **Project URL** | `https://abcdefghijk.supabase.co` | 접속 주소 |
| **anon** `public` <br>(최신 화면에서는 **Publishable key**) | `eyJhbGciOi...` 로 시작하는 긴 문자열 <br>또는 `sb_publishable_...` | 웹앱에서 쓰는 공개 키 |

### ⚠️ 절대 전달하면 안 되는 키

같은 화면에 **`service_role`** (또는 **Secret key**, `sb_secret_...`) 이라는 키도 있습니다.
이 키는 **모든 보안 규칙을 무시하고 데이터베이스 전체를 열 수 있는 마스터 키**입니다.
채팅창·메모·GitHub 어디에도 붙여넣지 마세요. 이 프로젝트에서는 쓰지 않습니다.

> **anon 키는 노출되어도 괜찮은가요?** 네, 정상입니다.
> 이 키는 설계상 브라우저 자바스크립트에 포함되어 누구나 볼 수 있습니다.
> 실제 보호는 키가 아니라 **RLS(행 수준 보안) 정책**이 담당합니다.
> 그래서 "익명 사용자는 기록 추가만 가능하고 조회는 불가"로 정책을 걸어 둡니다.

---

## 3단계 · 키를 개발에 반영하는 방법

### 방법 A — 직접 파일에 넣기 (권장)

1. 프로젝트 폴더에서 `.env.local.example` 파일을 복사해 이름을 `.env.local`로 바꿉니다.

   ```bash
   Copy-Item .env.local.example .env.local
   ```

2. 메모장으로 `.env.local`을 열고 두 줄을 채웁니다.

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijk.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

3. 저장 후 "키 입력 완료"라고 알려주시면, 연결 테스트부터 진행합니다.
   이 파일은 `.gitignore`에 등록되어 있어 **GitHub에 올라가지 않습니다.**

### 방법 B — 채팅으로 알려주기

`Project URL`과 `anon public` 키 두 개를 그대로 붙여넣어 주셔도 됩니다.
(anon 키는 어차피 웹사이트 소스에 포함되어 공개되는 값이라 전달 자체는 문제되지 않습니다.)
**단, `service_role`/`Secret` 키는 어떤 경우에도 보내지 마세요.**

---

## 4단계 · GitHub Actions에 키 등록 (배포용, 저장소 만든 뒤에)

정적 사이트로 빌드할 때도 위 두 값이 필요합니다.

1. GitHub 저장소 → **Settings** → 좌측 **Secrets and variables → Actions**
2. **New repository secret** 을 눌러 두 개 등록

   | Name | Secret |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public 키 |

3. **Settings → Pages → Build and deployment → Source** 를 **GitHub Actions** 로 변경

이후 `main` 브랜치에 코드를 올릴 때마다 자동으로 빌드·배포됩니다.

---

---

## 5단계 · 데이터베이스 만들기 (SQL 실행)

`supabase/schema.sql` 파일 하나만 실행하면 아래가 한 번에 만들어집니다.

- `access_logs` — 입장 기록 (성명 + 시각). RLS로 잠가 두어 공개 키로는 조회 불가
- `app_config` — 인증코드 보관 (초기값 `1234`). 공개 키로 읽을 수 없음
- `enter_platform()` — 코드 확인 + 기록을 한 번에 처리하는 함수
- 매일 새벽 3시, 1년 지난 기록 자동 삭제 (개인정보 보유기간 준수)

**실행 방법**

1. https://supabase.com/dashboard → `hamkke-onsum` 프로젝트 선택
2. 왼쪽 메뉴에서 **SQL Editor** (`</>` 아이콘) 클릭
3. `supabase/schema.sql` 파일을 열어 **전체 복사** → 붙여넣기
4. 오른쪽 아래 **Run** 클릭
5. `Success. No rows returned` 이 나오면 완료

> pg_cron 관련 오류가 난다면 **Database → Extensions** 에서 `pg_cron` 을 켠 뒤
> 다시 실행하세요. 이 부분만 실패해도 로그인 기능 자체는 정상 동작합니다.
> (자동 삭제만 안 되므로 나중에 꼭 다시 실행해 주세요)

---

## 자주 쓰는 관리 작업

**인증코드 바꾸기** — SQL Editor에서 실행. 사이트 재배포 불필요, 즉시 적용됩니다.

```sql
update public.app_config set value = '새코드', updated_at = now()
where key = 'access_code';
```

**이용 현황 보기**

```sql
select date(entered_at at time zone 'Asia/Seoul') as 날짜,
       count(*) as 입장수,
       count(distinct full_name) as 이용자수
from public.access_logs
group by 1 order by 1 desc;
```

기록은 대시보드의 **Table Editor → access_logs** 에서도 볼 수 있습니다.
(웹사이트 방문자는 이 표를 절대 볼 수 없습니다)
