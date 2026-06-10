# My Sanctuary

개인용 통합 일기 웹 앱입니다. 하루를 `일상 -> 감정 -> 배움 -> 성장 -> 다음 행동` 흐름으로 돌아보고, Supabase에 날짜별 일기로 저장합니다.

로그인 없이 혼자 쓰는 로컬/개인 배포 용도를 전제로 만들었습니다.

## 주요 기능

- 날짜 선택 캘린더를 먼저 고른 뒤 단계별 질문에 답변
- 5개 주제, 15개 세부 질문 기반 작성 플로우
- 설정 페이지에서 기본 질문과 추천 질문을 켜고 끄는 템플릿 관리
- 질문 단계 사이를 부드러운 슬라이드 전환으로 이동
- 세부 질문 스킵 가능
- 작성 화면은 기존 저장 데이터를 불러오지 않고 항상 빈 입력으로 시작
- 조회 페이지에서 저장된 일기를 날짜별로 읽기
- Supabase `jsonb` answers 컬럼에 질문별 답변 저장

## 기술 스택

- Vite
- React
- Supabase
- lucide-react

## Supabase 설정

1. Supabase에서 새 프로젝트를 만듭니다.
2. Supabase 대시보드에서 `SQL Editor`를 엽니다.
3. [supabase/schema.sql](supabase/schema.sql)의 SQL을 그대로 실행합니다.
4. `Project Settings > API`에서 Project URL과 anon public key를 복사합니다.

주의: 이 앱은 로그인 없이 anon key로 읽기/쓰기/수정/삭제가 가능하도록 RLS 정책을 열어둡니다. 개인용 로컬 앱이나 제한된 개인 배포 용도로 사용하세요. 브라우저 앱에 `service_role` 키를 넣으면 안 됩니다.

## 환경 변수

`.env.example`을 복사해서 `.env`를 만들고 값을 채웁니다.

```powershell
Copy-Item .env.example .env
```

```text
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 실행

```powershell
npm install
npm run dev
```

브라우저에서 Vite가 출력한 로컬 주소를 엽니다. 보통 `http://127.0.0.1:5173`입니다.

## 빌드

```powershell
npm run build
```

## 데이터 구조

테이블: `public.diary_entries`

- `id`: 일기 ID
- `entry_date`: 일기 날짜, 날짜별 고유값
- `answers`: 15개 세부 질문 답변을 담는 `jsonb`
- `created_at`: 생성 시각
- `updated_at`: 수정 시각

`entry_date`에 unique index가 걸려 있어 같은 날짜로 저장하면 기존 일기가 덮어써집니다.

템플릿 설정은 브라우저 `localStorage`에 저장됩니다. 질문을 추가하거나 끄더라도 Supabase 테이블은 `answers` JSONB 구조를 그대로 사용합니다.

## 작성 템플릿

1. 일상: 오늘 있었던 일과 기억에 남는 장면
2. 감정: 가장 강했던 감정, 원인, 행동에 준 영향
3. 배움: 새롭게 배운 것과 잘못 알고 있던 것
4. 성장: 실수, 반복 패턴, 다음에도 적용할 교훈
5. 행동: 내일 다르게 해볼 작은 행동

기본값은 위 5개 주제의 15개 질문입니다. 설정에서 다음 추천 질문을 추가로 켤 수 있습니다.

- 몸과 에너지 상태
- 다시 반복하고 싶은 선택
- 미루거나 피한 것
- 나답다고 느낀 순간
- 내일의 장애물과 대응

## 프로젝트 구조

```text
src/
  main.jsx            # 앱 화면, 작성/조회 플로우, 캘린더 UI
  styles.css          # 전체 디자인 시스템과 화면 스타일
  supabaseClient.js   # Supabase 클라이언트 설정
supabase/
  schema.sql          # 테이블, 인덱스, RLS 정책, updated_at 트리거
```
