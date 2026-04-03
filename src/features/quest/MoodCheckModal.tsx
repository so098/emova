"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SmilePlus, Minus, HelpCircle } from "lucide-react";
import type { ElementType } from "react";

interface MoodCheckModalProps {
  open: boolean;
  onClose: () => void;
}

const MOODS: { label: string; Icon: ElementType; bg: string; color: string }[] = [
  { label: "조금 나아졌어요", Icon: SmilePlus, bg: "#dbeafe", color: "#3b82f6" },
  { label: "그대로에요", Icon: Minus, bg: "#d1fae5", color: "#10b981" },
  { label: "잘 모르겠어요", Icon: HelpCircle, bg: "#fee2e2", color: "#ef4444" },
];

export default function MoodCheckModal({ open, onClose }: MoodCheckModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (label: string) => {
    setSelected(label);
    setStep(2);
  };

  const handleClose = () => {
    setStep(1);
    setSelected(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-40 bg-black/30"
          />
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed inset-x-4 top-1/2 z-50 mx-auto flex max-w-[28rem] -translate-y-1/2 flex-col items-center gap-6 rounded-2xl bg-white px-6 pt-8 pb-6 shadow-[0_8px_32px_rgba(0,0,0,0.15)]"
          >
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col items-center gap-6"
                >
                  <p className="text-center text-base leading-relaxed font-bold text-[#1a1a1a]">
                    퀘스트를 해냈네요!
                    <br />
                    오늘 기분은 조금 달라졌나요?
                  </p>

                  <div className="flex gap-4">
                    {MOODS.map((mood) => (
                      <button
                        key={mood.label}
                        onClick={() => handleSelect(mood.label)}
                        className="flex flex-col items-center gap-2 rounded-[1rem] px-4 py-4 transition-transform hover:scale-105"
                        style={{ background: mood.bg }}
                      >
                        <mood.Icon size={28} strokeWidth={1.8} color={mood.color} />
                        <span className="text-xs font-semibold text-[#555555]">
                          {mood.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-5"
                >
                  <p className="text-center text-base leading-relaxed font-bold text-[#1a1a1a]">
                    그 감정을 회고에 남겨볼까요?
                  </p>

                  <p className="text-sm text-[#999999]">
                    &apos;{selected}&apos;를 선택하셨어요
                  </p>

                  <button
                    onClick={handleClose}
                    className="bg-brand-primary w-full rounded-full py-3 text-sm font-bold text-white"
                  >
                    회고 남기기
                  </button>
                  <button
                    onClick={handleClose}
                    className="text-sm font-medium text-[#aaaaaa]"
                  >
                    다음에 할게요
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
