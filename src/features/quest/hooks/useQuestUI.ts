"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { MovaContext } from "../lib/movaMessages";

interface UseQuestUIOptions {
  initialContext: MovaContext;
}

export function useQuestUI({ initialContext }: UseQuestUIOptions) {
  const [restoreTargetId, setRestoreTargetId] = useState<string | null>(null);
  const [convertTargetId, setConvertTargetId] = useState<string | null>(null);
  const [moodCheckOpen, setMoodCheckOpen] = useState(false);
  const [movaContext, setMovaContext] = useState<MovaContext>(initialContext);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteHasChildren, setDeleteHasChildren] = useState(false);

  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => { timerRefs.current.forEach(clearTimeout); }, []);

  const trackTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timerRefs.current.push(id);
    return id;
  }, []);

  const openMenu = useCallback((id: string, btn: HTMLButtonElement) => {
    const rect = btn.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    setMenuOpenId(id);
  }, []);

  const closeMenu = useCallback(() => setMenuOpenId(null), []);

  return {
    restoreTargetId, setRestoreTargetId,
    convertTargetId, setConvertTargetId,
    moodCheckOpen, setMoodCheckOpen,
    movaContext, setMovaContext,
    editingId, setEditingId,
    menuOpenId, menuPos,
    deleteTargetId, setDeleteTargetId,
    deleteHasChildren, setDeleteHasChildren,
    trackTimeout,
    openMenu, closeMenu,
  };
}
