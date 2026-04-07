"use client";

import { Zap, Diamond } from "lucide-react";
import { useRewardStore } from "@/store/rewardStore";

export default function CurrencyHUD() {
  const xp = useRewardStore((s) => s.xp);
  const points = useRewardStore((s) => s.points);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 rounded-full bg-bg-muted px-2.5 py-1.5">
        <Zap size={13} strokeWidth={2.2} color="var(--point-color)" />
        <span className="text-xs font-bold text-text-primary">{xp} XP</span>
      </div>
      <div className="flex items-center gap-1 rounded-full bg-bg-muted px-2.5 py-1.5">
        <Diamond size={13} strokeWidth={2.2} color="var(--point-color)" />
        <span className="text-xs font-bold text-text-primary">{points.toLocaleString()}P</span>
      </div>
    </div>
  );
}
