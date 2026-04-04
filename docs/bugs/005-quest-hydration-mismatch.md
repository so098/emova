# 퀘스트 새로고침 시 데이터 소실 + 하이드레이션 에러

**날짜:** 2026-04-05

**증상:**
1. 새로고침하면 퀘스트가 전부 사라짐
2. DB에서 로드되면서 하이드레이션 에러 발생: `Hydration failed because the server rendered text didn't match the client`

**원인:**

1. **loadQuests 미호출** — `questStore`에 `loadQuests()`가 정의되어 있었지만, `QuestPage` 마운트 시 호출하는 코드가 없었음. Zustand store 초기값(빈 배열)만 사용하다가 새로고침하면 메모리가 날아감.

2. **하이드레이션 불일치** — `loadQuests()` 추가 후, 클라이언트에서 DB 데이터를 로드하면 `QuestSidePanel`의 모바 메시지 텍스트가 서버(빈 배열 기준)와 달라짐. 서버: "퀘스트가 비어있어요" vs 클라이언트: "뭐든 좋아요, 작은 거 하나"

**수정:**

```tsx
// QuestPage.tsx
const loadQuests = useQuestStore((s) => s.loadQuests);
const isLoaded = useQuestStore((s) => s.isLoaded);

useEffect(() => {
  setMounted(true);
  loadQuests();
}, [loadQuests]);

if (!isLoaded) return null; // DB 로드 전까지 렌더링 지연 → 서버/클라이언트 일치
```

**교훈:**
- Zustand store에 DB fetch 함수를 만들었으면 마운트 시 호출하는 것까지 확인할 것
- 클라이언트에서 비동기 로드하는 데이터가 렌더 텍스트에 영향을 주면 하이드레이션 에러 발생 → 로드 완료 전까지 렌더를 지연시키거나 SSR로 전환
