# 상태 관리 마이그레이션 계획

> 서버 상태 → React Query / 클라이언트 상태 → Zustand 분리

---

## 현재 문제

Zustand 스토어 안에 서버 데이터(Supabase fetch 결과)와 클라이언트 UI 상태가 섞여있음.
`@tanstack/react-query` v5.96.2가 설치되어 있지만 **어디에서도 사용하지 않고 있음**.

| 문제 | 위치 | 영향 |
|------|------|------|
| 수동 캐시 관리 | questStore.isLoaded, loadedForUser | 유저 변경/탭 복귀 시 stale 데이터 |
| 로딩/에러 수동 관리 | questStore.isLoading, error | 보일러플레이트 |
| fire & forget 뮤테이션 | EmotionCardList.saveEmotion() | 실패해도 유저 모름 |
| XP 미영속 | rewardStore.points, xp | 새로고침 시 초기화 |
| 요청 중복 | loadQuests() 여러 곳에서 호출 가능 | 불필요한 네트워크 |

---

## 스토어별 상태 분류

### questStore — 대부분 서버 상태 (React Query로 이관)

| 필드 | 분류 | 이관 대상 |
|------|------|-----------|
| `단기[]`, `장기[]`, `보류[]` | 서버 | `useQuests()` 쿼리 |
| `isLoading` | 서버 메타 | 쿼리 `isPending` |
| `isLoaded` | 서버 메타 | 쿼리 `isFetched` |
| `loadedForUser` | 서버 메타 | 쿼리 키에 userId 포함 |
| `error` | 서버 메타 | 쿼리 `error` |

**→ questStore 삭제. React Query 쿼리 + 뮤테이션으로 전환.**

### sessionStore — 순수 클라이언트 (유지)

| 필드 | 분류 | 비고 |
|------|------|------|
| `selectedGrid` | 클라이언트 | 플로우 중 선택 상태 |
| `selectedEmotion` | 클라이언트 | 플로우 중 선택 상태 |
| `questionLabel`, `questionText` | 클라이언트 | 입력 중인 텍스트 |
| `supabaseSessionId` | 하이브리드 | DB에서 받아 로컬에 보관 |

**→ 유지. supabaseSessionId는 startFlow 뮤테이션의 반환값으로 set.**

### progressStore — 순수 클라이언트 (유지)

| 필드 | 분류 |
|------|------|
| `filled` (1-4) | 클라이언트 — 플로우 진행 단계 |

**→ 유지. 변경 없음.**

### rewardStore — 서버 상태여야 함 (이관)

| 필드 | 현재 | 이후 |
|------|------|------|
| `points`, `xp` | 메모리 전용 (새로고침 시 소실) | `useXP()` 쿼리 (xp_ledger SUM) |

**→ React Query 쿼리로 전환. xp_ledger 테이블에서 SUM(delta) 조회.**

### themeStore — 순수 클라이언트 (유지)

| 필드 | 분류 |
|------|------|
| `theme` | 클라이언트 — localStorage persist |

**→ 유지. 변경 없음.**

---

## React Query 훅 설계

### 쿼리 (읽기)

```
hooks/
  useQuests.ts        — 퀘스트 목록 (단기/장기/보류)
  useActiveSession.ts — 진행 중인 세션 조회
  useTotalXP.ts       — 누적 XP (xp_ledger SUM)
  useReflections.ts   — 회고 목록 (DB 연동 시)
```

| 훅 | 쿼리 키 | API 함수 | staleTime |
|----|---------|----------|-----------|
| `useQuests` | `["quests", userId]` | `questApi.fetchQuests()` | 30초 |
| `useActiveSession` | `["session", "active", userId]` | `movaFlowApi.fetchActiveSession()` | 0 (항상 fresh) |
| `useTotalXP` | `["xp", userId]` | `xpLedgerApi.fetchTotalXP()` | 60초 |
| `useReflections` | `["reflections", userId]` | `reflectionApi.fetchReflections()` | 60초 |

### 뮤테이션 (쓰기)

```
hooks/
  useToggleQuestDone.ts   — 퀘스트 완료/취소
  useAddQuests.ts         — 퀘스트 추가
  useDeleteQuest.ts       — 퀘스트 삭제
  useMoveQuestCategory.ts — 카테고리 이동 (보류/복원/전환)
  useUpdateQuestTitle.ts  — 제목 수정
  useStartFlow.ts         — 플로우 시작 (세션 생성 + 생각 저장)
  useSaveEmotion.ts       — 감정 저장
  useFinishFlow.ts        — 플로우 완료 (desires + actions + 세션 종료)
```

| 훅 | 성공 시 invalidate | 낙관적 업데이트 |
|----|-------------------|----------------|
| `useToggleQuestDone` | `["quests"]`, `["xp"]` | O — 즉시 done 토글 |
| `useAddQuests` | `["quests"]` | O — 즉시 목록에 추가 |
| `useDeleteQuest` | `["quests"]` | O — 즉시 목록에서 제거 |
| `useMoveQuestCategory` | `["quests"]` | O — 즉시 탭 이동 |
| `useUpdateQuestTitle` | `["quests"]` | O — 즉시 제목 반영 |
| `useStartFlow` | `["session"]` | X |
| `useSaveEmotion` | — | X |
| `useFinishFlow` | `["quests"]`, `["session"]` | X |

---

## 작업 순서

### 1단계: React Query 세팅 + 퀘스트 쿼리

- [ ] `QueryClientProvider` 추가 (`app/layout.tsx`에 래핑)
- [ ] `useQuests()` 훅 작성 — `questApi.fetchQuests()` 래핑
- [ ] `QuestPage`에서 `useQuests()` 사용 → questStore.loadQuests 제거
- [ ] questStore에서 서버 상태 필드 제거 (`단기/장기/보류`, `isLoading`, `isLoaded`, `error`)

### 2단계: 퀘스트 뮤테이션

- [ ] `useToggleQuestDone` — 낙관적 업데이트 + `["quests"]` invalidate
- [ ] `useAddQuests` — RecommendList에서 사용
- [ ] `useDeleteQuest`, `useMoveQuestCategory`, `useUpdateQuestTitle`
- [ ] `useQuestActions` 훅 리팩토링 — questStore 의존 제거, React Query 뮤테이션 사용

### 3단계: 플로우 뮤테이션

- [ ] `useStartFlow` — GridSection에서 사용 (fire & forget → 뮤테이션)
- [ ] `useSaveEmotion` — EmotionCardList에서 사용
- [ ] `useFinishFlow` — RecommendList에서 사용 (이미 await 처리됨)

### 4단계: XP + 회고

- [ ] `xpLedgerApi.fetchTotalXP()` 구현
- [ ] `useTotalXP()` 쿼리 → rewardStore 대체
- [ ] `reflectionApi` 구현
- [ ] `useReflections()` 쿼리 → ReflectPage mock 데이터 대체

---

## 삭제 대상

| 파일/코드 | 이유 |
|-----------|------|
| `questStore.ts` 서버 필드 (단기/장기/보류, isLoading, isLoaded, loadedForUser, error) | React Query가 관리 |
| `questStore.loadQuests()`, `reloadQuests()`, `resetCache()` | `useQuests()` 쿼리가 대체 |
| `questStore.addShortQuests()` | `useAddQuests` 뮤테이션이 대체 |
| `rewardStore.points`, `rewardStore.xp` | `useTotalXP()` 쿼리가 대체 |
| `AuthProvider`의 `resetCache()` 호출 | React Query는 키에 userId 포함 → 자동 분리 |

## 유지 대상

| 스토어 | 이유 |
|--------|------|
| `sessionStore` | 플로우 중 UI 선택 상태 (서버와 무관) |
| `progressStore` | 플로우 단계 (순수 네비게이션) |
| `themeStore` | 테마 (localStorage) |
| `questStore.setQuests()` | 낙관적 업데이트 시 로컬 상태 즉시 반영용으로 잔류 가능 (또는 React Query onMutate로 대체) |

---

## 참고: 낙관적 업데이트 패턴

```typescript
// useToggleQuestDone.ts 예시 구조
useMutation({
  mutationFn: (id: string) => questApi.updateQuestStatus(id, true),
  onMutate: async (id) => {
    await queryClient.cancelQueries({ queryKey: ["quests"] });
    const prev = queryClient.getQueryData(["quests", userId]);
    // 로컬에서 즉시 done 토글
    queryClient.setQueryData(["quests", userId], toggledState);
    return { prev };
  },
  onError: (_err, _id, context) => {
    // 실패 시 롤백
    queryClient.setQueryData(["quests", userId], context?.prev);
    showToast("저장 실패", "다시 시도해주세요");
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ["quests"] });
    queryClient.invalidateQueries({ queryKey: ["xp"] });
  },
});
```
