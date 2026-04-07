"use client";

import { useState, useEffect, useRef } from "react";
import { User, Lock, Trophy, X, PartyPopper } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRewardStore, getLevel } from "@/store/rewardStore";
import { useQuests } from "@/features/quest/useQuests";
import { useReflections } from "@/features/reflect/useReflections";
import { useStreak, useUnlockedAchievements, useUnlockAchievement } from "@/features/reward/useAchievements";
import { useInsertTransaction } from "@/features/reward/useXPLedger";

interface Achievement {
  key: string;
  name: string;
  description: string;
  condition: string;
  check: (stats: Stats) => boolean;
  points: number;
}

interface Stats {
  reflectionCount: number;
  doneQuestCount: number;
  streakDays: number;
}

const ACHIEVEMENTS: Achievement[] = [
  { key: "emotion_explorer", name: "감정 탐험가", description: "나를 들여다보기 시작했어요", condition: "회고 3회", check: (s) => s.reflectionCount >= 3, points: 1000 },
  { key: "emotion_interpreter", name: "감정 해석가", description: "감정의 패턴이 보이기 시작해요", condition: "회고 10회", check: (s) => s.reflectionCount >= 10, points: 2500 },
  { key: "inner_observer", name: "내면의 관찰자", description: "꾸준히 자신을 마주하고 있어요", condition: "회고 30회", check: (s) => s.reflectionCount >= 30, points: 5000 },
  { key: "emotion_starter", name: "작심 감정러", description: "감정을 행동으로 바꾸기 시작했어요", condition: "퀘스트 5개 완료", check: (s) => s.doneQuestCount >= 5, points: 1500 },
  { key: "execution_master", name: "실행의 달인", description: "꾸준한 실행이 습관이 되었어요", condition: "퀘스트 20개 완료", check: (s) => s.doneQuestCount >= 20, points: 3000 },
  { key: "action_designer", name: "행동 설계자", description: "감정에서 행동까지, 자연스럽게", condition: "퀘스트 50개 완료", check: (s) => s.doneQuestCount >= 50, points: 6000 },
  { key: "routine_alchemist", name: "루틴 연금술사", description: "매일의 기록이 금으로 변해요", condition: "7일 연속 기록", check: (s) => s.streakDays >= 7, points: 2000 },
  { key: "habit_hero", name: "습관의 주인공", description: "한 달간의 꾸준함, 대단해요", condition: "30일 연속 기록", check: (s) => s.streakDays >= 30, points: 8000 },
  { key: "self_understanding", name: "자기이해 마스터", description: "감정, 행동, 회고를 모두 아우르는 사람", condition: "회고 10회 + 퀘스트 20개", check: (s) => s.reflectionCount >= 10 && s.doneQuestCount >= 20, points: 10000 },
];

function getProgress(achievement: Achievement, stats: Stats) {
  const c = achievement.condition;
  if (c.includes("회고") && c.includes("퀘스트")) {
    const r = Math.min(stats.reflectionCount / 10, 1);
    const q = Math.min(stats.doneQuestCount / 20, 1);
    return Math.round(((r + q) / 2) * 100);
  }
  if (c.includes("회고")) {
    const target = parseInt(c.match(/\d+/)?.[0] ?? "1");
    return Math.min(Math.round((stats.reflectionCount / target) * 100), 100);
  }
  if (c.includes("퀘스트")) {
    const target = parseInt(c.match(/\d+/)?.[0] ?? "1");
    return Math.min(Math.round((stats.doneQuestCount / target) * 100), 100);
  }
  if (c.includes("연속")) {
    const target = parseInt(c.match(/\d+/)?.[0] ?? "1");
    return Math.min(Math.round((stats.streakDays / target) * 100), 100);
  }
  return 0;
}

function AchievementModal({
  stats,
  unlockedKeys,
  onClose,
}: {
  stats: Stats;
  unlockedKeys: Set<string>;
  onClose: () => void;
}) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/30"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className="fixed inset-x-4 top-1/2 z-50 mx-auto flex max-h-[80dvh] max-w-[28rem] -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border-default bg-surface"
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <Trophy size={18} strokeWidth={2} color="var(--point-color)" />
            <span className="text-base font-bold text-text-primary">업적</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-text-muted">{unlockedKeys.size}/{ACHIEVEMENTS.length}</span>
            <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
              <X size={18} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* 목록 */}
        <div className="flex flex-col gap-2 overflow-y-auto px-5 pb-5">
          {ACHIEVEMENTS.map((a) => {
            const unlocked = unlockedKeys.has(a.key);
            const progress = getProgress(a, stats);
            return (
              <div
                key={a.key}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
                  unlocked ? "bg-bg-muted" : "bg-surface border border-border-default opacity-60"
                }`}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  unlocked ? "bg-point" : "bg-bg-muted"
                }`}>
                  {unlocked
                    ? <Trophy size={16} strokeWidth={2} color="var(--on-accent)" />
                    : <Lock size={14} strokeWidth={2} color="var(--text-muted)" />
                  }
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold ${unlocked ? "text-text-primary" : "text-text-muted"}`}>
                      {a.name}
                    </span>
                    <span className="text-xs font-bold text-point">{a.points.toLocaleString()}P</span>
                  </div>
                  <span className="text-xs text-text-muted">{a.description}</span>
                  {!unlocked && (
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg-muted">
                        <div
                          className="h-full rounded-full bg-point transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-[0.625rem] font-bold text-text-muted">{a.condition}</span>
                    </div>
                  )}
                  {unlocked && (
                    <span className="text-[0.625rem] font-bold text-point">해금 완료</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </>
  );
}

function useCelebrationSound() {
  const audioRef = useRef<AudioContext | null>(null);

  return () => {
    try {
      const ctx = audioRef.current ?? new AudioContext();
      audioRef.current = ctx;

      const playNote = (freq: number, start: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
        osc.connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + dur);
      };

      // 짧은 팡파레 멜로디
      playNote(523, 0, 0.15);     // C5
      playNote(659, 0.12, 0.15);  // E5
      playNote(784, 0.24, 0.15);  // G5
      playNote(1047, 0.36, 0.4);  // C6 (길게)
    } catch {
      // 오디오 재생 실패 무시
    }
  };
}

export default function ProfilePage() {
  const [showAchievements, setShowAchievements] = useState(false);
  const [celebrateAchievement, setCelebrateAchievement] = useState<Achievement | null>(null);
  const playCelebration = useCelebrationSound();

  const xp = useRewardStore((s) => s.xp);
  const level = getLevel(xp);

  const { data: questData } = useQuests();
  const { data: reflectionData } = useReflections();
  const { data: streakDays } = useStreak();
  const { data: unlockedList } = useUnlockedAchievements();
  const unlockAchievement = useUnlockAchievement();
  const insertTransaction = useInsertTransaction();

  const reflectionCount = reflectionData?.pages.flatMap((p) => p.data).length ?? 0;
  const doneQuestCount = questData
    ? [...questData.단기, ...questData.장기, ...questData.보류].filter((q) => q.done).length
    : 0;

  const stats: Stats = { reflectionCount, doneQuestCount, streakDays: streakDays ?? 0 };
  const unlockedKeys = new Set((unlockedList ?? []).map((a) => a.achievementKey));

  // 새로 달성한 업적 자동 해금 + 보상 + 축하 모달
  const celebrateQueue = useRef<Achievement[]>([]);
  const processing = useRef(false);

  useEffect(() => {
    const newlyUnlocked: Achievement[] = [];
    for (const a of ACHIEVEMENTS) {
      if (a.check(stats) && !unlockedKeys.has(a.key)) {
        unlockAchievement.mutate(a.key);
        insertTransaction.mutate({
          type: "points",
          delta: a.points,
          reason: `업적 해금: ${a.name}`,
        });
        useRewardStore.getState().addPoints(a.points);
        newlyUnlocked.push(a);
      }
    }
    if (newlyUnlocked.length > 0) {
      celebrateQueue.current.push(...newlyUnlocked);
      if (!processing.current) {
        processing.current = true;
        setCelebrateAchievement(celebrateQueue.current.shift()!);
        playCelebration();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats.reflectionCount, stats.doneQuestCount, stats.streakDays, unlockedKeys.size]);

  const dismissCelebration = () => {
    if (celebrateQueue.current.length > 0) {
      setCelebrateAchievement(celebrateQueue.current.shift()!);
      playCelebration();
    } else {
      setCelebrateAchievement(null);
      processing.current = false;
    }
  };

  return (
    <main className="flex min-h-dvh items-start justify-center px-4 pt-7 pb-8">
      <div className="flex w-full max-w-(--ui-content-width) flex-col gap-6">
        <h1 className="text-lg font-bold text-text-primary">내 정보</h1>

        {/* 프로필 카드 */}
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border-default bg-surface px-6 py-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-point">
            <User size={28} strokeWidth={2} color="var(--on-accent)" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-base font-bold text-text-primary">익명 사용자</span>
            <span className="rounded-full bg-brand-primary px-3 py-0.5 text-[0.625rem] font-bold tracking-widest text-on-accent">
              LV.{level}
            </span>
          </div>
          <div className="flex gap-4 text-xs text-text-muted">
            <span>회고 <strong className="text-text-primary">{reflectionCount}</strong>회</span>
            <span>퀘스트 <strong className="text-text-primary">{doneQuestCount}</strong>개 완료</span>
          </div>

          {/* 업적 버튼 */}
          <button
            onClick={() => setShowAchievements(true)}
            className="flex items-center gap-2 rounded-full border border-border-default px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:text-text-primary"
          >
            <Trophy size={16} strokeWidth={2} color="var(--point-color)" />
            업적 {unlockedKeys.size}/{ACHIEVEMENTS.length}
          </button>
        </div>

        {/* 계정 정보 */}
        <div className="flex flex-col gap-3 rounded-2xl border border-border-default bg-surface px-5 py-4">
          <span className="text-xs font-bold text-text-muted">계정</span>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">인증 방식</span>
            <span className="text-sm text-text-muted">익명 로그인</span>
          </div>
        </div>
      </div>

      {/* 업적 모달 */}
      <AnimatePresence>
        {showAchievements && (
          <AchievementModal
            stats={stats}
            unlockedKeys={unlockedKeys}
            onClose={() => setShowAchievements(false)}
          />
        )}
      </AnimatePresence>

      {/* 축하 모달 */}
      <AnimatePresence>
        {celebrateAchievement && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={dismissCelebration}
              className="fixed inset-0 z-[60] bg-black/40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 24 }}
              className="fixed inset-x-4 top-1/2 z-[61] mx-auto flex max-w-[22rem] -translate-y-1/2 flex-col items-center gap-4 overflow-hidden rounded-2xl border border-border-default bg-surface"
            >
              <div className="flex w-full flex-col items-center gap-2 bg-point px-6 pt-8 pb-5">
                <motion.div
                  animate={{ rotate: [0, -12, 12, -8, 8, 0], scale: [1, 1.2, 1.2, 1.1, 1.1, 1] }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <PartyPopper size={36} strokeWidth={1.8} color="var(--on-accent)" />
                </motion.div>
                <span className="text-lg font-bold text-on-accent">업적 달성!</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 px-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-point">
                  <Trophy size={22} strokeWidth={2} color="var(--on-accent)" />
                </div>
                <span className="text-base font-bold text-text-primary">{celebrateAchievement.name}</span>
                <span className="text-xs text-text-muted">{celebrateAchievement.description}</span>
              </div>
              <div className="w-full px-6">
                <div className="flex items-center justify-between rounded-[0.875rem] bg-accent-gold-bg-light px-4 py-3">
                  <span className="text-sm text-text-muted">보상</span>
                  <span className="text-sm font-bold text-accent-gold">+{celebrateAchievement.points.toLocaleString()} P</span>
                </div>
              </div>
              <div className="w-full px-6 pb-6">
                <button
                  onClick={dismissCelebration}
                  className="w-full rounded-full bg-point py-3 text-sm font-bold text-on-accent"
                >
                  확인
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
