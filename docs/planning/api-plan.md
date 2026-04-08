# Supabase API 연동 계획

> 최종 업데이트: 2026-04-06

---

## 현황

| 테이블 | API 파일 | 연동 상태 |
|---|---|---|
| quests | questApi.ts + useQuests.ts (React Query) | ✅ 완료 |
| survey_sessions | movaFlowApi.ts | ✅ 완료 (createSession, completeSession, abortSession, fetchActiveSession) |
| survey_thought | movaFlowApi.ts | ✅ 완료 (saveThought, startFlow에 포함) |
| survey_emotions | movaFlowApi.ts | ✅ 완료 (saveEmotion) |
| survey_desires | movaFlowApi.ts | ✅ 완료 (saveDesires, finishFlow에 포함) |
| survey_actions | movaFlowApi.ts | ✅ 완료 (saveActions, finishFlow에 포함) |
| reflections | reflectionApi.ts + useReflections.ts (React Query) | ✅ 완료 (fetchReflectionPage, insertReflection, fetchReflectionBySession) |
| xp_ledger | xpLedgerApi.ts + useXPLedger.ts (React Query) | ✅ 완료 (insertTransaction, fetchTotals, fetchHistory) |
| user_achievements | achievementApi.ts + useAchievements.ts (React Query) | ✅ 완료 (fetchUnlocked, unlockAchievement, fetchStreak) |
| action_catalog | - | ❌ 미구현 (MVP 이후) |
| suggestion_rules | - | ❌ 미구현 (MVP 이후) |

### React Query 이관 상태

| 영역 | 상태 |
|---|---|
| quests fetch | ✅ useQuests() — useQuery |
| quests mutation | ✅ useQuestActions() — invalidateQuests 패턴 |
| quests 추가 (추천→퀘스트) | ✅ useAddQuests() — useMutation |
| flow 시작 (세션+생각) | ✅ useStartFlow() — useMutation |
| flow 감정 저장 | ✅ useSaveEmotion() — useMutation |
| flow 완료 (욕구+행동+세션종료) | ✅ useFinishFlow() — useMutation |
| reflections fetch | ✅ useReflections() — useInfiniteQuery (페이지네이션) |
| reflections mutation | ✅ useInsertReflection, useUpdateReflection, useDeleteReflection |
| xp_ledger fetch | ✅ useTotals() — useQuery |
| xp_ledger mutation | ✅ useInsertTransaction() — useMutation + invalidate totals |
| achievements fetch | ✅ useUnlockedAchievements() — useQuery |
| achievements mutation | ✅ useUnlockAchievement() — useMutation |
| streak fetch | ✅ useStreak() — useQuery (quests.completed_at 기반 계산) |

---

## 완료된 구현

### 1순위: 세션 API ✅

**파일:** `src/lib/supabase/movaFlowApi.ts`

| 함수 | 상태 | 연동 위치 |
|---|---|---|
| `createSession()` | ✅ | GridSection → startFlow |
| `completeSession(id)` | ✅ | RecommendList → finishFlow |
| `abortSession(id)` | ✅ | 구현됨, 호출처 미연결 |
| `fetchActiveSession()` | ✅ | 구현됨, 호출처 미연결 |

### 2순위: 감정·생각 API ✅

**파일:** `src/lib/supabase/movaFlowApi.ts` + `src/features/flow/useFlowMutations.ts`

| 함수 | 상태 | 연동 위치 |
|---|---|---|
| `saveThought(sessionId, key, customText?)` | ✅ | GridSection → useStartFlow |
| `saveEmotion(sessionId, key, intensity, customText?)` | ✅ | EmotionCardList → useSaveEmotion |
| `fetchEmotionsBySession()` | ❌ | 조회 함수 미구현 (시각화 시 필요) |
| `fetchEmotionHistory()` | ❌ | 조회 함수 미구현 (시각화 시 필요) |

### 5순위 일부: survey_actions, survey_desires ✅

| 함수 | 상태 | 연동 위치 |
|---|---|---|
| `saveActions(sessionId, actions[])` | ✅ | RecommendList → useFinishFlow |
| `saveDesires(sessionId, needNow, desiredAction)` | ✅ | RecommendList → useFinishFlow |

---

## 남은 구현

### 3순위: 회고 API — `reflectionApi.ts` ✅

**파일:** `src/lib/supabase/reflectionApi.ts` + `src/features/reflect/useReflections.ts`

| 함수 | 상태 | 연동 위치 |
|---|---|---|
| `fetchReflectionPage(offset)` | ✅ | ReflectEntryList → useReflections (useInfiniteQuery) |
| `fetchReflections()` | ✅ | 전체 조회 (레거시, 유지) |
| `insertReflection(params)` | ✅ | ReflectPage → useInsertReflection |
| `fetchReflectionBySession(sessionId)` | ✅ | 세션별 조회 |

**구현 특이사항:**
- `useInfiniteQuery`로 무한 스크롤 페이지네이션 (PAGE_SIZE=3)
- `react-virtuoso` + `customScrollParent`로 가상화 리스트
- 컴포넌트 분리: `ReflectEntryCard.tsx`, `ReflectEntryList.tsx`

---

### 4순위: XP 원장 API — `xpLedgerApi.ts` ✅

**파일:** `src/lib/supabase/xpLedgerApi.ts` + `src/features/reward/useXPLedger.ts`

| 함수 | 상태 | 설명 |
|---|---|---|
| `insertTransaction(type, delta, reason, questId?, sessionId?)` | ✅ | XP 또는 포인트 변동 기록 |
| `fetchTotals()` | ✅ | XP + 포인트 합계 한번에 조회 |
| `fetchTotal(type)` | ✅ | 타입별 누적 합계 |
| `fetchHistory(type?, limit?)` | ✅ | 변동 이력 (최신순) |

**연동:**
- `RewardSync` 컴포넌트가 앱 마운트 시 `fetchTotals()` → `rewardStore.setTotals()` 동기화
- `rewardStore`에 `loaded` 플래그 + `setTotals()` 추가
- 퀘스트 완료 시 `useQuestActions`에서 insert (연동 예정)
- 회고 완료 시 `ReflectPage`에서 insert (연동 예정)

---

### 4.5순위: 업적 API — `achievementApi.ts` ✅

**파일:** `src/lib/supabase/achievementApi.ts` + `src/features/reward/useAchievements.ts`

| 함수 | 상태 | 설명 |
|---|---|---|
| `fetchUnlocked()` | ✅ | 해금된 업적 목록 조회 |
| `unlockAchievement(key)` | ✅ | 업적 해금 (upsert, 중복 방지) |
| `fetchStreak()` | ✅ | quests.completed_at 기반 연속 기록 일수 계산 |

**스트릭 계산 방식:**
- 별도 테이블 없이 quests.completed_at에서 고유 날짜 추출
- KST 기준으로 변환 후 오늘/어제부터 역순으로 연속일 카운트
- 오늘·어제 모두 기록 없으면 streak = 0

---

### 5순위: 나머지 (MVP 이후)

**action_catalog API** — 행동 카탈로그 마스터 데이터 조회
- `fetchActions(tags?, difficulty?)`
- 연동: 추천 시스템 fallback (하이브리드 추천 전환 시)

**suggestion_rules API** — 감정+생각 → 행동 추천 규칙
- `fetchRules(emotionKey, thoughtKey)`
- 연동: DB 기반 추천 로직

**감정 조회 API** — 시각화용
- `fetchEmotionsBySession(sessionId)` — 세션별 감정 조회
- `fetchEmotionHistory()` — 전체 감정 이력 (그래프용)

---

## 전제 조건

- [ ] OAuth 로그인 구현 (현재 익명 인증으로 동작, RLS는 auth.uid() 기반)

## 완료 후 가능해지는 것

- [x] ~~세션 단위로 감정→생각→행동 데이터 연결~~ (완료)
- [x] ~~새로고침해도 퀘스트 유지~~ (React Query로 해결)
- [ ] 감정 변화 시각화 (감정 강도 데이터 기반 그래프)
- [ ] 사용자별 데이터 격리 (OAuth + RLS)
- [x] ~~새로고침해도 XP/포인트 유지~~ (xp_ledger + RewardSync 완료)
- [x] ~~회고 이력 열람~~ (reflections 연동 + 무한 스크롤 완료)
- [x] ~~업적 해금 기록 영속화~~ (user_achievements 테이블 + API 완료)
- [x] ~~연속 기록 스트릭 계산~~ (quests.completed_at 기반 fetchStreak 완료)
