# Emova — Claude 작업 가이드

## 프로젝트 개요

**한 줄 정의:** 감정을 출발점으로 사용자의 실행 루틴을 설계하고, 미션 → 실행 → 회고 → 성장 루프를 형성하는 웹앱.

### 핵심 UX 플로우
1. 감정 선택 (또는 스킵)
2. 오늘의 미션 선택 또는 생성
3. 실행 전 메모 (선택)
4. 미션 완료 체크
5. 회고 작성 (감정 변화 + 텍스트)
6. 보상 지급 (XP / 포인트)
7. 감정-행동 기록 누적

### 핵심 기능 (MVP 범위)
| 기능 | 내용 |
|---|---|
| 감정 입력 | 선택형 (불안·무기력·의욕 등) + 텍스트 직접 입력 |
| 미션 | 장기 미션(목표) + 단기 미션(실행 단위), 하루 1회 루틴 |
| 실행 메모 | 실행 전 다짐 기록 → 회고 시 자동 불러오기 |
| 회고 | 감정 변화 선택 + 텍스트 회고 + AI 피드백(예정) |
| 보상 | XP(성장 경험) + 포인트(외적 보상) |

**MVP 제외:** 감정 히스토리 그래프, AI 심화 분석, 게임화 확장 기능

### 설계 철학
- **감정 = 행동 트리거** — 감정은 단순 기록 대상이 아니라 실행을 유도하는 신호
- **실행 최소화** — 작은 행동부터 시작해 자기효능감 회복 (BJ Fogg Behavior Model 참고)
- **회고 = 루프 완성** — 회고는 선택 기능이 아닌 행동-감정 연결을 인식하는 핵심 단계

> 상세 기획 원문: `docs/info.md`

---

## 디자인 토큰

실제 값은 `src/app/globals.css` `:root`가 single source of truth.
코드에서 색상·크기를 쓸 때는 CSS 변수(`var(--...)`)를 우선 사용할 것.

### 색상
| 변수 | 값 | 용도 |
|---|---|---|
| `--brand-logo` | `#FFC38F` | 로고 텍스트 |
| `--brand-deco-circle` | `#FFF3DC` | 배경 장식 원 (좌상단·우하단) |
| `--ui-button-primary` | `#FF9437` | 주요 액션 버튼 배경 |
| `--ui-menu-bg` | `#F8F8F8` | 사이드 네비게이션 배경 |
| `--background` | `#FFFFFF` | 전체 body 배경 |

### 그리드 아이템 색상
| 변수 | 값 | 텍스트 요약 |
|---|---|---|
| `--item-unknown` | `#4894FF` | 뭘 원하는지 모르겠다 |
| `--item-procrastinate` | `#FFA900` | 자꾸 미루게 된다 |
| `--item-apathy` | `#656565` | 아무 것도 하기 싫다 |
| `--item-remotive` | `#00FF77` | 다시 잘해보고 싶다 |
| `--item-stimulate` | `#FF7400` | 자극이 필요하다 |
| `--item-custom` | `#7E9CB9` | 직접 입력하기 |

### 레이아웃 수치
> 모든 수치는 rem 기준 (16px = 1rem). px 하드코딩 금지.

| 변수 | rem | px 환산 | 용도 |
|---|---|---|---|
| `--ui-menu-width` | `12.5rem` | 200px | 사이드 네비게이션 너비 |
| `--ui-menu-radius` | `1.25rem` | 20px | 네비게이션 컨테이너 라운드 |
| `--ui-active-radius` | `2.75rem` | 44px | 네비게이션 active pill 라운드 |
| `--ui-progress-width` | `13.8125rem` | 221px | 프로그래스 바 너비 |
| (deco circle) | `20rem` | 320px | 배경 장식 원 크기 |
| (deco circle offset) | `-5rem` | -80px | 배경 장식 원 위치 offset |

---

## 컴포넌트 배치 원칙

- **로고 (Emova)** — 가운데 상단 고정
- **ProgressBar** — 왼쪽 상단
- **NavMenu** — 왼쪽 세로 중앙 (데스크톱) / 하단 고정 (모바일)
- **배경 장식 원** — body 의사요소로 좌상단·우하단 배치, 20rem 크기

---

## 네비게이션 메뉴 (NavMenu)

- 항목: **모바 / 퀘스트 / 회고**
- 기본 active: **모바**
- active 표시: framer-motion `layoutId="active-pill"` spring 애니메이션으로 슬라이드
- active pill 스타일: 투명 배경 + 2.75rem 라운드 + 미세 shadow

---

## 기술 스택

- Next.js 16 / React 19
- Tailwind CSS v4 (`@tailwindcss/postcss`)
- framer-motion (애니메이션)
- Pretendard Variable (기본 폰트)
- Supabase (백엔드)
- Zustand (상태관리)

---

## 작업 규칙

- **미사용 파일 삭제 전 반드시 먼저 삭제 요청 확인** — 불필요한 파일을 발견해도 바로 지우지 말고, 삭제해도 되는지 먼저 물어볼 것
- **라우트 상수 파일 동기화** — 모든 경로 문자열은 `src/constants/routes.ts`에서 관리. `app/` 하위 페이지가 추가/삭제될 때 `ROUTES`, `PROGRESS_FLOW`, `HIDE_NAV_ROUTES`도 함께 업데이트할 것
- **라우트는 실제 폴더 기준** — `app/` 하위에 해당 폴더/페이지가 존재하지 않으면 `routes.ts`에 추가하지 말 것
- **동적 라우트 세그먼트명 변경 시 `.next` 캐시 삭제 필수** — `[index]` → `[slug]` 같이 폴더명을 바꾸면 반드시 `.next` 폴더 삭제 후 서버 재시작. 캐시가 남으면 Next.js가 충돌 에러를 발생시킴

---

## 코드 컨벤션

- 색상 하드코딩 금지 — CSS 변수 또는 globals.css 토큰 참조
- **px 하드코딩 금지** — 수치는 반드시 rem 사용 (16px = 1rem)
- 새 컴포넌트는 `src/components/`에 생성
- 클라이언트 컴포넌트는 파일 상단에 `"use client"` 명시

### Tailwind v4 CSS 변수 사용 규칙

- Tailwind 클래스에서 CSS 변수를 색상으로 쓰려면 반드시 `@theme inline` 블록에 `--color-*` 접두사로 등록해야 한다
- 등록 후 테마 이름으로 사용 (예: `--color-brand-primary` 등록 → `bg-brand-primary` 사용)
- `@theme` 미등록 변수를 `()` 문법으로 사용하면 색상이 적용 안 됨
- gradient는 `@theme`에 색상으로 등록 불가 → 기존 코드(XPBar, NavMenu 등) 참고
- inline style의 `var()` 참조는 `@theme` 등록 없이도 동작 (순수 CSS)
- 새 색상 추가 시: `:root`에 변수 정의 → `@theme inline`에 등록 → Tailwind 클래스로 사용
- 현재 등록된 테마 색상은 `globals.css`의 `@theme inline` 블록 참고

### 인라인 스타일 vs Tailwind 기준

- 테마 색상, 고정 크기, border, radius, shadow, gradient → Tailwind 클래스로 작성
- inline style은 런타임 계산값, 외부 props 동적 색상 등 진짜 동적 값만 허용
- **CLAUDE.md에 Tailwind 클래스 예시를 절대 적지 말 것** — Tailwind v4 스캐너가 md 파일도 읽어서 CSS 생성을 시도함
