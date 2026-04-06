"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as questApi from "@/lib/supabase/questApi";
import type { Quest } from "@/store/questStore";

const QUEST_KEY = ["quests"] as const;

export function useQuests() {
  return useQuery({
    queryKey: QUEST_KEY,
    queryFn: questApi.fetchQuests,
  });
}

export function useAddQuests() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      quests,
      category,
    }: {
      quests: Omit<Quest, "id">[];
      category: "단기" | "장기";
    }) => questApi.insertQuests(quests, category),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUEST_KEY }),
  });
}

export function useInvalidateQuests() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: QUEST_KEY });
}

export function useRemoveQuestCache() {
  const queryClient = useQueryClient();
  return () => queryClient.removeQueries({ queryKey: QUEST_KEY });
}

export { QUEST_KEY };
