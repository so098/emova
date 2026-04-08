"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MoreVertical,
  Check,
  Target,
  ChevronDown,
  ChevronUp,
  Diamond,
  Zap,
  PenLine,
} from "lucide-react";
import type { Quest, QuestState } from "@/store/questStore";
import QuestContextMenu from "./QuestContextMenu";
import clsx from "clsx";

type Tab = "단기" | "장기" | "보류";

interface QuestCardProps {
  quest: Quest;
  activeTab: Tab;
  quests: QuestState;
  editing: {
    id: string | null;
    onStart: (id: string) => void;
    onCommit: (id: string, title: string) => void;
  };
  menu: {
    openId: string | null;
    pos: { top: number; right: number };
    mounted: boolean;
    onOpen: (id: string, btn: HTMLButtonElement) => void;
    onClose: () => void;
  };
  actions: {
    toggleDone: (id: string) => void;
    restore: (id: string) => void;
    convertToLong: (id: string) => void;
    convertToShort: (id: string) => void;
    hold: (id: string) => void;
    resume: (id: string) => void;
    delete: (id: string) => void;
    goToReflect: (id: string) => void;
    saveMemo: (id: string, memo: string) => void;
    openRoutine: (id: string) => void;
  };
}

export default function QuestCard({
  quest,
  activeTab,
  quests,
  editing,
  menu,
  actions,
}: QuestCardProps) {
  const titleRef = useRef<HTMLSpanElement>(null);
  const [isTitleOverflowing, setIsTitleOverflowing] = useState(false);
  const [isTitleExpanded, setIsTitleExpanded] = useState(false);
  const [memoOpen, setMemoOpen] = useState(false);
  const [memoText, setMemoText] = useState(quest.memo ?? "");

  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    setIsTitleOverflowing(el.scrollWidth > el.clientWidth);
  }, [quest.title]);

  const parentLabel =
    (activeTab === "단기" || activeTab === "보류") && quest.parentId
      ? (quests.장기.find((q) => q.id === quest.parentId)?.title ??
        quests.보류.find((q) => q.id === quest.parentId)?.title)
      : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: quest.done ? 0.55 : 1, y: 0 }}
      className={
        "bg-surface-card-glass border-border-default flex h-auto flex-col rounded-2xl border px-5 py-4 backdrop-blur-lg"
      }
    >
      {/* 상단: 메타 + 메뉴 */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {parentLabel && (
            <>
              <span className="text-interactive max-w-[10ch] truncate text-xs font-semibold">
                {parentLabel}
              </span>
              <span className="text-border-default">·</span>
            </>
          )}
          <span className="text-text-subtle text-xs">{quest.date}</span>
          {activeTab === "보류" && quest.originTab && (
            <>
              <span className="text-border-default">·</span>
              <span className="text-text-subtle text-xs font-medium">
                {quest.originTab}에서 보류됨
              </span>
            </>
          )}
        </div>
        <div>
          <button
            onClick={(e) =>
              menu.openId === quest.id
                ? menu.onClose()
                : menu.onOpen(quest.id, e.currentTarget)
            }
            className="text-text-faint hover:text-text-muted -mr-1 rounded-md p-1"
          >
            <MoreVertical size={16} strokeWidth={2} />
          </button>
          {menu.openId === quest.id && menu.mounted && (
            <QuestContextMenu
              questId={quest.id}
              done={quest.done}
              activeTab={activeTab}
              menuPos={menu.pos}
              actions={{
                edit: editing.onStart,
                restore: actions.restore,
                convertToLong: actions.convertToLong,
                convertToShort: actions.convertToShort,
                hold: actions.hold,
                resume: actions.resume,
                delete: actions.delete,
                goToReflect: actions.goToReflect,
              }}
              onClose={menu.onClose}
            />
          )}
        </div>
      </div>

      {/* 메인: 체크/아이콘 + 제목 + 포인트 */}
      <div
        className={clsx(
          "flex gap-3",
          isTitleExpanded ? "items-start" : "items-center",
        )}
      >
        {activeTab === "단기" && (
          <motion.button
            onClick={() => actions.toggleDone(quest.id)}
            whileTap={{ scale: 0.8 }}
            animate={quest.done ? { scale: [1, 1.25, 1] } : {}}
            transition={{ duration: 0.3 }}
            className="mt-[0.1875rem] h-[1.625rem] w-[1.625rem] shrink-0 rounded-full border-[2px] transition-colors"
            style={{
              borderColor: quest.done
                ? "var(--interactive)"
                : "var(--text-faint)",
              background: quest.done ? "var(--interactive)" : "transparent",
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
            className={`mt-[0.1875rem] flex h-[1.625rem] w-[1.625rem] shrink-0 items-center justify-center rounded-full ${
              quest.done ? "bg-border-default" : "bg-bg-muted"
            }`}
          >
            {quest.done ? (
              <Check size={14} strokeWidth={2} color="var(--text-muted)" />
            ) : (
              <Target size={14} strokeWidth={1.5} color="var(--accent-gold)" />
            )}
          </div>
        )}

        {editing.id === quest.id ? (
          <input
            type="text"
            defaultValue={quest.title}
            autoFocus
            placeholder="퀘스트를 입력하세요"
            onBlur={(e) => editing.onCommit(quest.id, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter")
                editing.onCommit(quest.id, e.currentTarget.value);
            }}
            className="text-text-primary placeholder:text-text-faint flex-1 text-sm font-semibold outline-none"
          />
        ) : (
          <span
            ref={titleRef}
            className={`min-w-0 flex-1 text-sm font-semibold ${
              quest.done ? "text-text-subtle line-through" : "text-text-primary"
            } ${isTitleExpanded ? "break-words whitespace-normal" : "truncate"}`}
          >
            {quest.title}
          </span>
        )}

        <span
          className={`mt-[0.0625rem] flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
            quest.done
              ? "bg-bg-muted text-text-subtle"
              : quest.source === "ai"
                ? "bg-accent-gold-bg text-accent-gold"
                : "text-point bg-bg-muted"
          }`}
        >
          {quest.source === "ai" ? (
            <>
              <Zap size={12} strokeWidth={2} /> {quest.points} XP
            </>
          ) : (
            <>
              <Diamond size={12} strokeWidth={2} />
              {quest.points}
            </>
          )}
        </span>
      </div>

      {/* 더보기/접기 */}
      {(isTitleOverflowing || isTitleExpanded) && editing.id !== quest.id && (
        <button
          onClick={() => setIsTitleExpanded((v) => !v)}
          className="text-text-faint hover:text-text-muted mt-1 flex items-center gap-0.5 self-end text-xs font-medium transition-colors"
        >
          {isTitleExpanded ? (
            <>
              접기 <ChevronUp size={14} />
            </>
          ) : (
            <>
              더보기 <ChevronDown size={14} />
            </>
          )}
        </button>
      )}

      {/* 실행 메모 (미완료 단기 퀘스트) */}
      {activeTab === "단기" && !quest.done && editing.id !== quest.id && (
        <div className="border-bg-muted mt-2 border-t pt-2">
          {!memoOpen && !quest.memo && (
            <button
              onClick={() => setMemoOpen(true)}
              className="text-text-faint hover:text-text-muted flex items-center gap-1.5 text-xs font-medium transition-colors"
            >
              <PenLine size={12} strokeWidth={1.5} />
              다짐 메모 쓰기
            </button>
          )}
          {!memoOpen && quest.memo && (
            <button
              onClick={() => setMemoOpen(true)}
              className="bg-accent-gold-bg-light flex w-full flex-col gap-0.5 rounded-xl px-4 py-2.5 text-left"
            >
              <span className="text-text-faint text-[0.625rem] font-semibold">
                실행 전 다짐
              </span>
              <p className="text-text-muted text-xs leading-relaxed whitespace-pre-wrap">
                {quest.memo}
              </p>
            </button>
          )}
          {memoOpen && (
            <div className="bg-accent-gold-bg-light flex flex-col gap-2 rounded-xl px-4 py-2.5">
              <span className="text-text-faint text-[0.625rem] font-semibold">
                실행 전 다짐
              </span>
              <textarea
                value={memoText}
                onChange={(e) => setMemoText(e.target.value)}
                placeholder="실행 전 다짐이나 생각을 적어보세요"
                rows={2}
                autoFocus
                className="bg-surface-elevated text-text-primary placeholder:text-text-faint focus:ring-accent-gold resize-none rounded-xl px-3 py-2 text-xs leading-relaxed outline-none focus:ring-1"
              />
              <div className="flex justify-end gap-1.5">
                <button
                  onClick={() => {
                    setMemoOpen(false);
                    setMemoText(quest.memo ?? "");
                  }}
                  className="text-text-muted hover:text-text-primary rounded-full px-3 py-1 text-xs font-medium"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    actions.saveMemo(quest.id, memoText.trim());
                    setMemoOpen(false);
                  }}
                  className="bg-point text-on-point rounded-full px-3 py-1 text-xs font-bold"
                >
                  저장
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 완료된 퀘스트의 메모 (읽기 전용) */}
      {quest.done && quest.memo && (
        <div className="bg-accent-gold-bg-light mt-2 flex flex-col gap-0.5 rounded-xl px-4 py-2.5">
          <span className="text-text-faint text-[0.625rem] font-semibold">
            실행 전 다짐
          </span>
          <p className="text-text-muted text-xs leading-relaxed">
            {quest.memo}
          </p>
        </div>
      )}

      {/* 장기 탭: 프로그레스 + CTA */}
      {activeTab === "장기" &&
        !quest.done &&
        (() => {
          const children = quests.단기.filter((q) => q.parentId === quest.id);
          const total = children.length;
          const doneCount = children.filter((q) => q.done).length;
          const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;
          return (
            <div className="border-bg-muted mt-3 flex flex-col gap-2.5 border-t pt-3">
              {total > 0 && (
                <div className="flex items-center gap-3">
                  <div className="bg-bg-muted h-[0.3125rem] flex-1 overflow-hidden rounded-full">
                    <motion.div
                      className="bg-point h-full rounded-full"
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
                onClick={() => actions.openRoutine(quest.id)}
                className="hover:text-accent-gold text-text-subtle text-left text-sm font-medium transition-colors"
              >
                + 오늘의 작은 실천 추가
              </button>
            </div>
          );
        })()}

      {/* 보류 탭: 연결된 단기 퀘스트 버튼 */}
      {activeTab === "보류" &&
        quest.originTab === "장기" &&
        quests.단기.filter((q) => q.parentId === quest.id).length > 0 && (
          <div className="mt-2.5">
            <button
              onClick={() => actions.openRoutine(quest.id)}
              className="border-border-default bg-bg-muted text-text-secondary hover:text-text-primary rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors"
            >
              연결된 단기 퀘스트 확인
            </button>
          </div>
        )}
    </motion.div>
  );
}
