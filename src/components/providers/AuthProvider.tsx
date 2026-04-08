"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRemoveQuestCache } from "@/features/quest/hooks/useQuests";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialized = useRef(false);
  const removeQuestCache = useRemoveQuestCache();

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const supabase = createClient();

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const { error } = await supabase.auth.signInAnonymously();
        if (error) console.error("[AuthProvider] anonymous sign-in failed:", error.message);
      }
    })();

    // auth 상태 변경 시 React Query 캐시 리셋
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT" || event === "USER_UPDATED" || event === "SIGNED_IN") {
        removeQuestCache();
      }
    });

    return () => subscription.unsubscribe();
  }, [removeQuestCache]);

  return <>{children}</>;
}
