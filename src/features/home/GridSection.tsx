"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import SectionTitle from "@/components/SectionTitle";

const ITEMS = [
  { key: "unknown", label: "뭘 원하는지\n모르겠다", color: "#4894ff" },
  { key: "procrastinate", label: "자꾸\n미루게 된다", color: "#ffa900" },
  { key: "apathy", label: "아무 것도\n하기 싫다", color: "#656565" },
  { key: "remotive", label: "다시 잘해보고 싶다", color: "#00ff77" },
  { key: "stimulate", label: "자극이\n필요하다", color: "#ff7400" },
  { key: "custom", label: "직접\n입력하기", color: "#7e9cb9" },
];

export default function GridSection() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<number | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [customValue, setCustomValue] = useState("");

  const updateThought = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("thought", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <SectionTitle>요즘 자주 드는 생각을 골라보세요</SectionTitle>

      <div className="grid grid-cols-3 gap-4">
        {ITEMS.map(({ label, color }, i) => (
          <motion.div
            key={i}
            onClick={() => {
              setSelected(i);
              if (i === 5) {
                setCustomOpen(true);
              } else {
                setCustomOpen(false);
                updateThought(ITEMS[i].key);
              }
            }}
            whileTap={{ scale: 0.91 }}
            transition={{ type: "spring", stiffness: 500, damping: 18 }}
            className="flex h-[10rem] w-[10rem] cursor-pointer flex-col items-center justify-center gap-2 whitespace-pre-line rounded-xl bg-transparent text-center text-sm font-medium leading-snug text-[#3a3a3a] shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
            style={{ border: selected === i ? `1px solid ${color}` : "1px solid #e5e5e5" }}
          >
            <div
              className="h-[3.0625rem] w-[3.0625rem] shrink-0 rounded-full"
              style={{ background: color }}
            />
            <span>{label}</span>
          </motion.div>
        ))}
      </div>

      {customOpen && (
        <input
          type="text"
          value={customValue}
          onChange={(e) => {
            setCustomValue(e.target.value);
            updateThought(e.target.value || "custom");
          }}
          placeholder="직접 입력해주세요"
          autoFocus
          className="w-full rounded-xl border border-[#e5e5e5] bg-transparent px-4 py-3 text-sm outline-none transition-colors placeholder:text-[#cccccc] focus:border-brand-logo"
        />
      )}
    </div>
  );
}
