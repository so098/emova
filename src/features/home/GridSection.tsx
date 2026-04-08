"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import SectionTitle from "@/components/ui/SectionTitle";
import { HelpCircle, Snail, Ban, Sprout, Zap, PenLine } from "lucide-react";
import type { ElementType } from "react";
import { useSessionStore } from "@/store/sessionStore";
import { useToast } from "@/components/feedback/ToastStack";
import { useStartFlow } from "@/features/flow/useFlowMutations";

const ITEMS: {
  key: string;
  label: string;
  color: string;
  Icon: ElementType;
}[] = [
  {
    key: "unknown",
    label: "뭘 원하는지\n모르겠다",
    color: "#4894ff",
    Icon: HelpCircle,
  },
  {
    key: "procrastinate",
    label: "자꾸\n미루게 된다",
    color: "#ffa900",
    Icon: Snail,
  },
  { key: "apathy", label: "아무 것도\n하기 싫다", color: "#656565", Icon: Ban },
  {
    key: "remotive",
    label: "다시 잘해보고 싶다",
    color: "#00ff77",
    Icon: Sprout,
  },
  { key: "stimulate", label: "자극이\n필요하다", color: "#ff7400", Icon: Zap },
  { key: "custom", label: "직접\n입력하기", color: "#7e9cb9", Icon: PenLine },
];

export default function GridSection() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<number | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [customConfirmed, setCustomConfirmed] = useState(false);
  const setGrid = useSessionStore((s) => s.setGrid);
  const setSupabaseSessionId = useSessionStore((s) => s.setSupabaseSessionId);
  const { showToast } = useToast();
  const startFlow = useStartFlow();

  /** 그리드 선택 시 세션 생성 + 생각 저장 */
  const saveToDb = (thoughtKey: string, customText?: string) => {
    startFlow.mutate(
      { thoughtKey, customText },
      {
        onSuccess: (sessionId) => setSupabaseSessionId(sessionId),
        onError: () =>
          showToast("저장에 실패했어요", "잠시 후 다시 시도해주세요"),
      },
    );
  };

  /** 공백 포함 6자 초과 시 말줄임 */
  const truncateLabel = (text: string) =>
    text.length > 6 ? text.slice(0, 6) + "…" : text;

  const updateThought = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("thought", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <SectionTitle>요즘 자주 드는 생각을 골라보세요</SectionTitle>

      <div className="grid grid-cols-3 gap-4" data-onboarding="thought-grid">
        {ITEMS.map(({ label, color, Icon }, i) => (
          <motion.div
            key={i}
            onClick={() => {
              setSelected(i);
              if (i === 5) {
                if (customConfirmed) {
                  // 확정된 상태에서 다시 클릭하면 수정 모드
                  setCustomConfirmed(false);
                  setCustomOpen(true);
                } else {
                  setCustomOpen(true);
                }
              } else {
                setCustomOpen(false);
                setCustomConfirmed(false);
                setCustomValue("");
                setGrid(ITEMS[i].label.replace("\n", " "));
                updateThought(ITEMS[i].key);
                saveToDb(ITEMS[i].key);
              }
            }}
            whileTap={{ scale: 0.91 }}
            transition={{ type: "spring", stiffness: 500, damping: 18 }}
            className="bg-surface-glass text-text-primary flex h-[10rem] w-[10rem] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl text-center text-sm leading-snug font-medium whitespace-pre-line shadow-[0_0.25rem_0.75rem_var(--shadow-card)] backdrop-blur-lg"
            style={{
              border:
                selected === i
                  ? `1px solid ${color}`
                  : "1px solid rgba(255,255,255,0.5)",
            }}
          >
            <div
              className="flex h-[3.0625rem] w-[3.0625rem] shrink-0 items-center justify-center rounded-full"
              style={{
                background: `radial-gradient(circle at 35% 35%, ${color}88, ${color})`,
                boxShadow: `0 0.25rem 0.75rem ${color}40`,
              }}
            >
              <Icon size={22} strokeWidth={2} color="var(--on-accent)" />
            </div>
            <span>
              {i === 5 && customConfirmed && customValue.trim()
                ? truncateLabel(customValue.trim())
                : label}
            </span>
          </motion.div>
        ))}
      </div>

      {customOpen && !customConfirmed && (
        <div className="flex w-full gap-2">
          <input
            type="text"
            value={customValue}
            onChange={(e) => {
              setCustomValue(e.target.value);
              updateThought(e.target.value || "custom");
            }}
            placeholder="직접 입력해주세요"
            autoFocus
            className="border-border-default text-text-primary placeholder:text-text-faint focus:border-brand-logo flex-1 rounded-xl border bg-transparent px-4 py-3 text-sm transition-colors outline-none"
          />
          <button
            type="button"
            disabled={!customValue.trim()}
            onClick={() => {
              const val = customValue.trim();
              if (!val) return;
              setCustomConfirmed(true);
              setCustomOpen(false);
              setGrid(val);
              updateThought(val);
              saveToDb("custom", val);
            }}
            className="text-on-accent shrink-0 rounded-xl bg-[var(--ui-button-primary)] px-4 py-3 text-sm font-medium transition-opacity disabled:opacity-40"
          >
            확인
          </button>
        </div>
      )}
    </div>
  );
}
