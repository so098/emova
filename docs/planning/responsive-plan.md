# 반응형 디자인 계획

> 목표: 모바일(375px) ~ 데스크톱(1280px) 전 구간에서 자연스러운 UX

---

## 현재 상태

### 이미 반응형인 것

| 컴포넌트 | 방식 | 분기점 |
|----------|------|--------|
| NavMenu | 세로 사이드(md+) / 하단 가로(<md) | `md` (768px) |
| SessionSidePanel | 데스크톱만 표시 | `lg` (1024px) |
| QuestSidePanel | 데스크톱만 표시 | `lg` (1024px) |
| ThemeToggle | 데스크톱 좌하단 / 모바일 NavMenu 내부 | `md` (768px) |
| ToastStack | 데스크톱 우측 / 모바일 중앙 상단 | `max-lg` |

### 문제가 있는 것

| 문제 | 위치 | 영향 |
|------|------|------|
| 그리드 카드 고정 10rem | GridSection.tsx | 375px 화면에 3열 못 들어감 (30rem = 480px 필요) |
| content-width 고정 28rem | globals.css | 모바일에서 좌우 여백 부족하거나 넘침 |
| BottomBar `bottom-8` 고정 | BottomBar.tsx | 모바일 NavMenu와 겹침 위험 |
| 헤더 요소 간격 | AppChrome.tsx | 좁은 화면에서 UserHUD/로고/알림이 겹침 |
| 모달 고정 너비 | QuestPage.tsx | `max-w-[24rem]`이 작은 화면에서 꽉 참 |
| 퀘스트 카드 min-h 고정 | QuestPage.tsx | `min-h-[7.5rem]`이 모바일에서 과도 |

---

## 브레이크포인트 전략

Tailwind 기본 브레이크포인트 사용 (커스텀 추가 없음):

| 이름 | 너비 | 타겟 기기 |
|------|------|-----------|
| base | 0~639px | 모바일 (iPhone SE ~ iPhone 16) |
| `sm` | 640px+ | 큰 모바일 / 작은 태블릿 |
| `md` | 768px+ | 태블릿 (iPad Mini~) |
| `lg` | 1024px+ | 데스크톱 |

**모바일 퍼스트** — base 스타일을 모바일로, `sm`/`md`/`lg`로 확장.

---

## 수정 항목

### 1. 그리드 카드 — 모바일에서 2열

현재: `grid grid-cols-3` + 고정 `10rem` 카드
문제: 375px 화면에 3열이 안 들어감

**수정:**
```
grid-cols-2 sm:grid-cols-3
카드: w-full aspect-square (고정 10rem 제거)
```

**파일:** `src/features/home/GridSection.tsx`
- `grid grid-cols-3 gap-4` → `grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4`
- 카드 `h-[10rem] w-[10rem]` → `aspect-square w-full`

---

### 2. content-width 반응형화

현재: `--ui-content-width: 28rem` 고정

**수정:** CSS 변수는 유지하되, 컨테이너에 `w-full max-w-(--ui-content-width)` 패턴 확인.
이미 `max-w`로 쓰고 있다면 모바일에서 자동으로 100% 폭. 패딩만 확인.

**확인 필요:**
- `max-w-(--ui-content-width)`를 쓰는 곳에 `px-4` 패딩이 있는지
- 없으면 추가

---

### 3. BottomBar 위치 — NavMenu와 겹침 방지

현재: `fixed bottom-8` (BottomBar) + `fixed bottom-0` (NavMenu 모바일)
문제: BottomBar가 NavMenu 위에 떠야 하는데 위치가 애매

**수정:**
```
모바일: bottom-[calc(var(--ui-mobile-nav-height)+1rem)]
데스크톱(md+): bottom-8 (현재 유지)
```

**파일:** `src/components/BottomBar.tsx`
- `fixed bottom-8` → `fixed bottom-[calc(3.75rem+1rem)] md:bottom-8`

---

### 4. 헤더 모바일 최적화

현재: UserHUD + 로고 + 알림+감정게이지가 한 줄
문제: 좁은 화면에서 겹침

**수정:**
- 모바일: 로고 + 알림만 표시, UserHUD 숨김
- `sm+`: 전체 표시

**파일:** `src/components/AppChrome.tsx`
- UserHUD div: `hidden sm:block`
- 또는 UserHUD 내부에서 모바일용 축약 버전

---

### 5. 감정 카드 리스트 — 카드 높이

현재: 고정 높이 카드
모바일에서는 OK지만 패딩 확인 필요

**파일:** `src/features/emotion/EmotionCardList.tsx`
- 컨테이너에 `px-4` 확인

---

### 6. 퀘스트 카드 모바일 최적화

현재: `min-h-[7.5rem]`, 내부 패딩 `px-5 py-4`

**수정:**
- 모바일: `min-h-0 px-4 py-3`
- `sm+`: 현재 유지

**파일:** `src/features/quest/QuestPage.tsx`
- 카드: `min-h-[7.5rem] px-5 py-4` → `px-4 py-3 sm:min-h-[7.5rem] sm:px-5 sm:py-4`

---

### 7. 모달 모바일 전폭

현재: `max-w-[24rem]` 고정

**수정:**
- 모바일: `inset-x-4`로 좌우 여백만 (이미 적용됨 → 확인만)
- 내부 패딩 축소

---

## 작업 순서

| 순서 | 작업 | 영향도 | 난이도 |
|------|------|--------|--------|
| 1 | 그리드 카드 2열/3열 반응형 | 높음 — 첫 화면 | 낮음 |
| 2 | BottomBar NavMenu 겹침 수정 | 높음 — 조작 불가 | 낮음 |
| 3 | 헤더 모바일 축약 | 중간 | 낮음 |
| 4 | 퀘스트 카드 패딩/높이 | 중간 | 낮음 |
| 5 | 전체 px-4 패딩 점검 | 낮음 | 낮음 |
| 6 | 모달 모바일 확인 | 낮음 | 낮음 |

---

## 테스트 기준

| 기기 | 뷰포트 | 확인 사항 |
|------|--------|-----------|
| iPhone SE | 375×667 | 그리드 2열, 텍스트 잘림 없음, 버튼 터치 가능 |
| iPhone 16 | 393×852 | 그리드 2열, BottomBar + NavMenu 겹침 없음 |
| iPad Mini | 768×1024 | 사이드 네비 표시, 그리드 3열 |
| 데스크톱 | 1280×800 | 사이드패널 표시, 현재와 동일 |

Chrome DevTools의 기기 모드로 테스트.
