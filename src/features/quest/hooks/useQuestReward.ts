"use client";

import { useCallback } from "react";
import { useRewardStore } from "@/store/rewardStore";
import { useToast } from "@/components/feedback/ToastStack";
import * as xpLedgerApi from "@/lib/supabase/xpLedgerApi";
import { fetchTodayCount, calcQuestReward, checkAndAwardStreakBonus } from "@/lib/rewardBalancing";
import type { Quest } from "@/store/questStore";

export function useQuestReward() {
  const { showToast } = useToast();

  /** 퀘스트 완료 시 보상 지급 (체감 수익 계산 + 스트릭 보너스) */
  const grantReward = useCallback(async (quest: Quest) => {
    const ledgerType = quest.source === "ai" ? "xp" as const : "points" as const;
    const rewardType = quest.source === "ai" ? "XP" : "포인트";

    try {
      const todayCount = await fetchTodayCount("퀘스트 완료");
      const adjusted = calcQuestReward(quest.points, todayCount);

      const { addPoints, addXP } = useRewardStore.getState();
      if (quest.source === "ai") addXP(adjusted); else addPoints(adjusted);

      await xpLedgerApi.insertTransaction({
        type: ledgerType,
        delta: adjusted,
        reason: "퀘스트 완료",
        questId: quest.id,
      });
      showToast(`+${adjusted} ${rewardType} 완료!`, "");

      const streakBonus = await checkAndAwardStreakBonus();
      if (streakBonus > 0) {
        useRewardStore.getState().addXP(streakBonus);
        showToast(`🔥 스트릭 보너스 +${streakBonus} XP`, "");
      }
    } catch (e) {
      console.error("Failed to record XP transaction:", e);
    }
  }, [showToast]);

  /** 퀘스트 복원 시 보상 차감 */
  const revokeReward = useCallback((quest: Quest) => {
    const ledgerType = quest.source === "ai" ? "xp" as const : "points" as const;
    const rewardType = quest.source === "ai" ? "XP" : "포인트";

    const { removePoints, removeXP } = useRewardStore.getState();
    if (quest.source === "ai") removeXP(quest.points); else removePoints(quest.points);

    xpLedgerApi.insertTransaction({
      type: ledgerType,
      delta: -quest.points,
      reason: "퀘스트 복원",
      questId: quest.id,
    }).catch((e) => console.error("Failed to record refund transaction:", e));

    showToast(`-${quest.points} ${rewardType} 차감`, "복원되었습니다");
  }, [showToast]);

  return { grantReward, revokeReward };
}
