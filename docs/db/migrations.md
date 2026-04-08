# Emova DB 마이그레이션 이력

> 마이그레이션 파일 위치: `/supabase/migrations/`

---

## 마이그레이션 목록

| 파일 | 내용 | 비고 |
|---|---|---|
| 001_create_tables.sql | 전체 테이블 11개 + ENUM 4개 생성 | 초기 스키마 |
| 002_enable_rls.sql | 모든 테이블 RLS 활성화 + 정책 설정 | client_id = auth.uid() |
| 003_add_origin_category.sql | quests에 origin_category 컬럼 추가 | 보류 이동 시 원래 카테고리 기억 |
| 004_alter_enums_to_text.sql | emotion_key, thought_key ENUM → text | 동적 키 추가 유연성 확보 |
| 005_schema_cleanup.sql | category/updated_at 추가, user_id 제거, 복합 인덱스 | 스키마 정규화 |
| 006_rename_retrospectives_to_reflections.sql | retrospectives → reflections 테이블명 변경 | 도메인 언어 통일 |
| 007_add_user_achievements_and_ledger_type.sql | user_achievements 테이블 + xp_ledger type 컬럼 | 게이미피케이션 |
| 008_sync_schema.sql | quests.parent_id, feedback 테이블, DELETE RLS 정책 | DB 싱크 보강 |
| 009_add_time_indexes.sql | 시간 기반 인덱스 5개 추가 | 쿼리 성능 개선 |

---

## 009_add_time_indexes.sql 상세

스트릭, 일일 보상 제한, 대시보드 쿼리에서 시간 필터를 사용하는데 인덱스가 없어서 추가.

### 추가된 인덱스

| 인덱스명 | 테이블 | 컬럼 | 용도 |
|---|---|---|---|
| idx_xp_ledger_client_created | xp_ledger | (client_id, created_at DESC) | fetchTodayCount, fetchHistory |
| idx_xp_ledger_reward_reasons | xp_ledger | (client_id, created_at DESC) WHERE reason IN (...) | fetchStreakFromLedger (partial index) |
| idx_sessions_client_started | survey_sessions | (client_id, started_at DESC) | 대시보드 날짜별 세션 집계 |
| idx_emotions_client_created | survey_emotions | (client_id, created_at DESC) | 감정 시계열 조회 |
| idx_thought_client_created | survey_thought | (client_id, created_at DESC) | 생각 시계열 조회 |

### partial index 설명

`idx_xp_ledger_reward_reasons`는 partial index로, 조건에 해당하는 행만 인덱싱함:

```
WHERE reason IN ('퀘스트 완료', '회고 작성') AND delta > 0
```

- 전체 ledger 중 보상 관련 행만 인덱싱 → 인덱스 크기가 작음
- 스트릭 계산 쿼리와 조건이 정확히 일치 → 최적 성능

---

## 기존 인덱스 전체 현황

| 인덱스명 | 테이블 | 컬럼 | 추가 시점 |
|---|---|---|---|
| idx_sessions_client_status | survey_sessions | (client_id, status) | 005 |
| idx_sessions_client_started | survey_sessions | (client_id, started_at DESC) | 009 |
| idx_survey_thought_session_id | survey_thought | (session_id) | 001 |
| idx_survey_thought_client_id | survey_thought | (client_id) | 001 |
| idx_thought_client_created | survey_thought | (client_id, created_at DESC) | 009 |
| idx_survey_desires_client_id | survey_desires | (client_id) | 001 |
| idx_survey_emotions_session_id | survey_emotions | (session_id) | 001 |
| idx_survey_emotions_client_id | survey_emotions | (client_id) | 001 |
| idx_emotions_client_created | survey_emotions | (client_id, created_at DESC) | 009 |
| idx_survey_actions_session_id | survey_actions | (session_id) | 001 |
| idx_survey_actions_client_id | survey_actions | (client_id) | 001 |
| idx_survey_actions_action_id | survey_actions | (action_id) | 001 |
| idx_suggestion_rules_action_id | suggestion_rules | (action_id) | 001 |
| idx_quests_client_category | quests | (client_id, category) | 005 |
| idx_quests_client_status | quests | (client_id, status) | 005 |
| idx_quests_session_id | quests | (session_id) | 001 |
| idx_quests_parent_id | quests | (parent_id) | 008 |
| idx_reflections_client_id | reflections | (client_id) | 001 |
| idx_reflections_session_id | reflections | (session_id) | 001 |
| idx_reflections_quest_id | reflections | (quest_id) | 001 |
| idx_xp_ledger_client_id | xp_ledger | (client_id) | 001 |
| idx_xp_ledger_session_id | xp_ledger | (session_id) | 001 |
| idx_xp_ledger_quest_id | xp_ledger | (quest_id) | 001 |
| idx_xp_ledger_client_type | xp_ledger | (client_id, type) | 007 |
| idx_xp_ledger_client_created | xp_ledger | (client_id, created_at DESC) | 009 |
| idx_xp_ledger_reward_reasons | xp_ledger | (client_id, created_at DESC) partial | 009 |
| idx_user_achievements_client | user_achievements | (client_id) | 007 |
| idx_feedback_client_id | feedback | (client_id) | 008 |
