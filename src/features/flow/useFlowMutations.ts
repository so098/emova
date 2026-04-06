"use client";

import { useMutation } from "@tanstack/react-query";
import * as movaFlowApi from "@/lib/supabase/movaFlowApi";

/** 플로우 시작: 세션 생성 + 생각 저장 → sessionId 반환 */
export function useStartFlow() {
  return useMutation({
    mutationFn: ({ thoughtKey, customText }: { thoughtKey: string; customText?: string }) =>
      movaFlowApi.startFlow(thoughtKey, customText),
  });
}

/** 감정 저장 */
export function useSaveEmotion() {
  return useMutation({
    mutationFn: ({ sessionId, key, intensity, customText }: {
      sessionId: string;
      key: string;
      intensity?: number;
      customText?: string;
    }) => movaFlowApi.saveEmotion(sessionId, key, intensity, customText),
  });
}

/** 플로우 완료: desires 저장 + actions 저장 + 세션 종료 */
export function useFinishFlow() {
  return useMutation({
    mutationFn: async ({ sessionId, questionLabel, questionText, actions }: {
      sessionId: string;
      questionLabel: string;
      questionText: string;
      actions: { text: string; source: "system" | "custom" | "regen"; selected: boolean }[];
    }) => {
      await movaFlowApi.saveDesires(sessionId, questionLabel, questionText);
      await movaFlowApi.finishFlow(sessionId, actions);
    },
  });
}
