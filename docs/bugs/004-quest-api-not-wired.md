# 퀘스트 mutation API 미연결 — 로컬 상태만 변경, DB 동기화 누락

**날짜:** 2026-04-05

**증상:**
퀘스트 완료/보류/삭제/제목 수정 후 새로고침하면 변경사항이 전부 사라짐.

**원인:**
`questApi.ts`에 update/delete 함수 5개(`updateQuestStatus`, `updateQuestCategory`, `updateQuestTitle`, `updateQuestFields`, `deleteQuest`)가 정의되어 있었지만, `QuestPage.tsx`의 mutation 함수들이 이를 호출하지 않고 `setQuests()`로 로컬 상태만 변경하고 있었음.

`insertQuest`/`insertQuests`만 연결되어 있었고 나머지는 죽은 코드 상태.

**영향 범위:**
- `toggleDone` — 완료 처리 DB 미반영
- `handleRestore` — 완료 취소 DB 미반영
- `holdQuest` — 보류 이동 DB 미반영
- `resumeQuest` — 보류 복귀 DB 미반영
- `convertToLong` / `convertToShort` — 카테고리 전환 DB 미반영
- `deleteQuest` — 삭제 DB 미반영
- `commitInlineTitle` — 제목 수정 DB 미반영

**추가 발견:**
보류 퀘스트의 `originTab`(원래 탭)이 DB에 저장되지 않아, 장기 퀘스트를 보류했다가 새로고침하면 단기로 잘못 복원되는 버그도 함께 존재.

**수정:**
1. 각 mutation에 낙관적 업데이트 패턴 적용 (로컬 상태 먼저 변경 → 백그라운드 API 호출)
2. `questApi.updateQuestCategory`에 `originCategory` 파라미터 추가
3. `fetchQuests`에서 `origin_category` 컬럼으로 originTab 복원
4. DB 마이그레이션 `003_add_origin_category.sql` 추가

**교훈:**
API 함수를 만들어놓고 실제 호출을 빠뜨리기 쉬움. insert만 연결하고 update/delete를 잊은 전형적인 케이스. 새 API 함수 작성 후 호출 여부를 반드시 확인할 것.
