# Emova

> 감정을 출발점으로 실행 루틴을 설계하는 웹앱.  
> 미션 -> 실행 -> 회고 -> 성장 루프를 통해 자기효능감을 회복합니다.

## 핵심 플로우

```
감정 선택 → 질문 응답 → AI 맞춤 루틴 추천 → 퀘스트 등록 → 회고
```

1. 현재 상태를 6가지 카드 중 선택 (뭘 원하는지 모르겠다, 자꾸 미루게 된다 등)
2. 10가지 감정 중 현재 감정 선택 (캐러셀 UI)
3. 맥락에 맞는 질문에 자유 텍스트로 답변
4. Claude API가 감정 + 답변 기반으로 5~20분 실행 가능한 마이크로 루틴 3개 추천
5. 선택한 루틴을 퀘스트로 등록하고 실행 -> 회고

## 기술 스택과 선택 이유

| 영역 | 기술 | 왜 이걸 선택했나 |
|------|------|------|
| 프레임워크 | Next.js 16 (App Router) / React 19 | layout·error·middleware 등 파일 컨벤션으로 라우팅·에러·인증을 선언적으로 처리하고, Server Action/Component로 API 키 노출 없이 서버 로직 호출 |
| 스타일링 | Tailwind CSS v4 + CSS 변수 | 디자인 토큰을 한 곳에서 관리하면서 다크모드 전환도 변수 스위칭으로 해결 |
| 애니메이션 | Framer Motion | spring physics 기반 자연스러운 전환. 외부 UI 라이브러리 없이 직접 구현 |
| 상태관리 | Zustand | Redux 대비 보일러플레이트가 적고, 셀렉터 패턴으로 불필요한 리렌더 방지 |
| 백엔드 | Supabase (Auth + DB) | 별도 서버 구축 없이 인증·DB·RLS를 즉시 사용해 빠른 MVP 개발. 익명 인증 → OAuth 전환 시 같은 uid 유지 |
| AI | Claude API (Server Action) | 감정+답변 맥락을 넘겨 일반적 조언이 아닌 구체적 행동을 생성 |
| 테스트 | Vitest | 순수 로직을 분리해서 유닛 테스트로 리팩토링 안전망 확보 |

## 주요 기능

### AI 맞춤 루틴 추천
- Claude Haiku를 활용해 감정 상태 + 사용자 답변 기반 마이크로 루틴 생성
- Server Action으로 API 키를 클라이언트에 노출하지 않음
- 일반적인 조언이 아닌, 5~20분 내 실행 가능한 구체적 행동 제안
- 추천 데이터가 쌓이면 DB 기반 하이브리드 추천으로 전환 가능하도록 설계

### 퀘스트 시스템
- 단기(일일) / 장기(마일스톤) / 보류 3단계 계층 구조
- 단기 퀘스트 전체 완료 시 상위 장기 퀘스트 자동 완료 (캐스케이드)
- 완료/보류/복원/삭제 상태 전환 with 불변 업데이트
- XP 보상 및 레벨 시스템

### 감정 기반 UX
- 10가지 감정 각각 고유 색상 팔레트 적용
- 감정 선택 -> 질문 -> 추천까지 세션 단위로 Supabase에 기록
- 회고 단계에서 감정 변화 before/after 추적

### 디자인 시스템
- CSS 변수 기반 디자인 토큰 (색상, 레이아웃, 간격)
- 다크모드 지원 (CSS 변수 스위칭 + localStorage 영속)
- 데스크톱/모바일 반응형 레이아웃
- 외부 UI 라이브러리 없이 Tailwind + Framer Motion으로 직접 구현

## 설계 의사결정

### 세션 중심 데이터 모델

모든 데이터를 `session_id`로 묶는 구조를 선택. 감정 → 생각 → 욕구 → 행동이 하나의 플로우로 연결되어야 "이 감정일 때 어떤 행동을 했는지" 추적이 가능하기 때문.

### XP 원장 패턴 (Ledger)

잔고를 직접 저장하지 않고, 변동(delta)을 쌓아서 SUM으로 계산. 보상 취소나 감사 추적이 필요해질 때 이력이 남아있어야 한다고 판단.

### 순수 로직 분리 → 테스트 → 리팩토링

퀘스트 페이지가 980줄까지 비대해진 후, 상태 변환 로직을 순수 함수(`questLogic.ts`)로 먼저 분리하고 테스트를 작성한 뒤, 안전하게 커스텀 훅(`useQuestActions`)으로 리팩토링. 테스트가 있으니 리팩토링 중 회귀 버그 걱정 없이 진행할 수 있었음.

### 하이브리드 추천 전략

현재는 AI가 매번 추천을 생성하지만, `survey_actions` 테이블에 선택/미선택 데이터가 쌓이고 있음. 같은 감정+생각 조합이 반복되면 DB에서 선택 빈도 높은 행동을 우선 추천하고 AI는 다양성 확보용으로만 사용하는 하이브리드 모델로 전환할 계획.

## 개발 과정에서 마주친 문제들

| 문제 | 원인 | 해결 | 문서 |
|------|------|------|------|
| 새로고침 시 퀘스트 소실 + 하이드레이션 에러 | DB 로드 함수 미호출 + SSR/CSR 텍스트 불일치 | loadQuests 호출 + isLoaded 가드 | [bug-005](docs/bugs/005-quest-hydration-mismatch.md) |
| 퀘스트 페이지 980줄 비대화 | 핸들러, UI, 로직이 한 파일에 혼재 | 순수 로직 분리 → 훅 추출 (980→580줄) | |
| DB 스키마 정규화 및 최적화 | enum 조기 도입, 이중 ID, 인덱스 부재 등 | text 전환, 복합 인덱스, user_id 제거 등 6건 마이그레이션 | [schema-review](docs/db/schema-review.md) |
| Zustand 셀렉터 무한 리렌더링 | 매 렌더마다 새 객체 반환 → 참조 비교 실패 | 개별 셀렉터로 분리 | [bug-003](docs/bugs/003-zustand-selector-infinite-loop.md) |

## 프로젝트 구조

```
src/
├── app/                    # App Router 페이지 + Server Actions
│   ├── emotion/            # 감정 선택
│   ├── question/[slug]/    # 질문 응답 (동적 라우트)
│   ├── recommend/          # AI 루틴 추천 + Server Action
│   ├── quest/              # 퀘스트 관리
│   ├── reflect/            # 회고 저널
│   ├── profile/            # 프로필 (XP, 업적, 스트릭)
│   ├── shop/               # 상점
│   ├── dashboard/          # 대시보드
│   └── api/dashboard/      # 대시보드 API 라우트
├── components/             # 공통 컴포넌트
│   ├── layout/             # AppChrome, PageMain 등
│   ├── nav/                # NavMenu, BottomBar
│   ├── ui/                 # XPBar, CurrencyHUD, Toast 등
│   ├── providers/          # Auth, Query, Theme
│   └── feedback/           # 피드백 모달
├── features/               # 기능별 컴포넌트 및 로직
│   ├── home/               # 메인 그리드 선택
│   ├── emotion/            # 감정 캐러셀
│   ├── quest/              # 퀘스트 (components, hooks, lib 분리)
│   ├── question/           # 질문 목록/상세
│   ├── recommend/          # 추천 결과
│   ├── reflect/            # 회고 (components, hooks 분리)
│   ├── profile/            # 프로필 (components, hooks 분리)
│   ├── flow/               # 세션 플로우 관리
│   └── reward/             # XP/포인트 보상 로직
├── store/                  # Zustand 스토어
├── lib/
│   ├── supabase/           # Supabase 클라이언트 + API 레이어
│   └── query/              # React Query 설정
├── types/                  # 타입 정의
├── constants/              # 라우트, 질문 상수
└── utils/                  # 유틸리티 함수
```

## Supabase 스키마

| 테이블 | 역할 |
|--------|------|
| `survey_sessions` | 세션 메타데이터 (시작/완료 시각, 상태) |
| `survey_thought` | 초기 생각 선택 (세션당 1개) |
| `survey_emotions` | 감정 선택 + 강도 (1~10) |
| `survey_desires` | 사용자 니즈 + 답변 (세션당 1개) |
| `survey_actions` | 추천/선택된 행동 — 선택 안 된 것도 저장해서 추천 분석에 활용 |
| `quests` | 퀘스트 (제목, XP, 상태, 카테고리, 부모-자식 관계) |
| `reflections` | 회고 (감정 변화 before/after + 텍스트) |
| `xp_ledger` | XP 변동 원장 (delta 누적, 잔고 미저장) |

## 설계 철학

- **감정 = 행동 트리거** : 감정을 단순 기록이 아닌 실행을 유도하는 신호로 활용 (BJ Fogg Behavior Model)
- **실행 최소화** : 5~20분 마이크로 루틴으로 시작해 자기효능감 회복
- **회고 = 루프 완성** : 행동-감정 연결을 인식하는 핵심 단계
- **익명 인증** : 가입 장벽 제거, 감정 탐색에 집중

## 문서

| 문서 | 설명 |
|------|------|
| [DB 스키마](docs/db/schema.md) | 테이블 설계, 인덱스, 추천 전략 |
| [ERD](docs/db/erd.md) | 전체 테이블 관계 + 컬럼 상세 |
| [마이그레이션 이력](docs/db/migrations.md) | 001~009 마이그레이션 목록 + 인덱스 현황 |
| [스키마 리뷰](docs/db/schema-review.md) | 설계 미흡점 6건과 개선 과정 |
| [퀘스트 스펙](docs/spec/quest-spec.md) | 퀘스트 상태 머신 및 라이프사이클 |
| [기능 로드맵](docs/feature-roadmap.md) | MVP 범위 및 향후 계획 |
| [버그 로그](docs/bugs/log.md) | 주요 이슈 해결 기록 |

## 시작하기

```bash
npm install
npm run dev
```

`.env.local`에 다음 환경 변수가 필요합니다:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
```
