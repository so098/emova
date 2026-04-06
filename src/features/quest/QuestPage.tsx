"use client";

import { useState, useEffect, useRef } from "react";
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

  useEffect(() => {
    setMounted(true);
  }, []);

  // 서버 에러 → 토스트
  useEffect(() => {
    if (error) {
      showToast("퀘스트를 불러오지 못했어요", "새로고침 후 다시 시도해주세요");
    }
  }, [error, showToast]);

  // 추천에서 넘어왔을 때 안내 토스트
  const hasShownNewQuestToast = useRef(false);
  useEffect(() => {
    if (searchParams.get("tab") === "단기" && !hasShownNewQuestToast.current) {
      hasShownNewQuestToast.current = true;
      showToast("새로운 퀘스트를 추가했어요", "확인해보세요");
    }
  }, [searchParams, showToast]);

  const openRoutineModal = (questId: string) => {
    setModalQuestId(questId);
    setModalOpen(true);
  };

  const items = sortByDone(quests[activeTab]);

  if (isLoading && !serverQuests)
    return (
      <div className="relative flex min-h-[80vh] w-full items-start justify-center gap-6 px-6 pt-10">
        <div className="flex w-full max-w-[34rem] flex-col gap-4">
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-surface-elevated h-[2.25rem] w-[4.5rem] animate-pulse rounded-full"
              />
            ))}
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-surface-elevated h-[4rem] animate-pulse rounded-2xl"
            />
          ))}
        </div>
      </div>
    );

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
        onSubmit={(routines) =>
          handleRoutineSubmit(routines, modalQuestId ?? undefined)
        }
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
                      : "border-border-default hover:border-text-faint border"
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
                                  <Pencil size={15} strokeWidth={1.5} color="#555" />
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
                                  <ArrowRightLeft size={15} strokeWidth={1.5} color="#777" />
                                  장기로 변경
                                </button>
                              )}
                              {activeTab === "장기" && !quest.done && (
                                <button
                                  onClick={() => tryConvertToShort(quest.id)}
                                  className="flex items-center gap-2.5 rounded-[0.625rem] px-3 py-2.5 text-left text-[0.8125rem] font-medium text-[#777777] hover:bg-[#f5f5f5]"
                                >
                                  <ArrowRightLeft size={15} strokeWidth={1.5} color="#777" />
                                  단기로 변경
                                </button>
                              )}
                              {activeTab !== "보류" && (
                                <button
                                  onClick={() => holdQuest(quest.id)}
                                  className="text-text-muted flex items-center gap-2.5 rounded-[0.625rem] px-3 py-2.5 text-left text-[0.8125rem] font-medium hover:bg-[#f5f5f5]"
                                >
                                  <Pause size={15} strokeWidth={1.5} color="#999" />
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

        {/* 데스크톱 사이드 패널 */}
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
