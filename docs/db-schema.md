# Emova DB 스키마 문서

> Supabase (PostgreSQL) 기준. 마이그레이션 파일: `supabase/migrations/`

---

## 전체 테이블 관계도

```
survey_sessions (세션)
  ├── survey_thought     (생각 선택, 세션당 1개)
  ├── survey_emotions    (감정 선택)
  ├── survey_desires     (욕구/질문 답변, 세션당 1개)
  ├── survey_actions     (추천 행동 기록)
  ├── reflections        (회고)
  ├── quests             (퀘스트 인스턴스)
  └── xp_ledger          (XP 적립)

action_catalog (행동 마스터)
  ├── suggestion_rules   (추천 규칙)
  └── survey_actions     (세션별 행동 기록)
```

모든 데이터는 `session_id`로 하나의 플로우에 묶인다.
모든 사용자 식별은 `client_id` (= Supabase `auth.uid()`) 하나로 통일.

---

## 테이블 상세

### 1. survey_sessions — 세션

플로우의 최상위 단위. 감정 선택부터 회고까지 하나의 세션.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid (PK) | 세션 ID |
| client_id | uuid | 사용자 ID (auth.uid) |
| status | text | `in_progress` / `completed` / `aborted` |
| started_at | timestamptz | 세션 시작 시각 |
| completed_at | timestamptz | 완료 시각 |
| aborted_at | timestamptz | 중단 시각 |
| updated_at | timestamptz | 마지막 수정 시각 |

**생명주기:** 그리드 선택 시 생성 → 추천 완료 시 completed → 중도 이탈 시 aborted

**인덱스:** `(client_id, status)` 복합 인덱스

---

### 2. survey_thought — 생각 선택

그리드에서 선택한 "요즘 자주 드는 생각". **세션당 1개** (UNIQUE 제약).

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid (PK) | |
| session_id | uuid (FK, UNIQUE) | 소속 세션 (세션당 1개) |
| client_id | uuid | |
| key | text | 생각 키 (`unknown`, `procrastinate`, `apathy`, `remotive`, `stimulate`, `custom`) |
| custom_text | text | key가 `custom`일 때 직접 입력 텍스트 |
| created_at | timestamptz | |

---

### 3. survey_emotions — 감정 선택

감정 카드에서 선택한 감정.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid (PK) | |
| session_id | uuid (FK) | 소속 세션 |
| client_id | uuid | |
| key | text | 감정 키 (자유 텍스트) |
| intensity | smallint | 감정 강도 (기본 5) |
| custom_text | text | 직접 입력 텍스트 |
| created_at | timestamptz | |

---

### 4. survey_desires — 욕구/질문 답변

질문 페이지에서 사용자가 작성한 답변. **세션당 1개** (UNIQUE 제약).

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid (PK) | |
| session_id | uuid (FK, UNIQUE) | 세션당 1개 |
| client_id | uuid | |
| need_now | text | 질문 라벨 (예: "지금 가장 필요한 건?") |
| desired_action | text | 사용자 답변 텍스트 |
| end_of_day_feel | text | 하루 끝 느낌 (선택) |
| is_wrote | boolean | 답변 작성 여부 |
| created_at | timestamptz | |

---

### 5. survey_actions — 추천 행동 기록

AI 추천 행동 + 사용자 직접 입력 행동. **세션마다 누적된다.**

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid (PK) | |
| session_id | uuid (FK) | 소속 세션 |
| client_id | uuid | |
| source | enum | `system` (AI 추천) / `custom` (직접 입력) / `regen` (다시 추천) |
| action_id | uuid (FK) | action_catalog 참조 (카탈로그 기반일 때) |
| custom_text | text | 행동 텍스트 |
| is_selected | boolean | 사용자가 선택했는지 |
| is_completed | boolean | 실제로 수행했는지 |
| completed_at | timestamptz | 완료 시각 |
| created_at | timestamptz | |

**데이터 쌓이는 방식:**

매 세션마다 AI가 추천한 항목 전체 + 사용자 직접 입력이 모두 저장됨.

```
세션 A:
  - "5분 산책하기"       source=system, is_selected=true
  - "물 한 잔 마시기"    source=system, is_selected=false
  - "스트레칭"          source=system, is_selected=true
  - "일기 쓰기"         source=custom,  is_selected=true

세션 B:
  - "5분 산책하기"       source=system, is_selected=true   ← 또 선택됨
  - "심호흡 3회"         source=system, is_selected=false
  - ...
```

선택되지 않은 항목도 저장하는 이유: 나중에 "추천했는데 선택 안 된 행동"을 분석할 수 있음.

---

### 6. action_catalog — 행동 카탈로그 (마스터)

시스템이 추천할 수 있는 행동 목록 원본.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid (PK) | |
| title | text | 행동 제목 |
| description | text | 설명 |
| tags | jsonb | `{"category": [...], "recommendation": [...]}` |
| difficulty | smallint | 난이도 (1~) |
| is_active | boolean | 활성 여부 |
| created_at | timestamptz | |

---

### 7. suggestion_rules — 추천 규칙

감정+생각 조합 → 어떤 행동을 추천할지 결정하는 규칙 테이블.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid (PK) | |
| emotion_key | text | 감정 키 |
| thought_key | text | 생각 키 |
| action_id | uuid (FK) | 추천할 행동 (action_catalog) |
| weight | real | 추천 가중치 (기본 1.0) |
| is_active | boolean | 활성 여부 |

**UNIQUE 제약:** (emotion_key, thought_key, action_id)

---

### 8. quests — 퀘스트

사용자에게 할당된 퀘스트 인스턴스.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid (PK) | |
| client_id | uuid | 사용자 ID |
| session_id | uuid (FK) | 생성 출처 세션 |
| title | text | 퀘스트 제목 |
| description | text | |
| source | text | 출처 (`survey`, `user`, `ai`) |
| status | enum | `pending` / `in_progress` / `done` / `expired` |
| category | text | `단기` / `장기` / `보류` (기본: `단기`) |
| origin_category | text | 원래 카테고리 (보류 이동 시 기억용) |
| due_at | timestamptz | 기한 |
| xp_reward | int | 완료 시 XP (기본 5) |
| created_at | timestamptz | |
| completed_at | timestamptz | |
| updated_at | timestamptz | 마지막 수정 시각 |

**인덱스:** `(client_id, category)`, `(client_id, status)` 복합 인덱스

---

### 9. reflections — 회고

퀘스트 수행 후 감정 변화 기록.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid (PK) | |
| client_id | uuid | 사용자 ID |
| session_id | uuid (FK) | |
| quest_id | uuid (FK) | 회고 대상 퀘스트 |
| before_emotion | text | 수행 전 감정 |
| after_emotion | text | 수행 후 감정 |
| notes | text | 회고 텍스트 |
| ai_feedback | jsonb | AI 피드백 (예정) |
| created_at | timestamptz | |

---

### 10. xp_ledger — XP 적립 내역

모든 XP/포인트 변동 기록. 누적 XP = SUM(delta).

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid (PK) | |
| client_id | uuid | 사용자 ID |
| delta | int | 변동량 (+/-) |
| reason | text | 사유 (퀘스트 완료, 회고 작성 등) |
| session_id | uuid (FK) | |
| quest_id | uuid (FK) | |
| created_at | timestamptz | |

---

## 마이그레이션 이력

| 파일 | 내용 | 상태 |
|---|---|---|
| 001_create_tables.sql | 전체 테이블 + enum 생성 | 적용됨 |
| 002_enable_rls.sql | RLS 활성화 | 적용됨 |
| 003_add_origin_category.sql | quests에 origin_category 추가 | 적용됨 |
| 004_alter_enums_to_text.sql | thought_key, emotion_key enum → text 변환 | 적용됨 |
| 005_schema_cleanup.sql | category 추가, user_id 제거, updated_at, 복합 인덱스, thought UNIQUE | 적용됨 |
| 006_rename_retrospectives_to_reflections.sql | retrospectives → reflections 테이블명 변경 | 미적용 |

---

## 추천 시스템 전략: survey_actions 활용

survey_actions 데이터가 쌓이면 AI 의존도를 줄이고 DB 기반 추천으로 전환할 수 있다.

### 하이브리드 추천 모델

```
데이터 충분한가? (같은 emotion+thought 조합의 기록이 N건 이상)
  │
  ├─ YES → DB 추천 2개 + AI 신규 1개
  │         ↳ is_selected=true 빈도순 정렬
  │         ↳ is_completed=true면 가중치 추가 (실제 수행한 행동)
  │
  └─ NO  → AI 3개 (현재 방식 유지)
```

### DB 기반 추천이 유리한 경우

| 조건 | 쿼리 예시 |
|---|---|
| 같은 감정+생각 조합 반복 | `WHERE thought_key = ? AND emotion_key = ? AND is_selected = true` → 빈도순 |
| 완료 이력 존재 | `is_completed = true` 행동 우선 (실제로 수행한 검증된 행동) |
| 다수 사용자 데이터 | 같은 조합에서 다른 유저들이 많이 선택한 행동 (협업 필터링) |

### AI가 여전히 필요한 경우

| 조건 | 이유 |
|---|---|
| 첫 사용 / 데이터 부족 | 참고할 기록 없음 (콜드 스타트) |
| 새로운 감정+생각 조합 | 이전에 없던 조합이면 DB에 매칭 데이터 없음 |
| 다양성 확보 | 매번 같은 추천만 나오면 사용자 피로 → AI로 변주 |

### 전환 시 필요한 작업

1. **suggestion_rules에 weight 업데이트 로직** — survey_actions의 선택/완료 패턴을 주기적으로 weight에 반영
2. **action_catalog 채우기** — 현재 AI가 생성하는 행동을 카탈로그에 등록 (중복 제거)
3. **추천 API 분기** — 데이터 충분 여부 판단 → DB or AI 분기
