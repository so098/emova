# 반응형 개선 체크리스트

> 작성: 2026-04-08

## Critical (반드시 수정)

### 1. GridSection 카드 크기 + 그리드 오버플로우
- **파일:** `src/features/home/GridSection.tsx`
- **문제:** `w-[10rem] h-[10rem]` 카드 3열 = 최소 504px. iPhone SE(375px)에서 넘침
- **수정:** 모바일 2열 + 카드 `w-full`로 변경
  - `grid-cols-2 md:grid-cols-3`

### 2. `--ui-content-width` 모바일 대응
- **파일:** `src/app/globals.css`
- **문제:** `--ui-content-width: 28rem`(448px) 고정 → 375px 화면에서 넘침
- **수정:** 미디어 쿼리로 모바일에서 `calc(100vw - 2rem)`

### 3. 높이 계산 통일
- **파일:** QuestPage, ReflectPage, RecommendList
- **문제:** `h-[calc(100dvh-10rem)]`이 모바일 nav 높이 미반영
- **수정:** CSS 변수 `--ui-safe-height` 만들어서 통일

### 4. 헤더 패딩
- **파일:** `src/components/layout/AppLayout.tsx`
- **문제:** `px-6`(48px)이 320px 화면에서 너무 넓음
- **수정:** `px-4 md:px-6`

---

## High (출시 전 수정)

### 5. 터치 타겟 44px 미달
- [ ] QuestCard 체크박스: `h-[1.625rem]`(26px) → 패딩 추가로 44px 확보
- [ ] 감정 pill 버튼: `py-1.5` → `py-2.5`로 키우기

### 6. 프로필 페이지 하단 nav에 가려짐
- **파일:** `src/app/profile/page.tsx`
- **수정:** `pb-8` → 모바일 nav 높이 고려한 여백

---

## 검증 방법
- 크롬 DevTools: iPhone SE(375px), iPhone 12(390px), iPad mini(768px)
- 각 페이지 가로 스크롤 없는지 체크
- 모달이 화면 안에 들어오는지 확인
