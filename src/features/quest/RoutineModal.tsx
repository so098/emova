"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, PenLine } from "lucide-react";

interface ExistingRoutine {
  title: string;
  done: boolean;
}

interface RoutineModalProps {
  open: boolean;
  existingRoutines: ExistingRoutine[];
  onClose: () => void;
  onSubmit: (routines: string[]) => void;
  readOnly?: boolean;
}

export default function RoutineModal({
  open,
  existingRoutines,
  onClose,
  onSubmit,
  readOnly = false,
}: RoutineModalProps) {
  const [inputs, setInputs] = useState<string[]>([]);

  const updateInput = (index: number, value: string) => {
    setInputs((prev) => prev.map((v, i) => (i === index ? value : v)));
  };

  const removeInput = (index: number) => {
    setInputs((prev) => prev.filter((_, i) => i !== index));
  };

  const addInput = () => {
    setInputs((prev) => [...prev, ""]);
  };

  const handleSubmit = () => {
    const filled = inputs.map((s) => s.trim()).filter(Boolean);
    if (filled.length > 0) onSubmit(filled);
    setInputs([]);
    onClose();
  };

  const handleSkip = () => {
    setInputs([]);
    onClose();
  };

  const hasNewInput = inputs.some((s) => s.trim().length > 0);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleSkip}
            className="fixed inset-0 z-40 bg-black/30"
          />

          {/* 모달 */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed inset-x-4 top-1/2 z-50 mx-auto flex max-w-[28rem] -translate-y-1/2 flex-col rounded-2xl bg-surface px-5 pb-5 pt-6 shadow-[0_8px_32px_rgba(0,0,0,0.15)]"
          >
            {/* 헤더 */}
            <div className="mb-6 flex flex-col items-center gap-2">
              <div className="flex h-[3rem] w-[3rem] items-center justify-center rounded-full bg-accent-gold-bg">
                <PenLine size={22} strokeWidth={2} color="var(--accent-gold)" />
              </div>
              <h2 className="text-base font-bold text-text-primary">
                {readOnly ? "연결된 단기 퀘스트" : "오늘 할 작은 루틴 적기"}
              </h2>
              <p className="text-xs text-text-muted">
                {readOnly ? "보류된 장기 퀘스트에 연결된 단기 퀘스트 목록입니다" : "작은 실천이 큰 변화를 만들어요"}
              </p>
            </div>

            {/* 기존 루틴 + 새 입력 목록 */}
            <div className="flex max-h-[18rem] flex-col gap-2.5 overflow-y-auto">
              {existingRoutines.map((routine, i) => (
                <div
                  key={`existing-${i}`}
                  className={`flex items-center gap-3 rounded-[0.75rem] px-4 py-3 ${
                    routine.done ? "bg-[#f9f9f9]" : "bg-surface-elevated"
                  }`}
                >
                  {/* 체크/번호 아이콘 */}
                  <div
                    className={`flex h-[1.375rem] w-[1.375rem] shrink-0 items-center justify-center rounded-full text-[0.625rem] font-bold ${
                      routine.done
                        ? "bg-[#e0e0e0] text-on-accent"
                        : "bg-brand-primary text-on-accent"
                    }`}
                  >
                    {routine.done ? "✓" : i + 1}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      routine.done
                        ? "text-text-faint line-through"
                        : "text-text-secondary"
                    }`}
                  >
                    {routine.title}
                  </span>
                </div>
              ))}

              {/* 새 입력 */}
              {!readOnly && inputs.map((value, i) => (
                <motion.div
                  key={`new-${i}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 rounded-[0.75rem] bg-accent-gold-bg-light px-4 py-3"
                >
                  <div className="flex h-[1.375rem] w-[1.375rem] shrink-0 items-center justify-center rounded-full bg-brand-primary text-[0.625rem] font-bold text-on-accent">
                    {existingRoutines.filter((r) => !r.done).length + i + 1}
                  </div>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => updateInput(i, e.target.value)}
                    placeholder="오늘 할 루틴을 적어보세요"
                    autoFocus={i === inputs.length - 1}
                    className="flex-1 bg-transparent text-sm font-medium text-text-primary outline-none placeholder:text-text-faint"
                  />
                  <button
                    onClick={() => removeInput(i)}
                    className="shrink-0 text-text-faint hover:text-text-muted"
                  >
                    <X size={16} strokeWidth={1.8} />
                  </button>
                </motion.div>
              ))}
            </div>

            {readOnly ? (
              <div className="mt-6">
                <button
                  onClick={onClose}
                  className="bg-surface-elevated text-text-muted w-full rounded-full py-3.5 text-sm font-bold transition-colors"
                >
                  확인
                </button>
              </div>
            ) : (
              <>
                {/* + 버튼 */}
                <div className="mt-4 flex justify-center">
                  <motion.button
                    onClick={addInput}
                    whileTap={{ scale: 0.9 }}
                    className="flex items-center gap-2 rounded-full bg-accent-gold-bg px-4 py-2 text-sm font-semibold text-brand-primary transition-colors hover:bg-accent-gold-bg-hover"
                  >
                    <Plus size={16} strokeWidth={2.2} />
                    루틴 추가
                  </motion.button>
                </div>

                {/* 하단 버튼 */}
                <div className="mt-6">
                  <button
                    onClick={handleSubmit}
                    className={`w-full rounded-full py-3.5 text-sm font-bold transition-colors ${
                      hasNewInput
                        ? "bg-brand-primary text-on-accent shadow-[0_4px_12px_rgba(255,148,55,0.3)]"
                        : "bg-surface-elevated text-text-muted"
                    }`}
                  >
                    {hasNewInput
                      ? `${inputs.filter((s) => s.trim()).length}개 루틴 추가하기`
                      : "다 했어요"}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
