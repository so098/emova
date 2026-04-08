export interface DbQuestRow {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  source: string;
  status: string;
  due_at: string | null;
  xp_reward: number;
  created_at: string;
  completed_at: string | null;
  parent_id: string | null;
  category: string;
  origin_category: string | null;
}
