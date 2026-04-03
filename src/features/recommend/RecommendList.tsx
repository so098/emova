"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { fetchRecommendations, type Recommendation } from "@/app/recommend/actions";
import { ROUTES } from "@/constants/routes";
import CelebrationToast from "@/components/CelebrationToast";
import { useQuestStore, getNextId, today } from "@/store/questStore";

interface RecommendListProps {
  questionLabel: string;
  questionText: string;
  initial: Recommendation[];
}

export default function RecommendList({
  questionLabel,
  questionText,
  initial,
}: RecommendListProps) {
  const router = useRouter();
  const [items, setItems] = useState<Recommendation[]>(initial);
  const [selected, setSelected] = useState<number[]>([]);
  const [customOpen, setCustomOpen] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const [showToast, setShowToast] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSelect = (i: number) =>
    setSelected((prev) =>
      prev.includes(i) ? prev.filter((v) => v !== i) : [...prev, i]
    );

  const addShortQuests = useQuestStore((s) => s.addShortQuests);

  const handleDone = () => {
    // 선택한 추천 + 직접 입력을 퀘스트 store에 추가
    const dateStr = today();
    const newQuests = [
      ...selected.map((i) => ({
        id: getNextId(),
        title: items[i].title,
        date: dateStr,
        points: 20,
        done: false,
        source: "ai" as const,
      })),
      ...(customValue.trim()
        ? [{ id: getNextId(), title: customValue.trim(), date: dateStr, points: 20, done: false, source: "user" as const }]
        : []),
    ];
    if (newQuests.length > 0) addShortQuests(newQuests);

    if (timerRef.current) clearTimeout(timerRef.current);
    setShowToast(true);
    timerRef.current = setTimeout(() => {
      setShowToast(false);
      router.push(`${ROUTES.QUEST}?tab=단기`);
    }, 3000);
  };

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const handleRetry = () => {
    startTransition(async () => {
      const next = await fetchRecommendations(questionLabel, questionText);
      setItems(next);
      setSelected([]);
    });
  };

  return (
    <>
      <CelebrationToast
        visible={showToast}
        message="퀘스트 추가완료!"
        sub="이제 퀘스트 창에서 확인해볼까요?"
        duration={3000}
      />

      <div className="flex w-full max-w-[26rem] flex-col gap-4">
        {/* 타이틀 */}
        <p className="text-base font-bold leading-snug text-[#1a1a1a]">
          이 감정을 행동으로 바꾸는 건 쉽지 않지만 괜찮아요, 작게 시작해볼 수 있어요
          <span className="ml-1 text-sm font-normal text-[#999999]">(중복 선택 가능)</span>
        </p>

        {/* 추천 목록 */}
        <div className="flex flex-col gap-2">
          {isPending
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-[4.5rem] animate-pulse rounded-2xl bg-[#f0f0f0]" />
              ))
            : items.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => handleSelect(i)}
                  className="flex cursor-pointer items-center gap-3 rounded-2xl bg-white/60 px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.05)] backdrop-blur-lg transition-colors"
                  style={{
                    border: selected.includes(i) ? "1px solid var(--ui-button-primary)" : "1px solid rgba(255,255,255,0.5)",
                  }}
                >
                  <div
                    className="h-4 w-4 shrink-0 rounded-full border-2 transition-colors"
                    style={{
                      borderColor: selected.includes(i) ? "var(--ui-button-primary)" : "#cccccc",
                      background: selected.includes(i) ? "var(--ui-button-primary)" : "transparent",
                    }}
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold text-[#1a1a1a]">{item.title}</span>
                    <span className="text-xs text-[#666666]">{item.description}</span>
                  </div>
                </motion.div>
              ))}

          {/* 직접 입력 */}
          <div
            onClick={() => setCustomOpen((v) => !v)}
            className="flex cursor-pointer items-center justify-center rounded-2xl bg-white/60 px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
            style={{ border: customOpen ? "1px solid var(--ui-button-primary)" : "1px solid transparent" }}
          >
            <span className="text-sm text-[#999999]">직접 입력하기</span>
          </div>
          {customOpen && (
            <input
              type="text"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              placeholder="직접 적어보세요"
              autoFocus
              className="rounded-xl border border-[#e5e5e5] bg-white px-4 py-3 text-sm outline-none placeholder:text-[#cccccc] focus:border-brand-primary"
            />
          )}
        </div>

        {/* 다시 추천받기 */}
        <button
          onClick={handleRetry}
          disabled={isPending}
          className="self-center rounded-full border border-[#e5e5e5] bg-white px-5 py-2 text-sm text-[#666666] transition-colors hover:border-brand-primary hover:text-brand-primary disabled:opacity-50"
        >
          다시 추천받기
        </button>

        {/* 하단 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={() => router.push(ROUTES.HOME)}
            className="flex-1 rounded-xl border border-[#e5e5e5] bg-white py-3 text-sm text-[#666666] transition-colors hover:border-brand-primary"
          >
            오늘은 그냥 넘어갈게요
          </button>
          <button
            onClick={handleDone}
            className="flex-1 rounded-xl bg-brand-primary py-3 text-sm font-bold text-white transition-opacity hover:opacity-85"
          >
            다 했어요
          </button>
        </div>
      </div>
    </>
  );
}
