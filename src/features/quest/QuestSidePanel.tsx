"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getMovaMessage, type MovaContext } from "./movaMessages";

interface Quest {
  id: string;
  title: string;
  points: number;
  done: boolean;
  parentId?: string;
}

interface QuestSidePanelProps {
  단기: Quest[];
  장기: Quest[];
  movaContext: MovaContext;
}

interface ActivityItem {
  id: string;
  text: string;
  time: string;
  type: "complete" | "point" | "streak";
}

function getMotivation(
  doneCount: number,
  totalCount: number,
  streakDays: number,
): string | null {
  if (streakDays >= 3) return `🔥 ${streakDays}일 연속 달성 중!`;
  if (doneCount >= 5) return `💪 오늘 벌써 ${doneCount}개 완료!`;
  if (doneCount > 0 && doneCount === totalCount) return "🎉 오늘 퀘스트 전부 클리어!";
  if (doneCount >= 3) return "✨ 순조로운 하루예요!";
  if (doneCount === 1) return "👏 좋은 시작이에요!";
  return null;
}

export default function QuestSidePanel({ 단기, 장기, movaContext }: QuestSidePanelProps) {
  const totalShort = 단기.length;
  const doneShort = 단기.filter((q) => q.done).length;
  const totalLong = 장기.length;
  const doneLong = 장기.filter((q) => q.done).length;
  const totalPoints =
    단기.filter((q) => q.done).reduce((s, q) => s + q.points, 0) +
    장기.filter((q) => q.done).reduce((s, q) => s + q.points, 0);

  // 임시 streak (추후 실제 데이터 연동)
  const streakDays = 1;

  const motivation = getMotivation(doneShort + doneLong, totalShort + totalLong, streakDays);

  // 최근 활동 피드 (완료된 항목 역순)
  const activities: ActivityItem[] = [
    ...단기.filter((q) => q.done).map((q) => ({
      id: `s-${q.id}`,
      text: `"${q.title}" 완료`,
      time: "방금",
      type: "complete" as const,
    })),
    ...장기.filter((q) => q.done).map((q) => ({
      id: `l-${q.id}`,
      text: `🎯 "${q.title}" 달성`,
      time: "방금",
      type: "streak" as const,
    })),
  ].slice(0, 5);

  const shortPercent = totalShort > 0 ? Math.round((doneShort / totalShort) * 100) : 0;

  const stats = { shortTotal: totalShort, shortDone: doneShort, longTotal: totalLong, longDone: doneLong };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const movaMessage = useMemo(() => getMovaMessage(movaContext, stats), [movaContext, doneShort, doneShort, totalShort, doneLong]);

  return (
    <div className="flex w-[14rem] shrink-0 flex-col gap-3">
      {/* 모바 말풍선 */}
      <div className="relative rounded-2xl border border-border-default bg-surface p-4">
        {/* 꼬리 — 왼쪽 */}
        <div className="absolute -left-1.5 top-5 h-3 w-3 rotate-45 border-b border-l border-border-default bg-surface" />
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-[1.75rem] w-[1.75rem] items-center justify-center rounded-full bg-accent-gold-bg">
            <span className="text-sm">🧡</span>
          </div>
          <span className="text-xs font-bold text-text-primary">모바</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={movaMessage}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-sm leading-relaxed font-medium text-text-secondary"
          >
            {movaMessage}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* 오늘의 요약 */}
      <div className="rounded-2xl border border-border-default bg-surface p-4">
        <h3 className="mb-3 text-xs font-bold text-text-muted">퀘스트 현황</h3>

        {/* 단기 진행률 */}
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-text-secondary">단기</span>
          <span className="text-xs font-bold text-interactive">
            {doneShort}/{totalShort}
          </span>
        </div>
        <div className="mb-3 h-[0.3125rem] overflow-hidden rounded-full bg-bg-muted">
          <motion.div
            className="h-full rounded-full bg-point"
            initial={{ width: 0 }}
            animate={{ width: `${shortPercent}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>

        {/* 장기 */}
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-medium text-text-secondary">장기</span>
          <span className="text-xs font-bold text-accent-gold">
            {doneLong}/{totalLong}
          </span>
        </div>

        {/* 총 포인트 */}
        <div className="flex items-center justify-between rounded-[0.625rem] bg-bg-muted px-3 py-2">
          <span className="text-xs font-medium text-text-muted">획득 포인트</span>
          <span className="text-xs font-bold text-text-primary">+{totalPoints}</span>
        </div>
      </div>

      {/* 동기부여 메시지 */}
      <AnimatePresence>
        {motivation && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl bg-bg-muted px-4 py-3 text-center text-sm font-semibold text-text-secondary"
          >
            {motivation}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 활동 피드 */}
      {activities.length > 0 && (
        <div className="rounded-2xl border border-border-default bg-surface p-4">
          <h3 className="mb-3 text-xs font-bold text-text-muted">최근 활동</h3>
          <div className="flex flex-col gap-2">
            <AnimatePresence>
              {activities.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  className="flex items-start gap-2"
                >
                  <div
                    className={`mt-0.5 h-[0.375rem] w-[0.375rem] shrink-0 rounded-full ${
                      item.type === "streak"
                        ? "bg-interactive"
                        : "bg-accent-gold"
                    }`}
                  />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-xs font-medium text-text-secondary">
                      {item.text}
                    </span>
                    <span className="text-[0.625rem] text-text-faint">
                      {item.time}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
