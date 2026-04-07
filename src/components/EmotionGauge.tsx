"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { useRewardStore } from "@/store/rewardStore";

export default function EmotionGauge() {
  const points = useRewardStore((s) => s.points);
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2 text-xs font-semibold text-text-secondary">
        <div className="relative flex items-center gap-1">
          <span>자기이해도</span>
          <button
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="text-text-faint hover:text-text-muted transition-colors"
          >
            <HelpCircle size={12} strokeWidth={2} />
          </button>
          {showTooltip && (
            <div className="absolute left-0 top-full z-50 mt-1 w-[12rem] rounded-lg border border-border-default bg-surface px-3 py-2 text-xs font-medium text-text-secondary shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
              유저가 만든 퀘스트가 완료되면 이해도가 올라갑니다
            </div>
          )}
        </div>
        <span className="text-brand-primary">{points}P</span>
      </div>

      <div className="relative h-3 w-[13.8125rem] overflow-hidden rounded-full border border-border-default/60 bg-bg-muted">
        {[25, 50, 75].map((pos) => (
          <div
            key={pos}
            className="absolute top-0 z-10 h-full w-px bg-surface-card-glass"
            style={{ left: `${pos}%` }}
          />
        ))}
        <div
          className="h-full rounded-full bg-point transition-all duration-500 ease-out"
          style={{ width: `${Math.min(100, (points / 500) * 100)}%` }}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[0.3125rem] rounded-full bg-surface-card-glass" />
      </div>

      <div className="flex justify-between text-[0.625rem] text-text-muted">
        <span>0</span>
        <span>125</span>
        <span>250</span>
        <span>375</span>
        <span>500</span>
      </div>
    </div>
  );
}
