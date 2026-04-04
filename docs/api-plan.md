# Supabase API 연동 계획

> 현재 상태: quests 테이블만 API 연동 완료. 나머지 10개 테이블 미연동.

---

## 현황

| 테이블 | API 파일 | 연동 상태 |
|---|---|---|
| quests | questApi.ts | 완료 |
| survey_sessions | - | 미구현 |
| survey_emotions | - | 미구현 |
| survey_thought | - | 미구현 |
| reflections | - | 미구현 (ReflectPage 목 데이터 사용 중) |
| xp_ledger | - | 미구현 (rewardStore 메모리만) |
| survey_actions | - | 미구현 |
| action_catalog | - | 미구현 |
| suggestion_rules | - | 미구현 |
| survey_desires | - | 미구현 |

---

## 구현 순서

### 1순위: 세션 API — `surveySessionApi.ts`

세션이 모든 데이터의 묶음 단위. 이게 없으면 감정/생각/회고를 연결할 수 없음.

**테이블:** `survey_sessions`

**함수:**
- `createSession()` — 감정 선택 시 세션 생성 (status: in_progress)
- `completeSession(id)` — 회고 완료 시 status → completed, completed_at 기록
- `abortSession(id)` — 중도 이탈 시 status → aborted
- `fetchActiveSession()` — 현재 진행 중인 세션 조회

**연동 위치:** 감정 선택 페이지에서 세션 시작, 회고 완료 시 세션 종료

---

### 2순위: 감정·생각 API — `surveyEmotionApi.ts`, `surveyThoughtApi.ts`

시각화의 원천 데이터. 감정 강도(intensity)가 여기서 쌓여야 나중에 그래프를 그릴 수 있음.

**테이블:** `survey_emotions`, `survey_thought`

**감정 API 함수:**
- `insertEmotion(sessionId, emotionKey, intensity, customText?)` — 감정 선택 저장
- `fetchEmotionsBySession(sessionId)` — 세션별 감정 조회
- `fetchEmotionHistory()` — 전체 감정 이력 (시각화용)

**생각 API 함수:**
- `insertThought(sessionId, thoughtKey, customText?)` — 생각 선택 저장
- `fetchThoughtsBySession(sessionId)` — 세션별 생각 조회

**연동 위치:**
- 감정: `EmotionCardList` — 감정 선택 시 insert
- 생각: `GridSection` — 그리드 선택 시 insert

---

### 3순위: 회고 API — `reflectionApi.ts`

감정 before/after 변화 기록. 현재 ReflectPage가 목 데이터(`MOCK_ENTRIES`)로 동작 중.

**테이블:** `reflections`

**함수:**
- `insertReflection(sessionId, questId, beforeEmotion, afterEmotion, notes)` — 회고 저장
- `fetchReflections()` — 회고 목록 조회
- `fetchReflectionBySession(sessionId)` — 세션별 회고 조회

**연동 위치:** `ReflectPage` — 회고 작성 완료 시 insert, 목록 조회 시 fetch

---

### 4순위: XP 원장 API — `xpLedgerApi.ts`

현재 rewardStore가 메모리에서만 동작. 새로고침하면 XP 초기화됨.

**테이블:** `xp_ledger`

**함수:**
- `insertXPTransaction(delta, reason, questId?, sessionId?)` — XP 변동 기록
- `fetchTotalXP()` — 누적 XP 합계 조회 (SUM)
- `fetchXPHistory()` — XP 변동 이력 (선택)

**연동 위치:**
- 퀘스트 완료 시 `QuestPage`에서 insert
- 회고 완료 시 `ReflectPage`에서 insert
- `rewardStore` 초기화 시 fetchTotalXP로 DB에서 로드

---

### 5순위: 나머지 (MVP 이후)

**survey_actions API** — 추천 행동 선택/완료 기록
- `insertAction(sessionId, actionId, source, customText?)`
- `markActionCompleted(id)`
- 연동: `RecommendList`

**action_catalog API** — 행동 카탈로그 마스터 데이터 조회
- `fetchActions(tags?, difficulty?)`
- 연동: 추천 시스템 fallback

**suggestion_rules API** — 감정+생각 → 행동 추천 규칙
- `fetchRules(emotionKey, thoughtKey)`
- 연동: 추천 로직

**survey_desires API** — 욕구/니즈 기록
- `insertDesires(sessionId, needNow, endOfDayFeel, desiredAction)`
- 연동: 설문 플로우 확장 시

---

## 전제 조건

- [ ] OAuth 로그인 구현 (RLS가 auth.uid() 기반이라 로그인 없이 데이터 저장 불가)

## 완료 후 가능해지는 것

- [ ] 감정 변화 시각화 (감정 강도 데이터 기반 그래프)
- [ ] 사용자별 데이터 격리 (로그인 + RLS)
- [ ] 새로고침해도 XP/포인트 유지
- [ ] 회고 이력 열람
