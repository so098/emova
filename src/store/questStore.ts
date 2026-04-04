import { create } from "zustand";
import * as questApi from "@/lib/supabase/questApi";

export interface Quest {
  id: string;
  title: string;
  date: string;
  points: number;
  done: boolean;
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
  isLoading: boolean;
  isLoaded: boolean;
  loadQuests: () => Promise<void>;
  reloadQuests: () => Promise<void>;
  setQuests: (updater: (prev: QuestState) => QuestState) => void;
  addShortQuests: (quests: Omit<Quest, "id">[]) => Promise<void>;
}

export function today() {
  const d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export const useQuestStore = create<QuestStore>((set, get) => ({
  단기: [],
  장기: [],
  보류: [],
  isLoading: false,
  isLoaded: false,

  loadQuests: async () => {
    if (get().isLoaded) return;
    set({ isLoading: true });
    try {
      const state = await questApi.fetchQuests();
      set({ ...state, isLoaded: true });
    } catch (e) {
      console.error("Failed to load quests:", e);
    } finally {
      set({ isLoading: false });
    }
  },

  reloadQuests: async () => {
    set({ isLoading: true });
    try {
      const state = await questApi.fetchQuests();
      set({ ...state, isLoaded: true });
    } catch (e) {
      console.error("Failed to reload quests:", e);
    } finally {
      set({ isLoading: false });
    }
  },

  setQuests: (updater) =>
    set((state) => {
      const { 단기, 장기, 보류 } = updater({
        단기: state.단기,
        장기: state.장기,
        보류: state.보류,
      });
      return { 단기, 장기, 보류 };
    }),

  addShortQuests: async (quests) => {
    try {
      const inserted = await questApi.insertQuests(quests, "단기");
      set((state) => ({ 단기: [...inserted, ...state.단기] }));
    } catch (e) {
      console.error("Failed to add quests:", e);
    }
  },
}));
