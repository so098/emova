import { createClient } from "./server";
import { AppError } from "@/lib/errors";
import type { QuestState, Quest } from "@/types/quest";
import type { UnlockedAchievement } from "@/types/reward";
import type { Reflection } from "@/types/reflection";
import type { DbQuestRow } from "@/types/db/quest";
import type { DbAchievementRow } from "@/types/db/reward";
import type { DbReflectionWithQuest } from "@/types/db/reflection";

/**
 * 서버 컴포넌트용 read-only 쿼리 함수들.
 * 인증 쿠키가 없는 첫 방문 시에는 빈 기본값을 반환한다.
 */

/* ── 헬퍼 ── */

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function toKSTDateString(iso: string): string {
  const d = new Date(iso);
  d.setHours(d.getHours() + 9);
  return d.toISOString().slice(0, 10);
}

/* ── 퀘스트 ── */

export async function prefetchQuests(): Promise<QuestState> {
  const empty: QuestState = { 단기: [], 장기: [], 보류: [] };

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return empty;

    const { data, error } = await supabase
      .from("quests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return empty;

    const state: QuestState = { 단기: [], 장기: [], 보류: [] };
    for (const row of (data ?? []) as DbQuestRow[]) {
      const quest: Quest = {
        id: row.id,
        title: row.title,
        date: formatDate(row.created_at),
        points: row.xp_reward,
        done: row.status === "done",
        memo: row.description ?? undefined,
        parentId: row.parent_id ?? undefined,
        originTab: row.origin_category as Quest["originTab"],
        source: row.source as Quest["source"],
      };
      const cat = row.category as keyof QuestState;
      if (cat === "보류") {
        quest.originTab = (row.origin_category as "단기" | "장기") ?? "단기";
      }
      if (state[cat]) {
        state[cat].push(quest);
      }
    }
    return state;
  } catch (e) {
    if (!(e instanceof AppError && e.code === "UNAUTHENTICATED")) {
      console.error("[serverQueries] prefetchQuests:", e);
    }
    return empty;
  }
}

/* ── 업적 ── */

export async function prefetchUnlockedAchievements(): Promise<UnlockedAchievement[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("user_achievements")
      .select("*")
      .order("unlocked_at", { ascending: false });

    if (error) return [];
    return (data as DbAchievementRow[]).map((row) => ({
      id: row.id,
      achievementKey: row.achievement_key,
      unlockedAt: row.unlocked_at,
    }));
  } catch (e) {
    if (!(e instanceof AppError && e.code === "UNAUTHENTICATED")) {
      console.error("[serverQueries] prefetchUnlockedAchievements:", e);
    }
    return [];
  }
}

/* ── 스트릭 ── */

export async function prefetchStreak(): Promise<number> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data, error } = await supabase
      .from("xp_ledger")
      .select("created_at")
      .in("reason", ["퀘스트 완료", "회고 작성"])
      .gt("delta", 0)
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) return 0;

    const uniqueDays = [...new Set(
      (data as { created_at: string }[]).map((r) => toKSTDateString(r.created_at)),
    )].sort().reverse();

    const today = toKSTDateString(new Date().toISOString());
    const yesterday = toKSTDateString(new Date(Date.now() - 86400000).toISOString());
    if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) return 0;

    let streak = 1;
    for (let i = 1; i < uniqueDays.length; i++) {
      const prev = new Date(uniqueDays[i - 1]);
      const curr = new Date(uniqueDays[i]);
      const diff = (prev.getTime() - curr.getTime()) / 86400000;
      if (diff === 1) streak++;
      else break;
    }
    return streak;
  } catch (e) {
    if (!(e instanceof AppError && e.code === "UNAUTHENTICATED")) {
      console.error("[serverQueries] prefetchStreak:", e);
    }
    return 0;
  }
}

/* ── 회고 ── */

export async function prefetchReflections(): Promise<Reflection[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("reflections")
      .select("*, quests(title)")
      .order("created_at", { ascending: false });

    if (error) return [];
    return (data as DbReflectionWithQuest[]).map((row) => ({
      id: row.id,
      date: formatDate(row.created_at),
      sessionId: row.session_id,
      questId: row.quest_id,
      questTitle: row.quests?.title ?? null,
      beforeEmotion: row.before_emotion ?? "",
      afterEmotion: row.after_emotion ?? "",
      notes: row.notes ?? "",
      createdAt: row.created_at,
    }));
  } catch (e) {
    if (!(e instanceof AppError && e.code === "UNAUTHENTICATED")) {
      console.error("[serverQueries] prefetchReflections:", e);
    }
    return [];
  }
}
