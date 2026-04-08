# 서버 컴포넌트 마이그레이션 기록

## 개요

기존에 클라이언트 컴포넌트(`"use client"`)로 동작하던 페이지들을 Next.js 서버 컴포넌트로 전환하고, React Query의 서버 프리페칭 패턴을 도입했다.

---

## 변경된 페이지

### 1. `app/quest/page.tsx`

**Before:** 동기 함수, 클라이언트 `QuestPage`를 직접 렌더링  
**After:** `async` 서버 컴포넌트로 전환

- 서버에서 `prefetchQuests()`로 퀘스트 데이터를 미리 fetch
- `dehydrate()` + `HydrationBoundary`로 서버 캐시를 클라이언트에 전달
- 로딩 중 `QuestSkeleton` 폴백 추가

### 2. `app/profile/page.tsx`

**Before:** `"use client"` — 351줄짜리 단일 클라이언트 컴포넌트 (프로필 카드, 업적 모달, 축하 애니메이션 등 모든 로직 포함)  
**After:** `async` 서버 컴포넌트 (27줄)

- 4개 데이터를 `Promise.all`로 병렬 프리페칭:
  - `prefetchQuests()` — 퀘스트 목록
  - `prefetchReflections()` — 회고 기록
  - `prefetchUnlockedAchievements()` — 해금된 업적
  - `prefetchStreak()` — 연속 기록 일수
- 기존 UI/상태 로직은 `ProfileContent` 클라이언트 컴포넌트로 분리

### 3. `app/shop/page.tsx`

**Before:** `"use client"` — `useRewardStore`로 포인트/XP를 직접 구독  
**After:** `"use client"` 제거, 서버 컴포넌트로 전환

- 상점 헤더의 포인트/XP 표시 UI 제거 (CurrencyHUD로 통합)
- Zustand 스토어 의존성 제거로 서버 컴포넌트 전환 가능

---

## 추가된 인프라 파일

### `src/lib/query/getQueryClient.ts`

서버 컴포넌트 전용 QueryClient 팩토리.

- React의 `cache()`로 요청 단위 싱글턴 보장 (동일 요청 내 중복 생성 방지)
- staleTime: 30초

### `src/lib/query/queryKeys.ts`

쿼리 키 상수 모음.

| 상수 | 용도 |
|---|---|
| `QUEST_KEY` | 퀘스트 목록 |
| `REFLECTION_KEY` | 회고 기록 |
| `ACHIEVEMENTS_KEY` | 해금 업적 |
| `STREAK_KEY` | 연속 기록 |

### `src/lib/supabase/serverQueries.ts`

서버 사이드 Supabase 쿼리 함수들. 인증 없는 경우 빈 기본값 반환.

- `prefetchQuests()` — 카테고리별(단기/장기/보류) 퀘스트 조회
- `prefetchReflections()` — 회고 + 연결된 퀘스트 조회
- `prefetchUnlockedAchievements()` — 해금 업적 조회
- `prefetchStreak()` — 연속 활동 일수 계산

---

## 아키텍처 패턴

```
서버 컴포넌트 (page.tsx)
  ├─ getQueryClient()로 QueryClient 생성
  ├─ prefetch*()로 서버에서 데이터 fetch
  ├─ dehydrate()로 캐시 직렬화
  └─ HydrationBoundary로 감싸서 클라이언트에 전달
      └─ 클라이언트 컴포넌트 (useQuery로 캐시 재사용)
```

### 장점

- **초기 로딩 속도 개선**: 서버에서 데이터를 미리 가져오므로 클라이언트 waterfall 제거
- **번들 크기 감소**: 서버 컴포넌트 코드는 클라이언트 번들에 포함되지 않음
- **관심사 분리**: 데이터 페칭(서버) ↔ UI/인터랙션(클라이언트) 명확 분리

---

## 컴포넌트 구조 변경

### 분리된 클라이언트 컴포넌트

| 기존 위치 | 변경 후 |
|---|---|
| `app/profile/page.tsx` (351줄, 모든 로직 포함) | `features/profile/components/ProfileContent.tsx` (UI/상태) |

### 폴더 구조 정리 (동시 진행)

| 기존 | 변경 후 | 비고 |
|---|---|---|
| `components/AppChrome.tsx` | `components/layout/AppLayout.tsx` | 이름 + 경로 변경 |
| `components/BottomBar.tsx` | `components/layout/BottomBar.tsx` | layout 그룹 |
| `components/NavMenu.tsx` | `components/layout/NavMenu.tsx` | layout 그룹 |
| `components/PageMain.tsx` | `components/layout/PageMain.tsx` | layout 그룹 |
| `components/CurrencyHUD.tsx` | `components/nav/CurrencyHUD.tsx` | nav 그룹 |
| `components/NotificationBell.tsx` | `components/nav/NotificationBell.tsx` | nav 그룹 |
| `components/UserHUD.tsx` | `components/nav/UserHUD.tsx` | nav 그룹 |
| `components/AuthProvider.tsx` | `components/providers/AuthProvider.tsx` | providers 그룹 |
| `components/QueryProvider.tsx` | `components/providers/QueryProvider.tsx` | providers 그룹 |
| `components/EmotionGauge.tsx` | `components/ui/EmotionGauge.tsx` | ui 그룹 |
| `components/XPBar.tsx` | `components/ui/XPBar.tsx` | ui 그룹 |
| `features/quest/QuestPage.tsx` | `features/quest/components/QuestPage.tsx` | 하위 정리 |
| `features/quest/useQuests.ts` | `features/quest/hooks/useQuests.ts` | 하위 정리 |
| `features/reflect/ReflectPage.tsx` | `features/reflect/components/ReflectPage.tsx` | 하위 정리 |
