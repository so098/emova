"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { today, type QuestState } from "@/store/questStore";
import { useToast } from "@/components/feedback/ToastStack";
import * as questApi from "@/lib/supabase/questApi";
import * as logic from "../lib/questLogic";
import { QUEST_KEY, useInvalidateQuests } from "./useQuests";
import { useQuestUI } from "./useQuestUI";
import { useQuestReward } from "./useQuestReward";

export function useQuestActions(serverQuests?: QuestState) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const invalidateQuests = useInvalidateQuests();
  const { grantReward, revokeReward } = useQuestReward();

  const quests: QuestState = serverQuests ?? { 단기: [], 장기: [], 보류: [] };

  const ui = useQuestUI({
    initialContext: quests.단기.length + quests.장기.length === 0 ? "empty" : "idle",
  });

  /** React Query 캐시를 낙관적으로 업데이트 */
  const setQuests = useCallback(
    (updater: (prev: QuestState) => QuestState) => {
      queryClient.setQueryData<QuestState>(QUEST_KEY, (old) => {
        const prev = old ?? { 단기: [], 장기: [], 보류: [] };
        return updater(prev);
      });
    },
    [queryClient],
  );

  // ── 퀘스트 액션 ──────────────────────────────────

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

    grantReward(toggled);
    ui.setMovaContext("questDone");

    if (toggled.parentId) {
      const remaining = quests.단기.filter(
        (q) => q.parentId === toggled.parentId && q.id !== id && !q.done,
      );
      if (remaining.length === 0) {
        const parent = quests.장기.find((q) => q.id === toggled.parentId);
        if (parent && !parent.done) {
          ui.setMovaContext("longTermDone");
          ui.trackTimeout(
            () => showToast("목표 달성!", `'${parent.title}' 완료 +${parent.points} XP`),
            2600,
          );
          ui.trackTimeout(() => ui.setMoodCheckOpen(true), 5200);
        }
      }
    }

    const allShortDone = quests.단기.every((q) => q.id === id || q.done);
    if (allShortDone && quests.단기.length > 0) {
      ui.setMovaContext("allDone");
    }
  };

  const handleRestore = (id: string) => {
    const quest = [...quests.단기, ...quests.장기].find((q) => q.id === id);
    setQuests((prev) => logic.restore(prev, id));

    if (quest) revokeReward(quest);

    (async () => {
      try {
        await questApi.updateQuestStatus(id, false);
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

    ui.setRestoreTargetId(null);
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
    ui.setRestoreTargetId(null);
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
    ui.closeMenu();
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
    ui.closeMenu();
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
    ui.closeMenu();
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

    ui.setConvertTargetId(null);
    ui.closeMenu();
  };

  const tryConvertToShort = (id: string) => {
    const hasChildren = quests.단기.some((q) => q.parentId === id);
    ui.closeMenu();
    if (hasChildren) {
      ui.setConvertTargetId(id);
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

  const tryDeleteQuest = (id: string) => {
    ui.closeMenu();
    const hasChildren = quests.단기.some((q) => q.parentId === id);
    ui.setDeleteHasChildren(hasChildren);
    ui.setDeleteTargetId(id);
  };

  /** 자식 해제 후 부모만 삭제 */
  const deleteDetachChildren = (id: string) => {
    setQuests((prev) => logic.removeDetachChildren(prev, id));

    (async () => {
      try {
        await questApi.deleteQuest(id);
        invalidateQuests();
      } catch (e) {
        console.error("Failed to sync delete:", e);
        showToast("삭제에 실패했어요", "");
        invalidateQuests();
      }
    })();

    ui.setDeleteTargetId(null);
  };

  /** 부모 + 자식 모두 삭제 */
  const deleteWithChildren = (id: string) => {
    const childIds = quests.단기.filter((q) => q.parentId === id).map((q) => q.id);
    setQuests((prev) => logic.removeWithChildren(prev, id));

    (async () => {
      try {
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

    ui.setDeleteTargetId(null);
  };

  const startEdit = (id: string) => {
    ui.setEditingId(id);
    ui.closeMenu();
  };

  const addInlineQuest = async (tab: "단기" | "장기") => {
    const points = tab === "장기" ? 100 : 10;
    try {
      const inserted = await questApi.insertQuest(
        { title: "", date: today(), points, done: false, source: "user" },
        tab,
      );
      setQuests((prev) => ({ ...prev, [tab]: [inserted, ...prev[tab]] }));
      ui.setEditingId(inserted.id);
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
    ui.setEditingId(null);
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

  const saveMemo = (id: string, memo: string) => {
    setQuests((prev) => ({
      ...prev,
      단기: prev.단기.map((q) => (q.id === id ? { ...q, memo } : q)),
      장기: prev.장기.map((q) => (q.id === id ? { ...q, memo } : q)),
    }));
    questApi.updateQuestMemo(id, memo)
      .then(() => invalidateQuests())
      .catch((e) => {
        console.error("Failed to sync memo:", e);
        showToast("메모 저장에 실패했어요", "");
      });
  };

  const restoreTarget = ui.restoreTargetId
    ? ([...quests.단기, ...quests.장기].find((q) => q.id === ui.restoreTargetId) ?? null)
    : null;

  return {
    quests,
    restoreTargetId: ui.restoreTargetId, setRestoreTargetId: ui.setRestoreTargetId,
    convertTargetId: ui.convertTargetId, setConvertTargetId: ui.setConvertTargetId,
    moodCheckOpen: ui.moodCheckOpen, setMoodCheckOpen: ui.setMoodCheckOpen,
    movaContext: ui.movaContext,
    editingId: ui.editingId,
    menuOpenId: ui.menuOpenId, menuPos: ui.menuPos,
    restoreTarget,
    toggleDone,
    handleRestore, handleAddAsNew,
    holdQuest, resumeQuest,
    convertToLong, convertToShort, tryConvertToShort,
    deleteTargetId: ui.deleteTargetId, setDeleteTargetId: ui.setDeleteTargetId,
    deleteHasChildren: ui.deleteHasChildren,
    tryDeleteQuest, deleteDetachChildren, deleteWithChildren,
    startEdit, addInlineQuest, commitInlineTitle,
    saveMemo,
    handleRoutineSubmit,
    openMenu: ui.openMenu, closeMenu: ui.closeMenu,
  };
}
