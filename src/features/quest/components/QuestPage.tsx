"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import RoutineModal from "./RoutineModal";
import MoodCheckModal from "./MoodCheckModal";
import QuestSidePanel from "./QuestSidePanel";
import QuestCard from "./QuestCard";
import { ConvertToShortModal, RestoreModal, DeleteQuestModal } from "./QuestConfirmModals";
import { useToast } from "@/components/feedback/ToastStack";
import { sortByDone } from "../lib/questLogic";
import { useQuestActions } from "../hooks/useQuestActions";
import { useQuests } from "../hooks/useQuests";

type Tab = "단기" | "장기" | "보류";
const TABS: Tab[] = ["단기", "장기", "보류"];

export default function QuestPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = (searchParams.get("tab") as Tab) || "단기";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalQuestId, setModalQuestId] = useState<string | null>(null);
  const [modalReadOnly, setModalReadOnly] = useState(false);
  const [showDoneOnly, setShowDoneOnly] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { data: serverQuests } = useQuests();
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
    deleteTargetId, setDeleteTargetId, deleteHasChildren,
    tryDeleteQuest, deleteDetachChildren, deleteWithChildren,
    startEdit, addInlineQuest, commitInlineTitle,
    saveMemo,
    handleRoutineSubmit,
    openMenu, closeMenu,
  } = useQuestActions(serverQuests);

  useEffect(() => { setMounted(true); }, []);

  const hasShownNewQuestToast = useRef(false);
  useEffect(() => {
    if (searchParams.get("tab") === "단기" && !hasShownNewQuestToast.current) {
      hasShownNewQuestToast.current = true;
      showToast("새로운 퀘스트를 추가했어요", "확인해보세요");
    }
  }, [searchParams, showToast]);

  const allItems = sortByDone(quests[activeTab]);
  const items = showDoneOnly ? allItems.filter((q) => q.done) : allItems;

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
      <DeleteQuestModal
        targetId={deleteTargetId}
        hasChildren={deleteHasChildren}
        onDetachAndDelete={deleteDetachChildren}
        onDeleteAll={deleteWithChildren}
        onCancel={() => setDeleteTargetId(null)}
      />
      <RoutineModal
        open={modalOpen}
        existingRoutines={
          modalQuestId
            ? quests.단기.filter((q) => q.parentId === modalQuestId).map((q) => ({ title: q.title, done: q.done }))
            : quests.단기.map((q) => ({ title: q.title, done: q.done }))
        }
        onClose={() => { setModalOpen(false); setModalReadOnly(false); }}
        onSubmit={(routines) => handleRoutineSubmit(routines, modalQuestId ?? undefined)}
        readOnly={modalReadOnly}
      />

      <div className="relative flex h-[calc(100dvh-10rem)] w-full justify-center">
        <div className="flex w-full max-w-(--ui-content-width) flex-col gap-4">
          {/* 탭 + 완료됨 필터 */}
          <div className="flex items-center gap-2">
            {TABS.map((tab) => {
              const isActive = activeTab === tab;
              const count = quests[tab].length;
              return (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setShowDoneOnly(false); }}
                  className={`relative flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                    isActive ? "" : "border-border-default hover:border-text-faint border"
                  }`}
                  style={{ color: isActive ? "var(--on-accent)" : "var(--text-muted)" }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="tab-pill"
                      className="bg-brand-primary absolute inset-0 rounded-full"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{tab}</span>
                  {count > 0 && (
                    <span
                      className={`relative z-10 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full px-1 text-[0.625rem] font-bold ${
                        isActive ? "bg-white/20 text-on-accent" : "text-text-muted"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}

            {allItems.length > 0 && activeTab !== "보류" && (
              <div className="ml-auto">
                <button
                  onClick={() => setShowDoneOnly((v) => !v)}
                  className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    showDoneOnly
                      ? "bg-interactive text-on-accent"
                      : "border border-border-default text-text-subtle"
                  }`}
                >
                  <Check size={12} strokeWidth={2.5} />
                  완료됨
                </button>
              </div>
            )}
          </div>

          {/* 퀘스트 목록 */}
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
            {items.length === 0 && (
              <div className="flex flex-1 flex-col items-center justify-center gap-3">
                <span className="text-sm font-medium text-text-subtle">
                  {showDoneOnly ? "완료된 퀘스트가 없어요" : activeTab === "보류" ? "보류된 퀘스트가 없어요" : `${activeTab} 퀘스트가 없어요`}
                </span>
                {!showDoneOnly && (activeTab === "단기" || activeTab === "장기") && (
                  <button
                    onClick={() => addInlineQuest(activeTab)}
                    className="bg-point text-on-point rounded-full px-5 py-2.5 text-sm font-bold"
                  >
                    생성하기
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
                  delete: tryDeleteQuest,
                  goToReflect: (id) => {
                    closeMenu();
                    const quest = [...quests.단기, ...quests.장기].find((q) => q.id === id);
                    const params = new URLSearchParams({ write: "true", questId: id });
                    if (quest) {
                      params.set("questTitle", quest.title);
                      if (quest.memo) params.set("questMemo", quest.memo);
                    }
                    router.push(`/reflect?${params.toString()}`);
                  },
                  saveMemo,
                  openRoutine: (id) => { setModalQuestId(id); setModalReadOnly(activeTab === "보류"); setModalOpen(true); },
                }}
              />
            ))}

          </div>

          {/* + 퀘스트 추가 (하단 고정, 퀘스트가 있을 때만) */}
          {allItems.length > 0 && (activeTab === "단기" || activeTab === "장기") && (
            <button
              onClick={() => addInlineQuest(activeTab)}
              className="bg-point text-on-point shrink-0 rounded-full py-3 text-sm font-bold"
            >
              + 퀘스트 추가
            </button>
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
