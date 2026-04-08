import { createClient } from "./client";
import { authError, dbError } from "@/lib/errors";
import type { Quest, QuestState } from "@/types/quest";
import type { DbQuestRow } from "@/types/db/quest";

/* ── 매핑 헬퍼 ── */

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function fromDbRow(row: DbQuestRow): Quest {
  return {
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
}

/* ── 인증 헬퍼 ── */

async function getClientId(): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw authError();
  return user.id;
}

/* ── CRUD ── */

export async function fetchQuests(): Promise<QuestState> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("quests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw dbError(error);

  const rows = (data ?? []) as DbQuestRow[];
  const state: QuestState = { 단기: [], 장기: [], 보류: [] };

  for (const row of rows) {
    const quest = fromDbRow(row);
    const cat = row.category as keyof QuestState;
    if (cat === "보류") {
      quest.originTab = (row.origin_category as "단기" | "장기") ?? "단기";
    }
    if (state[cat]) {
      state[cat].push(quest);
    }
  }

  return state;
}

export async function insertQuest(
  quest: Omit<Quest, "id">,
  category: "단기" | "장기",
): Promise<Quest> {
  const clientId = await getClientId();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("quests")
    .insert({
      client_id: clientId,
      title: quest.title,
      source: quest.source ?? "user",
      status: quest.done ? "done" : "pending",
      xp_reward: quest.points,
      parent_id: quest.parentId ?? null,
      category,
    })
    .select()
    .single();

  if (error) throw dbError(error);
  return fromDbRow(data as DbQuestRow);
}

export async function insertQuests(
  quests: Omit<Quest, "id">[],
  category: "단기" | "장기",
  sessionId?: string,
): Promise<Quest[]> {
  if (quests.length === 0) return [];
  const clientId = await getClientId();
  const supabase = createClient();

  const rows = quests.map((q) => ({
    client_id: clientId,
    title: q.title,
    source: q.source ?? "user",
    status: q.done ? "done" : "pending",
    xp_reward: q.points,
    parent_id: q.parentId ?? null,
    category,
    session_id: sessionId ?? null,
  }));

  const { data, error } = await supabase
    .from("quests")
    .insert(rows)
    .select();

  if (error) throw dbError(error);
  return (data as DbQuestRow[]).map(fromDbRow);
}

export async function updateQuestStatus(
  id: string,
  done: boolean,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("quests")
    .update({
      status: done ? "done" : "pending",
      completed_at: done ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) throw dbError(error);
}

export async function updateQuestCategory(
  id: string,
  category: "단기" | "장기" | "보류",
  originCategory?: "단기" | "장기",
): Promise<void> {
  const supabase = createClient();
  const updates: Record<string, unknown> = { category };
  if (category === "보류" && originCategory) {
    updates.origin_category = originCategory;
  } else if (category !== "보류") {
    updates.origin_category = null;
  }
  const { error } = await supabase
    .from("quests")
    .update(updates)
    .eq("id", id);
  if (error) throw dbError(error);
}

export async function updateQuestTitle(
  id: string,
  title: string,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("quests")
    .update({ title })
    .eq("id", id);
  if (error) throw dbError(error);
}

/** 실��� 메모 저장 */
export async function updateQuestMemo(
  id: string,
  memo: string,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("quests")
    .update({ description: memo })
    .eq("id", id);
  if (error) throw dbError(error);
}

export async function updateQuestFields(
  id: string,
  fields: Partial<{
    title: string;
    xp_reward: number;
    parent_id: string | null;
    category: string;
    status: string;
  }>,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("quests").update(fields).eq("id", id);
  if (error) throw dbError(error);
}

export async function deleteQuest(id: string): Promise<void> {
  const supabase = createClient();

  // 자식 퀘스트의 parent_id 해제 (외래키 제약 방지)
  await supabase
    .from("quests")
    .update({ parent_id: null })
    .eq("parent_id", id);

  const { error } = await supabase.from("quests").delete().eq("id", id);
  if (error) throw dbError(error);
}
