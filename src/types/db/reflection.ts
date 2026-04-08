export interface DbReflection {
  id: string;
  client_id: string;
  session_id: string | null;
  quest_id: string | null;
  before_emotion: string | null;
  after_emotion: string | null;
  notes: string | null;
  ai_feedback: unknown | null;
  created_at: string;
}

export type DbReflectionWithQuest = DbReflection & { quests: { title: string } | null };
