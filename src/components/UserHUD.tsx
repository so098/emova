"use client";

import { User } from "lucide-react";
import XPBar from "@/components/XPBar";
import { useRewardStore, getLevel, getLevelProgress, getNextLevelXP } from "@/store/rewardStore";

export default function UserHUD() {
  const xp = useRewardStore((s) => s.xp);
  const level = getLevel(xp);
  const progress = getLevelProgress(xp);
  const nextLevelXP = getNextLevelXP(xp);

  return (
    <div className="flex items-center gap-3">
      {/* 아바타 */}
      <div className="relative shrink-0">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--brand-logo)_0%,var(--ui-button-primary)_100%)] p-[2.5px] shadow-[0_4px_14px_rgba(255,148,55,0.4)]">
          <div className="flex h-full w-full items-center justify-center rounded-full bg-surface">
            <User size={20} strokeWidth={2} color="var(--ui-button-primary)" />
          </div>
        </div>
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-accent-green" />
      </div>

      {/* LV 뱃지 + XP 바 */}
      <XPBar value={progress} level={level} current={xp} max={nextLevelXP} />
    </div>
  );
}
