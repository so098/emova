"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";

interface XPBarProps {
  level: number;
  current?: number;
  max?: number;
  value: number; // 0 ~ 100
}

export default function XPBar({ level, current, max, value }: XPBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative flex items-center gap-1.5">
        <span className="rounded-md bg-brand-primary px-2 py-0.5 text-[0.625rem] font-black tracking-widest text-on-accent">
          LV.{level}
        </span>
        {current !== undefined && max !== undefined && (
          <span className="text-xs font-semibold text-text-muted">
            {current}
            <span className="font-normal"> / {max} XP</span>
          </span>
        )}
        <button
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="text-text-faint hover:text-text-muted transition-colors"
        >
          <HelpCircle size={12} strokeWidth={2} />
        </button>
        {showTooltip && (
          <div className="absolute left-0 top-full z-50 mt-1 w-[14rem] rounded-lg border border-border-default bg-surface px-3 py-2 text-xs font-medium text-text-secondary shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
            AI가 만든 퀘스트를 완료하면 XP가 올라가고 레벨이 상승합니다
          </div>
        )}
      </div>

      <div className="relative h-2.5 w-[13.8125rem] overflow-hidden rounded-full bg-bg-muted">
        <div
          className="h-full rounded-full bg-point transition-all duration-700 ease-out"
          style={{ width: `${clamped}%` }}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[0.25rem] rounded-full bg-surface-card-glass" />
      </div>
    </div>
  );
}
