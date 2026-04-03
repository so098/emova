"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ExistingRoutine {
  title: string;
  done: boolean;
}

interface RoutineModalProps {
  open: boolean;
  existingRoutines: ExistingRoutine[];
  onClose: () => void;
  onSubmit: (routines: string[]) => void;
}

export default function RoutineModal({
  open,
  existingRoutines,
  onClose,
  onSubmit,
}: RoutineModalProps) {
  const [inputs, setInputs] = useState<string[]>([]);

  const updateInput = (index: number, value: string) => {
    setInputs((prev) => prev.map((v, i) => (i === index ? value : v)));
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
            className="fixed inset-x-4 top-1/2 z-50 mx-auto flex max-w-[28rem] -translate-y-1/2 flex-col rounded-2xl bg-white px-5 pb-5 pt-6 shadow-[0_8px_32px_rgba(0,0,0,0.15)]"
          >
            {/* 제목 */}
            <h2 className="mb-5 text-base font-bold text-[#1a1a1a]">
              오늘 할 작은 루틴 적기
            </h2>

            {/* 기존 루틴 + 새 입력 목록 */}
            <div className="flex max-h-[20rem] flex-col gap-3 overflow-y-auto">
              {existingRoutines.map((routine, i) => (
                <div
                  key={`existing-${i}`}
                  className={`rounded-[0.75rem] bg-[#f5f5f5] px-4 py-3 text-sm font-medium ${
                    routine.done ? "text-[#cccccc] line-through" : "text-[#999999]"
                  }`}
                >
                  {routine.title}
                </div>
              ))}
              {inputs.map((value, i) => (
                <input
                  key={`new-${i}`}
                  type="text"
                  value={value}
                  onChange={(e) => updateInput(i, e.target.value)}
                  placeholder="루틴을 입력하세요"
                  autoFocus={i === inputs.length - 1}
                  className="rounded-[0.75rem] bg-[#f5f5f5] px-4 py-3 text-sm font-medium text-[#1a1a1a] outline-none placeholder:text-[#bcbcbc]"
                />
              ))}
            </div>

            {/* + 버튼 */}
            <div className="mt-4 flex justify-center">
              <button
                onClick={addInput}
                className="flex h-[2.5rem] w-[2.5rem] items-center justify-center rounded-full bg-brand-primary shadow-[0_4px_12px_rgba(255,148,55,0.4)]"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                >
                  <path
                    d="M9 3v12M3 9h12"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {/* 하단 버튼 */}
            <div className="mt-auto pt-8">
              <button
                onClick={handleSubmit}
                className="w-full rounded-full bg-[#f0f0f0] py-3 text-sm font-bold text-[#666666]"
              >
                다 했어요
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
