"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CelebrationToastProps {
  visible: boolean;
  message: string;
  sub: string;
}

const COLORS = ["#FF9437", "#FFC38F", "#77dd77", "#c3aed6", "#ff6b6b", "#7ec8e3", "#ffb347", "#ffc38f"];

function useParticles(count: number) {
  return useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 320,
        y: -(Math.random() * 180 + 40),
        rotate: Math.random() * 720 - 360,
        scale: Math.random() * 0.6 + 0.4,
        color: COLORS[i % COLORS.length],
        isRect: i % 3 === 0,
        delay: Math.random() * 0.3,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
}

export default function CelebrationToast({ visible, message, sub }: CelebrationToastProps) {
  const particles = useParticles(28);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.92 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="fixed left-1/2 top-20 z-[200] -translate-x-1/2"
        >
          {/* 파티클 */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ x: 0, y: 0, opacity: 1, scale: p.scale, rotate: 0 }}
                animate={{ x: p.x, y: p.y, opacity: 0, scale: 0, rotate: p.rotate }}
                transition={{ duration: 1.2, delay: p.delay, ease: "easeOut" }}
                className="absolute"
                style={{
                  width: p.isRect ? "0.5rem" : "0.45rem",
                  height: p.isRect ? "0.3rem" : "0.45rem",
                  borderRadius: p.isRect ? "0.1rem" : "50%",
                  background: p.color,
                }}
              />
            ))}
          </div>

          {/* 토스트 카드 */}
          <div className="flex flex-col items-center gap-1 rounded-2xl bg-white px-6 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.14)]">
            <span className="text-base font-bold text-[#1a1a1a]">{message}</span>
            <span className="text-sm text-[#999999]">{sub}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
