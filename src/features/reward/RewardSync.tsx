"use client";

import { useEffect } from "react";
import { useRewardStore } from "@/store/rewardStore";
import { useTotals } from "./useXPLedger";

/**
 * DB에서 XP/포인트 합계를 가져와 rewardStore에 동기화.
 * 레이아웃 최상단에 한 번 마운트.
 */
export default function RewardSync() {
  const { data, isSuccess } = useTotals();
  const setTotals = useRewardStore((s) => s.setTotals);
  const loaded = useRewardStore((s) => s.loaded);

  useEffect(() => {
    if (isSuccess && data && !loaded) {
      setTotals(data.xp, data.points);
    }
  }, [isSuccess, data, loaded, setTotals]);

  return null;
}
