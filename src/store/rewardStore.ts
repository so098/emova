import { create } from "zustand";

const XP_PER_LEVEL = 100;

interface RewardState {
  points: number;
  xp: number;
  loaded: boolean;
  setTotals: (xp: number, points: number) => void;
  addPoints: (amount: number) => void;
  addXP: (amount: number) => void;
  removePoints: (amount: number) => void;
  removeXP: (amount: number) => void;
}

export const useRewardStore = create<RewardState>((set) => ({
  points: 0,
  xp: 0,
  loaded: false,
  setTotals: (xp, points) => set({ xp, points, loaded: true }),
  addPoints: (amount) => set((s) => ({ points: s.points + amount })),
  addXP: (amount) => set((s) => ({ xp: s.xp + amount })),
  removePoints: (amount) => set((s) => ({ points: Math.max(0, s.points - amount) })),
  removeXP: (amount) => set((s) => ({ xp: Math.max(0, s.xp - amount) })),
}));

/** XP에서 레벨 계산 */
export function getLevel(xp: number) {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

/** 현재 레벨 내 진행도 (0-100) */
export function getLevelProgress(xp: number) {
  return ((xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100;
}

/** 다음 레벨까지 필요한 총 XP */
export function getNextLevelXP(xp: number) {
  const level = getLevel(xp);
  return level * XP_PER_LEVEL;
}
