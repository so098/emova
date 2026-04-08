"use client";

import { useState } from "react";
import { X, Star, Bug, Lightbulb, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useSubmitFeedback } from "@/features/profile/hooks/useFeedback";
import { useToast } from "@/components/feedback/ToastStack";
import type { FeedbackCategory } from "@/lib/supabase/feedbackApi";

const CATEGORIES: { key: FeedbackCategory; label: string; icon: typeof Bug }[] = [
  { key: "bug", label: "버그 신고", icon: Bug },
  { key: "feature", label: "기능 제안", icon: Lightbulb },
  { key: "general", label: "일반 피드백", icon: MessageCircle },
];

export default function FeedbackModal({ onClose }: { onClose: () => void }) {
  const [category, setCategory] = useState<FeedbackCategory>("general");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<number | null>(null);

  const submitFeedback = useSubmitFeedback();
  const { showToast } = useToast();

  const handleSubmit = async () => {
    try {
      await submitFeedback.mutateAsync({
        category,
        message,
        rating: rating ?? undefined,
      });
      showToast("피드백 전송 완료", "소중한 의견 감사합니다!");
      onClose();
    } catch {
      showToast("전송 실패", "잠시 후 다시 시도해주세요");
    }
  };

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
        className="fixed inset-x-4 top-1/2 z-50 mx-auto flex max-w-[28rem] -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border-default bg-surface"
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <span className="text-base font-bold text-text-primary">피드백 보내기</span>
          <button onClick={onClose} className="text-text-muted transition-colors hover:text-text-primary">
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <div className="flex flex-col gap-4 px-5 pb-5">
          {/* 카테고리 */}
          <div className="flex gap-2">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              const active = category === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? "bg-point text-on-accent"
                      : "bg-bg-muted text-text-muted hover:text-text-secondary"
                  }`}
                >
                  <Icon size={13} strokeWidth={2} />
                  {c.label}
                </button>
              );
            })}
          </div>

          {/* 메시지 입력 */}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="내용을 입력해주세요"
            rows={4}
            className="w-full resize-none rounded-xl border border-border-default bg-bg-muted px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-point focus:outline-none"
          />

          {/* 별점 */}
          <div className="flex items-center gap-1">
            <span className="mr-2 text-xs text-text-muted">만족도</span>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setRating(rating === n ? null : n)}
                className="p-1 transition-colors"
              >
                <Star
                  size={20}
                  strokeWidth={1.8}
                  className={
                    rating !== null && n <= rating
                      ? "fill-point text-point"
                      : "text-text-muted"
                  }
                />
              </button>
            ))}
          </div>

          {/* 제출 */}
          <button
            onClick={handleSubmit}
            disabled={!message.trim() || submitFeedback.isPending}
            className="w-full rounded-full bg-point py-3 text-sm font-bold text-on-accent transition-opacity disabled:opacity-40"
          >
            {submitFeedback.isPending ? "전송 중..." : "보내기"}
          </button>
        </div>
      </motion.div>
    </>
  );
}
