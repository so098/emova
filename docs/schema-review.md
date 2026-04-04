# DB 스키마 리뷰 & 개선 기록

**날짜:** 2026-04-05

---

## 배경

MVP 스키마(001~004)를 운영하면서 드러난 설계 미흡점을 정리하고, 005 마이그레이션으로 한번에 개선.

---

## 1. quests.category 컬럼 누락 (버그)

**문제:** `questApi.ts`에서 `category` 값을 INSERT/UPDATE하는데 DB에 컬럼이 없었음.
코드를 먼저 작성하고 스키마를 나중에 맞추다 보니 싱크가 안 맞은 케이스.

**교훈:** 코드에서 새 컬럼을 쓰기 시작하면 마이그레이션을 같이 작성할 것. API 파일과 스키마를 항상 쌍으로 확인.

**수정:** `ALTER TABLE quests ADD COLUMN category text NOT NULL DEFAULT '단기'`

---

## 2. client_id / user_id 이중 관리 (과잉 설계)

**문제:** 거의 모든 테이블에 `client_id`(익명)와 `user_id`(OAuth)를 둘 다 넣었음.

**왜 서툴렀나:** "나중에 OAuth 붙이면 user_id가 따로 필요하겠지"라고 생각했지만, Supabase는 익명→OAuth 전환 시 같은 `auth.uid()`를 유지함. 즉 컬럼 하나로 충분한데 불필요하게 두 개를 관리하고 있었음.

**실제 영향:**
- 모든 API 함수에서 `client_id`만 쓰고 `user_id`는 항상 null
- 쿼리할 때 어느 컬럼으로 필터할지 혼란
- RLS 정책도 `client_id` 기준으로만 작성

**수정:** `user_id` 컬럼 전부 DROP (sessions, quests, retrospectives, xp_ledger)

---

## 3. enum을 너무 일찍 도입 (유연성 부족)

**문제:** thought_key, emotion_key를 enum으로 시작했는데, 값이 `('custom')`뿐이었음. 새 감정/생각 키를 추가할 때마다 `ALTER TYPE ... ADD VALUE`가 필요하고, 값 삭제는 enum에서 불가능.

**왜 서툴렀나:** "enum이 안전하니까"라는 이유로 선택했지만, 감정·생각 키는 기획 단계에서 계속 바뀌는 값이라 text가 맞았음.

**판단 기준 (이번에 배운 것):**
- 값이 확정되고 거의 안 바뀜 → enum (예: `quest_status`)
- 값이 유동적이거나 사용자 입력 가능 → text

**수정:** 004에서 enum → text 전환 + enum 타입 DROP

---

## 4. 제약 조건 일관성 (비즈니스 규칙 미반영)

**문제:** `survey_desires`는 session당 UNIQUE인데 `survey_thought`는 UNIQUE가 없었음. 한 세션에서 생각은 하나만 선택하는 게 비즈니스 규칙인데 스키마에 안 드러남.

**왜 서툴렀나:** 코드에서 "어차피 한 번만 호출하니까"라고 생각하고 DB 제약을 안 걸었음. 하지만 코드 버그로 중복 호출될 수 있고, DB 제약이 마지막 방어선 역할을 해야 함.

**수정:** `ALTER TABLE survey_thought ADD CONSTRAINT uq_survey_thought_session UNIQUE (session_id)`

---

## 5. 단일 인덱스만 존재 (쿼리 패턴 미고려)

**문제:** `client_id`, `status` 각각 단일 인덱스만 있었음. 실제 쿼리는 항상 `WHERE client_id = ? AND status = ?` 조합.

**왜 서툴렀나:** "인덱스는 컬럼마다 하나씩"이라고 단순하게 생각. 복합 인덱스가 왼쪽 컬럼 단독 쿼리도 커버한다는 걸 몰랐음.

**수정:**
- `(client_id, status)` 복합 인덱스 추가
- `(client_id, category)` 복합 인덱스 추가
- 커버되는 단일 인덱스 제거

---

## 6. updated_at 없음 (운영 편의 누락)

**문제:** 모든 테이블에 `created_at`은 있는데 `updated_at`이 없었음.

**실제 영향:** 퀘스트 상태가 언제 바뀌었는지, 세션이 언제 완료됐는지 `completed_at`으로만 추적 가능하고 중간 수정 이력을 알 수 없음.

**수정:** quests, survey_sessions에 `updated_at` 추가

---

## 정리

| 구분 | 내용 | 원인 |
|---|---|---|
| 버그 | category 컬럼 누락 | 코드↔스키마 싱크 실수 |
| 과잉 설계 | user_id 이중 관리 | Supabase 인증 흐름 이해 부족 |
| 유연성 부족 | enum 조기 도입 | 변경 빈도 예측 실패 |
| 규칙 미반영 | UNIQUE 제약 누락 | "코드가 알아서 하겠지" 사고방식 |
| 성능 미고려 | 단일 인덱스만 존재 | 복합 인덱스 개념 미숙 |
| 운영 누락 | updated_at 없음 | 디버깅 경험 부족 |

전부 **005_schema_cleanup.sql** 마이그레이션 하나로 수정.
