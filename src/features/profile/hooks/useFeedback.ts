"use client";

import { useMutation } from "@tanstack/react-query";
import { insertFeedback } from "@/lib/supabase/feedbackApi";

export function useSubmitFeedback() {
  return useMutation({
    mutationFn: insertFeedback,
  });
}
