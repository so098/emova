import { describe, it, expect, beforeEach } from "vitest";
import { useSessionStore } from "./sessionStore";

describe("sessionStore", () => {
  beforeEach(() => {
    useSessionStore.getState().reset();
  });

  it("초기 상태는 모두 빈 문자열이다", () => {
    const s = useSessionStore.getState();
    expect(s.selectedGrid).toBe("");
    expect(s.selectedEmotion).toBe("");
    expect(s.questionLabel).toBe("");
    expect(s.questionText).toBe("");
  });

  it("setGrid로 그리드 선택값을 저장한다", () => {
    useSessionStore.getState().setGrid("자꾸 미루게 된다");
    expect(useSessionStore.getState().selectedGrid).toBe("자꾸 미루게 된다");
  });

  it("setEmotion으로 감정을 저장한다", () => {
    useSessionStore.getState().setEmotion("불안");
    expect(useSessionStore.getState().selectedEmotion).toBe("불안");
  });

  it("setSession으로 질문 라벨과 텍스트를 저장한다", () => {
    useSessionStore.getState().setSession("질문1", "답변 내용");
    const s = useSessionStore.getState();
    expect(s.questionLabel).toBe("질문1");
    expect(s.questionText).toBe("답변 내용");
  });

  it("reset으로 모든 값이 초기화된다", () => {
    const store = useSessionStore.getState();
    store.setGrid("test");
    store.setEmotion("불안");
    store.setSession("q", "a");
    store.reset();

    const s = useSessionStore.getState();
    expect(s.selectedGrid).toBe("");
    expect(s.selectedEmotion).toBe("");
    expect(s.questionLabel).toBe("");
    expect(s.questionText).toBe("");
  });
});
