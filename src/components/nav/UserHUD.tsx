"use client";

import { User } from "lucide-react";
import { useRewardStore, getLevel, getLevelProgress } from "@/store/rewardStore";

export default function UserHUD() {
  const xp = useRewardStore((s) => s.xp);
  const level = getLevel(xp);
  const progress = getLevelProgress(xp);

  return (
    <div data-onboarding="user-hud" className="flex items-center gap-2.5">
      {/* 아바타 */}
      <div className="relative shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-point p-[2px]">
          <div className="flex h-full w-full items-center justify-center rounded-full bg-surface">
            <User size={18} strokeWidth={2} color="var(--point-color)" />
          </div>
        </div>
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-accent-green" />
      </div>

      {/* LV + 게이지 */}
      <div className="flex flex-col gap-1">
        <span className="rounded-md bg-brand-primary px-2 py-0.5 text-[0.625rem] font-black tracking-widest text-on-accent">
          LV.{level}
        </span>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-14 overflow-hidden rounded-full bg-bg-muted">
            <div
              className="h-full rounded-full bg-point transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[0.625rem] font-bold text-text-muted">XP</span>
        </div>
      </div>
    </div>
  );
}
