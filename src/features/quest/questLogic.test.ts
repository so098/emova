import { describe, it, expect } from "vitest";
import {
  toggleDone,
  restore,
  hold,
  resume,
  remove,
  sortByDone,
  type QuestState,
} from "./questLogic";

function makeState(overrides?: Partial<QuestState>): QuestState {
  return {
    단기: [
      { id: "1", title: "손 씻기", date: "2026.04.03", points: 30, done: false, parentId: "10" },
      { id: "2", title: "심호흡", date: "2026.04.03", points: 20, done: false, parentId: "10" },
    ],
    장기: [
      { id: "10", title: "자격증 따기", date: "2025.06.01", points: 100, done: false },
    ],
    보류: [],
    ...overrides,
  };
}

describe("toggleDone", () => {
  it("단기 퀘스트를 완료 처리한다", () => {
    const state = makeState();
    const result = toggleDone(state, "1");

    expect(result.state.단기.find((q) => q.id === "1")?.done).toBe(true);
    expect(result.completed?.id).toBe("1");
    expect(result.longTermCompleted).toBeNull();
  });

  it("이미 완료된 단기를 undo 한다", () => {
    const state = makeState({
      단기: [
        { id: "1", title: "손 씻기", date: "2026.04.03", points: 30, done: true, parentId: "10" },
        { id: "2", title: "심호흡", date: "2026.04.03", points: 20, done: false, parentId: "10" },
      ],
    });
    const result = toggleDone(state, "1");

    expect(result.state.단기.find((q) => q.id === "1")?.done).toBe(false);
    expect(result.completed).toBeNull();
  });

  it("모든 단기 완료 시 장기도 자동 완료된다", () => {
    const state = makeState({
      단기: [
        { id: "1", title: "손 씻기", date: "2026.04.03", points: 30, done: true, parentId: "10" },
        { id: "2", title: "심호흡", date: "2026.04.03", points: 20, done: false, parentId: "10" },
      ],
    });
    const result = toggleDone(state, "2");

    expect(result.state.단기.every((q) => q.done)).toBe(true);
    expect(result.state.장기.find((q) => q.id === "10")?.done).toBe(true);
    expect(result.longTermCompleted?.id).toBe("10");
  });

  it("일부만 완료하면 장기는 완료되지 않는다", () => {
    const state = makeState({
      단기: [
        { id: "1", title: "손 씻기", date: "2026.04.03", points: 30, done: false, parentId: "10" },
        { id: "2", title: "심호흡", date: "2026.04.03", points: 20, done: false, parentId: "10" },
        { id: "3", title: "산책", date: "2026.04.03", points: 10, done: false, parentId: "10" },
      ],
    });
    const result = toggleDone(state, "1");

    expect(result.state.장기.find((q) => q.id === "10")?.done).toBe(false);
    expect(result.longTermCompleted).toBeNull();
  });

  it("parentId 없는 단기 완료 시 장기에 영향 없다", () => {
    const state = makeState({
      단기: [
        { id: "5", title: "독립 퀘스트", date: "2026.04.03", points: 10, done: false },
      ],
    });
    const result = toggleDone(state, "5");

    expect(result.state.단기.find((q) => q.id === "5")?.done).toBe(true);
    expect(result.longTermCompleted).toBeNull();
  });
});

describe("restore", () => {
  it("완료된 단기를 미완료로 복원한다", () => {
    const state = makeState({
      단기: [
        { id: "1", title: "손 씻기", date: "2026.04.03", points: 30, done: true, parentId: "10" },
      ],
    });
    const next = restore(state, "1");

    expect(next.단기.find((q) => q.id === "1")?.done).toBe(false);
  });

  it("단기 복원 시 연결된 장기도 함께 복원한다", () => {
    const state = makeState({
      단기: [
        { id: "1", title: "손 씻기", date: "2026.04.03", points: 30, done: true, parentId: "10" },
      ],
      장기: [
        { id: "10", title: "자격증 따기", date: "2025.06.01", points: 100, done: true },
      ],
    });
    const next = restore(state, "1");

    expect(next.단기.find((q) => q.id === "1")?.done).toBe(false);
    expect(next.장기.find((q) => q.id === "10")?.done).toBe(false);
  });

  it("완료된 장기를 직접 복원한다", () => {
    const state = makeState({
      장기: [
        { id: "10", title: "자격증 따기", date: "2025.06.01", points: 100, done: true },
      ],
    });
    const next = restore(state, "10");

    expect(next.장기.find((q) => q.id === "10")?.done).toBe(false);
  });
});

describe("hold / resume", () => {
  it("단기를 보류로 이동한다", () => {
    const state = makeState();
    const next = hold(state, "1");

    expect(next.단기.find((q) => q.id === "1")).toBeUndefined();
    expect(next.보류.find((q) => q.id === "1")).toBeDefined();
    expect(next.보류.find((q) => q.id === "1")?.originTab).toBe("단기");
  });

  it("장기를 보류로 이동한다", () => {
    const state = makeState();
    const next = hold(state, "10");

    expect(next.장기.find((q) => q.id === "10")).toBeUndefined();
    expect(next.보류.find((q) => q.id === "10")?.originTab).toBe("장기");
  });

  it("보류에서 원래 탭으로 복원한다", () => {
    const state = makeState({
      단기: [],
      보류: [
        { id: "1", title: "손 씻기", date: "2026.04.03", points: 30, done: false, parentId: "10", originTab: "단기" },
      ],
    });
    const next = resume(state, "1");

    expect(next.보류).toHaveLength(0);
    expect(next.단기.find((q) => q.id === "1")).toBeDefined();
    expect(next.단기.find((q) => q.id === "1")?.originTab).toBeUndefined();
  });

  it("장기 보류에서 복원 시 장기로 돌아간다", () => {
    const state = makeState({
      장기: [],
      보류: [
        { id: "10", title: "자격증 따기", date: "2025.06.01", points: 100, done: false, originTab: "장기" },
      ],
    });
    const next = resume(state, "10");

    expect(next.보류).toHaveLength(0);
    expect(next.장기.find((q) => q.id === "10")).toBeDefined();
  });
});

describe("remove", () => {
  it("단기에서 삭제한다", () => {
    const state = makeState();
    const next = remove(state, "1");
    expect(next.단기.find((q) => q.id === "1")).toBeUndefined();
  });

  it("장기에서 삭제한다", () => {
    const state = makeState();
    const next = remove(state, "10");
    expect(next.장기.find((q) => q.id === "10")).toBeUndefined();
  });

  it("보류에서 삭제한다", () => {
    const state = makeState({
      보류: [{ id: "99", title: "보류 퀘스트", date: "2026.04.03", points: 10, done: false }],
    });
    const next = remove(state, "99");
    expect(next.보류).toHaveLength(0);
  });
});

describe("sortByDone", () => {
  it("미완료를 위로, 완료를 아래로 정렬한다", () => {
    const list = [
      { id: "1", title: "a", date: "", points: 0, done: true },
      { id: "2", title: "b", date: "", points: 0, done: false },
      { id: "3", title: "c", date: "", points: 0, done: true },
      { id: "4", title: "d", date: "", points: 0, done: false },
    ];
    const sorted = sortByDone(list);

    expect(sorted[0].done).toBe(false);
    expect(sorted[1].done).toBe(false);
    expect(sorted[2].done).toBe(true);
    expect(sorted[3].done).toBe(true);
  });
});

// ─── 엣지 케이스 ────────────────────────────────────

describe("엣지 케이스", () => {
  const emptyState: QuestState = { 단기: [], 장기: [], 보류: [] };

  it("존재하지 않는 ID로 toggleDone 호출 시 상태 변경 없음", () => {
    const state = makeState();
    const result = toggleDone(state, "999");
    expect(result.state).toEqual(state);
    expect(result.completed).toBeNull();
    expect(result.longTermCompleted).toBeNull();
  });

  it("존재하지 않는 ID로 restore 호출 시 상태 변경 없음", () => {
    const state = makeState();
    expect(restore(state, "999")).toEqual(state);
  });

  it("존재하지 않는 ID로 hold 호출 시 상태 변경 없음", () => {
    const state = makeState();
    expect(hold(state, "999")).toEqual(state);
  });

  it("존재하지 않는 ID로 resume 호출 시 상태 변경 없음", () => {
    const state = makeState();
    expect(resume(state, "999")).toEqual(state);
  });

  it("존재하지 않는 ID로 remove 호출 시 상태 변경 없음", () => {
    const state = makeState();
    const next = remove(state, "999");
    expect(next.단기).toHaveLength(state.단기.length);
    expect(next.장기).toHaveLength(state.장기.length);
  });

  it("빈 상태에서 toggleDone 호출 시 에러 없음", () => {
    const result = toggleDone(emptyState, "1");
    expect(result.state).toEqual(emptyState);
  });

  it("빈 상태에서 restore/hold/resume/remove 호출 시 에러 없음", () => {
    expect(restore(emptyState, "1")).toEqual(emptyState);
    expect(hold(emptyState, "1")).toEqual(emptyState);
    expect(resume(emptyState, "1")).toEqual(emptyState);
    expect(remove(emptyState, "1")).toEqual(emptyState);
  });

  it("이미 완료된 장기에 연결된 단기를 완료해도 장기 중복 완료 안 됨", () => {
    const state = makeState({
      단기: [
        { id: "1", title: "손 씻기", date: "2026.04.03", points: 30, done: false, parentId: "10" },
      ],
      장기: [
        { id: "10", title: "자격증 따기", date: "2025.06.01", points: 100, done: true },
      ],
    });
    const result = toggleDone(state, "1");

    expect(result.state.장기.find((q) => q.id === "10")?.done).toBe(true);
    // 이미 done이었으므로 longTermCompleted는 null
    expect(result.longTermCompleted).toBeNull();
  });

  it("장기에 연결된 단기가 0개면 장기 자동 완료 안 됨", () => {
    const state = makeState({
      단기: [
        { id: "5", title: "독립 퀘스트", date: "2026.04.03", points: 10, done: false },
      ],
      장기: [
        { id: "10", title: "자격증 따기", date: "2025.06.01", points: 100, done: false },
      ],
    });
    const result = toggleDone(state, "5");

    expect(result.state.장기.find((q) => q.id === "10")?.done).toBe(false);
  });

  it("hold 후 resume하면 원래 상태와 동일하다 (라운드트립)", () => {
    const state = makeState();
    const held = hold(state, "1");
    const resumed = resume(held, "1");

    // 단기에 다시 존재
    expect(resumed.단기.find((q) => q.id === "1")).toBeDefined();
    expect(resumed.보류).toHaveLength(0);
    // originTab이 정리됨
    expect(resumed.단기.find((q) => q.id === "1")?.originTab).toBeUndefined();
  });

  it("sortByDone은 빈 배열에서도 동작한다", () => {
    expect(sortByDone([])).toEqual([]);
  });

  it("sortByDone은 전부 미완료일 때 순서 유지한다", () => {
    const list = [
      { id: "1", title: "a", date: "", points: 0, done: false },
      { id: "2", title: "b", date: "", points: 0, done: false },
    ];
    const sorted = sortByDone(list);
    expect(sorted.map((q) => q.id)).toEqual(["1", "2"]);
  });
});

// ─── 복합 시나리오 ──────────────────────────────────

describe("복합 시나리오", () => {
  it("단기 3개 중 2개 완료 → 1개 보류 → 복원 → 완료 → 장기 자동 완료", () => {
    let state = makeState({
      단기: [
        { id: "1", title: "A", date: "2026.04.03", points: 10, done: false, parentId: "10" },
        { id: "2", title: "B", date: "2026.04.03", points: 10, done: false, parentId: "10" },
        { id: "3", title: "C", date: "2026.04.03", points: 10, done: false, parentId: "10" },
      ],
    });

    // 1, 2 완료
    state = toggleDone(state, "1").state;
    state = toggleDone(state, "2").state;
    expect(state.장기.find((q) => q.id === "10")?.done).toBe(false);

    // 3 보류
    state = hold(state, "3");
    expect(state.보류).toHaveLength(1);
    expect(state.단기).toHaveLength(2);

    // 3 복원
    state = resume(state, "3");
    expect(state.단기).toHaveLength(3);
    expect(state.보류).toHaveLength(0);

    // 3 완료 → 장기 자동 완료
    const result = toggleDone(state, "3");
    expect(result.state.단기.every((q) => q.done)).toBe(true);
    expect(result.state.장기.find((q) => q.id === "10")?.done).toBe(true);
    expect(result.longTermCompleted?.id).toBe("10");
  });

  it("장기 자동 완료 → 단기 1개 restore → 장기도 함께 미완료 복원", () => {
    // 모든 단기 완료 → 장기 자동 완료
    let state = makeState({
      단기: [
        { id: "1", title: "A", date: "2026.04.03", points: 10, done: true, parentId: "10" },
        { id: "2", title: "B", date: "2026.04.03", points: 10, done: true, parentId: "10" },
      ],
      장기: [
        { id: "10", title: "자격증 따기", date: "2025.06.01", points: 100, done: true },
      ],
    });

    // 단기 1개 restore
    state = restore(state, "1");

    expect(state.단기.find((q) => q.id === "1")?.done).toBe(false);
    expect(state.장기.find((q) => q.id === "10")?.done).toBe(false);
    // 나머지 단기는 여전히 완료
    expect(state.단기.find((q) => q.id === "2")?.done).toBe(true);
  });

  it("단기 완료 → undo → 장기 미완료 유지", () => {
    let state = makeState({
      단기: [
        { id: "1", title: "A", date: "2026.04.03", points: 10, done: true, parentId: "10" },
        { id: "2", title: "B", date: "2026.04.03", points: 10, done: false, parentId: "10" },
      ],
    });

    // 2 완료 → 장기 자동 완료
    const r1 = toggleDone(state, "2");
    expect(r1.state.장기.find((q) => q.id === "10")?.done).toBe(true);

    // 2 undo
    const r2 = toggleDone(r1.state, "2");
    expect(r2.state.단기.find((q) => q.id === "2")?.done).toBe(false);
    // 장기는 toggleDone의 undo로 자동 복원되지 않음 (별도 restore 필요)
    // 따라서 장기는 여전히 done
    expect(r2.state.장기.find((q) => q.id === "10")?.done).toBe(true);
  });

  it("복수 장기 퀘스트: 하나만 완료되고 다른 것은 영향 없음", () => {
    let state: QuestState = {
      단기: [
        { id: "1", title: "A", date: "2026.04.03", points: 10, done: true, parentId: "10" },
        { id: "2", title: "B", date: "2026.04.03", points: 10, done: false, parentId: "10" },
        { id: "3", title: "C", date: "2026.04.03", points: 10, done: false, parentId: "20" },
      ],
      장기: [
        { id: "10", title: "자격증", date: "2025.06.01", points: 100, done: false },
        { id: "20", title: "운동", date: "2025.06.01", points: 100, done: false },
      ],
      보류: [],
    };

    // id:2 완료 → 장기 10 자동 완료
    const result = toggleDone(state, "2");

    expect(result.state.장기.find((q) => q.id === "10")?.done).toBe(true);
    expect(result.longTermCompleted?.id).toBe("10");
    // 장기 20은 영향 없음
    expect(result.state.장기.find((q) => q.id === "20")?.done).toBe(false);
  });

  it("삭제 후 다른 퀘스트에 영향 없음", () => {
    const state = makeState();
    const next = remove(state, "1");

    expect(next.단기).toHaveLength(1);
    expect(next.단기[0].id).toBe("2");
    expect(next.장기).toHaveLength(1);
  });
});
