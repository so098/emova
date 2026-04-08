# 모달 컴포넌트 현황

## 모달 목록 (6개)

### 1. MoodCheckModal

- **파일:** `features/quest/MoodCheckModal.tsx`
- **용도:** 퀘스트 완료 후 감정 확인 + 회고 유도
- **사용처:** QuestPage
- **스텝 1 텍스트:**
  - 제목: `퀘스트를 해냈네요! / 오늘 기분은 조금 달라졌나요?`
  - 감정 선택지: `조금 나아졌어요` / `그대로에요` / `잘 모르겠어요`
- **스텝 2 텍스트:**
  - 제목: `그 감정을 회고에 남겨볼까요?`
  - 서브: `'{선택한 감정}'를 선택하셨어요`
  - 버튼: `회고 남기기` (주황) / `다음에 할게요` (텍스트)

---

### 2. RoutineModal

- **파일:** `features/quest/RoutineModal.tsx`
- **용도:** 단기 루틴 추가 / 보류 탭에서 연결된 단기 퀘스트 조회
- **사용처:** QuestPage
- **일반 모드 텍스트:**
  - 제목: `오늘 할 작은 루틴 적기`
  - 서브: `작은 실천이 큰 변화를 만들어요`
  - placeholder: `오늘 할 루틴을 적어보세요`
  - 버튼: `루틴 추가` / `{N}개 루틴 추가하기` (입력 있을 때) / `다 했어요` (입력 없을 때)
- **readOnly 모드 텍스트:**
  - 제목: `연결된 단기 퀘스트`
  - 서브: `보류된 장기 퀘스트에 연결된 단기 퀘스트 목록입니다`
  - 버튼: `확인`

---

### 3. ConvertToShortModal

- **파일:** `features/quest/QuestConfirmModals.tsx`
- **용도:** 장기 퀘스트를 단기로 변환 시 확인
- **사용처:** QuestPage
- **텍스트:**
  - 본문: `현재 관련 단기 퀘스트가 있습니다.`
  - 서브(muted): `장기 퀘스트를 단기로 변경 시, 연결된 단기 퀘스트들은 전체 해제되어 별도 단기 퀘스트로 변경됩니다.`
  - 질문: `변경하시겠습니까?`
  - 버튼: `네` (주황) / `아니요` (회색)

---

### 4. DeleteQuestModal

- **파일:** `features/quest/QuestConfirmModals.tsx`
- **용도:** 퀘스트 삭제 확인
- **사용처:** QuestPage
- **자식 있을 때 텍스트:**
  - 본문: `장기 퀘스트 삭제 시 단기 퀘스트은 해제되어 별도 단기 퀘스트으로 변경하시겠어요? 아니면 단기 퀘스트도 같이 삭제하시겠어요?`
  - 버튼: `단기 퀘스트 별도 관리` (주황) / `단기 퀘스트 포함 삭제` (빨강) / `취소` (회색)
- **자식 없을 때 텍스트:**
  - 본문: `정말 삭제하시겠습니까?`
  - 버튼: `예` (주황) / `아니오` (회색)

---

### 5. RestoreModal

- **파일:** `features/quest/QuestConfirmModals.tsx`
- **용도:** 완료된 퀘스트 복원 또는 새로 생성 선택
- **사용처:** QuestPage
- **텍스트:**
  - 본문: `새로 생성하시겠어요, 기존 것을 복원하시겠어요?`
  - 서브(muted): `복원 시 받은 보상은 취소됩니다.`
  - 버튼: `복원하기` (주황) / `새로 생성하기` (회색) / `취소` (회색)

---

### 6. Summary Modal (인라인)

- **파일:** `features/reflect/ReflectPage.tsx` (별도 컴포넌트 아님)
- **용도:** 회고 제출 후 감정 변화 요약 + XP 보상 표시
- **사용처:** ReflectPage 내부
- **텍스트:**
  - 상단 배너: `오늘 하루, 고생했어요`
  - 감정 변화: `{진행 전 감정} → {진행 후 감정}`
  - 회고 요약: `"{한 줄 요약}"`
  - 보상: `경험치 +{N} XP`
  - 하단: `내일 또 봐요.`
  - 버튼: `닫기` (주황)

---

## 토스트/알림 (모달 아님)

| 컴포넌트 | 파일 | 용도 |
|---|---|---|
| ToastStack | `components/ToastStack.tsx` | 토스트 알림 (z-200, pointer-events-none) |
| CelebrationToast | `components/CelebrationToast.tsx` | 퀘스트 완료 파티클 효과 (z-200) |
| NotificationBell | `components/NotificationBell.tsx` | 알림 드롭다운 (absolute, z-30) |

---

## 공통 패턴

- **오버레이:** `fixed inset-0 z-40 bg-black/30`
- **모달 본체:** `fixed inset-x-4 top-1/2 z-50 mx-auto max-w-[24~28rem] -translate-y-1/2`
- **애니메이션:** framer-motion `AnimatePresence` + spring transition
- **z-index 체계:** 모달 오버레이 40, 모달 본체 50, 토스트 200

---

## 공통 컴포넌트 추출 후보

### 1. BaseModal (최우선)

오버레이 + 센터링 + 애니메이션을 감싸는 래퍼. 6개 모달 모두 동일 구조 반복 중.

```
props: open, onClose, maxWidth?, children
```

**적용 대상:** 모든 모달 (6개)

### 2. SurfaceCard

`rounded-2xl border border-border-default bg-surface-card-glass shadow backdrop-blur-lg` 패턴.

**적용 대상:** QuestCard, ReflectEntryCard, EmotionCardList, QuestionList, ReflectPage 등 8곳 이상

### 3. PrimaryButton / SecondaryButton

- Primary: `bg-brand-primary text-on-accent rounded-full py-3 text-sm font-bold` (+shadow 옵션)
- Secondary: `bg-[#f0f0f0] text-text-secondary rounded-full py-3 text-sm font-bold`
- Danger: `bg-[#ffe5e5] text-[#e04040] rounded-full py-3 text-sm font-bold`

**적용 대상:** 모든 모달 버튼, QuestPage CTA 등 15곳 이상

### 4. EmptyState

`"~가 없어요"` 메시지 + 선택적 CTA 버튼 패턴.

**적용 대상:** QuestPage (단기/장기/완료됨 빈 상태), ReflectEntryList

### 5. ExpandableContent

콘텐츠 truncate + 더보기/접기 토글 패턴.

**적용 대상:** QuestCard (제목 truncate), ReflectEntryCard (본문 max-h)

### 6. EmotionPill

감정 선택 토글 pill 패턴.

**적용 대상:** ReflectPage (진행 전/후 감정 선택), ReflectEntryCard (감정 표시)

---

## 현재 문제점

- 모달 6개 중 5개가 `features/quest/`에 집중, 1개는 `features/reflect/` 인라인
- `QuestConfirmModals.tsx`에 3개 모달이 한 파일에 혼재
- Summary Modal은 별도 컴포넌트로 분리되지 않고 ReflectPage에 인라인으로 존재
- 공통 모달 래퍼(오버레이 + 센터링 + 애니메이션)가 없어서 동일 코드 반복
- 버튼 스타일이 인라인 className으로 반복, 컴포넌트화 안 됨
