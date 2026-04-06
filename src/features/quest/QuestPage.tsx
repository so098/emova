"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import RoutineModal from "@/features/quest/RoutineModal";
import MoodCheckModal from "@/features/quest/MoodCheckModal";
import QuestSidePanel from "@/features/quest/QuestSidePanel";
import QuestCard from "@/features/quest/QuestCard";
import { ConvertToShortModal, RestoreModal } from "@/features/quest/QuestConfirmModals";
import { useToast } from "@/components/ToastStack";
import { Plus } from "lucide-react";
import { sortByDone } from "./questLogic";
import { useQuestActions } from "./useQuestActions";
import { useQuests } from "./useQuests";

type Tab = "단기" | "장기" | "보류";
const TABS: Tab[] = ["단기", "장기", "보류"];

export default function QuestPage() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab) || "장기";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalQuestId, setModalQuestId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const { data: serverQuests, isLoading, error } = useQuests();
  const { showToast } = useToast();

  const {
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
    deleteQuest,
    startEdit, addInlineQuest, commitInlineTitle,
    handleRoutineSubmit,
    openMenu, closeMenu,
  } = useQuestActions(serverQuests ?? undefined);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (error) showToast("퀘스트를 불러오지 못했어요", "새로고침 후 다시 시도해주세요");
  }, [error, showToast]);

  const hasShownNewQuestToast = useRef(false);
  useEffect(() => {
    if (searchParams.get("tab") === "단기" && !hasShownNewQuestToast.current) {
      hasShownNewQuestToast.current = true;
      showToast("새로운 퀘스트를 추가했어요", "확인해보세요");
    }
  }, [searchParams, showToast]);

  const items = sortByDone(quests[activeTab]);

  if (isLoading && !serverQuests)
    return (
      <div className="relative flex min-h-[80vh] w-full items-start justify-center gap-6 px-6 pt-10">
        <div className="flex w-full max-w-[34rem] flex-col gap-4">
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface-elevated h-[2.25rem] w-[4.5rem] animate-pulse rounded-full" />
            ))}
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-surface-elevated h-[4rem] animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );

  return (
    <>
      <MoodCheckModal open={moodCheckOpen} onClose={() => setMoodCheckOpen(false)} />
      <ConvertToShortModal
        targetId={convertTargetId}
        onConfirm={convertToShort}
        onCancel={() => setConvertTargetId(null)}
      />
      <RestoreModal
        target={restoreTarget}
        onRestore={handleRestore}
        onAddAsNew={handleAddAsNew}
        onCancel={() => setRestoreTargetId(null)}
      />
      <RoutineModal
        open={modalOpen}
        existingRoutines={
          modalQuestId
            ? quests.단기.filter((q) => q.parentId === modalQuestId).map((q) => ({ title: q.title, done: q.done }))
            : quests.단기.map((q) => ({ title: q.title, done: q.done }))
        }
        onClose={() => setModalOpen(false)}
        onSubmit={(routines) => handleRoutineSubmit(routines, modalQuestId ?? undefined)}
      />

      <div className="relative flex h-[calc(100dvh-16rem)] w-full justify-center">
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
                    isActive ? "" : "border-border-default hover:border-text-faint border"
                  }`}
                  style={{ color: isActive ? "var(--on-accent)" : "var(--text-muted)" }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="tab-pill"
                      className="bg-brand-primary absolute inset-0 rounded-full shadow-[0_2px_8px_rgba(255,148,55,0.25)]"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{tab}</span>
                  {count > 0 && (
                    <span
                      className={`relative z-10 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full px-1 text-[0.625rem] font-bold ${
                        isActive ? "bg-surface-card-glass text-on-accent" : "bg-[#f0f0f0] text-[#aaaaaa]"
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
                <span className="text-sm font-medium text-[#bbbbbb]">{activeTab} 퀘스트가 없어요</span>
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

            {items.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                activeTab={activeTab}
                quests={quests}
                editing={{ id: editingId, onStart: startEdit, onCommit: commitInlineTitle }}
                menu={{ openId: menuOpenId, pos: menuPos, mounted, onOpen: openMenu, onClose: closeMenu }}
                actions={{
                  toggleDone,
                  restore: (id) => { closeMenu(); setRestoreTargetId(id); },
                  convertToLong,
                  convertToShort: tryConvertToShort,
                  hold: holdQuest,
                  resume: resumeQuest,
                  delete: deleteQuest,
                  openRoutine: (id) => { setModalQuestId(id); setModalOpen(true); },
                }}
              />
            ))}
          </div>

          {/* 추가 버튼 */}
          {activeTab !== "보류" && (
            <motion.button
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => addInlineQuest(activeTab)}
              className="mt-3 flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl border border-dashed border-[#e0d5c5] bg-[#fdfaf6] px-5 py-3.5 transition-colors hover:border-[#d4c4ad] hover:bg-[#faf5ed]"
            >
              <Plus size={16} strokeWidth={2.2} color="var(--accent-gold)" />
              <span className="text-accent-gold text-sm font-medium">퀘스트 추가</span>
            </motion.button>
          )}
        </div>

        {/* 사이드 패널 */}
        <div className="absolute top-0 left-[calc(50%+var(--ui-content-width)/2+1.5rem)] hidden lg:block">
          <QuestSidePanel 단기={quests.단기} 장기={quests.장기} movaContext={movaContext} />
        </div>
      </div>
    </>
  );
}
