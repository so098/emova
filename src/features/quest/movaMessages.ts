export type MovaContext =
  | "idle"
  | "questDone"
  | "longTermDone"
  | "empty"
  | "allDone";

export interface QuestStats {
  shortTotal: number;
  shortDone: number;
  longTotal: number;
  longDone: number;
}

const IDLE: string[] = [
  "오늘 {shortRemain}개 남았어요, 천천히 해봐요",
  "{shortDone}개 했고 {shortRemain}개 남았어요",
  "오늘 할 거 {shortRemain}개, 할 수 있어요",
];

const IDLE_ZERO: string[] = [
  "아직 시작 전이에요, 하나만 해볼까요",
  "준비됐으면 가볍게 시작해봐요",
];

const QUEST_DONE: string[] = [
  "{shortDone}/{shortTotal} 완료, 잘하고 있어요",
  "하나 끝! {shortRemain}개 남았어요",
  "{shortRemain}개만 더, 거의 다 왔어요",
];

const QUEST_DONE_LAST: string[] = [
  "단기 전부 끝, 수고했어요",
  "오늘 단기 다 했어요, 고생했어요",
];

const LONG_TERM_DONE: string[] = [
  "장기 하나 끝났어요, 여기까지 온 거 대단해요",
  "목표 하나 달성, 잘 해왔어요",
];

const EMPTY: string[] = [
  "퀘스트가 비어있어요, 하나 적어볼까요",
  "뭐든 좋아요, 작은 거 하나 추가해봐요",
];

const ALL_DONE: string[] = [
  "오늘 다 끝냈어요, 푹 쉬어요",
  "다 했어요, 회고 남기기 좋은 타이밍이에요",
  "오늘 충분히 했어요",
];

function fill(template: string, stats: QuestStats): string {
  const shortRemain = stats.shortTotal - stats.shortDone;
  return template
    .replace("{shortTotal}", String(stats.shortTotal))
    .replace("{shortDone}", String(stats.shortDone))
    .replace("{shortRemain}", String(shortRemain))
    .replace("{longTotal}", String(stats.longTotal))
    .replace("{longDone}", String(stats.longDone));
}

function pick(pool: string[]): string {
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getMovaMessage(context: MovaContext, stats: QuestStats): string {
  switch (context) {
    case "empty":
      return pick(EMPTY);
    case "allDone":
      return pick(ALL_DONE);
    case "longTermDone":
      return pick(LONG_TERM_DONE);
    case "questDone": {
      const remain = stats.shortTotal - stats.shortDone;
      return remain <= 0 ? pick(QUEST_DONE_LAST) : fill(pick(QUEST_DONE), stats);
    }
    case "idle":
    default: {
      if (stats.shortDone === 0 && stats.shortTotal > 0) return pick(IDLE_ZERO);
      if (stats.shortTotal === 0) return pick(EMPTY);
      return fill(pick(IDLE), stats);
    }
  }
}
