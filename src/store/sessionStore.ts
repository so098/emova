import { create } from "zustand";

interface SessionState {
  questionLabel: string;
  questionText: string;
  setSession: (label: string, text: string) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  questionLabel: "",
  questionText: "",
  setSession: (questionLabel, questionText) =>
    set({ questionLabel, questionText }),
}));
