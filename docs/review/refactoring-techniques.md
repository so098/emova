# 리팩토링 기법 정리

> Martin Fowler *Refactoring* (2nd ed.) 기반 + React/프론트엔드 확장

---

## 1. 함수/메서드 단위

| 기법 | 설명 | 적용 시점 |
|---|---|---|
| **Extract Function** | 긴 함수에서 의미 있는 블록을 별도 함수로 추출 | 함수가 "그리고"로 설명되면 분리 대상 |
| **Inline Function** | 본문이 이름만큼 명확하면 호출부에 인라인 | 불필요한 간접 참조 제거 |
| **Extract Variable** | 복잡한 표현식에 설명적 변수명 부여 | 조건문이 한눈에 안 읽힐 때 |
| **Replace Temp with Query** | 임시 변수를 함수 호출로 대체 | 같은 계산이 여러 곳에서 필요할 때 |
| **Parameterize Function** | 비슷한 함수들을 파라미터로 통합 | 로직이 같고 값만 다른 함수가 2개 이상일 때 |
| **Remove Flag Argument** | boolean 파라미터를 별도 함수로 분리 | `doSomething(true)` 호출이 의미 불명확할 때 |

---

## 2. 객체/모듈 단위

| 기법 | 설명 | 적용 시점 |
|---|---|---|
| **Move Function** | 함수를 더 적절한 모듈/클래스로 이동 | 함수가 자기 모듈보다 다른 모듈의 데이터를 더 많이 쓸 때 |
| **Extract Class / Module** | 하나의 클래스가 2가지 이상 책임을 가지면 분리 | "이 클래스는 A도 하고 B도 한다" |
| **Inline Class** | 역할이 너무 작은 클래스를 다른 곳에 합침 | 분리가 오히려 이해를 방해할 때 |
| **Hide Delegate** | 중간 객체를 감춰서 의존 체인을 줄임 | `a.b().c()` 같은 체인이 반복될 때 |
| **Replace Conditional with Polymorphism** | if/switch 분기를 다형성으로 대체 | 같은 조건 분기가 여러 함수에 걸쳐 반복될 때 |
| **Replace Subclass with Delegate** | 상속 대신 위임으로 변경 | 상속 계층이 복잡해지거나 다중 축 변형이 필요할 때 |

---

## 3. 데이터 구조

| 기법 | 설명 | 적용 시점 |
|---|---|---|
| **Encapsulate Record** | 원시 객체/레코드를 클래스로 감싸서 접근 제어 | 외부에서 내부 필드를 직접 수정하는 코드가 많을 때 |
| **Replace Primitive with Object** | 문자열/숫자에 의미가 있으면 Value Object로 승격 | `status: "active"` 같은 문자열이 비교/분기에 반복 사용될 때 |
| **Split Phase** | 하나의 처리를 입력 변환 -> 계산 -> 출력 단계로 분리 | 함수가 파싱과 비즈니스 로직을 동시에 할 때 |
| **Replace Derived Variable with Query** | 파생 값을 저장하지 말고 계산 함수로 대체 | 원본이 바뀔 때 파생 값 동기화를 잊기 쉬울 때 |

---

## 4. API / 인터페이스

| 기법 | 설명 | 적용 시점 |
|---|---|---|
| **Separate Query from Modifier** (CQS) | 조회와 변경을 하나의 함수에서 하지 않기 | `getAndUpdate()` 같은 함수가 있을 때 |
| **Replace Parameter with Query** | 호출자가 넘기는 값을 함수 내부에서 직접 조회 | 호출부마다 같은 값을 계산해서 넘기고 있을 때 |
| **Preserve Whole Object** | 객체에서 값을 꺼내 넘기지 말고 객체 자체를 전달 | `fn(obj.a, obj.b, obj.c)` 파라미터가 3개 이상일 때 |
| **Remove Setting Method** | 생성 이후 변경되면 안 되는 필드의 setter 제거 | 불변이어야 할 값이 외부에서 바뀔 수 있을 때 |

---

## 5. React / 프론트엔드

| 기법 | 설명 | 적용 시점 |
|---|---|---|
| **Extract Custom Hook** | 컴포넌트에서 상태 + 로직을 훅으로 분리 | 컴포넌트가 렌더링 외에 비즈니스 로직을 직접 수행할 때 |
| **Lift State Up** | 상태를 공유가 필요한 최소 공통 조상으로 이동 | 형제 컴포넌트가 같은 상태를 필요로 할 때 |
| **Push State Down** | 상태를 실제 사용하는 자식 컴포넌트로 내림 | 부모가 들고 있지만 자식 하나만 쓸 때 |
| **Compound Component** | 관련 컴포넌트를 하나의 네임스페이스로 묶기 | `<Select>`, `<Select.Option>` 같은 패턴 |
| **Render Prop -> Hook** | render prop 패턴을 커스텀 훅으로 전환 | 렌더 트리 중첩이 깊어질 때 |
| **Colocation** | 상태/로직/스타일을 사용처 가까이 배치 | 전역에 있지만 실제론 한 곳에서만 쓰이는 코드 |

---

## 6. 이 프로젝트에서 적용한 사례

| 기법 | 적용 위치 | 내용 |
|---|---|---|
| **Extract Custom Hook** | `useQuestActions` -> `useQuestUI` + `useQuestReward` | UI 상태 10개 useState + 보상 로직을 별도 훅으로 분리 |
| **Move Function** | `features/quest/` -> `hooks/` / `lib/` / `components/` | 훅, 순수 함수, 컴포넌트를 폴더 단위로 분리 |
| **Split Phase** | `questLogic.ts` (순수 변환) + `questApi.ts` (DB) | 상태 변환 계산과 API 호출을 분리 |
| **Separate Query from Modifier** | Zustand (UI) vs React Query (서버) | 조회(React Query)와 UI 변경(Zustand)을 레이어로 분리 |
| **Extract Class / Module** | `rewardBalancing.ts` | 보상 계산 비즈니스 로직을 독립 모듈로 추출 |

---

## 참고 자료

- Martin Fowler, *Refactoring: Improving the Design of Existing Code* (2nd Edition)
- Kent Beck, *Tidy First?*
- refactoring.guru/refactoring/catalog
