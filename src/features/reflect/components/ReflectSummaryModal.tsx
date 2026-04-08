"use client";

import { motion } from "framer-motion";
import { Sun } from "lucide-react";

export interface SummaryData {
  emotionBefore: string;
  emotionAfter: string;
  oneLiner: string;
  xp: number;
}

export default function ReflectSummaryModal({
  summary,
  onClose,
}: {
  summary: SummaryData;
  onClose: () => void;
}) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/30"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className="fixed inset-x-4 top-1/2 z-50 mx-auto flex max-w-[26rem] -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border-default bg-surface"
      >
        <div className="flex flex-col items-center gap-2 bg-brand-primary px-6 pt-8 pb-6">
          <Sun size={32} strokeWidth={1.8} color="var(--on-accent)" />
          <span className="text-lg font-bold text-on-accent">오늘 하루, 고생했어요</span>
        </div>
        <div className="flex flex-col gap-5 px-6 pt-5 pb-6">
          <div className="flex items-center justify-center gap-2.5 text-sm">
            <span className="rounded-full bg-surface-elevated px-3 py-1.5 font-medium text-text-muted">
              {summary.emotionBefore}
            </span>
            <span className="text-xs text-text-faint">→</span>
            <span className="rounded-full bg-accent-green-bg px-3 py-1.5 font-medium text-accent-green-text">
              {summary.emotionAfter}
            </span>
          </div>
          <p className="text-center text-sm leading-relaxed text-text-secondary">
            &ldquo;{summary.oneLiner}&rdquo;
          </p>
          <div className="h-px bg-surface-elevated" />
          <div className="flex items-center justify-between rounded-[0.875rem] bg-accent-gold-bg-light px-4 py-3">
            <span className="text-sm text-text-muted">경험치</span>
            <span className="text-sm font-bold text-accent-gold">+{summary.xp} XP</span>
          </div>
          <p className="text-center text-xs text-text-subtle">내일 또 봐요.</p>
          <button
            onClick={onClose}
            className="bg-brand-primary w-full rounded-full py-3 text-sm font-bold text-on-accent"
          >
            닫기
          </button>
        </div>
      </motion.div>
    </>
  );
}
