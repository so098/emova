import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { SessionStatus } from "@/types/session";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET() {
  const [sessionsRes, questsRes, emotionsRes, thoughtsRes] = await Promise.all([
    supabase.from("survey_sessions").select("id, client_id, status, started_at"),
    supabase.from("quests").select("id, client_id, status"),
    supabase.from("survey_emotions").select("id, client_id, key"),
    supabase.from("survey_thought").select("id, client_id, key, custom_text"),
  ]);

  for (const res of [sessionsRes, questsRes, emotionsRes, thoughtsRes]) {
    if (res.error) {
      return NextResponse.json(
        { error: res.error.message, code: "DB_ERROR" },
        { status: 500 },
      );
    }
  }

  const EXCLUDED_CLIENTS = ["7cdf15a3", "845f843a"];

  const sessions = (sessionsRes.data as { id: string; client_id: string; status: string; started_at: string }[])
    .filter((s) => !EXCLUDED_CLIENTS.some((id) => s.client_id.startsWith(id)));
  const quests = (questsRes.data as { id: string; client_id: string; status: string }[])
    .filter((q) => !EXCLUDED_CLIENTS.some((id) => q.client_id.startsWith(id)));

  // 세션 상태 분포
  const statusMap = new Map<string, number>();
  for (const s of sessions) {
    statusMap.set(s.status, (statusMap.get(s.status) ?? 0) + 1);
  }
  const sessionStatusCounts = [...statusMap.entries()].map(
    ([status, count]) => ({ status: status as SessionStatus, count }),
  );

  // 일별 세션 수
  const dailyMap = new Map<string, number>();
  for (const s of sessions) {
    const date = s.started_at.slice(0, 10);
    dailyMap.set(date, (dailyMap.get(date) ?? 0) + 1);
  }
  const dailySessions = [...dailyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  // 시간대별 사용량
  const hourMap = new Map<number, number>();
  for (const s of sessions) {
    const hour = new Date(s.started_at).getHours();
    hourMap.set(hour, (hourMap.get(hour) ?? 0) + 1);
  }
  const hourlyUsage = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    count: hourMap.get(h) ?? 0,
  }));

  // 기기별 접속 기록
  const deviceMap = new Map<string, { firstSeen: string; lastSeen: string; sessions: number; hours: Set<number> }>();
  for (const s of sessions) {
    const existing = deviceMap.get(s.client_id);
    const hour = new Date(s.started_at).getHours();
    if (existing) {
      existing.sessions++;
      existing.hours.add(hour);
      if (s.started_at < existing.firstSeen) existing.firstSeen = s.started_at;
      if (s.started_at > existing.lastSeen) existing.lastSeen = s.started_at;
    } else {
      deviceMap.set(s.client_id, { firstSeen: s.started_at, lastSeen: s.started_at, sessions: 1, hours: new Set([hour]) });
    }
  }
  const deviceAccessLogs = [...deviceMap.entries()].map(([clientId, info]) => ({
    clientId: clientId.slice(0, 8),
    firstSeen: info.firstSeen,
    lastSeen: info.lastSeen,
    sessions: info.sessions,
    activeHours: [...info.hours].sort((a, b) => a - b),
  }));

  // 퀘스트 상태 분포
  const questMap = new Map<string, number>();
  for (const q of quests) {
    questMap.set(q.status, (questMap.get(q.status) ?? 0) + 1);
  }
  const questStatusCounts = [...questMap.entries()].map(
    ([status, count]) => ({ status, count }),
  );

  // 퍼널: 세션 시작 → 플로우 완료 → 회고 완료
  const funnelStarted = sessions.length;
  const funnelCompleted = sessions.filter((s) => s.status === "completed" || s.status === "reflected").length;
  const funnelReflected = sessions.filter((s) => s.status === "reflected").length;
  const funnel = [
    { stage: "세션 시작", count: funnelStarted },
    { stage: "플로우 완료", count: funnelCompleted },
    { stage: "회고 완료", count: funnelReflected },
  ];

  // 기기별 루프 완주율
  const deviceStatusMap = new Map<string, { total: number; completed: number; reflected: number }>();
  for (const s of sessions) {
    const existing = deviceStatusMap.get(s.client_id);
    if (existing) {
      existing.total++;
      if (s.status === "completed" || s.status === "reflected") existing.completed++;
      if (s.status === "reflected") existing.reflected++;
    } else {
      deviceStatusMap.set(s.client_id, {
        total: 1,
        completed: (s.status === "completed" || s.status === "reflected") ? 1 : 0,
        reflected: s.status === "reflected" ? 1 : 0,
      });
    }
  }
  const deviceCompletionRates = [...deviceStatusMap.entries()].map(([clientId, info]) => ({
    clientId: clientId.slice(0, 8),
    total: info.total,
    completed: info.completed,
    reflected: info.reflected,
    flowRate: info.total ? Math.round((info.completed / info.total) * 100) : 0,
    loopRate: info.total ? Math.round((info.reflected / info.total) * 100) : 0,
  }));

  // 세션별 상세
  const sessionDetails = sessions.map((s) => ({
    id: s.id.slice(0, 8),
    clientId: s.client_id.slice(0, 8),
    status: s.status,
    startedAt: s.started_at,
    flowCompleted: s.status === "completed" || s.status === "reflected",
    loopCompleted: s.status === "reflected",
  }));

  // 감정 분포
  const emotions = (emotionsRes.data as { id: string; client_id: string; key: string }[])
    .filter((e) => !EXCLUDED_CLIENTS.some((id) => e.client_id.startsWith(id)));
  const emotionMap = new Map<string, number>();
  for (const e of emotions) {
    emotionMap.set(e.key, (emotionMap.get(e.key) ?? 0) + 1);
  }
  const emotionCounts = [...emotionMap.entries()]
    .sort(([, a], [, b]) => b - a)
    .map(([key, count]) => ({ key, count }));

  // 생각 분포
  const thoughts = (thoughtsRes.data as { id: string; client_id: string; key: string; custom_text: string | null }[])
    .filter((t) => !EXCLUDED_CLIENTS.some((id) => t.client_id.startsWith(id)));
  const thoughtMap = new Map<string, number>();
  for (const t of thoughts) {
    const label = t.key === "custom" ? (t.custom_text ?? "직접 입력") : t.key;
    thoughtMap.set(label, (thoughtMap.get(label) ?? 0) + 1);
  }
  const thoughtCounts = [...thoughtMap.entries()]
    .sort(([, a], [, b]) => b - a)
    .map(([key, count]) => ({ key, count }));

  // 총 사용자 수 (세션 + 퀘스트 합산)
  const uniqueUsers = new Set([
    ...sessions.map((s) => s.client_id),
    ...quests.map((q) => q.client_id),
  ]);

  return NextResponse.json({
    sessionStatusCounts,
    dailySessions,
    hourlyUsage,
    deviceAccessLogs,
    questStatusCounts,
    totalUsers: uniqueUsers.size,
    funnel,
    deviceCompletionRates,
    sessionDetails,
    emotionCounts,
    thoughtCounts,
  });
}
