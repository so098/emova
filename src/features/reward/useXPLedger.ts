"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as ledgerApi from "@/lib/supabase/xpLedgerApi";

const LEDGER_KEY = ["xp-ledger"] as const;
const TOTALS_KEY = ["xp-totals"] as const;

/** XP + 포인트 합계 조회 */
export function useTotals() {
  return useQuery({
    queryKey: TOTALS_KEY,
    queryFn: ledgerApi.fetchTotals,
  });
}

/** 변동 이력 조회 */
export function useHistory(type?: ledgerApi.LedgerType) {
  return useQuery({
    queryKey: [...LEDGER_KEY, type ?? "all"],
    queryFn: () => ledgerApi.fetchHistory(type),
  });
}

/** XP/포인트 변동 기록 */
export function useInsertTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ledgerApi.insertTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TOTALS_KEY });
      queryClient.invalidateQueries({ queryKey: LEDGER_KEY });
    },
  });
}

/** 캐시 무효화 헬퍼 */
export function useInvalidateTotals() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: TOTALS_KEY });
}
