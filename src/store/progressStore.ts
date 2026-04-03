import { create } from "zustand";
import { PROGRESS_FLOW } from "@/constants/routes";

interface ProgressState {
  filled: number;
  next: () => string;
  advance: () => void;
  reset: () => void;
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  filled: 1,
  next: () => PROGRESS_FLOW[get().filled] ?? "/",
  advance: () => set((s) => ({ filled: Math.min(s.filled + 1, 4) })),
  reset: () => set({ filled: 1 }),
}));
