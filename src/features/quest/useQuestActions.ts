"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useQuestStore, today, type QuestState } from "@/store/questStore";
import { useRewardStore } from "@/store/rewardStore";
import { useToast } from "@/components/ToastStack";
import * as questApi from "@/lib/supabase/questApi";
import * as logic from "./questLogic";
import { useInvalidateQuests } from "./useQuests";
import type { MovaContext } from "./movaMessages";

export function useQuestActions(serverQuests?: QuestState) {
  const 단기 = useQuestStore((s) => s.단기);
  const 장기 = useQuestStore((s) => s.장기);
  const 보류 = useQuestStore((s) => s.보류);
  const setQuests = useQuestStore((s) => s.setQuests);
  const { showToast } = useToast();
  const invalidateQuests = useInvalidateQuests();

  // 서버 데이터를 store에 동기화
  useEffect(() => {
    if (serverQuests) {
      setQuests(() => serverQuests);
    }
  }, [serverQuests, setQuests]);

  const quests = { 단기, 장기, 보류 };

  const [restoreTargetId, setRestoreTargetId] = useState<string | null>(null);
  const [convertTargetId, setConvertTargetId] = useState<string | null>(null);
  const [moodCheckOpen, setMoodCheckOpen] = useState(false);
  const [movaContext, setMovaContext] = useState<MovaContext>(() => {
    const total = 단기.length + 장기.length;
    return total === 0 ? "empty" : "idle";
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });

  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => { timerRefs.current.forEach(clearTimeout); }, []);

  const trackTimeout = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timerRefs.current.push(id);
    return id;
  };

  const openMenu = useCallback((id: string, btn: HTMLButtonElement) => {
    const rect = btn.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    setMenuOpenId(id);
  }, []);

  const closeMenu = useCallback(() => setMenuOpenId(null), []);

  const toggleDone = (id: string) => {
    const toggled = [...quests.단기, ...quests.장기].find((q) => q.id === id);
    if (!toggled || toggled.done) return;

    setQuests((prev) => logic.toggleDone(prev, id).state);

    (async () => {
      try {
        await questApi.updateQuestStatus(id, true);
        if (toggled.parentId) {
          const remaining = quests.단기.filter(
            (q) => q.parentId === toggled.parentId && q.id !== id && !q.done,
          );
          if (remaining.length === 0) {
            const parent = quests.장기.find((q) => q.id === toggled.parentId);
            if (parent && !parent.done) {
              await questApi.updateQuestStatus(toggled.parentId, true);
            }
          }
        }
        invalidateQuests();
      } catch (e) {
        console.error("Failed to sync quest status:", e);
        showToast("저장에 실패했어요", "새로고침 후 다시 시도해주세요");
        invalidateQuests();
      }
    })();

    const { addPoints, addXP } = useRewardStore.getState();
    if (toggled.source === "ai") {
      addXP(toggled.points);
    } else {
      addPoints(toggled.points);
    }

    const rewardType = toggled.source === "ai" ? "XP" : "포인트";
    showToast(`+${toggled.points} ${rewardType} 완료!`, "");
    setMovaContext("questDone");

    if (toggled.parentId) {
      const remaining = quests.단기.filter(
        (q) => q.parentId === toggled.parentId && q.id !== id && !q.done,
      );
      if (remaining.length === 0) {
        const parent = quests.장기.find((q) => q.id === toggled.parentId);
        if (parent && !parent.done) {
          setMovaContext("longTermDone");
          trackTimeout(
            () => showToast("목표 달성!", `'${parent.title}' 완료 +${parent.points} XP`),
            2600,
          );
          trackTimeout(() => setMoodCheckOpen(true), 5200);
        }
      }
    }

    const allShortDone = quests.단기.every((q) => q.id === id || q.done);
    if (allShortDone && quests.단기.length > 0) {
      setMovaContext("allDone");
    }
  };

  const handleRestore = (id: string) => {
    setQuests((prev) => logic.restore(prev, id));

    (async () => {
      try {
        await questApi.updateQuestStatus(id, false);
        const quest = [...quests.단기, ...quests.장기].find((q) => q.id === id);
        if (quest?.parentId) {
          await questApi.updateQuestStatus(quest.parentId, false);
        }
        invalidateQuests();
      } catch (e) {
        console.error("Failed to sync restore:", e);
        showToast("복원에 실패했어요", "새로고침 후 다시 시도해주세요");
        invalidateQuests();
      }
    })();

    setRestoreTargetId(null);
  };

  const handleAddAsNew = async (id: string) => {
    const quest = [...quests.단기, ...quests.장기].find((q) => q.id === id);
    if (!quest) return;
    try {
      const inserted = await questApi.insertQuest(
        { title: quest.title, date: today(), points: 10, done: false, source: "user" },
        "단기",
      );
      setQuests((prev) => ({ ...prev, 단기: [inserted, ...prev.단기] }));
      invalidateQuests();
    } catch (e) {
      console.error("Failed to add quest:", e);
      showToast("퀘스트 추가에 실패했어요", "");
    }
    setRestoreTargetId(null);
  };

  const holdQuest = (id: string) => {
    const fromShort = quests.단기.find((q) => q.id === id);
    const originCat: "단기" | "장기" = fromShort ? "단기" : "장기";

    setQuests((prev) => logic.hold(prev, id));

    questApi.updateQuestCategory(id, "보류", originCat)
      .then(() => invalidateQuests())
      .catch((e) => {
        console.error("Failed to sync hold:", e);
        showToast("보류 처리에 실패했어요", "");
        invalidateQuests();
      });
    setMenuOpenId(null);
  };

  const resumeQuest = (id: string) => {
    const quest = quests.보류.find((q) => q.id === id);
    const target = quest?.originTab ?? "단기";

    setQuests((prev) => logic.resume(prev, id));

    questApi.updateQuestCategory(id, target)
      .then(() => invalidateQuests())
      .catch((e) => {
        console.error("Failed to sync resume:", e);
        showToast("다시 시작에 실패했어요", "");
        invalidateQuests();
      });
    setMenuOpenId(null);
  };

  const convertToLong = (id: string) => {
    setQuests((prev) => logic.convertToLong(prev, id));

    questApi.updateQuestFields(id, { category: "장기", xp_reward: 100, parent_id: null })
      .then(() => invalidateQuests())
      .catch((e) => {
        console.error("Failed to sync convert to long:", e);
        showToast("변경에 실패했어요", "");
        invalidateQuests();
      });
    setMenuOpenId(null);
  };

  const convertToShort = (id: string) => {
    const children = quests.단기.filter((q) => q.parentId === id);

    setQuests((prev) => logic.convertToShort(prev, id));

    (async () => {
      try {
        await questApi.updateQuestFields(id, { category: "단기", xp_reward: 10 });
        for (const child of children) {
          await questApi.updateQuestFields(child.id, { parent_id: null });
        }
        invalidateQuests();
      } catch (e) {
        console.error("Failed to sync convert to short:", e);
        showToast("변경에 실패했어요", "");
        invalidateQuests();
      }
    })();

    setConvertTargetId(null);
    setMenuOpenId(null);
  };

  const tryConvertToShort = (id: string) => {
    const hasChildren = quests.단기.some((q) => q.parentId === id);
    setMenuOpenId(null);
    if (hasChildren) {
      setConvertTargetId(id);
    } else {
      convertToShort(id);
    }
  };

  /** 확인 없이 바로 삭제 (빈 제목 인라인 퀘스트 등 내부용) */
  const deleteQuestSilent = (id: string) => {
    setQuests((prev) => logic.remove(prev, id));
    questApi.deleteQuest(id)
      .then(() => invalidateQuests())
      .catch((e) => {
        console.error("Failed to sync delete:", e);
        showToast("삭제에 실패했어요", "");
        invalidateQuests();
      });
  };

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteHasChildren, setDeleteHasChildren] = useState(false);

  const tryDeleteQuest = (id: string) => {
    setMenuOpenId(null);
    const hasChildren = quests.단기.some((q) => q.parentId === id);
    setDeleteHasChildren(hasChildren);
    setDeleteTargetId(id);
  };

  /** 자식 해제 후 부모만 삭제 */
  const deleteDetachChildren = (id: string) => {
    setQuests((prev) => logic.removeDetachChildren(prev, id));

    (async () => {
      try {
        // 자식 parent_id 해제는 questApi.deleteQuest 안에서 처리됨
        await questApi.deleteQuest(id);
        invalidateQuests();
      } catch (e) {
        console.error("Failed to sync delete:", e);
        showToast("삭제에 실패했어요", "");
        invalidateQuests();
      }
    })();

    setDeleteTargetId(null);
  };

  /** 부모 + 자식 모두 삭제 */
  const deleteWithChildren = (id: string) => {
    const childIds = quests.단기.filter((q) => q.parentId === id).map((q) => q.id);
    setQuests((prev) => logic.removeWithChildren(prev, id));

    (async () => {
      try {
        // 자식 먼저 삭제
        for (const childId of childIds) {
          await questApi.deleteQuest(childId);
        }
        await questApi.deleteQuest(id);
        invalidateQuests();
      } catch (e) {
        console.error("Failed to sync delete:", e);
        showToast("삭제에 실패했어요", "");
        invalidateQuests();
      }
    })();

    setDeleteTargetId(null);
  };

  const startEdit = (id: string) => {
    setEditingId(id);
    setMenuOpenId(null);
  };

  const addInlineQuest = async (tab: "단기" | "장기") => {
    const points = tab === "장기" ? 100 : 10;
    try {
      const inserted = await questApi.insertQuest(
        { title: "", date: today(), points, done: false, source: "user" },
        tab,
      );
      setQuests((prev) => ({ ...prev, [tab]: [inserted, ...prev[tab]] }));
      setEditingId(inserted.id);
      invalidateQuests();
    } catch (e) {
      console.error("Failed to add quest:", e);
      showToast("퀘스트 추가에 실패했어요", "");
    }
  };

  const commitInlineTitle = (id: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) {
      deleteQuestSilent(id);
    } else {
      setQuests((prev) => ({
        ...prev,
        단기: prev.단기.map((q) => (q.id === id ? { ...q, title: trimmed } : q)),
        장기: prev.장기.map((q) => (q.id === id ? { ...q, title: trimmed } : q)),
      }));
      questApi.updateQuestTitle(id, trimmed)
        .then(() => invalidateQuests())
        .catch((e) => {
          console.error("Failed to sync title:", e);
          showToast("제목 저장에 실패했어요", "");
        });
    }
    setEditingId(null);
  };

  const handleRoutineSubmit = async (routines: string[], parentId?: string) => {
    const newQuests = routines.map((title) => ({
      title,
      date: today(),
      points: 20,
      done: false,
      parentId,
      source: "user" as const,
    }));
    try {
      const inserted = await questApi.insertQuests(newQuests, "단기");
      setQuests((prev) => ({ ...prev, 단기: [...inserted, ...prev.단기] }));
      invalidateQuests();
    } catch (e) {
      console.error("Failed to add routines:", e);
      showToast("루틴 추가에 실패했어요", "");
    }
  };

  const restoreTarget = restoreTargetId
    ? ([...quests.단기, ...quests.장기].find((q) => q.id === restoreTargetId) ?? null)
    : null;

  return {
    quests,
    restoreTargetId, setRestoreTargetId,
    convertTargetId, setConvertTargetId,
    moodCheckOpen, setMoodCheckOpen,
    movaContext,
    editingId,
    menuOpenId, menuPos,
    restoreTarget,
    toggleDone,
    handleRestore, handleAddAsNew,
    holdQuest, resumeQuest,
    convertToLong, convertToShort, tryConvertToShort,
    deleteTargetId, setDeleteTargetId, deleteHasChildren,
    tryDeleteQuest, deleteDetachChildren, deleteWithChildren,
    startEdit, addInlineQuest, commitInlineTitle,
    handleRoutineSubmit,
    openMenu, closeMenu,
  };
}
