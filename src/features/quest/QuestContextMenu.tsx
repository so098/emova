"use client";

import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  Pencil,
  RotateCcw,
  Pause,
  Play,
  Trash2,
  ArrowRightLeft,
} from "lucide-react";

interface MenuActions {
  edit: (id: string) => void;
  restore: (id: string) => void;
  convertToLong: (id: string) => void;
  convertToShort: (id: string) => void;
  hold: (id: string) => void;
  resume: (id: string) => void;
  delete: (id: string) => void;
  goToReflect: (id: string) => void;
}

interface QuestContextMenuProps {
  questId: string;
  done: boolean;
  activeTab: "단기" | "장기" | "보류";
  menuPos: { top: number; right: number };
  actions: MenuActions;
  onClose: () => void;
}

export default function QuestContextMenu({
  questId,
  done,
  activeTab,
  menuPos,
  actions,
  onClose,
}: QuestContextMenuProps) {
  return createPortal(
    <>
      <div className="fixed inset-0 z-[100]" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="border-border-default bg-surface fixed z-[101] flex min-w-[8rem] flex-col gap-0.5 rounded-[0.875rem] border p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
        style={{ top: menuPos.top, right: menuPos.right }}
      >
        {!done && (
          <button
            onClick={() => actions.edit(questId)}
            className="flex items-center gap-2.5 rounded-[0.625rem] px-3 py-2.5 text-left text-[0.8125rem] font-medium text-[#333333] hover:bg-[#f5f5f5]"
          >
            <Pencil size={15} strokeWidth={1.5} color="#555" />
            수정
          </button>
        )}
        {done && activeTab !== "보류" && (
          <button
            onClick={() => actions.restore(questId)}
            className="text-brand-primary flex items-center gap-2.5 rounded-[0.625rem] px-3 py-2.5 text-left text-[0.8125rem] font-medium hover:bg-[#fff8f0]"
          >
            <RotateCcw size={15} strokeWidth={1.5} />
            돌려놓기
          </button>
        )}
        {activeTab === "단기" && !done && (
          <button
            onClick={() => actions.convertToLong(questId)}
            className="flex items-center gap-2.5 rounded-[0.625rem] px-3 py-2.5 text-left text-[0.8125rem] font-medium text-[#777777] hover:bg-[#f5f5f5]"
          >
            <ArrowRightLeft size={15} strokeWidth={1.5} color="#777" />
            장기로 변경
          </button>
        )}
        {activeTab === "장기" && !done && (
          <button
            onClick={() => actions.convertToShort(questId)}
            className="flex items-center gap-2.5 rounded-[0.625rem] px-3 py-2.5 text-left text-[0.8125rem] font-medium text-[#777777] hover:bg-[#f5f5f5]"
          >
            <ArrowRightLeft size={15} strokeWidth={1.5} color="#777" />
            단기로 변경
          </button>
        )}
        {activeTab !== "보류" && (
          <button
            onClick={() => actions.hold(questId)}
            className="text-text-muted flex items-center gap-2.5 rounded-[0.625rem] px-3 py-2.5 text-left text-[0.8125rem] font-medium hover:bg-[#f5f5f5]"
          >
            <Pause size={15} strokeWidth={1.5} color="#999" />
            보류
          </button>
        )}
        {activeTab === "보류" && (
          <>
            <button
              onClick={() => actions.resume(questId)}
              className="text-brand-primary flex items-center gap-2.5 rounded-[0.625rem] px-3 py-2.5 text-left text-[0.8125rem] font-medium hover:bg-[#fff8f0]"
            >
              <Play size={15} strokeWidth={1.5} />
              다시 시작
            </button>
            <div className="mx-2 my-0.5 h-px bg-[#f0f0f0]" />
            <button
              onClick={() => actions.delete(questId)}
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
  );
}
