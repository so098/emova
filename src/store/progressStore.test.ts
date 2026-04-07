import { describe, it, expect, beforeEach } from "vitest";
import { useProgressStore } from "./progressStore";

describe("progressStore", () => {
  beforeEach(() => {
    useProgressStore.setState({ filled: 1 });
  });

  it("초기 filled는 1이다", () => {
    expect(useProgressStore.getState().filled).toBe(1);
  });

  it("advance로 filled가 1 증가한다", () => {
    useProgressStore.getState().advance();
    expect(useProgressStore.getState().filled).toBe(2);
  });

  it("filled는 4를 초과하지 않는다", () => {
    const { advance } = useProgressStore.getState();
    advance();
    advance();
    advance();
    advance();
    advance();
    expect(useProgressStore.getState().filled).toBe(4);
  });

  it("next()는 PROGRESS_FLOW에서 다음 경로를 반환한다", () => {
    expect(useProgressStore.getState().next()).toBe("/emotion");
    useProgressStore.getState().advance();
    expect(useProgressStore.getState().next()).toBe("/question");
  });

  it("filled가 최대일 때 next()는 /를 반환한다", () => {
    useProgressStore.setState({ filled: 4 });
    expect(useProgressStore.getState().next()).toBe("/");
  });

  it("reset으로 filled가 1로 돌아간다", () => {
    useProgressStore.getState().advance();
    useProgressStore.getState().advance();
    useProgressStore.getState().reset();
    expect(useProgressStore.getState().filled).toBe(1);
  });
});
