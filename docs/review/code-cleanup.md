# 코드 정리 항목

> 면접관 관점에서 지적받을 수 있는 부분 + 코드 품질 개선 목록

---

## 1. 400줄 초과 컴포넌트 분리 (2개)

### QuestPage.tsx — 592줄

**섞여 있는 역할:**
- 탭 UI
- 퀘스트 카드 렌더링
- 컨텍스트 메뉴 (createPortal)
- 확인 모달 2개 (변환, 복원)
- 장기 퀘스트 프로그레스 바
- 빈 상태 + 스켈레톤

**분리 방안:**
| 새 파일 | 역할 | 예상 줄 수 |
|---|---|---|
| `QuestCard.tsx` | 카드 렌더링 + 체크/아이콘 + 포인트 + 장기 프로그레스 | ~150줄 |
| `QuestContextMenu.tsx` | createPortal 메뉴 (수정/돌려놓기/보류/삭제 등) | ~80줄 |
| `QuestConfirmModals.tsx` | 변환 확인 + 복원 확인 모달 | ~100줄 |
| `QuestPage.tsx` (축소) | 탭 + 레이아웃 + 훅 조합 | ~200줄 |

### ReflectPage.tsx — 442줄

**섞여 있는 역할:**
- 회고 작성 폼 (가이드/자유 모드)
- 감정 선택 UI
- 회고 목록 렌더링
- 요약 오버레이
- 목 데이터 (MOCK_ENTRIES)

**분리 방안:**
| 새 파일 | 역할 | 예상 줄 수 |
|---|---|---|
| `ReflectForm.tsx` | 작성 폼 (가이드/자유 모드 + 감정 선택) | ~180줄 |
| `ReflectEntryCard.tsx` | 회고 항목 카드 렌더링 | ~80줄 |
| `ReflectSummary.tsx` | 요약 오버레이 | ~60줄 |
| `ReflectPage.tsx` (축소) | 레이아웃 + 상태 조합 | ~120줄 |

---

## 2. 하드코딩 색상 정리

CLAUDE.md 규칙: "색상 하드코딩 금지 — CSS 변수 또는 globals.css 토큰 참조"

**위반 파일:**
| 파일 | 예시 | 반복 횟수 |
|---|---|---|
| `QuestPage.tsx` | `text-[#333333]`, `bg-[#f0f0f0]`, `text-[#b5b5b5]`, `text-[#777777]` | ~15곳 |
| `ReflectPage.tsx` | `text-[#777777]`, `bg-[#fffaf3]` | ~8곳 |
| `QuestSidePanel.tsx` | `bg-[#fff8ef]` | ~3곳 |
| `MoodCheckModal.tsx` | 무드 색상 `#dbeafe`, `#3b82f6` 등 하드코딩 | ~6곳 |
| `GridSection.tsx` | ITEMS 배열에 hex 색상 직접 입력 | 6곳 (이건 globals.css에 이미 변수 있음) |

**수정 방법:**
1. 반복되는 회색 계열(`#333333`, `#b5b5b5`, `#f0f0f0` 등)을 globals.css에 CSS 변수로 등록
2. 컴포넌트에서 Tailwind 테마 클래스로 교체

---

## 3. 매직넘버 상수화

**보상 값:**
| 위치 | 값 | 의미 |
|---|---|---|
| `useQuestActions.ts` | `100` / `10` | 장기/단기 퀘스트 포인트 |
| `useQuestActions.ts` | `20` | 루틴 퀘스트 포인트 |
| `RecommendList.tsx` | `20` | 추천 퀘스트 포인트 |
| `ReflectPage.tsx` | `20` | 회고 완료 XP |

→ `src/constants/rewards.ts`로 상수화

**타이밍 값:**
| 위치 | 값 | 의미 |
|---|---|---|
| `useQuestActions.ts` | `2600ms` | 장기 완료 토스트 딜레이 |
| `useQuestActions.ts` | `5200ms` | 무드체크 모달 딜레이 |
| `ToastStack.tsx` | `3000ms` | 토스트 자동 닫힘 |

→ `src/constants/timing.ts`로 상수화

---

## 4. 에러 처리 개선 (완료)

- [x] catch 블록 11개에 사용자 토스트 추가 완료
- [x] questStore 에러 상태 → QuestPage에서 토스트 (React Query 이관으로 제거됨)

---

## 우선순위

| 순위 | 항목 | 이유 |
|---|---|---|
| 1 | QuestPage 컴포넌트 분리 | 592줄, 면접에서 "왜 안 쪼갰냐" 지적 가능 |
| 2 | 하드코딩 색상 정리 | 본인이 세운 규칙 위반, 디자인 시스템 신뢰도 |
| 3 | 매직넘버 상수화 | 작은 작업, 코드 품질 체감 큼 |
| 4 | ReflectPage 분리 | 442줄, 회고 기능 완성 시 같이 작업 |
