# 버그 / 실수 기록

개별 파일은 `docs/bugs/` 폴더에 있습니다.

| # | 제목 | 핵심 원인 |
|---|---|---|
| [001](bugs/001-setState-sideeffect.md) | setState 업데이터 안에서 사이드이펙트 | Strict Mode 두 번 호출로 토스트 중복 |
| [002](bugs/002-server-component-function-prop.md) | 서버→클라이언트 함수 prop 전달 | 함수는 JSON 직렬화 불가 |
| [003](bugs/003-zustand-selector-infinite-loop.md) | Zustand 셀렉터 새 객체 반환 | 매 렌더마다 참조가 달라 무한 루프 |
