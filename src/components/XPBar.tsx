interface XPBarProps {
  level: number;
  current?: number;
  max?: number;
  value: number; // 0 ~ 100
}

export default function XPBar({ level, current, max, value }: XPBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <span className="rounded-md bg-[linear-gradient(135deg,var(--brand-logo)_0%,var(--ui-button-primary)_100%)] px-2 py-0.5 text-[0.625rem] font-black tracking-widest text-white shadow-[0_2px_8px_rgba(255,148,55,0.4)]">
          LV.{level}
        </span>
        {current !== undefined && max !== undefined && (
          <span className="text-[0.6875rem] font-semibold text-[#888888]">
            {current}
            <span className="font-normal"> / {max} XP</span>
          </span>
        )}
      </div>

      <div className="relative h-2.5 w-[13.8125rem] overflow-hidden rounded-full bg-[#FFF3DC]">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,var(--brand-logo)_0%,var(--ui-button-primary)_100%)] shadow-[0_0_8px_rgba(255,148,55,0.55)] transition-all duration-700 ease-out"
          style={{ width: `${clamped}%` }}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[0.25rem] rounded-full bg-white/40" />
      </div>
    </div>
  );
}
