export interface Question {
  label: string;
  sub: string;
  color: string;
}

export const QUESTIONS: Question[] = [
  { label: "지금 가장 필요한 건 무엇인가요?", sub: "지금 내게 가장 중요한 것을 떠올려보세요", color: "#c3aed6" },
  { label: "오늘 하루가 끝날 때 어떤 기분이길 바라나요?", sub: "하루의 끝을 상상해보세요", color: "#77dd77" },
  { label: "이 감정은 어떤 행동을 원하나요?", sub: "감정이 보내는 신호를 들어보세요", color: "#ffb347" },
  { label: "지금 가장 피하고 싶은 게 있나요?", sub: "회피하는 것도 하나의 신호예요", color: "#f4845f" },
  { label: "오늘 한 가지만 해낸다면 무엇인가요?", sub: "가장 작은 실행을 골라보세요", color: "#ffc38f" },
  { label: "지금 이 감정을 누군가에게 말한다면?", sub: "감정을 언어로 꺼내보세요", color: "#6c8ead" },
];
