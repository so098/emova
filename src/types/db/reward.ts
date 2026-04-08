export interface DbLedgerRow {
  id: string;
  client_id: string;
  type: string;
  delta: number;
  reason: string;
  quest_id: string | null;
  session_id: string | null;
  created_at: string;
}

export interface DbAchievementRow {
  id: string;
  client_id: string;
  achievement_key: string;
  unlocked_at: string;
}
