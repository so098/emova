import { createClient } from "./client";
import { authError } from "@/lib/errors";

export interface Notification {
  type: "no-session-today" | "unreflected" | "streak";
  title: string;
  desc: string;
  /** unreflected 건수 또는 streak 일수 */
  count?: number;
}

async function getClientId(): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw authError();
  return user.id;
}

/** 오늘 날짜 문자열 (KST) */
function todayKST(): string {
  const d = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }),
  );
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 날짜 문자열 → KST 날짜만 추출 */
function toKSTDate(iso: string): string {
  const d = new Date(
    new Date(iso).toLocaleString("en-US", { timeZone: "Asia/Seoul" }),
  );
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 연속 일수 계산 (오늘 포함) */
function calcStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const unique = [...new Set(dates)].sort().reverse();
  const today = todayKST();

  // 오늘 또는 어제부터 시작
  if (unique[0] !== today) {
    const yesterday = new Date(
      new Date(today).getTime() - 86_400_000,
    );
    const y = yesterday.getFullYear();
    const m = String(yesterday.getMonth() + 1).padStart(2, "0");
    const d = String(yesterday.getDate()).padStart(2, "0");
    if (unique[0] !== `${y}-${m}-${d}`) return 0;
  }

  let streak = 1;
  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(unique[i - 1]).getTime();
    const curr = new Date(unique[i]).getTime();
    if (prev - curr === 86_400_000) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export async function fetchNotifications(): Promise<Notification[]> {
  const clientId = await getClientId();
  const supabase = createClient();
  const today = todayKST();
  const notifications: Notification[] = [];

  // 1) 오늘 세션 존재 여부 + 2) 회고 미작성 + 3) 연속 기록용 날짜
  // 한 번의 쿼리로 최근 세션 가져오기
  const { data: sessions } = await supabase
    .from("survey_sessions")
    .select("started_at, status")
    .eq("client_id", clientId)
    .in("status", ["completed", "reflected"])
    .order("started_at", { ascending: false })
    .limit(100);

  const rows = sessions ?? [];

  // 1) 오늘 루틴 미시작
  const hasToday = rows.some((s) => toKSTDate(s.started_at) === today);
  if (!hasToday) {
    notifications.push({
      type: "no-session-today",
      title: "오늘 루틴을 아직 시작하지 않았어요",
      desc: "지금 시작하면 딱 좋을 시간이에요.",
    });
  }

  // 2) 회고 미작성
  const unreflectedCount = rows.filter((s) => s.status === "completed").length;
  if (unreflectedCount > 0) {
    notifications.push({
      type: "unreflected",
      title: `회고를 기다리는 미션이 ${unreflectedCount}개 있어요`,
      desc: "완료한 미션을 돌아보며 루프를 완성해보세요.",
      count: unreflectedCount,
    });
  }

  // 3) 연속 기록
  const dates = rows.map((s) => toKSTDate(s.started_at));
  const streak = calcStreak(dates);
  if (streak >= 2) {
    notifications.push({
      type: "streak",
      title: `${streak}일 연속 루틴 달성!`,
      desc: "꾸준히 실행하고 있어요. 계속 이어가봐요.",
      count: streak,
    });
  }

  return notifications;
}
