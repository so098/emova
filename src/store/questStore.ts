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

export function today() {
  const d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}
