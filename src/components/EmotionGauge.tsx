interface EmotionGaugeProps {
  value: number; // 0 ~ 100
  label?: string;
}

export default function EmotionGauge({ value, label }: EmotionGaugeProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2 text-[0.6875rem] font-semibold text-[#666666]">
        {label && <span>{label}</span>}
        <span className="text-brand-primary">{clamped}%</span>
      </div>

      <div className="relative h-3 w-[13.8125rem] overflow-hidden rounded-full bg-[#FFF3DC]">
        {[25, 50, 75].map((pos) => (
          <div
            key={pos}
            className="absolute top-0 z-10 h-full w-px bg-white/60"
            style={{ left: `${pos}%` }}
          />
        ))}
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,var(--brand-logo)_0%,var(--ui-button-primary)_100%)] shadow-[0_0_6px_rgba(244,132,95,0.5)] transition-all duration-500 ease-out"
          style={{ width: `${clamped}%` }}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[0.3125rem] rounded-full bg-white/30" />
      </div>

      <div className="flex justify-between text-[0.5625rem] text-[#999999]">
        <span>입문</span>
        <span>성장</span>
        <span>심화</span>
        <span>마스터</span>
      </div>
    </div>
  );
}
