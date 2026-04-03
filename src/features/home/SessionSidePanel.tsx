"use client";

import { useSessionStore } from "@/store/sessionStore";
import { motion, AnimatePresence } from "framer-motion";

export default function SessionSidePanel() {
  const { selectedGrid, selectedEmotion, questionLabel } = useSessionStore();

  const items = [
    { label: "생각", value: selectedGrid },
    { label: "감정", value: selectedEmotion },
    { label: "질문", value: questionLabel },
  ].filter((item) => item.value);

  if (items.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className="hidden w-[14rem] shrink-0 flex-col gap-3 lg:flex"
    >
      <div className="rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <h3 className="mb-3 text-xs font-bold text-[#aaaaaa]">선택 현황</h3>
        <AnimatePresence mode="popLayout">
          <div className="flex flex-col gap-2.5">
            {items.map((item) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.8, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="flex flex-col gap-1"
              >
                <span className="text-[0.625rem] font-semibold text-[#bbbbbb]">
                  {item.label}
                </span>
                <span className="rounded-[0.625rem] bg-[#f8f8f8] px-3 py-2 text-xs font-medium text-[#555555]">
                  {item.value}
                </span>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
