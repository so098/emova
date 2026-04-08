import type { SessionStatus } from "./movaFlowApi";

/* ── 타입 ── */

export interface SessionStatusCount {
  status: SessionStatus;
  count: number;
}

export interface DailySessionCount {
  date: string;
  count: number;
}

export interface HourlyUsage {
  hour: number;
  count: number;
}

export interface QuestStatusCount {
  status: string;
  count: number;
}

export interface DeviceAccessLog {
  clientId: string;
  firstSeen: string;
  lastSeen: string;
  sessions: number;
  activeHours: number[];
}

export interface FunnelStep {
  stage: string;
  count: number;
}

export interface DeviceCompletionRate {
  clientId: string;
  total: number;
  completed: number;
  reflected: number;
  flowRate: number;
  loopRate: number;
}

export interface SessionDetail {
  id: string;
  clientId: string;
  status: string;
  startedAt: string;
  flowCompleted: boolean;
  loopCompleted: boolean;
}

export interface DashboardData {
  sessionStatusCounts: SessionStatusCount[];
  dailySessions: DailySessionCount[];
  hourlyUsage: HourlyUsage[];
  deviceAccessLogs: DeviceAccessLog[];
  questStatusCounts: QuestStatusCount[];
  totalUsers: number;
  funnel: FunnelStep[];
  deviceCompletionRates: DeviceCompletionRate[];
  sessionDetails: SessionDetail[];
  emotionCounts: { key: string; count: number }[];
  thoughtCounts: { key: string; count: number }[];
}

