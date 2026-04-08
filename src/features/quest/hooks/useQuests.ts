"use client";

import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as questApi from "@/lib/supabase/questApi";
import { QUEST_KEY } from "@/lib/query/queryKeys";
import type { Quest } from "@/store/questStore";

export function useQuests() {
  return useSuspenseQuery({
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
      sessionId,
    }: {
      quests: Omit<Quest, "id">[];
      category: "단기" | "장기";
      sessionId?: string;
    }) => questApi.insertQuests(quests, category, sessionId),
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
