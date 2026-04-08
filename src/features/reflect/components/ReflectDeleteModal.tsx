"use client";

import { motion } from "framer-motion";

export default function ReflectDeleteModal({
  isPending,
  onConfirm,
  onCancel,
}: {
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
        className="fixed inset-0 z-40 bg-black/30"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className="fixed inset-x-4 top-1/2 z-50 mx-auto flex max-w-[22rem] -translate-y-1/2 flex-col gap-4 rounded-2xl border border-border-default bg-surface px-6 py-6"
      >
        <span className="text-sm font-bold text-text-primary">정말 삭제하시겠습니까?</span>
        <p className="text-xs text-text-muted">삭제하면 되돌릴 수 없어요.</p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-full bg-surface-elevated py-2.5 text-sm font-medium text-text-muted"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 rounded-full bg-accent-red py-2.5 text-sm font-bold text-white"
          >
            {isPending ? "삭제 중..." : "삭제"}
          </button>
        </div>
      </motion.div>
    </>
  );
}
