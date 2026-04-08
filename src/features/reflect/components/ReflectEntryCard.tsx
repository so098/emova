"use client";

import { useState, useRef, useEffect } from "react";
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import type { Reflection } from "@/lib/supabase/reflectionApi";

interface ReflectEntryCardProps {
  entry: Reflection;
  onEdit: (entry: Reflection) => void;
  onDelete: (id: string) => void;
}

export default function ReflectEntryCard({
  entry,
  onEdit,
  onDelete,
}: ReflectEntryCardProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const [questExpanded, setQuestExpanded] = useState(false);

  useEffect(() => {
    const el = contentRef.current;
    if (el) setIsOverflowing(el.scrollHeight > el.clientHeight);
  }, [entry.notes]);

  const beforeList = entry.beforeEmotion
    ? entry.beforeEmotion.split(", ").filter(Boolean)
    : [];
  const afterList = entry.afterEmotion
    ? entry.afterEmotion.split(", ").filter(Boolean)
    : [];

  const openMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    setMenuOpen(true);
  };

  return (
    <div className="border-border-default bg-surface-card-glass relative flex flex-col rounded-2xl border px-5 py-4 backdrop-blur-lg">
      <div
        ref={contentRef}
        className={`flex flex-col gap-3 ${isExpanded ? "" : "max-h-[7.5rem] overflow-hidden"}`}
      >
        <div className="flex items-center justify-between">
          <span className="text-text-subtle text-xs">{entry.date}</span>
          <button
            onClick={openMenu}
            className="text-text-faint hover:text-text-muted -mr-1 rounded-md p-1"
          >
            <MoreVertical size={16} strokeWidth={2} />
          </button>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="flex flex-wrap gap-1">
            {beforeList.length > 0 ? (
              beforeList.map((e) => (
                <span
                  key={e}
                  className="bg-surface-elevated text-text-muted rounded-full px-2.5 py-1 font-medium"
                >
                  {e}
                </span>
              ))
            ) : (
              <span className="bg-surface-elevated text-text-muted rounded-full px-2.5 py-1 font-medium">
                &mdash;
              </span>
            )}
          </div>
          <ArrowRight
            size={16}
            strokeWidth={1.8}
            color="var(--text-faint)"
            className="shrink-0"
          />
          <div className="flex flex-wrap gap-1">
            {afterList.map((e) => (
              <span
                key={e}
                className="bg-accent-gold-bg text-accent-gold rounded-full px-2.5 py-1 font-medium"
              >
                {e}
              </span>
            ))}
          </div>
        </div>
        <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-line">
          {entry.notes}
        </p>
      </div>

      {/* 넘칠 때만 그라데이션 + 더보기 */}
      {!isExpanded && isOverflowing && (
        <div className="pointer-events-none absolute right-0 bottom-10 left-0 h-8 bg-gradient-to-t from-[var(--surface-card-glass)] to-transparent" />
      )}
      {(isOverflowing || isExpanded) && (
        <button
          onClick={() => setIsExpanded((v) => !v)}
          className="text-text-faint hover:text-text-muted mt-2 flex items-center gap-1 self-end text-xs font-medium transition-colors"
        >
          {isExpanded ? (
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

      {/* 연동된 퀘스트 */}
      {entry.questId && entry.questTitle && (
        <button
          onClick={() => setQuestExpanded((v) => !v)}
          className="border-border-default bg-bg-muted hover:bg-surface-elevated mt-3 flex items-start gap-2 rounded-xl border px-3 py-2 transition-colors"
        >
          <span className="text-text-muted shrink-0 text-xs">퀘스트</span>
          <span
            className={`text-interactive text-left text-xs font-semibold ${
              questExpanded
                ? "break-words whitespace-normal"
                : "max-w-[16rem] truncate"
            }`}
          >
            {entry.questTitle}
          </span>
        </button>
      )}

      {/* 컨텍스트 메뉴 */}
      {menuOpen &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[100]"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="border-border-default bg-surface fixed z-[101] flex min-w-[7rem] flex-col gap-0.5 rounded-[0.875rem] border p-1.5"
              style={{ top: menuPos.top, right: menuPos.right }}
            >
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(entry);
                }}
                className="text-text-primary hover:bg-bg-muted flex items-center gap-2.5 rounded-[0.625rem] px-3 py-2.5 text-left text-sm font-medium"
              >
                <Pencil
                  size={15}
                  strokeWidth={1.5}
                  color="var(--text-secondary)"
                />
                수정
              </button>
              <div className="bg-bg-muted mx-2 my-0.5 h-px" />
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(entry.id);
                }}
                className="text-accent-red flex items-center gap-2.5 rounded-[0.625rem] px-3 py-2.5 text-left text-sm font-medium hover:bg-[#fff5f5]"
              >
                <Trash2 size={15} strokeWidth={1.5} />
                삭제
              </button>
            </motion.div>
          </>,
          document.body,
        )}
    </div>
  );
}
