"use client";

import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/store/themeStore";

export default function ThemeToggle() {
  const { theme, toggle } = useThemeStore();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "light" ? "다크 모드로 전환" : "라이트 모드로 전환"}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-glass-heavy shadow-[0_0.125rem_0.5rem_var(--shadow-card)] backdrop-blur-xl transition-colors hover:bg-surface-elevated"
    >
      {theme === "light" ? (
        <Moon size={18} className="text-text-secondary" />
      ) : (
        <Sun size={18} className="text-text-secondary" />
      )}
    </button>
  );
}
