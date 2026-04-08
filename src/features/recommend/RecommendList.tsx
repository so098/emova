"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { fetchRecommendations, type Recommendation } from "@/app/recommend/actions";
import { ROUTES } from "@/constants/routes";
import CelebrationToast from "@/components/feedback/CelebrationToast";
import { today } from "@/store/questStore";
import { useSessionStore } from "@/store/sessionStore";
import { useToast } from "@/components/feedback/ToastStack";
import { useAddQuests } from "@/features/quest/hooks/useQuests";
import { useFinishFlow } from "@/features/flow/useFlowMutations";

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
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSelect = (i: number) =>
    setSelected((prev) =>
      prev.includes(i) ? prev.filter((v) => v !== i) : [...prev, i]
    );

  const addQuestsMutation = useAddQuests();
  const finishFlow = useFinishFlow();
  const supabaseSessionId = useSessionStore((s) => s.supabaseSessionId);
  const { showToast: showErrorToast } = useToast();

  const handleDone = async () => {
    if (isSaving) return;
    setIsSaving(true);

    // 선택한 추천 + 직접 입력을 퀘스트 store에 추가
    const dateStr = today();
    const newQuests = [
      ...selected.map((i) => ({
        title: items[i].title,
        date: dateStr,
        points: 20,
        done: false,
        source: "ai" as const,
      })),
      ...(customValue.trim()
        ? [{ title: customValue.trim(), date: dateStr, points: 20, done: false, source: "user" as const }]
        : []),
    ];
    if (newQuests.length > 0) {
      addQuestsMutation.mutate({ quests: newQuests, category: "단기", sessionId: supabaseSessionId ?? undefined });
    }

    // DB 저장: desires + actions + 세션 완료
    if (supabaseSessionId) {
      const dbActions = [
        ...items.map((item, i) => ({
          text: item.title,
          source: "system" as const,
          selected: selected.includes(i),
        })),
        ...(customValue.trim()
          ? [{ text: customValue.trim(), source: "custom" as const, selected: true }]
          : []),
      ];
      try {
        await finishFlow.mutateAsync({
          sessionId: supabaseSessionId,
          questionLabel,
          questionText,
          actions: dbActions,
        });
      } catch (e) {
        console.error("Failed to save flow:", e);
        showErrorToast("저장에 실패했어요", "다시 시도해주세요");
        setIsSaving(false);
        return;
      }
    }

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

      <div className="flex h-[calc(100dvh-10rem)] w-full max-w-[26rem] flex-col gap-4">
        {/* 타이틀 (고정) */}
        <p className="shrink-0 text-base font-bold leading-snug text-text-primary">
          이 감정을 행동으로 바꾸는 건 쉽지 않지만 괜찮아요, 작게 시작해볼 수 있어요
          <span className="ml-1 text-sm font-normal text-text-muted">(중복 선택 가능)</span>
        </p>

        {/* 추천 목록 (스크롤) */}
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
          {isPending
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[4.5rem] shrink-0 animate-pulse rounded-2xl bg-surface-elevated" />
              ))
            : items.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => handleSelect(i)}
                  className="flex shrink-0 cursor-pointer items-center gap-3 rounded-2xl bg-surface-card-glass px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.05)] backdrop-blur-lg transition-colors"
                  style={{
                    border: selected.includes(i) ? "1px solid var(--ui-button-primary)" : "1px solid rgba(255,255,255,0.5)",
                  }}
                >
                  <div
                    className="h-4 w-4 shrink-0 rounded-full border-2 transition-colors"
                    style={{
                      borderColor: selected.includes(i) ? "var(--ui-button-primary)" : "var(--text-faint)",
                      background: selected.includes(i) ? "var(--ui-button-primary)" : "transparent",
                    }}
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold text-text-primary">{item.title}</span>
                    <span className="text-xs text-text-secondary">{item.description}</span>
                  </div>
                </motion.div>
              ))}

          {/* 직접 입력 */}
          <div
            onClick={() => setCustomOpen((v) => !v)}
            className="flex shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-surface-card-glass px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
            style={{ border: customOpen ? "1px solid var(--ui-button-primary)" : "1px solid transparent" }}
          >
            <span className="text-sm text-text-muted">직접 입력하기</span>
          </div>
          {customOpen && (
            <input
              type="text"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              placeholder="직접 적어보세요"
              autoFocus
              className="shrink-0 rounded-xl border border-border-default bg-surface px-4 py-3 text-sm outline-none placeholder:text-text-faint focus:border-brand-primary"
            />
          )}


        </div>

        {/* 하단 버튼 (고정) */}
        <div className="flex shrink-0 gap-3">
          <button
            onClick={() => router.push(ROUTES.HOME)}
            className="flex-1 rounded-xl border border-border-default bg-surface py-3 text-sm text-text-secondary transition-colors hover:border-brand-primary"
          >
            오늘은 이만 넘어갈게요
          </button>
          <button
            onClick={handleDone}
            disabled={isSaving}
            className="flex-1 rounded-xl bg-brand-primary py-3 text-sm font-bold text-on-accent transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {isSaving ? "저장 중..." : "다 했어요"}
          </button>
        </div>
      </div>
    </>
  );
}
