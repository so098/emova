"use client";

import { useToast } from "@/components/feedback/ToastStack";
import * as xpLedgerApi from "@/lib/supabase/xpLedgerApi";
import { fetchTodayCount, calcReflectionXP, checkAndAwardStreakBonus } from "@/lib/rewardBalancing";
import { useRewardStore } from "@/store/rewardStore";

/** 회고 저장 성공 시 XP 지급 + 스트릭 보너스 처리. 총 XP를 반환한다. */
export function useReflectRewards() {
  const { showToast } = useToast();

  const grantRewards = async (): Promise<number> => {
    const todayCount = await fetchTodayCount("회고 작성");
    const xpAmount = calcReflectionXP(todayCount);
    useRewardStore.getState().addXP(xpAmount);
    await xpLedgerApi.insertTransaction({
      type: "xp",
      delta: xpAmount,
      reason: "회고 작성",
    });

    let totalXP = xpAmount;
    const streakBonus = await checkAndAwardStreakBonus();
    if (streakBonus > 0) {
      useRewardStore.getState().addXP(streakBonus);
      totalXP += streakBonus;
      showToast(`🔥 스트릭 보너스 +${streakBonus} XP`, "");
    }

    return totalXP;
  };

  return { grantRewards };
}
