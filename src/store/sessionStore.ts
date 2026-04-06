import { create } from "zustand";

interface SessionState {
  selectedGrid: string;
  selectedEmotion: string;
  questionLabel: string;
  questionText: string;
  supabaseSessionId: string | null;
  setGrid: (label: string) => void;
  setEmotion: (label: string) => void;
  setSession: (label: string, text: string) => void;
  setSupabaseSessionId: (id: string) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  selectedGrid: "",
  selectedEmotion: "",
  questionLabel: "",
  questionText: "",
  supabaseSessionId: null,
  setGrid: (selectedGrid) => set({ selectedGrid }),
  setEmotion: (selectedEmotion) => set({ selectedEmotion }),
  setSession: (questionLabel, questionText) =>
    set({ questionLabel, questionText }),
  setSupabaseSessionId: (supabaseSessionId) => set({ supabaseSessionId }),
  reset: () => set({ selectedGrid: "", selectedEmotion: "", questionLabel: "", questionText: "", supabaseSessionId: null }),
}));
