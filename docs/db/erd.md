# Emova ERD

> 최종 스키마 기준 (migrations 001~008)

---

## 테이블 관계

| 부모 테이블 | 관계 | 자식 테이블 | FK 컬럼 | 비고 |
|---|---|---|---|---|
| survey_sessions | 1 : 0..1 | survey_thought | session_id | 세션당 1개 (UNIQUE) |
| survey_sessions | 1 : 0..N | survey_emotions | session_id | |
| survey_sessions | 1 : 0..1 | survey_desires | session_id | 세션당 1개 (UNIQUE) |
| survey_sessions | 1 : 0..N | survey_actions | session_id | |
| survey_sessions | 1 : 0..N | quests | session_id | |
| survey_sessions | 1 : 0..N | reflections | session_id | |
| survey_sessions | 1 : 0..N | xp_ledger | session_id | |
| action_catalog | 1 : 0..N | suggestion_rules | action_id | |
| action_catalog | 1 : 0..N | survey_actions | action_id | |
| quests | 1 : 0..N | reflections | quest_id | |
| quests | 1 : 0..N | xp_ledger | quest_id | |
| quests | 1 : 0..N | quests | parent_id | 자기참조 (장기→단기) |

---

## 테이블 상세

### survey_sessions

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | uuid | PK | |
| client_id | uuid | NOT NULL | auth.uid() |
| status | text | NOT NULL, CHECK | `in_progress` / `completed` / `aborted` |
| started_at | timestamptz | NOT NULL, DEFAULT now() | |
| completed_at | timestamptz | | |
| aborted_at | timestamptz | | |
| updated_at | timestamptz | DEFAULT now() | |

**인덱스:** `(client_id, status)`
**RLS:** SELECT / INSERT / UPDATE — `client_id = auth.uid()`

---

### survey_thought

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | uuid | PK | |
| session_id | uuid | FK → survey_sessions, UNIQUE | 세션당 1개 |
| client_id | uuid | NOT NULL | |
| key | text | NOT NULL | `unknown` / `procrastinate` / `apathy` / `remotive` / `stimulate` / `custom` |
| custom_text | text | | key=custom일 때 |
| created_at | timestamptz | NOT NULL, DEFAULT now() | |

**RLS:** SELECT / INSERT / UPDATE — `client_id = auth.uid()`

---

### survey_emotions

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | uuid | PK | |
| session_id | uuid | FK → survey_sessions | |
| client_id | uuid | NOT NULL | |
| key | text | NOT NULL | 감정 키 |
| intensity | smallint | NOT NULL | 감정 강도 |
| custom_text | text | | |
| created_at | timestamptz | NOT NULL, DEFAULT now() | |

**RLS:** SELECT / INSERT / UPDATE — `client_id = auth.uid()`

---

### survey_desires

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | uuid | PK | |
| session_id | uuid | FK → survey_sessions, UNIQUE | 세션당 1개 |
| client_id | uuid | NOT NULL | |
| need_now | text | NOT NULL | 질문 라벨 |
| desired_action | text | NOT NULL | 사용자 답변 |
| end_of_day_feel | text | | |
| is_wrote | boolean | NOT NULL, DEFAULT false | |
| created_at | timestamptz | NOT NULL, DEFAULT now() | |

**RLS:** SELECT / INSERT / UPDATE — `client_id = auth.uid()`

---

### survey_actions

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | uuid | PK | |
| session_id | uuid | FK → survey_sessions | |
| client_id | uuid | NOT NULL | |
| source | enum (survey_action_source) | NOT NULL, DEFAULT 'system' | `system` / `custom` / `regen` |
| action_id | uuid | FK → action_catalog | |
| custom_text | text | | |
| is_selected | boolean | NOT NULL, DEFAULT false | |
| is_completed | boolean | NOT NULL, DEFAULT false | |
| completed_at | timestamptz | | |
| created_at | timestamptz | NOT NULL, DEFAULT now() | |

**RLS:** SELECT / INSERT / UPDATE — `client_id = auth.uid()`

---

### action_catalog

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | uuid | PK | |
| title | text | NOT NULL | 행동 제목 |
| description | text | | |
| tags | jsonb | NOT NULL, DEFAULT `{}` | `{"category": [], "recommendation": []}` |
| difficulty | smallint | NOT NULL, DEFAULT 1 | |
| is_active | boolean | NOT NULL, DEFAULT true | |
| created_at | timestamptz | DEFAULT now() | |

**RLS:** SELECT — `true` (공개 읽기)

---

### suggestion_rules

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | uuid | PK | |
| emotion_key | text | UNIQUE(emotion_key, thought_key, action_id) | |
| thought_key | text | | |
| action_id | uuid | FK → action_catalog, NOT NULL | |
| weight | real | NOT NULL, DEFAULT 1.0 | 추천 가중치 |
| is_active | boolean | NOT NULL | |

**RLS:** SELECT — `true` (공개 읽기)

---

### quests

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | uuid | PK | |
| client_id | uuid | NOT NULL | |
| session_id | uuid | FK → survey_sessions | |
| parent_id | uuid | FK → quests | 장기→단기 연결 |
| title | text | NOT NULL | |
| description | text | | |
| source | text | NOT NULL, DEFAULT 'survey' | |
| status | enum (quest_status) | NOT NULL, DEFAULT 'pending' | `pending` / `in_progress` / `done` / `expired` |
| category | text | NOT NULL, DEFAULT '단기' | `단기` / `장기` / `보류` |
| origin_category | text | | 보류 이동 전 원래 카테고리 |
| due_at | timestamptz | | |
| xp_reward | int | NOT NULL, DEFAULT 5 | |
| created_at | timestamptz | NOT NULL, DEFAULT now() | |
| completed_at | timestamptz | | |
| updated_at | timestamptz | DEFAULT now() | |

**인덱스:** `(client_id, category)`, `(client_id, status)`, `(parent_id)`
**RLS:** SELECT / INSERT / UPDATE / DELETE — `client_id = auth.uid()`

---

### reflections

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | uuid | PK | |
| client_id | uuid | NOT NULL | |
| session_id | uuid | FK → survey_sessions | |
| quest_id | uuid | FK → quests | |
| before_emotion | text | | 수행 전 감정 |
| after_emotion | text | | 수행 후 감정 |
| notes | text | | 회고 텍스트 |
| ai_feedback | jsonb | | AI 피드백 (예정) |
| created_at | timestamptz | NOT NULL, DEFAULT now() | |

**RLS:** SELECT / INSERT / UPDATE / DELETE — `client_id = auth.uid()`

---

### xp_ledger

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | uuid | PK | |
| client_id | uuid | NOT NULL | |
| type | text | NOT NULL, DEFAULT 'xp', CHECK | `xp` / `points` |
| delta | int | NOT NULL | 변동량 (+/-) |
| reason | text | | |
| session_id | uuid | FK → survey_sessions | |
| quest_id | uuid | FK → quests | |
| created_at | timestamptz | NOT NULL, DEFAULT now() | |

**인덱스:** `(client_id, type)`
**RLS:** SELECT / INSERT — `client_id = auth.uid()`

---

### user_achievements

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | uuid | PK | |
| client_id | uuid | NOT NULL | |
| achievement_key | text | NOT NULL, UNIQUE(client_id, achievement_key) | 업적 키 |
| unlocked_at | timestamptz | NOT NULL, DEFAULT now() | |

**RLS:** SELECT / INSERT — `client_id = auth.uid()`

---

### feedback

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | uuid | PK | |
| client_id | uuid | NOT NULL | |
| category | text | | 피드백 분류 |
| message | text | NOT NULL | |
| rating | smallint | | |
| created_at | timestamptz | NOT NULL, DEFAULT now() | |

**RLS:** SELECT / INSERT — `client_id = auth.uid()`
