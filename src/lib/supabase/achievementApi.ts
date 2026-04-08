import { createClient } from "./client";
import { authError, dbError } from "@/lib/errors";

/* ── 인증 헬퍼 ── */

async function getClientId(): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw authError();
  return user.id;
}

/* ── 타입 ── */

export type { UnlockedAchievement } from "@/types/reward";
import type { UnlockedAchievement } from "@/types/reward";
import type { DbAchievementRow } from "@/types/db/reward";

/* ── CRUD ── */

/** 해금된 업적 목록 조회 */
export async function fetchUnlocked(): Promise<UnlockedAchievement[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("user_achievements")
    .select("*")
    .order("unlocked_at", { ascending: false });

  if (error) throw dbError(error);
  return (data as DbAchievementRow[]).map((row) => ({
    id: row.id,
    achievementKey: row.achievement_key,
    unlockedAt: row.unlocked_at,
  }));
}

/** 업적 해금 기록 (이미 해금된 경우 무시) */
export async function unlockAchievement(
  achievementKey: string,
): Promise<UnlockedAchievement | null> {
  const clientId = await getClientId();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("user_achievements")
    .upsert(
      { client_id: clientId, achievement_key: achievementKey },
      { onConflict: "client_id,achievement_key", ignoreDuplicates: true },
    )
    .select()
    .single();

  if (error) {
    // 이미 존재하는 경우 (ignoreDuplicates)
    if (error.code === "PGRST116") return null;
    throw dbError(error);
  }

  return data
    ? {
        id: (data as DbAchievementRow).id,
        achievementKey: (data as DbAchievementRow).achievement_key,
        unlockedAt: (data as DbAchievementRow).unlocked_at,
      }
    : null;
}

/* ── 스트릭 계산 (xp_ledger 기반 — 퀘스트 완료 + 회고 모두 포함) ── */

export { fetchStreakFromLedger as fetchStreak } from "@/lib/rewardBalancing";
