import { createClient } from "./supabase/client";
import * as xpLedgerApi from "./supabase/xpLedgerApi";

/* ── 상수 ── */

const DIMINISHING_REFLECTION = [20, 10, 5, 2];
const DIMINISHING_QUEST_MULTIPLIERS = [1.0, 0.7, 0.5, 0.25];

export const STREAK_TIERS = [
  { days: 3, bonus: 10 },
  { days: 7, bonus: 30 },
  { days: 14, bonus: 50 },
  { days: 30, bonus: 100 },
] as const;

/* ── 순수 계산 ── */

/** 오늘 N번째 회고일 때 받을 XP */
export function calcReflectionXP(todayCount: number): number {
  const idx = Math.min(todayCount, DIMINISHING_REFLECTION.length - 1);
  return DIMINISHING_REFLECTION[idx];
}

/** 오늘 N번째 퀘스트 완료일 때 받을 보상 */
export function calcQuestReward(basePoints: number, todayCount: number): number {
  const idx = Math.min(todayCount, DIMINISHING_QUEST_MULTIPLIERS.length - 1);
  return Math.max(1, Math.round(basePoints * DIMINISHING_QUEST_MULTIPLIERS[idx]));
}

/** 스트릭 일수에 해당하는 보너스 (마일스톤 정확히 일치할 때만) */
export function getStreakMilestoneBonus(streakDays: number): number | null {
  const tier = STREAK_TIERS.find((t) => t.days === streakDays);
  return tier ? tier.bonus : null;
}

/* ── KST 헬퍼 ── */

function kstMidnightISO(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const dateStr = kst.toISOString().slice(0, 10);
  // KST 자정 = UTC 전날 15:00
  return new Date(dateStr + "T00:00:00+09:00").toISOString();
}

function toKSTDateString(iso: string): string {
  const d = new Date(iso);
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

/* ── DB 조회 ── */

/** 오늘(KST) 같은 reason의 양수 트랜잭션 수 */
export async function fetchTodayCount(reason: string): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("xp_ledger")
    .select("*", { count: "exact", head: true })
    .eq("reason", reason)
    .gt("delta", 0)
    .gte("created_at", kstMidnightISO());

  if (error) throw error;
  return count ?? 0;
}

/** xp_ledger 기반 연속 활동 일수 (퀘스트 완료 + 회고) */
export async function fetchStreakFromLedger(): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("xp_ledger")
    .select("created_at")
    .in("reason", ["퀘스트 완료", "회고 작성"])
    .gt("delta", 0)
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!data || data.length === 0) return 0;

  const uniqueDays = [...new Set(
    (data as { created_at: string }[]).map((r) => toKSTDateString(r.created_at)),
  )].sort().reverse();

  const today = toKSTDateString(new Date().toISOString());
  const yesterday = toKSTDateString(
    new Date(Date.now() - 86400000).toISOString(),
  );

  if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1]);
    const curr = new Date(uniqueDays[i]);
    const diff = (prev.getTime() - curr.getTime()) / 86400000;
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/** 스트릭 보너스 체크 & 지급 (오늘 이미 받았으면 스킵) */
export async function checkAndAwardStreakBonus(): Promise<number> {
  const streak = await fetchStreakFromLedger();
  const bonus = getStreakMilestoneBonus(streak);
  if (!bonus) return 0;

  // 오늘 이미 스트릭 보너스를 받았는지 체크
  const alreadyAwarded = await fetchTodayCount("스트릭 보너스");
  if (alreadyAwarded > 0) return 0;

  await xpLedgerApi.insertTransaction({
    type: "xp",
    delta: bonus,
    reason: "스트릭 보너스",
  });

  return bonus;
}
