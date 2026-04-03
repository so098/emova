"use client";

import { useRewardStore } from "@/store/rewardStore";

export default function EmotionGauge() {
  const points = useRewardStore((s) => s.points);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2 text-[0.6875rem] font-semibold text-[#666666]">
        <span>포인트</span>
        <span className="text-brand-primary">{points}P</span>
      </div>

      <div className="relative h-3 w-[13.8125rem] overflow-hidden rounded-full border border-[#e0e0e0]/60 bg-[#FFF3DC]">
        {[25, 50, 75].map((pos) => (
          <div
            key={pos}
            className="absolute top-0 z-10 h-full w-px bg-white/60"
            style={{ left: `${pos}%` }}
          />
        ))}
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,var(--brand-logo)_0%,var(--ui-button-primary)_100%)] shadow-[0_0_6px_rgba(244,132,95,0.5)] transition-all duration-500 ease-out"
          style={{ width: `${Math.min(100, (points / 500) * 100)}%` }}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[0.3125rem] rounded-full bg-white/30" />
      </div>

      <div className="flex justify-between text-[0.5625rem] text-[#999999]">
        <span>0</span>
        <span>125</span>
        <span>250</span>
        <span>375</span>
        <span>500</span>
      </div>
    </div>
  );
}
