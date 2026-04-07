import { create } from "zustand";

export interface Quest {
  id: string;
  title: string;
  date: string;
  points: number;
  done: boolean;
  memo?: string;
  parentId?: string;
  originTab?: "단기" | "장기";
  source?: "user" | "ai" | "survey";
}

export interface QuestState {
  단기: Quest[];
  장기: Quest[];
  보류: Quest[];
}

interface QuestStore extends QuestState {
  setQuests: (updater: (prev: QuestState) => QuestState) => void;
}

export function today() {
  const d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export const useQuestStore = create<QuestStore>((set) => ({
  단기: [],
  장기: [],
  보류: [],

  setQuests: (updater) =>
    set((state) => {
      const { 단기, 장기, 보류 } = updater({
        단기: state.단기,
        장기: state.장기,
        보류: state.보류,
      });
      return { 단기, 장기, 보류 };
    }),
}));
