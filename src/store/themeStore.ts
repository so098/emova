import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "light",
      toggle: () =>
        set((s) => {
          const next = s.theme === "light" ? "dark" : "light";
          document.documentElement.classList.toggle("dark", next === "dark");
          return { theme: next };
        }),
    }),
    {
      name: "emova-theme",
      onRehydrateStorage: () => (state) => {
        if (state?.theme === "dark") {
          document.documentElement.classList.add("dark");
        }
      },
    },
  ),
);
