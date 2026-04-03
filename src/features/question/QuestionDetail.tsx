"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Question } from "@/constants/questions";
import { useSessionStore } from "@/store/sessionStore";

export default function QuestionDetail({ question }: { question: Question }) {
  const [text, setText] = useState("");
  const setSession = useSessionStore((s) => s.setSession);

  return (
    <>
      {/* 배경 컬러 워시 */}
      <div
        className="fixed inset-0 -z-[1] transition-colors duration-500"
        style={{ background: question.color + "28" }}
      />

      <main className="flex w-full flex-col items-center gap-6 px-4 pt-24 pb-[12rem]">
        {/* 헤더 타이틀 */}
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-[28rem] text-center text-xl font-bold text-[#1a1a1a]"
        >
          {question.label}
        </motion.h2>

        {/* 텍스트 입력 영역 */}
        <motion.textarea
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setSession(question.label, e.target.value);
          }}
          placeholder="자유롭게 적어보세요..."
          className="w-full max-w-(--ui-content-width) resize-none rounded-2xl bg-white/80 px-5 py-4 text-sm leading-relaxed text-[#1a1a1a] shadow-[0_2px_12px_rgba(0,0,0,0.06)] outline-none placeholder:text-[#cccccc] focus:shadow-[0_2px_16px_rgba(0,0,0,0.1)]"
          style={{ minHeight: "25rem" }}
        />
      </main>
    </>
  );
}
