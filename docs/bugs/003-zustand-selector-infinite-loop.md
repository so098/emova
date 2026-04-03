# Zustand 셀렉터에서 새 객체 반환 → 무한 리렌더링

**날짜:** 2026-04-03

**증상:**
퀘스트 페이지 진입 시 "The result of getSnapshot should be cached to avoid an infinite loop" 에러 발생.

**원인:**
Zustand의 `useStore((s) => ...)` 셀렉터가 매 렌더마다 **새 객체**를 반환하면, Zustand는 이전 값과 `===` 비교를 해서 "값이 바뀌었다"고 판단 → 리렌더링 → 또 새 객체 → 무한 루프.

**잘못된 코드:**
```ts
// 매 렌더마다 새 객체 { 단기, 장기, 보류 }를 생성 → 참조가 매번 다름
const quests = useQuestStore((s) => ({ 단기: s.단기, 장기: s.장기, 보류: s.보류 }));
```

**수정:**
개별 배열을 각각 구독하면, 배열 자체가 교체될 때만 리렌더링됨.

```ts
const 단기 = useQuestStore((s) => s.단기);
const 장기 = useQuestStore((s) => s.장기);
const 보류 = useQuestStore((s) => s.보류);
const quests = { 단기, 장기, 보류 };
```

**대안:**
`shallow` 비교를 사용할 수도 있음:
```ts
import { shallow } from "zustand/shallow";
const quests = useQuestStore(
  (s) => ({ 단기: s.단기, 장기: s.장기, 보류: s.보류 }),
  shallow
);
```

**교훈:**
- Zustand 셀렉터에서 **새 객체/배열을 생성하면 안 됨** (매번 참조가 달라서 무한 리렌더링)
- 원시값이나 store에 이미 존재하는 참조를 반환하거나, `shallow` 비교를 사용
- 여러 필드가 필요하면 개별 `useStore` 호출로 분리하는 게 가장 안전
