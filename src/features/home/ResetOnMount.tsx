"use client";

import { useEffect } from "react";
import { useSessionStore } from "@/store/sessionStore";
import { useProgressStore } from "@/store/progressStore";

export default function ResetOnMount() {
  const resetSession = useSessionStore((s) => s.reset);
  const resetProgress = useProgressStore((s) => s.reset);

  useEffect(() => {
    resetSession();
    resetProgress();
  }, [resetSession, resetProgress]);

  return null;
}
