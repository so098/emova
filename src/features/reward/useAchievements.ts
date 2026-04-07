"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as achievementApi from "@/lib/supabase/achievementApi";

const ACHIEVEMENTS_KEY = ["achievements"] as const;
const STREAK_KEY = ["streak"] as const;

/** 해금된 업적 조회 */
export function useUnlockedAchievements() {
  return useQuery({
    queryKey: ACHIEVEMENTS_KEY,
    queryFn: achievementApi.fetchUnlocked,
  });
}

/** 업적 해금 */
export function useUnlockAchievement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: achievementApi.unlockAchievement,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ACHIEVEMENTS_KEY }),
  });
}

/** 연속 기록 일수 */
export function useStreak() {
  return useQuery({
    queryKey: STREAK_KEY,
    queryFn: achievementApi.fetchStreak,
  });
}
