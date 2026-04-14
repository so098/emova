"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Flame, Star, AlertCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { fetchNotifications } from "@/lib/supabase/notificationApi";
import { NOTIFICATION_KEY } from "@/lib/query/queryKeys";
import type { Notification } from "@/lib/supabase/notificationApi";

const ICON_MAP: Record<Notification["type"], typeof Bell> = {
  "no-session-today": Flame,
  unreflected: AlertCircle,
  streak: Star,
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const { data: notifications = [] } = useQuery({
    queryKey: NOTIFICATION_KEY,
    queryFn: fetchNotifications,
    staleTime: 60_000,
  });

  const count = notifications.length;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative flex h-8 w-8 items-center justify-center rounded-full border border-border-default/60 transition-opacity hover:opacity-80"
        style={{ background: open ? "var(--brand-logo)" : "var(--brand-deco-circle)" }}
      >
        <Bell size={14} color="var(--ui-button-primary)" strokeWidth={2.2} />
        {count > 0 && !open && (
          <span className="absolute -right-1 -bottom-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-point px-1 text-[0.625rem] font-bold leading-none text-on-accent">
            {count}
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
            {count === 0 ? (
              <p className="px-2 py-3 text-center text-xs text-text-secondary">
                새로운 알림이 없어요
              </p>
            ) : (
              notifications.map((n, i) => {
                const Icon = ICON_MAP[n.type];
                return (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 rounded-xl bg-surface-card-glass px-3 py-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                  >
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-gold-bg">
                      <Icon size={12} color="var(--ui-button-primary)" strokeWidth={2} />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-xs font-semibold leading-snug text-text-primary">
                        {n.title}
                      </p>
                      <p className="text-[0.6875rem] leading-snug text-text-secondary">
                        {n.desc}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
