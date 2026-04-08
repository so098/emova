# 공통 API 핸들러 — 개발 계획

## 문제 정의

현재 Supabase API 레이어에 공통 패턴이 반복되고 있다.
에러 처리가 파편화되어 있어 유지보수 비용이 올라가고, 에러 종류에 따른 분기가 불가능하다.

---

## 현황 분석

### 1. `getClientId()` 6곳 복붙

questApi, movaFlowApi, reflectionApi, achievementApi, xpLedgerApi, feedbackApi — 전부 동일한 5줄짜리 함수가 각 파일에 있음.

```ts
// 6개 파일에 동일하게 존재
async function getClientId(): Promise<string> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}
```

### 2. `if (error) throw error` — 에러 분류 없음

모든 API 함수가 Supabase 에러를 그대로 throw. 인증 만료인지, 네트워크 실패인지, 유효성 위반인지 구분할 수 없다.

- questApi: 8개 throw 지점
- movaFlowApi: 9개
- reflectionApi: 6개
- xpLedgerApi: 4개

### 3. 에러 토스트 패턴 반복

`useQuestActions.ts` 하나에만 14개의 try-catch + console.error + showToast 조합이 있다.

```ts
// 이 패턴이 15회 이상 반복
try {
  await questApi.someOperation(...);
  invalidateQuests();
} catch (e) {
  console.error("Failed to [동작]:", e);
  showToast("[동작]에 실패했어요", "다시 시도해주세요");
  invalidateQuests();
}
```

### 4. 토스트 메시지 불일치

| 위치 | 메시지 | sub |
|---|---|---|
| useQuestActions | "저장에 실패했어요" | "새로고침 후 다시 시도해주세요" |
| useQuestActions | "퀘스트 추가에 실패했어요" | "" (빈 문자열) |
| ReflectPage | "저장에 실패했어요" | "다시 시도해주세요" |

같은 실패인데 sub 메시지가 있거나 없거나, 표현도 다르다.

---

## 개발 범위

3단계로 나눠서 점진적으로 적용한다.

### Phase 1: `getClientId` 통합

**파일:** `src/lib/supabase/auth.ts` (신규)

- 6개 파일의 `getClientId()`를 하나로 추출
- 기존 API 파일들은 import로 교체
- 동작 변화 없음, 순수 리팩토링

**영향 파일:**
- `src/lib/supabase/questApi.ts`
- `src/lib/supabase/movaFlowApi.ts`
- `src/lib/supabase/reflectionApi.ts`
- `src/lib/supabase/achievementApi.ts`
- `src/lib/supabase/xpLedgerApi.ts`
- `src/lib/supabase/feedbackApi.ts`

### Phase 2: 에러 래퍼 + 에러 분류

**파일:** `src/lib/supabase/apiError.ts` (신규)

Supabase 에러를 앱 에러로 변환하는 래퍼 도입.

```
분류 기준:
- AUTH_ERROR: 인증 만료, 세션 없음
- NETWORK_ERROR: fetch 실패, 타임아웃
- NOT_FOUND: 데이터 없음 (PGRST116 등)
- VALIDATION_ERROR: 제약조건 위반, 중복 키
- UNKNOWN: 그 외
```

API 함수에서 `if (error) throw error` 대신 래핑된 에러를 throw하도록 변경.
consumer 쪽에서 에러 종류에 따라 다른 처리가 가능해진다.

### Phase 3: 에러 토스트 훅 통합

**파일:** `src/hooks/useApiError.ts` (신규)

try-catch + console.error + showToast 패턴을 하나의 훅으로 통합.

```
before: 14개의 try-catch 블록마다 console.error + showToast
after:  handleApiError(e, "퀘스트 저장") → 에러 종류별 메시지 자동 생성
```

에러 종류별 기본 메시지:
- AUTH_ERROR → "로그인이 필요해요" + 로그인 유도
- NETWORK_ERROR → "네트워크 연결을 확인해주세요"
- 그 외 → "[동작]에 실패했어요" + "다시 시도해주세요"

---

## 우선순위

| Phase | 난이도 | 효과 | 비고 |
|---|---|---|---|
| 1 | 낮음 | 중복 제거 | 바로 가능, 리스크 없음 |
| 2 | 중간 | 에러 분류 기반 마련 | Phase 3의 전제 조건 |
| 3 | 중간 | 토스트 코드 대폭 감소 | Phase 2 완료 후 진행 |

---

## 건드리지 않는 것

- `serverQueries.ts`의 silent fallback 패턴 — SSR 프리페치용이라 현행 유지
- QueryClient의 retry 설정 — 현재 1회 재시도로 충분
- `error.tsx` 루트 에러 바운더리 — 별도 이슈로 분리
