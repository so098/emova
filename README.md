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

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) / React 19 |
| 스타일링 | Tailwind CSS v4 + CSS 변수 기반 디자인 토큰 |
| 애니메이션 | Framer Motion (spring physics, 제스처, 레이아웃 애니메이션) |
| 상태관리 | Zustand (session, quest, progress, reward, theme 5개 스토어) |
| 백엔드 | Supabase (Auth, Database) |
| AI | Claude API (Server Action으로 안전하게 호출) |
| 테스트 | Vitest |
| 폰트 | Pretendard Variable |

## 주요 기능

### AI 맞춤 루틴 추천
- Claude Haiku를 활용해 감정 상태 + 사용자 답변 기반 마이크로 루틴 생성
- Server Action으로 API 키를 클라이언트에 노출하지 않음
- 일반적인 조언이 아닌, 5~20분 내 실행 가능한 구체적 행동 제안

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

## 프로젝트 구조

```
src/
├── app/                  # App Router 페이지 + Server Actions
│   ├── emotion/          # 감정 선택
│   ├── question/[slug]/  # 질문 응답 (동적 라우트)
│   ├── recommend/        # AI 루틴 추천 + Server Action
│   ├── quest/            # 퀘스트 관리
│   └── reflect/          # 회고 저널
├── components/           # 공통 컴포넌트 (AppChrome, NavMenu, XPBar 등)
├── features/             # 기능별 컴포넌트 및 로직
│   ├── home/             # 메인 그리드 선택
│   ├── emotion/          # 감정 캐러셀
│   ├── quest/            # 퀘스트 상태 로직 + UI
│   ├── question/         # 질문 목록/상세
│   ├── recommend/        # 추천 결과
│   └── reflect/          # 회고 가이드
├── store/                # Zustand 스토어 5개
├── lib/supabase/         # Supabase 클라이언트 (브라우저/서버) + API 레이어
├── constants/            # 라우트, 질문 상수
└── utils/                # 유틸리티 함수
```

## Supabase 스키마

| 테이블 | 역할 |
|--------|------|
| `survey_sessions` | 세션 메타데이터 (시작/완료 시각, 상태) |
| `survey_thought` | 초기 생각 선택 |
| `survey_emotions` | 감정 선택 + 강도 (1~10) |
| `survey_desires` | 사용자 니즈 + 답변 |
| `survey_actions` | 추천/선택된 행동 (source: system/custom/regen) |
| `quests` | 퀘스트 (제목, XP, 상태, 부모 ID, 카테고리) |

## 설계 의도

- **감정 = 행동 트리거** : 감정을 단순 기록이 아닌 실행을 유도하는 신호로 활용 (BJ Fogg Behavior Model)
- **실행 최소화** : 5~20분 마이크로 루틴으로 시작해 자기효능감 회복
- **회고 = 루프 완성** : 행동-감정 연결을 인식하는 핵심 단계
- **익명 인증** : 가입 장벽 제거, 감정 탐색에 집중

## 문서

| 문서 | 설명 |
|------|------|
| [DB 스키마](docs/db-schema.md) | 테이블 설계, RLS 정책, 추천 전략 |
| [퀘스트 스펙](docs/quest-spec.md) | 퀘스트 상태 머신 및 라이프사이클 |
| [기능 로드맵](docs/feature-roadmap.md) | MVP 범위 및 향후 계획 |
| [버그 로그](docs/bug-log.md) | 주요 이슈 해결 기록 |

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
