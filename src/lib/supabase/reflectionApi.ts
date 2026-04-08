import { createClient } from "./client";
import { authError, dbError } from "@/lib/errors";
import { reflectSession } from "./movaFlowApi";

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

export type { Reflection } from "@/types/reflection";
import type { Reflection } from "@/types/reflection";
import type { DbReflection, DbReflectionWithQuest } from "@/types/db/reflection";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function fromDbRow(
  row: DbReflection,
  questTitle?: string | null,
): Reflection {
  return {
    id: row.id,
    date: formatDate(row.created_at),
    sessionId: row.session_id,
    questId: row.quest_id,
    questTitle: questTitle ?? null,
    beforeEmotion: row.before_emotion ?? "",
    afterEmotion: row.after_emotion ?? "",
    notes: row.notes ?? "",
    createdAt: row.created_at,
  };
}

/* ── CRUD ── */

const PAGE_SIZE = 3;

type DbRowWithQuest = DbReflectionWithQuest;

/** 회고 목록 조회 (최신순) */
export async function fetchReflections(): Promise<Reflection[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("reflections")
    .select("*, quests(title)")
    .order("created_at", { ascending: false });

  if (error) throw dbError(error);
  return (data as DbRowWithQuest[]).map((row) =>
    fromDbRow(row, row.quests?.title),
  );
}

/** 회고 페이지네이션 조회 (최신순, offset 기반) */
export async function fetchReflectionPage(
  offset: number,
): Promise<{ data: Reflection[]; nextOffset: number | null }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("reflections")
    .select("*, quests(title)")
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (error) throw dbError(error);
  const rows = (data as DbRowWithQuest[]).map((row) =>
    fromDbRow(row, row.quests?.title),
  );
  return {
    data: rows,
    nextOffset: rows.length === PAGE_SIZE ? offset + PAGE_SIZE : null,
  };
}

/** 회고 저장 */
export async function insertReflection(params: {
  sessionId?: string;
  questId?: string;
  beforeEmotion: string;
  afterEmotion: string;
  notes: string;
}): Promise<Reflection> {
  const clientId = await getClientId();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("reflections")
    .insert({
      client_id: clientId,
      session_id: params.sessionId ?? null,
      quest_id: params.questId ?? null,
      before_emotion: params.beforeEmotion,
      after_emotion: params.afterEmotion,
      notes: params.notes,
    })
    .select()
    .single();

  if (error) throw dbError(error);

  // 플로우 완주 판정: questId로부터 session_id를 찾아 reflected 처리
  const sessionId = params.sessionId;
  if (!sessionId && params.questId) {
    const { data: quest } = await supabase
      .from("quests")
      .select("session_id")
      .eq("id", params.questId)
      .maybeSingle();
    if (quest?.session_id) {
      await reflectSession(quest.session_id);
    }
  } else if (sessionId) {
    await reflectSession(sessionId);
  }

  return fromDbRow(data as DbReflection);
}

/** 세션별 회고 조회 */
export async function fetchReflectionBySession(
  sessionId: string,
): Promise<Reflection | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("reflections")
    .select("*")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (error) throw dbError(error);
  return data ? fromDbRow(data as DbReflection) : null;
}

/** 회고 수정 */
export async function updateReflection(
  id: string,
  params: {
    beforeEmotion: string;
    afterEmotion: string;
    notes: string;
  },
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("reflections")
    .update({
      before_emotion: params.beforeEmotion,
      after_emotion: params.afterEmotion,
      notes: params.notes,
    })
    .eq("id", id);
  if (error) throw dbError(error);
}

/** 회고 삭제 */
export async function deleteReflection(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("reflections").delete().eq("id", id);
  if (error) throw dbError(error);
}
