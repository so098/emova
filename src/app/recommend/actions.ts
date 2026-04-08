"use server";

import Anthropic from "@anthropic-ai/sdk";

export interface Recommendation {
  title: string;
  description: string;
}

const MOCK: Recommendation[] = [
  { title: "따뜻한 물로 손 씻기", description: "따뜻한 물의 촉감으로 긴장을 완화하고 기분을 새로 고칠 수 있어요" },
  { title: "창문 열고 3번 심호흡", description: "신선한 공기와 함께 짧은 호흡으로 머리를 맑게 해보세요" },
  { title: "5분 스트레칭", description: "굳어있는 몸을 가볍게 풀어주면 마음도 함께 이완돼요" },
  { title: "좋아하는 노래 한 곡 듣기", description: "음악으로 감정을 환기하고 잠깐의 쉼표를 만들어보세요" },
  { title: "오늘 감사한 것 1가지 적기", description: "작은 것이라도 좋아요, 시선을 바꾸는 연습이에요" },
  { title: "물 한 잔 천천히 마시기", description: "몸에 수분을 채우면서 잠깐 멈춰 서는 시간을 가져보세요" },
];

export async function fetchRecommendations(
  questionLabel: string,
  questionText: string
): Promise<Recommendation[]> {
  if (questionText.trim().toLowerCase() === "test") return MOCK;

  const client = new Anthropic();

  const prompt = `
사용자가 다음 질문에 대해 아래와 같이 답했어요.

질문: ${questionLabel}
사용자 답변: ${questionText}

이 사람에게 지금 당장 실천할 수 있는 작고 구체적인 행동 루틴 6가지를 추천해주세요.
각 루틴은 5분~20분 안에 할 수 있어야 하고, 감정 상태를 고려해 부담 없이 시작할 수 있는 것이어야 해요.
다양한 종류(신체 활동, 마음 챙김, 창작, 사회적 연결, 환경 전환, 자기 돌봄)로 골고루 추천해주세요.

반드시 아래 JSON 배열 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요:
[
  { "title": "루틴 제목", "description": "한 줄 설명" },
  { "title": "루틴 제목", "description": "한 줄 설명" },
  { "title": "루틴 제목", "description": "한 줄 설명" },
  { "title": "루틴 제목", "description": "한 줄 설명" },
  { "title": "루틴 제목", "description": "한 줄 설명" },
  { "title": "루틴 제목", "description": "한 줄 설명" }
]`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = (message.content[0] as { type: string; text: string }).text;
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) return MOCK;
  try {
    return JSON.parse(match[0]) as Recommendation[];
  } catch {
    return MOCK;
  }
}
