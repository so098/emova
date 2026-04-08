"use client";

import { useState, useEffect, useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface Step {
  target: string;
  message: string;
  /** 말풍선 위치: 타겟 기준 */
  position: "top" | "bottom" | "right";
}

const ALL_STEPS: Step[] = [
  {
    target: "thought-grid",
    message:
      "요즘 자주 드는 생각을 골라보세요.\n감정에서 시작해 행동으로 연결해줄게요.",
    position: "top",
  },
  {
    target: "nav-menu",
    message: "퀘스트와 회고는 여기서 확인할 수 있어요.",
    position: "right",
  },
  {
    target: "user-hud",
    message: "행동할수록 경험치가 쌓여요.\n레벨이 올라가는 걸 확인해보세요.",
    position: "bottom",
  },
];

const STORAGE_KEY = "emova_onboarding_done";

function getVisibleSteps(): Step[] {
  return ALL_STEPS.filter(
    (s) => document.querySelector(`[data-onboarding="${s.target}"]`) !== null,
  );
}

function getRect(target: string): DOMRect | null {
  const el = document.querySelector(`[data-onboarding="${target}"]`);
  return el ? el.getBoundingClientRect() : null;
}

function calcTooltipStyle(
  position: Step["position"],
  rect: DOMRect,
  padding: number,
): React.CSSProperties {
  const gap = 12;

  if (position === "right") {
    return {
      left: rect.right + padding + gap,
      top: rect.top + rect.height / 2,
      transform: "translateY(-50%)",
    };
  }

  // top / bottom: 수평 중앙 정렬 (화면 밖 방지)
  const centerX = rect.left + rect.width / 2 - 160;
  const clampedX = Math.min(Math.max(16, centerX), window.innerWidth - 336);

  if (position === "bottom") {
    return { left: clampedX, top: rect.bottom + padding + gap };
  }

  // top
  return {
    left: clampedX,
    bottom: window.innerHeight - rect.top + padding + gap,
  };
}

export default function Onboarding() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [steps, setSteps] = useState<Step[]>([]);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (pathname !== "/") {
      setActive(false);
      return;
    }
    // TODO: 배포 시 localStorage 체크 복원
    // if (localStorage.getItem(STORAGE_KEY)) return;
    let attempts = 0;
    const tryStart = () => {
      const visible = getVisibleSteps();
      if (visible.length > 0) {
        setSteps(visible);
        setStepIndex(0);
        setActive(true);
        return;
      }
      attempts++;
      if (attempts < 10) timer = setTimeout(tryStart, 300);
    };
    let timer = setTimeout(tryStart, 500);
    return () => clearTimeout(timer);
  }, [pathname]);

  useLayoutEffect(() => {
    if (!active || steps.length === 0) return;
    const current = steps[stepIndex];
    if (!current) return;
    setRect(getRect(current.target));
  }, [active, stepIndex, steps]);

  useEffect(() => {
    if (!active) return;
    const handleResize = () => {
      const current = steps[stepIndex];
      if (current) setRect(getRect(current.target));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [active, stepIndex, steps]);

  const handleNext = () => {
    if (stepIndex + 1 >= steps.length) {
      setActive(false);
      localStorage.setItem(STORAGE_KEY, "true");
    } else {
      console.log("여기실행?");
      setStepIndex((i) => i + 1);
    }
  };

  if (!active || !rect || steps.length === 0) return null;
  const current = steps[stepIndex];
  console.log("current", current, stepIndex);
  const padding = 8;
  const isLast = stepIndex >= steps.length - 1;
  const tooltipStyle = calcTooltipStyle(current.position, rect, padding);

  const initialY =
    current.position === "bottom" ? -8 : current.position === "top" ? 8 : 0;
  const initialX = current.position === "right" ? -8 : 0;

  return (
    <AnimatePresence>
      <motion.div
        key="onboarding-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100]"
        onClick={handleNext}
      >
        <div
          className="absolute rounded-2xl"
          style={{
            top: rect.top - padding,
            left: rect.left - padding,
            width: rect.width + padding * 2,
            height: rect.height + padding * 2,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
          }}
        />

        <motion.div
          key={stepIndex}
          initial={{ opacity: 0, x: initialX, y: initialY }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.25 }}
          className="bg-surface absolute flex w-[20rem] flex-col gap-3 rounded-2xl px-5 py-4 shadow-lg"
          style={tooltipStyle}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-text-primary text-sm leading-relaxed font-medium whitespace-pre-wrap">
            {current.message}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-text-faint text-xs">
              {stepIndex + 1} / {steps.length}
            </span>
            <button
              onClick={handleNext}
              className="bg-brand-primary text-on-accent rounded-full px-4 py-2 text-xs font-bold"
            >
              {isLast ? "시작하기" : "다음"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
