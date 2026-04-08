"use client";

import { useState } from "react";
import { Bell, Flame, Star, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const MESSAGES = [
  {
    icon: Sparkles,
    title: "요즘 자주 드는 생각 작성 완료!",
    desc: "루틴 진행률이 10% 올랐습니다.",
  },
  {
    icon: Flame,
    title: "오늘 루틴을 아직 시작하지 않았어요!",
    desc: "지금 시작하면 딱 좋을 시간이에요.",
  },
  {
    icon: Star,
    title: "어제보다 감정이해도가 12% 올랐어요",
    desc: "꾸준히 기록하고 있군요, 잘하고 있어요.",
  },
];

export default function NotificationBell() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative flex h-8 w-8 items-center justify-center rounded-full border border-border-default/60 transition-opacity hover:opacity-80"
        style={{ background: open ? "var(--brand-logo)" : "var(--brand-deco-circle)" }}
      >
        <Bell size={14} color="var(--ui-button-primary)" strokeWidth={2.2} />
        {MESSAGES.length > 0 && !open && (
          <span className="absolute -right-1 -bottom-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-red px-1 text-[0.625rem] font-bold leading-none text-on-accent">
            {MESSAGES.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="absolute right-0 top-10 z-30 flex w-[15rem] flex-col gap-[0.375rem] rounded-2xl border border-border-default/70 bg-surface-card-glass p-3 shadow-[0_8px_24px_rgba(0,0,0,0.1)] backdrop-blur-xl"
          >
            {MESSAGES.map(({ icon: Icon, title, desc }, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 rounded-xl bg-surface-card-glass px-3 py-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
              >
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-gold-bg">
                  <Icon size={12} color="var(--ui-button-primary)" strokeWidth={2} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-xs font-semibold leading-snug text-text-primary">
                    {title}
                  </p>
                  <p className="text-[0.6875rem] leading-snug text-text-secondary">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
