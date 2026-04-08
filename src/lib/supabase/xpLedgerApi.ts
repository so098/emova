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

export type { LedgerType, LedgerEntry } from "@/types/reward";
import type { LedgerType, LedgerEntry } from "@/types/reward";
import type { DbLedgerRow } from "@/types/db/reward";

function fromDbRow(row: DbLedgerRow): LedgerEntry {
  return {
    id: row.id,
    type: row.type as LedgerType,
    delta: row.delta,
    reason: row.reason,
    questId: row.quest_id,
    sessionId: row.session_id,
    createdAt: row.created_at,
  };
}

/* ── CRUD ── */

/** XP 또는 포인트 변동 기록 */
export async function insertTransaction(params: {
  type: LedgerType;
  delta: number;
  reason: string;
  questId?: string;
  sessionId?: string;
}): Promise<LedgerEntry> {
  const clientId = await getClientId();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("xp_ledger")
    .insert({
      client_id: clientId,
      type: params.type,
      delta: params.delta,
      reason: params.reason,
      quest_id: params.questId ?? null,
      session_id: params.sessionId ?? null,
    })
    .select()
    .single();

  if (error) throw dbError(error);
  return fromDbRow(data as DbLedgerRow);
}

/** 타입별 누적 합계 조회 */
export async function fetchTotal(type: LedgerType): Promise<number> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("xp_ledger")
    .select("delta")
    .eq("type", type);

  if (error) throw dbError(error);
  return (data as { delta: number }[]).reduce((sum, row) => sum + row.delta, 0);
}

/** XP + 포인트 합계 한번에 조회 */
export async function fetchTotals(): Promise<{ xp: number; points: number }> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("xp_ledger")
    .select("type, delta");

  if (error) throw dbError(error);

  let xp = 0;
  let points = 0;
  for (const row of data as { type: string; delta: number }[]) {
    if (row.type === "xp") xp += row.delta;
    else if (row.type === "points") points += row.delta;
  }
  return { xp, points };
}

/** 변동 이력 조회 (최신순) */
export async function fetchHistory(
  type?: LedgerType,
  limit = 50,
): Promise<LedgerEntry[]> {
  const supabase = createClient();

  let query = supabase
    .from("xp_ledger")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (type) query = query.eq("type", type);

  const { data, error } = await query;
  if (error) throw dbError(error);
  return (data as DbLedgerRow[]).map(fromDbRow);
}
