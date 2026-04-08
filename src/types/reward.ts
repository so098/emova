export type LedgerType = "xp" | "points";

export interface LedgerEntry {
  id: string;
  type: LedgerType;
  delta: number;
  reason: string;
  questId: string | null;
  sessionId: string | null;
  createdAt: string;
}

export interface UnlockedAchievement {
  id: string;
  achievementKey: string;
  unlockedAt: string;
}
