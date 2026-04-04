import type { Quest, QuestState } from "@/store/questStore";

export type { Quest, QuestState };

export interface ToggleDoneResult {
  state: QuestState;
  /** 완료 체크된 퀘스트 (undo 시 null) */
  completed: Quest | null;
  /** 장기 100% 달성된 장기 퀘스트 (없으면 null) */
  longTermCompleted: Quest | null;
}

/** 단기 퀘스트 완료/취소 토글 + 장기 자동 완료 */
export function toggleDone(prev: QuestState, id: string): ToggleDoneResult {
  const next: QuestState = {
    ...prev,
    단기: prev.단기.map((q) => (q.id === id ? { ...q, done: !q.done } : q)),
    장기: prev.장기.map((q) => (q.id === id ? { ...q, done: !q.done } : q)),
  };

  const toggled = [...prev.단기, ...prev.장기].find((q) => q.id === id);
  const completed = toggled && !toggled.done ? toggled : null;
  let longTermCompleted: Quest | null = null;

  if (toggled && !toggled.done && toggled.parentId) {
    const pid = toggled.parentId;
    const allChildren = next.단기.filter((q) => q.parentId === pid);
    const allDone = allChildren.length > 0 && allChildren.every((q) => q.done);
    if (allDone) {
      const parent = next.장기.find((q) => q.id === pid);
      if (parent && !parent.done) {
        next.장기 = next.장기.map((q) =>
          q.id === pid ? { ...q, done: true } : q,
        );
        longTermCompleted = parent;
      }
    }
  }

  return { state: next, completed, longTermCompleted };
}

/** 복원: done → !done + 연결된 장기도 복원 */
export function restore(prev: QuestState, id: string): QuestState {
  const quest = [...prev.단기, ...prev.장기].find((q) => q.id === id);
  if (!quest) return prev;

  const next: QuestState = {
    ...prev,
    단기: prev.단기.map((q) => (q.id === id ? { ...q, done: false } : q)),
    장기: prev.장기.map((q) => (q.id === id ? { ...q, done: false } : q)),
  };

  if (quest.parentId) {
    next.장기 = next.장기.map((q) =>
      q.id === quest.parentId ? { ...q, done: false } : q,
    );
  }

  return next;
}

/** 보류로 이동 */
export function hold(prev: QuestState, id: string): QuestState {
  const fromShort = prev.단기.find((q) => q.id === id);
  const fromLong = prev.장기.find((q) => q.id === id);
  const quest = fromShort || fromLong;
  if (!quest) return prev;
  const originTab: "단기" | "장기" = fromShort ? "단기" : "장기";
  return {
    ...prev,
    단기: prev.단기.filter((q) => q.id !== id),
    장기: prev.장기.filter((q) => q.id !== id),
    보류: [...prev.보류, { ...quest, originTab }],
  };
}

/** 보류에서 원래 탭으로 복원 */
export function resume(prev: QuestState, id: string): QuestState {
  const quest = prev.보류.find((q) => q.id === id);
  if (!quest) return prev;
  const target = quest.originTab ?? "단기";
  return {
    ...prev,
    보류: prev.보류.filter((q) => q.id !== id),
    [target]: [...prev[target], { ...quest, originTab: undefined }],
  };
}

/** 삭제 */
export function remove(prev: QuestState, id: string): QuestState {
  return {
    단기: prev.단기.filter((q) => q.id !== id),
    장기: prev.장기.filter((q) => q.id !== id),
    보류: prev.보류.filter((q) => q.id !== id),
  };
}

/** 미완료를 위로, 완료를 아래로 정렬 */
export function sortByDone(list: Quest[]): Quest[] {
  return [...list.filter((q) => !q.done), ...list.filter((q) => q.done)];
}
