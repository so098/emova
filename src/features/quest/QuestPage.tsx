"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import RoutineModal from "@/features/quest/RoutineModal";
import MoodCheckModal from "@/features/quest/MoodCheckModal";
import QuestSidePanel from "@/features/quest/QuestSidePanel";
import { useToast } from "@/components/ToastStack";
import {
  MoreVertical,
  Pencil,
  RotateCcw,
  Pause,
  Play,
  Trash2,
  Check,
  Target,
  Plus,
  ArrowRightLeft,
} from "lucide-react";
import type { MovaContext } from "@/features/quest/movaMessages";
import {
  useQuestStore,
  today,
  type Quest,
  type QuestState,
} from "@/store/questStore";
import { useRewardStore } from "@/store/rewardStore";
import * as questApi from "@/lib/supabase/questApi";

type Tab = "단기" | "장기" | "보류";

const TABS: Tab[] = ["단기", "장기", "보류"];

/** 미완료를 위로, 완료를 아래로 정렬 */
function sortByDone(list: Quest[]) {
  return [...list.filter((q) => !q.done), ...list.filter((q) => q.done)];
}

export default function QuestPage() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab) || "장기";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const 단기 = useQuestStore((s) => s.단기);
  const 장기 = useQuestStore((s) => s.장기);
  const 보류 = useQuestStore((s) => s.보류);
  const quests = { 단기, 장기, 보류 };
  const setQuests = useQuestStore((s) => s.setQuests);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalQuestId, setModalQuestId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const openMenu = useCallback((id: string, btn: HTMLButtonElement) => {
    const rect = btn.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    setMenuOpenId(id);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpenId(null);
  }, []);
  const [restoreTargetId, setRestoreTargetId] = useState<string | null>(null);
  const [convertTargetId, setConvertTargetId] = useState<string | null>(null);
  const [moodCheckOpen, setMoodCheckOpen] = useState(false);
  const [movaContext, setMovaContext] = useState<MovaContext>(() => {
    const total = quests.단기.length + quests.장기.length;
    if (total === 0) return "empty";
    return "idle";
  });
  const { showToast } = useToast();

  // 추천에서 넘어왔을 때 안내 토스트
  const hasShownNewQuestToast = useRef(false);
  useEffect(() => {
    if (searchParams.get("tab") === "단기" && !hasShownNewQuestToast.current) {
      hasShownNewQuestToast.current = true;
      showToast("새로운 퀘스트를 추가했어요", "확인해보세요");
    }
  }, [searchParams, showToast]);

  // 타이머 ID를 추적해서 undo/unmount 시 정리
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => {
      timerRefs.current.forEach(clearTimeout);
    };
  }, []);

  const clearTimers = () => {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
  };

  const trackTimeout = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timerRefs.current.push(id);
    return id;
  };

  const toggleDone = (id: string) => {
    // 현재 상태 읽어서 사이드이펙트 판단
    const toggled = [...quests.단기, ...quests.장기].find((q) => q.id === id);
    if (!toggled || toggled.done) return;

    // 상태 업데이트 (순수)
    setQuests((prev) => {
      const next: QuestState = {
        ...prev,
        단기: prev.단기.map((q) => (q.id === id ? { ...q, done: true } : q)),
        장기: prev.장기.map((q) => (q.id === id ? { ...q, done: true } : q)),
      };

      // 장기 100% 달성 체크
      if (toggled && !toggled.done && toggled.parentId) {
        const pid = toggled.parentId;
        const allChildren = next.단기.filter((q) => q.parentId === pid);
        const allDone =
          allChildren.length > 0 && allChildren.every((q) => q.done);
        if (allDone) {
          const parent = next.장기.find((q) => q.id === pid);
          if (parent && !parent.done) {
            next.장기 = next.장기.map((q) =>
              q.id === pid ? { ...q, done: true } : q,
            );
          }
        }
      }

      return next;
    });

    // 보상 지급
    const { addPoints, addXP } = useRewardStore.getState();
    if (toggled.source === "ai") {
      addXP(toggled.points);
    } else {
      addPoints(toggled.points);
    }

    // 사이드이펙트 (토스트/모달) — setQuests 밖에서 실행
    if (toggled && !toggled.done) {
      const rewardType = toggled.source === "ai" ? "XP" : "포인트";
      showToast(`+${toggled.points} ${rewardType} 완료!`, "");
      setMovaContext("questDone");

      // 장기 100% 달성 체크
      if (toggled.parentId) {
        const pid = toggled.parentId;
        const remaining = quests.단기.filter(
          (q) => q.parentId === pid && q.id !== id && !q.done,
        );
        if (remaining.length === 0) {
          const parent = quests.장기.find((q) => q.id === pid);
          if (parent && !parent.done) {
            setMovaContext("longTermDone");
            trackTimeout(
              () =>
                showToast(
                  `목표 달성!`,
                  `'${parent.title}' 완료 +${parent.points} XP`,
                ),
              2600,
            );
            trackTimeout(() => setMoodCheckOpen(true), 5200);
          }
        }
      }

      // 전부 완료 체크
      const allShortDone = quests.단기.every((q) => q.id === id || q.done);
      if (allShortDone && quests.단기.length > 0) {
        setMovaContext("allDone");
      }
    } else {
      clearTimers();
    }
  };

  /** 돌려놓기: done → !done + 장기가 done이면 장기도 복원 */
  const handleRestore = (id: string) => {
    setQuests((prev) => {
      const tab = prev.단기.find((q) => q.id === id) ? "단기" : "장기";
      const quest = prev[tab].find((q) => q.id === id);
      if (!quest) return prev;

      const next: QuestState = {
        ...prev,
        단기: prev.단기.map((q) => (q.id === id ? { ...q, done: false } : q)),
        장기: [...prev.장기],
      };

      // parentId가 있고 해당 장기가 done이면 장기도 복원
      if (quest.parentId) {
        next.장기 = next.장기.map((q) =>
          q.id === quest.parentId ? { ...q, done: false } : q,
        );
      }

      return next;
    });
    setRestoreTargetId(null);
  };

  /** 새 단기로 추가: 완료 항목 유지 + 동일 제목의 새 단기 생성 */
  const handleAddAsNew = async (id: string) => {
    const quest = [...quests.단기, ...quests.장기].find((q) => q.id === id);
    if (!quest) return;
    try {
      const inserted = await questApi.insertQuest(
        { title: quest.title, date: today(), points: 10, done: false, source: "user" },
        "단기",
      );
      setQuests((prev) => ({ ...prev, 단기: [inserted, ...prev.단기] }));
    } catch (e) {
      console.error("Failed to add quest:", e);
    }
    setRestoreTargetId(null);
  };

  /** 보류로 이동 */
  const holdQuest = (id: string) => {
    setQuests((prev) => {
      const fromShort = prev.단기.find((q) => q.id === id);
      const fromLong = prev.장기.find((q) => q.id === id);
      const quest = fromShort || fromLong;
      if (!quest) return prev;
      const originTab: "단기" | "장기" = fromShort ? "단기" : "장기";
      return {
        ...prev,
        단기: prev.단기.filter((q) => q.id !== id),
        장기: prev.장기.filter((q) => q.id !== id),
        보류: [...prev.보류, { ...quest, originTab }],
      };
    });
    setMenuOpenId(null);
  };

  /** 보류에서 원래 탭으로 복원 */
  const resumeQuest = (id: string) => {
    setQuests((prev) => {
      const quest = prev.보류.find((q) => q.id === id);
      if (!quest) return prev;
      const target = quest.originTab ?? "단기";
      return {
        ...prev,
        보류: prev.보류.filter((q) => q.id !== id),
        [target]: [...prev[target], { ...quest, originTab: undefined }],
      };
    });
    setMenuOpenId(null);
  };

  /** 단기 → 장기로 변환 */
  const convertToLong = (id: string) => {
    setQuests((prev) => {
      const quest = prev.단기.find((q) => q.id === id);
      if (!quest) return prev;
      return {
        ...prev,
        단기: prev.단기.filter((q) => q.id !== id),
        장기: [{ ...quest, parentId: undefined, points: 100 }, ...prev.장기],
      };
    });
    setMenuOpenId(null);
  };

  /** 장기 → 단기로 변환 (연결된 단기의 parentId 해제) */
  const convertToShort = (id: string) => {
    setQuests((prev) => {
      const quest = prev.장기.find((q) => q.id === id);
      if (!quest) return prev;
      return {
        ...prev,
        장기: prev.장기.filter((q) => q.id !== id),
        단기: [
          { ...quest, points: 10 },
          ...prev.단기.map((q) =>
            q.parentId === id ? { ...q, parentId: undefined } : q,
          ),
        ],
      };
    });
    setConvertTargetId(null);
    setMenuOpenId(null);
  };

  /** 장기→단기 변환 시도: 연결된 단기가 있으면 모달, 없으면 바로 변환 */
  const tryConvertToShort = (id: string) => {
    const hasChildren = quests.단기.some((q) => q.parentId === id);
    setMenuOpenId(null);
    if (hasChildren) {
      setConvertTargetId(id);
    } else {
      convertToShort(id);
    }
  };

  const openRoutineModal = (questId: string) => {
    setModalQuestId(questId);
    setModalOpen(true);
  };

  const deleteQuest = (id: string) => {
    setQuests((prev) => ({
      단기: prev.단기.filter((q) => q.id !== id),
      장기: prev.장기.filter((q) => q.id !== id),
      보류: prev.보류.filter((q) => q.id !== id),
    }));
    setMenuOpenId(null);
  };

  const startEdit = (id: string) => {
    setEditingId(id);
    setMenuOpenId(null);
  };

  const addInlineQuest = async (tab: Tab) => {
    if (tab === "보류") return;
    const points = tab === "장기" ? 100 : 10;
    try {
      const inserted = await questApi.insertQuest(
        { title: "", date: today(), points, done: false, source: "user" },
        tab,
      );
      setQuests((prev) => ({ ...prev, [tab]: [inserted, ...prev[tab]] }));
      setEditingId(inserted.id);
    } catch (e) {
      console.error("Failed to add quest:", e);
    }
  };

  const commitInlineTitle = (id: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) {
      deleteQuest(id);
    } else {
      setQuests((prev) => ({
        ...prev,
        단기: prev.단기.map((q) =>
          q.id === id ? { ...q, title: trimmed } : q,
        ),
        장기: prev.장기.map((q) =>
          q.id === id ? { ...q, title: trimmed } : q,
        ),
      }));
    }
    setEditingId(null);
  };

  const handleRoutineSubmit = async (routines: string[]) => {
    const parentId = modalQuestId ?? undefined;
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
    } catch (e) {
      console.error("Failed to add routines:", e);
    }
  };

  const items = sortByDone(quests[activeTab]);

  const restoreTarget = restoreTargetId
    ? ([...quests.단기, ...quests.장기].find((q) => q.id === restoreTargetId) ??
      null)
    : null;

  return (
    <>
      <MoodCheckModal
        open={moodCheckOpen}
        onClose={() => setMoodCheckOpen(false)}
      />

      {/* 장기→단기 변환 확인 모달 */}
      <AnimatePresence>
        {convertTargetId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConvertTargetId(null)}
              className="fixed inset-0 z-40 bg-black/30"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="bg-surface fixed inset-x-4 top-1/2 z-50 mx-auto flex max-w-[24rem] -translate-y-1/2 flex-col gap-5 rounded-2xl px-5 pt-6 pb-5 shadow-[0_8px_32px_rgba(0,0,0,0.15)]"
            >
              <p className="text-sm leading-relaxed font-medium text-[#333333]">
                현재 관련 단기 프로젝트가 있습니다.
                <br />
                <br />
                <span className="text-text-muted">
                  장기 프로젝트를 단기로 변경 시, 연결된 단기 프로젝트들은 전체
                  해제되어 별도 단기 프로젝트로 변경됩니다.
                </span>
                <br />
                <br />
                변경하시겠습니까?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => convertToShort(convertTargetId)}
                  className="bg-brand-primary text-on-accent flex-1 rounded-full py-3 text-sm font-bold"
                >
                  네
                </button>
                <button
                  onClick={() => setConvertTargetId(null)}
                  className="text-text-secondary flex-1 rounded-full bg-[#f0f0f0] py-3 text-sm font-bold"
                >
                  아니요
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 돌려놓기 확인 모달 */}
      <AnimatePresence>
        {restoreTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRestoreTargetId(null)}
              className="fixed inset-0 z-40 bg-black/30"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="bg-surface fixed inset-x-4 top-1/2 z-50 mx-auto flex max-w-[24rem] -translate-y-1/2 flex-col gap-5 rounded-2xl px-5 pt-6 pb-5 shadow-[0_8px_32px_rgba(0,0,0,0.15)]"
            >
              <p className="text-sm leading-relaxed font-medium text-[#333333]">
                새로 생성하시겠어요, 기존 것을 복원하시겠어요?
                <br />
                <span className="text-text-muted">
                  복원 시 받은 보상은 취소됩니다.
                </span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleRestore(restoreTarget.id)}
                  className="bg-brand-primary text-on-accent flex-1 rounded-full py-3 text-sm font-bold"
                >
                  복원하기
                </button>
                <button
                  onClick={() => handleAddAsNew(restoreTarget.id)}
                  className="text-text-secondary flex-1 rounded-full bg-[#f0f0f0] py-3 text-sm font-bold"
                >
                  새로 생성하기
                </button>
                <button
                  onClick={() => setRestoreTargetId(null)}
                  className="text-text-secondary flex-1 rounded-full bg-[#f0f0f0] py-3 text-sm font-bold"
                >
                  취소
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <RoutineModal
        open={modalOpen}
        existingRoutines={
          modalQuestId
            ? quests.단기
                .filter((q) => q.parentId === modalQuestId)
                .map((q) => ({ title: q.title, done: q.done }))
            : quests.단기.map((q) => ({ title: q.title, done: q.done }))
        }
        onClose={() => setModalOpen(false)}
        onSubmit={handleRoutineSubmit}
      />
      <div className="relative flex h-[calc(100dvh-16rem)] w-full justify-center">
        {/* 메인 퀘스트 리스트 */}
        <div className="flex w-full max-w-(--ui-content-width) flex-col gap-4">
          {/* 탭 */}
          <div className="flex gap-2">
            {TABS.map((tab) => {
              const isActive = activeTab === tab;
              const count = quests[tab].length;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-bold transition-all ${
                    isActive
                      ? ""
                      : "border-border-default border hover:border-text-faint"
                  }`}
                  style={{
                    color: isActive ? "var(--on-accent)" : "var(--text-muted)",
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="tab-pill"
                      className="bg-brand-primary absolute inset-0 rounded-full shadow-[0_2px_8px_rgba(255,148,55,0.25)]"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                  <span className="relative z-10">{tab}</span>
                  {count > 0 && (
                    <span
                      className={`relative z-10 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full px-1 text-[0.625rem] font-bold ${
                        isActive
                          ? "bg-surface-card-glass text-on-accent"
                          : "bg-[#f0f0f0] text-[#aaaaaa]"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 퀘스트 목록 */}
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
            {items.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 py-16">
                <span className="text-sm font-medium text-[#bbbbbb]">
                  {activeTab} 퀘스트가 없어요
                </span>
                {activeTab !== "보류" && (
                  <button
                    onClick={() => addInlineQuest(activeTab)}
                    className="bg-brand-primary text-on-accent rounded-full px-5 py-2.5 text-sm font-bold shadow-[0_4px_12px_rgba(255,148,55,0.4)]"
                  >
                    추가하기
                  </button>
                )}
              </div>
            )}

            {items.map((quest) => {
              const parentLabel =
                activeTab === "단기" && quest.parentId
                  ? quests.장기.find((q) => q.id === quest.parentId)?.title
                  : null;

              return (
                <motion.div
                  key={quest.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: quest.done ? 0.55 : 1, y: 0 }}
                  className="bg-surface-card-glass border-border-card-glass flex min-h-[7.5rem] flex-col rounded-2xl border px-5 py-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)] backdrop-blur-lg"
                >
                  {/* 상단: 메타 + 메뉴 */}
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {parentLabel && (
                        <>
                          <span className="text-brand-primary text-xs font-semibold">
                            {parentLabel}
                          </span>
                          <span className="text-[#d9d9d9]">·</span>
                        </>
                      )}
                      <span className="text-xs text-[#b5b5b5]">
                        {quest.date}
                      </span>
                    </div>
                    <div>
                      <button
                        onClick={(e) =>
                          menuOpenId === quest.id
                            ? closeMenu()
                            : openMenu(quest.id, e.currentTarget)
                        }
                        className="text-text-faint hover:text-text-muted -mr-1 rounded-md p-1"
                      >
                        <MoreVertical size={16} strokeWidth={2} />
                      </button>
                      {menuOpenId === quest.id &&
                        mounted &&
                        createPortal(
                          <>
                            <div
                              className="fixed inset-0 z-[100]"
                              onClick={closeMenu}
                            />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: -4 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              transition={{ duration: 0.15 }}
                              className="border-border-default bg-surface fixed z-[101] flex min-w-[8rem] flex-col gap-0.5 rounded-[0.875rem] border p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
                              style={{ top: menuPos.top, right: menuPos.right }}
                            >
                              {!quest.done && (
                                <button
                                  onClick={() => startEdit(quest.id)}
                                  className="flex items-center gap-2.5 rounded-[0.625rem] px-3 py-2.5 text-left text-[0.8125rem] font-medium text-[#333333] hover:bg-[#f5f5f5]"
                                >
                                  <Pencil
                                    size={15}
                                    strokeWidth={1.5}
                                    color="#555"
                                  />
                                  수정
                                </button>
                              )}
                              {quest.done && activeTab !== "보류" && (
                                <button
                                  onClick={() => {
                                    closeMenu();
                                    setRestoreTargetId(quest.id);
                                  }}
                                  className="text-brand-primary flex items-center gap-2.5 rounded-[0.625rem] px-3 py-2.5 text-left text-[0.8125rem] font-medium hover:bg-[#fff8f0]"
                                >
                                  <RotateCcw size={15} strokeWidth={1.5} />
                                  돌려놓기
                                </button>
                              )}
                              {activeTab === "단기" && !quest.done && (
                                <button
                                  onClick={() => convertToLong(quest.id)}
                                  className="flex items-center gap-2.5 rounded-[0.625rem] px-3 py-2.5 text-left text-[0.8125rem] font-medium text-[#777777] hover:bg-[#f5f5f5]"
                                >
                                  <ArrowRightLeft
                                    size={15}
                                    strokeWidth={1.5}
                                    color="#777"
                                  />
                                  장기로 변경
                                </button>
                              )}
                              {activeTab === "장기" && !quest.done && (
                                <button
                                  onClick={() => tryConvertToShort(quest.id)}
                                  className="flex items-center gap-2.5 rounded-[0.625rem] px-3 py-2.5 text-left text-[0.8125rem] font-medium text-[#777777] hover:bg-[#f5f5f5]"
                                >
                                  <ArrowRightLeft
                                    size={15}
                                    strokeWidth={1.5}
                                    color="#777"
                                  />
                                  단기로 변경
                                </button>
                              )}
                              {activeTab !== "보류" && (
                                <button
                                  onClick={() => holdQuest(quest.id)}
                                  className="text-text-muted flex items-center gap-2.5 rounded-[0.625rem] px-3 py-2.5 text-left text-[0.8125rem] font-medium hover:bg-[#f5f5f5]"
                                >
                                  <Pause
                                    size={15}
                                    strokeWidth={1.5}
                                    color="#999"
                                  />
                                  보류
                                </button>
                              )}
                              {activeTab === "보류" && (
                                <>
                                  <button
                                    onClick={() => resumeQuest(quest.id)}
                                    className="text-brand-primary flex items-center gap-2.5 rounded-[0.625rem] px-3 py-2.5 text-left text-[0.8125rem] font-medium hover:bg-[#fff8f0]"
                                  >
                                    <Play size={15} strokeWidth={1.5} />
                                    다시 시작
                                  </button>
                                  <div className="mx-2 my-0.5 h-px bg-[#f0f0f0]" />
                                  <button
                                    onClick={() => deleteQuest(quest.id)}
                                    className="text-accent-red flex items-center gap-2.5 rounded-[0.625rem] px-3 py-2.5 text-left text-[0.8125rem] font-medium hover:bg-[#fff5f5]"
                                  >
                                    <Trash2 size={15} strokeWidth={1.5} />
                                    삭제
                                  </button>
                                </>
                              )}
                            </motion.div>
                          </>,
                          document.body,
                        )}
                    </div>
                  </div>

                  {/* 메인: 체크/아이콘 + 제목 + 포인트 */}
                  <div className="flex items-center gap-3">
                    {activeTab === "단기" && (
                      <motion.button
                        onClick={() => toggleDone(quest.id)}
                        whileTap={{ scale: 0.8 }}
                        animate={quest.done ? { scale: [1, 1.25, 1] } : {}}
                        transition={{ duration: 0.3 }}
                        className="h-[1.625rem] w-[1.625rem] shrink-0 rounded-full border-[2px] transition-colors"
                        style={{
                          borderColor: quest.done
                            ? "var(--ui-button-primary)"
                            : "#d4d4d4",
                          background: quest.done
                            ? "var(--ui-button-primary)"
                            : "transparent",
                        }}
                      >
                        {quest.done && (
                          <Check
                            size={14}
                            strokeWidth={2.2}
                            color="white"
                            className="mx-auto"
                          />
                        )}
                      </motion.button>
                    )}
                    {activeTab === "장기" && (
                      <div
                        className={`flex h-[1.625rem] w-[1.625rem] shrink-0 items-center justify-center rounded-full ${
                          quest.done ? "bg-[#e0e0e0]" : "bg-accent-gold-bg"
                        }`}
                      >
                        {quest.done ? (
                          <Check size={14} strokeWidth={2} color="#aaa" />
                        ) : (
                          <Target
                            size={14}
                            strokeWidth={1.5}
                            color="var(--accent-gold)"
                          />
                        )}
                      </div>
                    )}

                    {editingId === quest.id ? (
                      <input
                        type="text"
                        defaultValue={quest.title}
                        autoFocus
                        placeholder="퀘스트를 입력하세요"
                        onBlur={(e) =>
                          commitInlineTitle(quest.id, e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            commitInlineTitle(quest.id, e.currentTarget.value);
                        }}
                        className="text-text-primary placeholder:text-text-faint flex-1 text-[0.9375rem] font-semibold outline-none"
                      />
                    ) : (
                      <span
                        className={`flex-1 text-[0.9375rem] font-semibold ${
                          quest.done
                            ? "text-[#b5b5b5] line-through"
                            : "text-text-primary"
                        }`}
                      >
                        {quest.title}
                      </span>
                    )}

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                        quest.done
                          ? "bg-[#f0f0f0] text-[#b5b5b5]"
                          : "text-accent-gold bg-[#fff5e9]"
                      }`}
                    >
                      +{quest.points}
                    </span>
                  </div>

                  {/* 장기 탭: 프로그레스 + CTA */}
                  {activeTab === "장기" &&
                    !quest.done &&
                    (() => {
                      const children = quests.단기.filter(
                        (q) => q.parentId === quest.id,
                      );
                      const total = children.length;
                      const doneCount = children.filter((q) => q.done).length;
                      const percent =
                        total > 0 ? Math.round((doneCount / total) * 100) : 0;
                      return (
                        <div className="mt-3 flex flex-col gap-2.5 border-t border-[#f0f0f0] pt-3">
                          {total > 0 && (
                            <div className="flex items-center gap-3">
                              <div className="h-[0.3125rem] flex-1 overflow-hidden rounded-full bg-[#f0f0f0]">
                                <motion.div
                                  className="bg-brand-primary h-full rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percent}%` }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 30,
                                  }}
                                />
                              </div>
                              <span className="text-accent-gold text-xs font-bold">
                                {doneCount}/{total}
                              </span>
                            </div>
                          )}
                          <button
                            onClick={() => openRoutineModal(quest.id)}
                            className="hover:text-accent-gold text-left text-sm font-medium text-[#b5b5b5] transition-colors"
                          >
                            + 오늘의 작은 실천 추가
                          </button>
                        </div>
                      );
                    })()}

                  {/* 보류 탭: 원래 탭 표시 */}
                  {activeTab === "보류" && quest.originTab && (
                    <div className="mt-2.5">
                      <span className="rounded-full bg-[#f5f5f5] px-2.5 py-1 text-xs font-medium text-[#b5b5b5]">
                        {quest.originTab}에서 보류됨
                      </span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* 추가 버튼 — 하단 고정 */}
          {activeTab !== "보류" && (
            <motion.button
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => addInlineQuest(activeTab)}
              className="mt-3 flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl border border-dashed border-[#e0d5c5] bg-[#fdfaf6] px-5 py-3.5 transition-colors hover:border-[#d4c4ad] hover:bg-[#faf5ed]"
            >
              <Plus size={16} strokeWidth={2.2} color="var(--accent-gold)" />
              <span className="text-accent-gold text-sm font-medium">
                퀘스트 추가
              </span>
            </motion.button>
          )}
        </div>

        {/* 데스크톱 사이드 패널 — 메인 오른쪽에 absolute 배치 */}
        <div className="absolute top-0 left-[calc(50%+var(--ui-content-width)/2+1.5rem)] hidden lg:block">
          <QuestSidePanel
            단기={quests.단기}
            장기={quests.장기}
            movaContext={movaContext}
          />
        </div>
      </div>
    </>
  );
}
