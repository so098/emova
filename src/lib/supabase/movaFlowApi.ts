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

/* ── 저수준 함수 ── */

/** 세션 생성 → 세션 ID 반환 */
export async function createSession(): Promise<string> {
  const clientId = await getClientId();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("survey_sessions")
    .insert({ client_id: clientId, status: "in_progress" })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

/** 생각(그리드) 저장 */
export async function saveThought(
  sessionId: string,
  key: string,
  customText?: string,
): Promise<void> {
  const clientId = await getClientId();
  const supabase = createClient();
  const { error } = await supabase.from("survey_thought").insert({
    session_id: sessionId,
    client_id: clientId,
    key,
    custom_text: customText ?? null,
  });
  if (error) throw error;
}

/** 감정 저장 */
export async function saveEmotion(
  sessionId: string,
  key: string,
  intensity: number = 5,
  customText?: string,
): Promise<void> {
  const clientId = await getClientId();
  const supabase = createClient();
  const { error } = await supabase.from("survey_emotions").insert({
    session_id: sessionId,
    client_id: clientId,
    key,
    intensity,
    custom_text: customText ?? null,
  });
  if (error) throw error;
}

/** 욕구/질문 답변 저장 */
export async function saveDesires(
  sessionId: string,
  needNow: string,
  desiredAction: string,
  endOfDayFeel?: string,
): Promise<void> {
  const clientId = await getClientId();
  const supabase = createClient();
  const { error } = await supabase.from("survey_desires").insert({
    session_id: sessionId,
    client_id: clientId,
    need_now: needNow,
    desired_action: desiredAction,
    end_of_day_feel: endOfDayFeel ?? null,
    is_wrote: desiredAction.trim().length > 0,
  });
  if (error) throw error;
}

/** 추천 행동 저장 (여러 개) */
export async function saveActions(
  sessionId: string,
  actions: { text: string; source: "system" | "custom" | "regen"; selected: boolean }[],
): Promise<void> {
  if (actions.length === 0) return;
  const clientId = await getClientId();
  const supabase = createClient();
  const rows = actions.map((a) => ({
    session_id: sessionId,
    client_id: clientId,
    source: a.source,
    custom_text: a.text,
    is_selected: a.selected,
  }));
  const { error } = await supabase.from("survey_actions").insert(rows);
  if (error) throw error;
}

/** 세션 완료 */
export async function completeSession(sessionId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("survey_sessions")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", sessionId);
  if (error) throw error;
}

/** 세션 중단 */
export async function abortSession(sessionId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("survey_sessions")
    .update({ status: "aborted", aborted_at: new Date().toISOString() })
    .eq("id", sessionId);
  if (error) throw error;
}

/** 진행 중인 세션 조회 */
export async function fetchActiveSession(): Promise<string | null> {
  const clientId = await getClientId();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("survey_sessions")
    .select("id")
    .eq("client_id", clientId)
    .eq("status", "in_progress")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

/* ── 고수준 함수 ── */

/** 플로우 시작: 세션 생성 + 생각 저장 한번에 */
export async function startFlow(
  thoughtKey: string,
  customText?: string,
): Promise<string> {
  const sessionId = await createSession();
  await saveThought(sessionId, thoughtKey, customText);
  return sessionId;
}

/** 플로우 완료: 행동 저장 + 세션 종료 한번에 */
export async function finishFlow(
  sessionId: string,
  actions: { text: string; source: "system" | "custom" | "regen"; selected: boolean }[],
): Promise<void> {
  await saveActions(sessionId, actions);
  await completeSession(sessionId);
}
