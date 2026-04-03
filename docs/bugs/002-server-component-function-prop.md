# 서버 컴포넌트에서 함수(Icon)를 클라이언트 컴포넌트로 전달 → 직렬화 에러

**날짜:** 2026-04-03

**증상:**
`/question/[slug]` 페이지 접근 시 "메서드가 있는 개체는 넘길 수 없다"는 에러 발생.

**원인:**
Next.js의 서버 컴포넌트에서 클라이언트 컴포넌트(`"use client"`)로 props를 넘길 때, 데이터는 **JSON 직렬화**되어 전달됨.
`Question` 인터페이스에 `Icon: ElementType`이 포함되어 있는데, 이건 React 컴포넌트 = **함수**임.
함수는 JSON으로 직렬화할 수 없어서 에러가 발생.

**잘못된 코드:**
```tsx
// page.tsx (서버 컴포넌트)
const question = QUESTIONS[index];
return <QuestionDetail question={question} />;
//                     ^^^^^^^^ Icon(함수)이 포함된 채로 넘김
```

**수정:**
서버 컴포넌트에서 `Icon`을 제외한 직렬화 가능한 데이터만 넘김.

```tsx
const { Icon: _, ...serializable } = question;
return <QuestionDetail question={serializable} />;
```

**교훈:**
- 서버 → 클라이언트 props는 **직렬화 가능한 값만** 가능 (string, number, boolean, plain object, array)
- 함수, 클래스 인스턴스, React 컴포넌트(ElementType) 등은 넘길 수 없음
- 데이터 객체에 함수가 섞여 있으면 구조분해로 분리해서 넘기거나, 클라이언트 쪽에서 직접 import
