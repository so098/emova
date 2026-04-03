"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import RoutineModal from "@/features/quest/RoutineModal";
import CelebrationToast from "@/components/CelebrationToast";

type Tab = "단기" | "장기";

interface Quest {
  id: number;
  title: string;
  date: string;
  points: number;
  done: boolean;
  parentId?: number; // 장기 퀘스트 ID (단기만 해당)
}

interface QuestState {
  단기: Quest[];
  장기: Quest[];
}

const MOCK_QUESTS: QuestState = {
  단기: [
    { id: 1, title: "따뜻한 물로 손 씻기", date: "2026.04.03", points: 30, done: false, parentId: 3 },
    { id: 2, title: "창문 열고 3번 심호흡", date: "2026.04.03", points: 20, done: false, parentId: 3 },
    { id: 4, title: "5분 스트레칭", date: "2026.04.01", points: 20, done: true, parentId: 3 },
  ],
  장기: [
    { id: 3, title: "자격증 따기", date: "2025.06.01", points: 100, done: false },
  ],
};

const TABS: Tab[] = ["단기", "장기"];

let nextId = 10;

/** 미완료를 위로, 완료를 아래로 정렬 */
function sortByDone(list: Quest[]) {
  return [...list.filter((q) => !q.done), ...list.filter((q) => q.done)];
}

export default function QuestPage() {
  const [activeTab, setActiveTab] = useState<Tab>("장기");
  const [quests, setQuests] = useState(MOCK_QUESTS);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalQuestId, setModalQuestId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [toast, setToast] = useState({ visible: false, message: "", sub: "" });
  const [restoreTargetId, setRestoreTargetId] = useState<number | null>(null);

  const showToast = useCallback((message: string, sub: string) => {
    setToast({ visible: true, message, sub });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2500);
  }, []);

  const toggleDone = (id: number) => {
    setQuests((prev) => {
      const next: QuestState = {
        단기: prev.단기.map((q) => (q.id === id ? { ...q, done: !q.done } : q)),
        장기: prev.장기.map((q) => (q.id === id ? { ...q, done: !q.done } : q)),
      };

      // 완료 체크 시 포인트 토스트
      const toggled = [...prev.단기, ...prev.장기].find((q) => q.id === id);
      if (toggled && !toggled.done) {
        showToast(`+${toggled.points} 포인트 완료!`, "");
      }

      // 단기 완료 시 → 장기 100% 달성 체크
      if (toggled && !toggled.done && toggled.parentId) {
        const pid = toggled.parentId;
        const allChildren = next.단기.filter((q) => q.parentId === pid);
        const allDone = allChildren.length > 0 && allChildren.every((q) => q.done);
        if (allDone) {
          const parent = next.장기.find((q) => q.id === pid);
          if (parent && !parent.done) {
            next.장기 = next.장기.map((q) =>
              q.id === pid ? { ...q, done: true } : q,
            );
            setTimeout(
              () =>
                showToast(
                  `목표 달성! 🎊`,
                  `'${parent.title}' 완료 +${parent.points} XP`,
                ),
              2600,
            );
          }
        }
      }

      return next;
    });
  };

  /** 돌려놓기: done → !done + 장기가 done이면 장기도 복원 */
  const handleRestore = (id: number) => {
    setQuests((prev) => {
      const tab = prev.단기.find((q) => q.id === id) ? "단기" : "장기";
      const quest = prev[tab].find((q) => q.id === id);
      if (!quest) return prev;

      const next: QuestState = {
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
  const handleAddAsNew = (id: number) => {
    const quest = [...quests.단기, ...quests.장기].find((q) => q.id === id);
    if (!quest) return;
    const today = new Date();
    const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;
    setQuests((prev) => ({
      ...prev,
      단기: [
        ...prev.단기,
        { id: nextId++, title: quest.title, date: dateStr, points: 10, done: false },
      ],
    }));
    setRestoreTargetId(null);
  };

  const openRoutineModal = (questId: number) => {
    setModalQuestId(questId);
    setModalOpen(true);
  };

  const deleteQuest = (id: number) => {
    setQuests((prev) => ({
      단기: prev.단기.filter((q) => q.id !== id),
      장기: prev.장기.filter((q) => q.id !== id),
    }));
    setMenuOpenId(null);
  };

  const startEdit = (id: number) => {
    setEditingId(id);
    setMenuOpenId(null);
  };

  const addInlineQuest = (tab: Tab) => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;
    const id = nextId++;
    const points = tab === "장기" ? 100 : 10;
    const newQuest: Quest = { id, title: "", date: dateStr, points, done: false };
    setQuests((prev) => ({ ...prev, [tab]: [...prev[tab], newQuest] }));
    setEditingId(id);
  };

  const commitInlineTitle = (id: number, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) {
      deleteQuest(id);
    } else {
      setQuests((prev) => ({
        단기: prev.단기.map((q) => (q.id === id ? { ...q, title: trimmed } : q)),
        장기: prev.장기.map((q) => (q.id === id ? { ...q, title: trimmed } : q)),
      }));
    }
    setEditingId(null);
  };

  const handleRoutineSubmit = (routines: string[]) => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;
    const parentId = modalQuestId ?? undefined;
    const newQuests: Quest[] = routines.map((title) => ({
      id: nextId++,
      title,
      date: dateStr,
      points: 20,
      done: false,
      parentId,
    }));
    setQuests((prev) => ({ ...prev, 단기: [...prev.단기, ...newQuests] }));
  };

  const items = sortByDone(quests[activeTab]);

  const restoreTarget = restoreTargetId
    ? ([...quests.단기, ...quests.장기].find((q) => q.id === restoreTargetId) ?? null)
    : null;

  return (
    <>
      <CelebrationToast visible={toast.visible} message={toast.message} sub={toast.sub} />

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
              className="fixed inset-x-4 top-1/2 z-50 mx-auto flex max-w-[24rem] -translate-y-1/2 flex-col gap-5 rounded-2xl bg-white px-5 pt-6 pb-5 shadow-[0_8px_32px_rgba(0,0,0,0.15)]"
            >
              <p className="text-sm leading-relaxed font-medium text-[#333333]">
                돌려놓기 시 연동되어있던 장기 프로젝트도 돌려놓으시겠어요?
                <br />
                <span className="text-[#999999]">
                  (장기 퀘스트의 진행도가 되돌아가고, 받은 보상도 함께 취소돼요)
                </span>
                <br /><br />
                아니면 새로운 단기 프로젝트로 추가하시겠어요?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleRestore(restoreTarget.id)}
                  className="bg-brand-primary flex-1 rounded-full py-3 text-sm font-bold text-white"
                >
                  돌려놓기
                </button>
                <button
                  onClick={() => handleAddAsNew(restoreTarget.id)}
                  className="flex-1 rounded-full bg-[#f0f0f0] py-3 text-sm font-bold text-[#666666]"
                >
                  추가하기
                </button>
                <button
                  onClick={() => setRestoreTargetId(null)}
                  className="flex-1 rounded-full bg-[#f0f0f0] py-3 text-sm font-bold text-[#666666]"
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
      <div className="flex w-full max-w-(--ui-content-width) flex-col gap-4">
        {/* 탭 */}
        <div className="flex gap-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative rounded-full px-5 py-2 text-sm font-bold transition-colors ${
                activeTab !== tab ? "border border-[#d4d4d4]" : ""
              }`}
              style={{
                color: activeTab === tab ? "#ffffff" : "#999999",
              }}
            >
              {activeTab === tab && (
                <motion.div
                  layoutId="tab-pill"
                  className="bg-brand-primary absolute inset-0 rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{tab}</span>
            </button>
          ))}
        </div>

        {/* 퀘스트 목록 */}
        <div className="flex max-h-[calc(100dvh-12rem)] flex-col gap-3 overflow-y-auto pr-1">
          {items.map((quest) => (
            <motion.div
              key={quest.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: quest.done ? 0.6 : 1, y: 0 }}
              className="flex flex-col gap-3 rounded-2xl bg-white px-5 py-4 shadow-[0_2px_12px_rgba(0,0,0,0.08)]"
            >
              {/* 상단 행 */}
              <div className="flex items-start justify-between">
                <span className="text-xs font-medium text-[#c8a96e]">
                  {quest.date} 작성
                </span>
                <div className="relative">
                  <button
                    onClick={() => setMenuOpenId(menuOpenId === quest.id ? null : quest.id)}
                    className="text-[#cccccc] hover:text-[#999999]"
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                      <circle cx="9" cy="3.5" r="1.5" />
                      <circle cx="9" cy="9" r="1.5" />
                      <circle cx="9" cy="14.5" r="1.5" />
                    </svg>
                  </button>
                  {menuOpenId === quest.id && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setMenuOpenId(null)} />
                      <div className="absolute top-6 right-0 z-40 flex flex-col overflow-hidden rounded-[0.75rem] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
                        {!quest.done && (
                          <button
                            onClick={() => startEdit(quest.id)}
                            className="px-4 py-2.5 text-left text-sm font-medium whitespace-nowrap text-[#333333] hover:bg-[#f5f5f5]"
                          >
                            수정
                          </button>
                        )}
                        {quest.done && (
                          <button
                            onClick={() => {
                              setMenuOpenId(null);
                              if (quest.parentId) {
                                setRestoreTargetId(quest.id);
                              } else {
                                handleRestore(quest.id);
                              }
                            }}
                            className="text-brand-primary px-4 py-2.5 text-left text-sm font-medium whitespace-nowrap hover:bg-[#fff8f0]"
                          >
                            돌려놓기
                          </button>
                        )}
                        <button
                          onClick={() => deleteQuest(quest.id)}
                          className="px-4 py-2.5 text-left text-sm font-medium whitespace-nowrap text-[#ff4d4d] hover:bg-[#fff5f5]"
                        >
                          삭제
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 장기 퀘스트 라벨 */}
              {activeTab === "단기" && quest.parentId && (() => {
                const parent = quests.장기.find((q) => q.id === quest.parentId);
                return parent ? (
                  <span className="text-brand-primary text-xs font-semibold">
                    {parent.title}
                  </span>
                ) : null;
              })()}

              {/* 중간 행 */}
              <div className="flex items-center gap-3">
                {/* 체크 원 */}
                <motion.button
                  onClick={() => toggleDone(quest.id)}
                  whileTap={{ scale: 0.8 }}
                  animate={quest.done ? { scale: [1, 1.25, 1] } : {}}
                  transition={{ duration: 0.3 }}
                  className="h-8 w-8 shrink-0 rounded-full border-[2.5px] transition-colors"
                  style={{
                    borderColor: "var(--ui-button-primary)",
                    background: quest.done ? "var(--ui-button-primary)" : "transparent",
                  }}
                />

                {/* 제목 */}
                {editingId === quest.id ? (
                  <input
                    type="text"
                    defaultValue={quest.title}
                    autoFocus
                    placeholder="퀘스트를 입력하세요"
                    onBlur={(e) => commitInlineTitle(quest.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitInlineTitle(quest.id, e.currentTarget.value);
                    }}
                    className="flex-1 text-base font-bold text-[#1a1a1a] outline-none placeholder:text-[#cccccc]"
                  />
                ) : (
                  <span
                    className={`flex-1 text-base font-bold ${
                      quest.done ? "text-[#aaaaaa] line-through" : "text-[#1a1a1a]"
                    }`}
                  >
                    {quest.title}
                  </span>
                )}

                {/* 포인트 뱃지 */}
                <div className="flex flex-col items-center gap-0.5 rounded-[0.75rem] bg-[#f5f5f5] px-3 py-1.5">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L6 8.5L12 22L18 8.5L12 2Z" fill="var(--ui-button-primary)" />
                    <path d="M12 2L6 8.5H18L12 2Z" fill="var(--brand-logo)" />
                  </svg>
                  <span className="text-xs font-bold text-[#888888]">{quest.points}</span>
                </div>
              </div>

              {/* 장기 탭: 프로그레스 바 + 액션 텍스트 */}
              {activeTab === "장기" && !quest.done && (() => {
                const children = quests.단기.filter((q) => q.parentId === quest.id);
                const total = children.length;
                const doneCount = children.filter((q) => q.done).length;
                const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;
                return (
                  <>
                    {total > 0 && (
                      <div className="flex items-center gap-3">
                        <div className="h-[0.375rem] flex-1 overflow-hidden rounded-full bg-[#f0f0f0]">
                          <motion.div
                            className="bg-brand-primary h-full rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        </div>
                        <span className="text-brand-primary text-xs font-bold">
                          {doneCount}/{total}
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => openRoutineModal(quest.id)}
                      className="hover:text-brand-primary text-left text-sm font-medium text-[#555555] transition-colors"
                    >
                      오늘 이 목표 위해 작은 걸 적어볼까요?
                    </button>
                  </>
                );
              })()}
            </motion.div>
          ))}

          {/* 추가 카드 */}
          <motion.button
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => addInlineQuest(activeTab)}
            className="relative flex min-h-[5rem] shrink-0 items-center rounded-2xl bg-[#f5f5f5] px-5 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
          >
            <span className="text-lg tracking-widest text-[#cccccc]">···</span>
            <div className="bg-brand-primary absolute top-1/2 right-4 flex h-[2.5rem] w-[2.5rem] -translate-y-1/2 items-center justify-center rounded-full shadow-[0_4px_12px_rgba(255,148,55,0.4)]">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 3v12M3 9h12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </motion.button>
        </div>
      </div>
    </>
  );
}
