export interface Quest {
  id: string;
  title: string;
  date: string;
  points: number;
  done: boolean;
  memo?: string;
  parentId?: string;
  originTab?: "단기" | "장기";
  source?: "user" | "ai" | "survey";
}

export interface QuestState {
  단기: Quest[];
  장기: Quest[];
  보류: Quest[];
}
