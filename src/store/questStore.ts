import { create } from "zustand";

export interface Quest {
  id: number;
  title: string;
  date: string;
  points: number;
  done: boolean;
  parentId?: number;
  originTab?: "단기" | "장기";
  source?: "user" | "ai";
}

export interface QuestState {
  단기: Quest[];
  장기: Quest[];
  보류: Quest[];
}

interface QuestStore extends QuestState {
  setQuests: (updater: (prev: QuestState) => QuestState) => void;
  addShortQuests: (quests: Quest[]) => void;
}

let nextId = 10;
export function getNextId() {
  return nextId++;
}

export function today() {
  const d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

const INITIAL: QuestState = {
  단기: [
    { id: 1, title: "따뜻한 물로 손 씻기", date: "2026.04.03", points: 30, done: false, parentId: 3, source: "ai" },
    { id: 2, title: "창문 열고 3번 심호흡", date: "2026.04.03", points: 20, done: false, parentId: 3, source: "ai" },
    { id: 4, title: "5분 스트레칭", date: "2026.04.01", points: 20, done: true, parentId: 3, source: "user" },
  ],
  장기: [
    { id: 3, title: "자격증 따기", date: "2025.06.01", points: 100, done: false, source: "user" },
  ],
  보류: [],
};

export const useQuestStore = create<QuestStore>((set) => ({
  ...INITIAL,
  setQuests: (updater) =>
    set((state) => {
      const { 단기, 장기, 보류 } = updater({ 단기: state.단기, 장기: state.장기, 보류: state.보류 });
      return { 단기, 장기, 보류 };
    }),
  addShortQuests: (quests) =>
    set((state) => ({
      단기: [...quests, ...state.단기],
    })),
}));
