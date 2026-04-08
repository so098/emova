import { describe, it, expect } from "vitest";
import {
  calcReflectionXP,
  calcQuestReward,
  getStreakMilestoneBonus,
  STREAK_TIERS,
} from "./rewardBalancing";

/*
 * 보상 체감(diminishing returns) 테스트
 *
 * 왜 체감이 필요한가:
 * - 체감 없이 고정 보상이면, 하루에 회고 100번 써서 XP를 무한으로 쌓을 수 있음.
 * - 보상 인플레이션이 생기면 레벨/등급의 의미가 사라지고 게임화 전체가 무너짐.
 * - 그렇다고 "하루 1회만 보상"으로 잘라버리면 추가 행동 동기가 0이 됨.
 *
 * 그래서 "줄이되 끊지는 않는" 체감 구조를 씀:
 * - 첫 행동에 가장 큰 보상 → 핵심 루틴 1회를 강하게 유도
 * - 반복할수록 줄어듦 → 어뷰징 방지
 * - 최소 보상은 유지 → "해봤자 0"이라는 느낌 방지, 추가 행동도 의미 있게
 *
 * "첫 행동"의 기준:
 * - todayCount 파라미터로 판단. 이 값은 fetchTodayCount(reason)이 DB에서 계산함.
 * - xp_ledger 테이블에서 "오늘 KST 자정 이후 + 같은 reason + 양수 delta"인 row를 count.
 * - todayCount=0이면 오늘 첫 행동 → 풀 보상, 1 이상이면 체감 적용.
 * - 하루가 지나면 count가 리셋되므로 매일 첫 행동은 항상 풀 보상.
 */

// ── 회고 XP ──
// 체감 테이블: [20, 10, 5, 2]
// 하루에 회고를 여러 번 쓰면 XP가 줄어들고, 4회차부터는 2 XP로 고정.
// 왜: 회고는 핵심 루프(행동→감정 연결 인식)의 마지막 단계라 첫 1회가 가장 중요.
//     추가 회고도 허용하되 XP를 줄여서 "양보다 질"을 유도.
describe("calcReflectionXP", () => {
  it("첫 회고(todayCount=0)는 20 XP", () => {
    expect(calcReflectionXP(0)).toBe(20);
  });

  it("두 번째 회고는 10 XP", () => {
    expect(calcReflectionXP(1)).toBe(10);
  });

  it("세 번째 회고는 5 XP", () => {
    expect(calcReflectionXP(2)).toBe(5);
  });

  it("네 번째 이후로는 몇 번을 써도 2 XP 고정", () => {
    expect(calcReflectionXP(3)).toBe(2);
    expect(calcReflectionXP(10)).toBe(2);
    expect(calcReflectionXP(100)).toBe(2);
  });
});

// ── 퀘스트 보상 ──
// 체감 배율: [1.0, 0.7, 0.5, 0.25]
// basePoints에 배율을 곱해서 실제 보상을 계산.
// 예) basePoints=100이면: 100 → 70 → 50 → 25 → 25 → ...
// 왜: 퀘스트는 "오늘 하나 해냈다"가 핵심이라 첫 완료에 풀 보상.
//     같은 날 추가 완료는 성실함이지만, 동일 보상이면 쉬운 퀘스트만 반복하는 편법이 생김.
//     배율을 곱하는 방식이라 퀘스트 난이도(basePoints)에 비례해서 자연스럽게 조절됨.
describe("calcQuestReward", () => {
  it("첫 완료(todayCount=0)는 배율 1.0 → 기본 포인트 그대로", () => {
    expect(calcQuestReward(100, 0)).toBe(100);
  });

  it("두 번째 완료는 배율 0.7 → 70%", () => {
    expect(calcQuestReward(100, 1)).toBe(70);
  });

  it("세 번째 완료는 배율 0.5 → 50%", () => {
    expect(calcQuestReward(100, 2)).toBe(50);
  });

  it("네 번째 이후로는 배율 0.25 고정 → 25%에서 더 안 줄어듦", () => {
    expect(calcQuestReward(100, 3)).toBe(25);
    expect(calcQuestReward(100, 20)).toBe(25);
  });

  it("계산 결과가 0 이하여도 최소 1포인트 보장 (Math.max(1, ...))", () => {
    expect(calcQuestReward(1, 3)).toBe(1);  // 1 * 0.25 = 0.25 → round → 0 → max(1,0) = 1
    expect(calcQuestReward(0, 0)).toBe(1);  // 0 * 1.0 = 0 → max(1,0) = 1
  });

  it("소수점은 반올림 처리 (Math.round)", () => {
    expect(calcQuestReward(33, 1)).toBe(Math.round(33 * 0.7));  // 23.1 → 23
    expect(calcQuestReward(7, 2)).toBe(Math.round(7 * 0.5));    // 3.5 → 4
  });
});

// ── 스트릭 마일스톤 보너스 ──
// 연속 활동 일수가 정확히 마일스톤(3, 7, 14, 30일)에 도달했을 때만 보너스 지급.
// 중간 일수(예: 5일, 10일)에는 보너스 없음.
// 왜: 매일 보너스를 주면 체감이 없어서 특별하지 않음.
//     "3일 버텼더니 보상이 왔다" 같은 서프라이즈가 습관 형성에 효과적.
//     마일스톤 간격이 3→7→14→30으로 넓어지는 건, 습관이 잡힐수록 외적 보상 의존을 줄이기 위함.
describe("getStreakMilestoneBonus", () => {
  it.each(STREAK_TIERS)(
    "$days일 연속 달성 시 $bonus XP 보너스",
    ({ days, bonus }) => {
      expect(getStreakMilestoneBonus(days)).toBe(bonus);
    },
  );

  it("마일스톤이 아닌 일수에는 null 반환 (보너스 없음)", () => {
    expect(getStreakMilestoneBonus(1)).toBeNull();
    expect(getStreakMilestoneBonus(5)).toBeNull();
    expect(getStreakMilestoneBonus(10)).toBeNull();
    expect(getStreakMilestoneBonus(31)).toBeNull();
  });
});
