"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import SectionTitle from "@/components/SectionTitle";
import { QUESTIONS } from "@/constants/questions";
import { encodeQuestionSlug } from "@/utils/questionSlug";

const INITIAL_COUNT = 3;
const STEP = 3;

export default function QuestionList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(INITIAL_COUNT);

  const showMore = () => setVisible((v) => Math.min(v + STEP, QUESTIONS.length));

  return (
    <div className="flex w-full max-w-(--ui-content-width) flex-col gap-4">
      <SectionTitle>지금 감정에 맞는 질문을 골라보세요</SectionTitle>

      <div className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {QUESTIONS.slice(0, visible).map(({ label, sub, color, Icon }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 28, delay: i < INITIAL_COUNT ? 0 : 0.05 * (i - visible + STEP) }}
              onClick={() => {
                const qs = searchParams.toString();
                const slug = encodeQuestionSlug(i);
                router.push(qs ? `/question/${slug}?${qs}` : `/question/${slug}`);
              }}
              whileTap={{ scale: 0.97 }}
              className="flex cursor-pointer items-center gap-4 rounded-2xl border border-border-card-glass bg-surface-card-glass px-5 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)] backdrop-blur-lg"
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: `radial-gradient(circle at 35% 35%, ${color}88, ${color})`,
                  boxShadow: `0 0.25rem 0.75rem ${color}40`,
                }}
              >
                <Icon size={20} strokeWidth={2} color="var(--on-accent)" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-base font-bold text-text-primary">{label}</span>
                <span className="text-xs text-text-secondary">{sub}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {visible < QUESTIONS.length && (
        <button
          onClick={showMore}
          className="mt-1 self-center text-sm font-semibold text-text-muted transition-colors hover:text-brand-primary"
        >
          질문 더 보기
        </button>
      )}
    </div>
  );
}
