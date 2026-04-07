# 게이미피케이션 구현 현황

---

## 완료된 구현

### 1. XP/포인트 영속화 (xp_ledger)

**문제:** rewardStore가 메모리 전용이라 새로고침하면 XP/포인트 초기화됨

**해결:**

| 구성 요소 | 파일 | 역할 |
|---|---|---|
| xpLedgerApi | `src/lib/supabase/xpLedgerApi.ts` | DB CRUD (insert, fetchTotals, fetchHistory) |
| useXPLedger | `src/features/reward/useXPLedger.ts` | React Query 훅 (useTotals, useInsertTransaction) |
| RewardSync | `src/features/reward/RewardSync.tsx` | 앱 마운트 시 DB → rewardStore 자동 동기화 |
| rewardStore | `src/store/rewardStore.ts` | `setTotals()` + `loaded` 플래그 추가 |

**데이터 흐름:**
```
앱 마운트
  → RewardSync (layout.tsx에 마운트)
  → useTotals() → xpLedgerApi.fetchTotals()
  → rewardStore.setTotals(xp, points)
```

**XP/포인트 기록 시점:**
- 퀘스트 완료: `useQuestActions.ts` → `xpLedgerApi.insertTransaction({ type, delta, reason, questId })`
- 퀘스트 복원(돌려놓기): 동일 함수, `delta: -포인트` (차감)
- 회고 작성: `ReflectPage.tsx` → `insertTransaction({ type: "xp", delta: 20, reason: "회고 작성" })`
- 업적 해금: `profile/page.tsx` → `insertTransaction({ type: "points", delta: 업적보상, reason: "업적 해금: ..." })`

**type 컬럼으로 XP/포인트 구분:**
- `type: "xp"` → AI 퀘스트 완료, 회고 작성 등 경험치
- `type: "points"` → 유저 퀘스트 완료, 업적 보상 등 재화

**DB 스키마 변경:** 마이그레이션 007에서 `xp_ledger`에 `type` 컬럼 추가 (CHECK 제약: `'xp'` | `'points'`)

---

### 2. 업적 시스템 (Achievements)

**구성 요소:**

| 구성 요소 | 파일 | 역할 |
|---|---|---|
| achievementApi | `src/lib/supabase/achievementApi.ts` | 해금 기록 CRUD + 스트릭 계산 |
| useAchievements | `src/features/reward/useAchievements.ts` | React Query 훅 |
| user_achievements 테이블 | 마이그레이션 007 | 해금 기록 영속화 (UNIQUE: client_id + achievement_key) |
| 프로필 페이지 | `src/app/profile/page.tsx` | 업적 모달 + 자동 해금 + 축하 모달 |

**업적 목록 (9개):**

| key | 이름 | 조건 | 보상 |
|---|---|---|---|
| `emotion_explorer` | 감정 탐험가 | 회고 3회 | 1,000P |
| `emotion_interpreter` | 감정 해석가 | 회고 10회 | 2,500P |
| `inner_observer` | 내면의 관찰자 | 회고 30회 | 5,000P |
| `emotion_starter` | 작심 감정러 | 퀘스트 5개 완료 | 1,500P |
| `execution_master` | 실행의 달인 | 퀘스트 20개 완료 | 3,000P |
| `action_designer` | 행동 설계자 | 퀘스트 50개 완료 | 6,000P |
| `routine_alchemist` | 루틴 연금술사 | 7일 연속 기록 | 2,000P |
| `habit_hero` | 습관의 주인공 | 30일 연속 기록 | 8,000P |
| `self_understanding` | 자기이해 마스터 | 회고 10회 + 퀘스트 20개 | 10,000P |

**자동 해금 로직 (`profile/page.tsx` useEffect):**
```
프로필 페이지 진입
  → stats 계산 (reflectionCount, doneQuestCount, streakDays)
  → ACHIEVEMENTS 순회: check(stats) === true && DB에 미해금
    → unlockAchievement.mutate(key)     ← DB에 해금 기록
    → insertTransaction(points)          ← 포인트 보상 DB 기록
    → rewardStore.addPoints()            ← 메모리 즉시 반영
    → celebrateQueue에 추가              ← 축하 모달 큐
```

**축하 모달 (업적 달성 시):**
- 팡파레 사운드: Web Audio API로 C→E→G→C 멜로디 합성 (별도 음원 파일 없음)
  - `useCelebrationSound()` 커스텀 훅
  - `AudioContext` + `OscillatorNode` (triangle wave)
  - 4개 음: 523Hz(C5) → 659Hz(E5) → 784Hz(G5) → 1047Hz(C6)
  - 각 0.12초 간격, 마지막 음 0.4초로 길게
- 모달 UI: PartyPopper 아이콘 흔들림 애니메이션 + 업적 이름/설명 + 보상 포인트
- 여러 개 동시 달성 시: `celebrateQueue` (ref 배열)로 하나씩 순서대로 표시, 확인 누르면 다음

**업적 모달 (목록 보기):**
- 프로필 카드의 "업적 N/9" 버튼 클릭 시 열림
- 해금된 업적: Trophy 아이콘 + "해금 완료" 텍스트
- 미해금 업적: Lock 아이콘 + 프로그레스 바 + 조건 텍스트
- 프로그레스 계산: `getProgress()` — condition 문자열 파싱으로 목표값 추출 후 백분율 계산

---

### 3. 스트릭 (연속 기록)

**문제:** QuestSidePanel 등에서 `streakDays`가 하드코딩(0 또는 1)이었음

**해결:** `achievementApi.fetchStreak()` — 별도 테이블 없이 `quests.completed_at` 기반 계산

**계산 로직:**
```
1. quests 테이블에서 status='done' & completed_at IS NOT NULL 조회
2. completed_at을 KST 기준 날짜 문자열로 변환 (UTC+9)
3. 고유 날짜 Set으로 중복 제거
4. 내림차순 정렬 후 오늘 or 어제부터 시작
5. 이전 날짜와 차이가 1일이면 streak++, 아니면 break
6. 오늘·어제 모두 기록 없으면 streak = 0
```

**연동:** `useStreak()` 훅 → 프로필 페이지 `stats.streakDays`에 반영 → 스트릭 기반 업적 자동 체크

---

## 남은 구현 (TODO)

### 레벨업 이벤트
- XP가 레벨 경계(100, 200, 300...)를 넘을 때 레벨업 모달/토스트 표시
- 레벨별 칭호 부여 (예: LV.1 "시작하는 사람", LV.3 "꾸준한 실행가" 등)

### streak 보상
- 3일 연속: 보너스 XP + 토스트
- 7일 연속: 특별 칭호 or 배지
- streak 끊기면 리셋 알림 (부드럽게, "다시 시작해볼까요?")

### 회고 유도 강화
- MoodCheckModal "다음에 할게요" → "회고 없이 마무리할게요"로 텍스트 변경
- 회고 미작성 시 NavMenu "회고" 탭에 알림 dot 표시
- 회고 Summary Modal에 streak 정보 함께 표시

### 관련 파일 맵

```
src/
├── app/profile/page.tsx          ← 업적 모달 + 축하 모달 + 자동 해금
├── features/
│   ├── quest/useQuestActions.ts  ← 퀘스트 완료/복원 시 ledger 기록
│   ├── reflect/ReflectPage.tsx   ← 회고 작성 시 XP 기록
│   └── reward/
│       ├── RewardSync.tsx        ← 앱 마운트 시 DB→store 동기화
│       ├── useXPLedger.ts        ← XP/포인트 React Query 훅
│       └── useAchievements.ts    ← 업적/스트릭 React Query 훅
├── lib/supabase/
│   ├── xpLedgerApi.ts            ← XP/포인트 DB API
│   └── achievementApi.ts         ← 업적 해금 + 스트릭 계산 DB API
└── store/rewardStore.ts          ← Zustand (메모리 + DB 동기화)
```
