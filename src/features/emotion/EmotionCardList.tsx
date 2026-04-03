"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import SectionTitle from "@/components/SectionTitle";
import { ROUTES } from "@/constants/routes";

const ITEMS = [
  { label: "불안", sub: "막연한 긴장감, 걱정", color: "#f4845f" },
  { label: "무기력", sub: "의욕 없음, 아무것도 하기 싫음", color: "#7ec8e3" },
  { label: "짜증", sub: "작은 일에도 화가 남", color: "#ff6b6b" },
  { label: "혼란", sub: "뭘 원하는지 모르겠음", color: "#c3aed6" },
  { label: "외로움", sub: "소속감 부족, 고립된 느낌", color: "#6c8ead" },
  { label: "초조함", sub: "성과 압박, 시간 압박", color: "#ffb347" },
  { label: "의욕", sub: "에너지 올라감, 뭔가 하고 싶음", color: "#77dd77" },
  { label: "공허함", sub: "채워지지 않는 느낌", color: "#b0a4a4" },
  { label: "설렘", sub: "기대감, 두근거림", color: "#ffc38f" },
  { label: "지침", sub: "몸과 마음이 모두 피곤함", color: "#9e9e9e" },
];

const PAGE_SIZE = 5;
const PAGES = Math.ceil(ITEMS.length / PAGE_SIZE);

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
};

export default function EmotionCardList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [page, setPage] = useState(0);
  const [dir, setDir] = useState(1);
  const [selected, setSelected] = useState<number | null>(null);

  const updateEmotion = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("emotion", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleCardClick = (globalIndex: number) => {
    if (selected === globalIndex) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("emotion", ITEMS[globalIndex].label);
      router.push(`${ROUTES.LOADING}?${params.toString()}`);
    } else {
      setSelected(globalIndex);
      updateEmotion(ITEMS[globalIndex].label);
    }
  };

  const changePage = (next: number) => {
    if (next < 0 || next >= PAGES) return;
    setDir(next > page ? 1 : -1);
    setPage(next);
  };

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x < -50) changePage(page + 1);
    else if (info.offset.x > 50) changePage(page - 1);
  };

  const pageItems = ITEMS.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="flex w-(--ui-content-width) flex-col gap-4">
      <SectionTitle>지금 느끼는 감정을 골라보세요</SectionTitle>

      {/* 카드 슬라이드 영역 */}
      <div className="relative">
        <AnimatePresence custom={dir} mode="popLayout">
          <motion.div
            key={page}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            className="flex cursor-grab flex-col gap-2 active:cursor-grabbing"
          >
            {pageItems.map(({ label, sub, color }, i) => {
              const globalIndex = page * PAGE_SIZE + i;
              return (
                <motion.div
                  key={label}
                  onClick={() => handleCardClick(globalIndex)}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 500, damping: 18 }}
                  className="flex items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                  style={{
                    border:
                      selected === globalIndex
                        ? `1px solid ${color}`
                        : "1px solid transparent",
                  }}
                >
                  <div
                    className="h-11 w-11 shrink-0 rounded-full"
                    style={{ background: color }}
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-base font-bold text-[#1a1a1a]">
                      {label}
                    </span>
                    <span className="text-xs text-[#666666]">{sub}</span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 페이지 인디케이터 dots */}
      <div className="flex justify-center gap-2">
        {Array.from({ length: PAGES }).map((_, i) => (
          <button
            key={i}
            onClick={() => changePage(i)}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === page ? "1.5rem" : "0.375rem",
              background: i === page ? "#FFA940" : "#e5e5e5",
            }}
          />
        ))}
      </div>
    </div>
  );
}
