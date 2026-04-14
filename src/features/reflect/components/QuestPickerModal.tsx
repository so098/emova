"use client";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { QUEST_KEY } from "@/lib/query/queryKeys";
import * as questApi from "@/lib/supabase/questApi";
import ScrollFadeBox from "@/components/ui/ScrollFadeBox";
import type { Quest } from "@/types/quest";

interface QuestPickerModalProps {
  onSelect: (quest: Quest) => void;
  onCancel: () => void;
}

export default function QuestPickerModal({ onSelect, onCancel }: QuestPickerModalProps) {
  const { data: quests } = useQuery({
    queryKey: QUEST_KEY,
    queryFn: questApi.fetchQuests,
  });

  const completed: Quest[] = [
    ...(quests?.단기 ?? []).filter((q) => q.done),
    ...(quests?.장기 ?? []).filter((q) => q.done),
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
        className="fixed inset-0 z-40 bg-black/30"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className="fixed inset-x-4 top-1/2 z-50 mx-auto flex max-w-[22rem] -translate-y-1/2 flex-col gap-3 rounded-2xl border border-border-default bg-surface px-5 py-5"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-text-primary">완료한 퀘스트 연결</span>
          <button onClick={onCancel} className="text-text-muted hover:text-text-primary">
            <X size={18} strokeWidth={2} />
          </button>
        </div>
        {completed.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-secondary">
            완료한 퀘스트가 없어요
          </p>
        ) : (
          <ScrollFadeBox className="flex max-h-[50dvh] flex-col gap-2">
            {completed.map((q) => (
              <button
                key={q.id}
                onClick={() => onSelect(q)}
                className="flex flex-col gap-0.5 rounded-xl border border-border-default bg-surface-elevated px-4 py-3 text-left transition-colors hover:border-brand-primary"
              >
                <span className="text-sm font-semibold text-text-primary">{q.title}</span>
                {q.memo && (
                  <span className="line-clamp-2 text-xs text-text-muted">{q.memo}</span>
                )}
              </button>
            ))}
          </ScrollFadeBox>
        )}
      </motion.div>
    </>
  );
}
