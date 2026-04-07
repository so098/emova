import { createClient } from "./client";

/* ── 인증 헬퍼 ── */

async function getClientId(): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

/* ── 타입 ── */

export interface UnlockedAchievement {
  id: string;
  achievementKey: string;
  unlockedAt: string;
}

interface DbAchievementRow {
  id: string;
  client_id: string;
  achievement_key: string;
  unlocked_at: string;
}

/* ── CRUD ── */

/** 해금된 업적 목록 조회 */
export async function fetchUnlocked(): Promise<UnlockedAchievement[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("user_achievements")
    .select("*")
    .order("unlocked_at", { ascending: false });

  if (error) throw error;
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
    throw error;
  }

  return data
    ? {
        id: (data as DbAchievementRow).id,
        achievementKey: (data as DbAchievementRow).achievement_key,
        unlockedAt: (data as DbAchievementRow).unlocked_at,
      }
    : null;
}

/* ── 스트릭 계산 (quests.completed_at 기반) ── */

/** 연속 기록 일수 계산 */
export async function fetchStreak(): Promise<number> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("quests")
    .select("completed_at")
    .eq("status", "done")
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false });

  if (error) throw error;
  if (!data || data.length === 0) return 0;

  // 완료 날짜를 고유 일자로 변환 (KST 기준)
  const uniqueDays = new Set<string>();
  for (const row of data as { completed_at: string }[]) {
    const d = new Date(row.completed_at);
    const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    uniqueDays.add(kst.toISOString().slice(0, 10));
  }

  const sorted = [...uniqueDays].sort().reverse();

  // 오늘 또는 어제부터 시작하여 연속 일수 계산
  const today = new Date();
  const kstToday = new Date(today.getTime() + 9 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const yesterday = new Date(today.getTime() + 9 * 60 * 60 * 1000 - 86400000)
    .toISOString()
    .slice(0, 10);

  if (sorted[0] !== kstToday && sorted[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (prev.getTime() - curr.getTime()) / 86400000;
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
