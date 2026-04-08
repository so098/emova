"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/feedback/ToastStack";
import { useInsertReflection, useUpdateReflection, useDeleteReflection } from "../hooks/useReflections";
import { useReflectRewards } from "../hooks/useReflectRewards";
import ReflectEntryList from "./ReflectEntryList";
import ReflectSummaryModal from "./ReflectSummaryModal";
import ReflectDeleteModal from "./ReflectDeleteModal";
import type { SummaryData } from "./ReflectSummaryModal";
import type { Reflection } from "@/lib/supabase/reflectionApi";

const EMOTION_LABELS = [
  "불안", "무기력", "짜증", "혼란", "외로움",
  "초조함", "의욕", "공허함", "설렘", "지침",
];

type WriteMode = "guided" | "free";
type Step = 0 | 1 | 2; // 0: 감정선택, 1: 방식선택, 2: 작성

const GUIDED_QUESTIONS = [
  {
    question: "오늘 어떤 감정에서 시작했나요?",
    sub: "그 감정은 어떤 상황에서 시작됐을까요?",
    placeholder: "여기에 감정을 적어주세요",
  },
  {
    question: "그 감정은 어떤 생각을 불렀나요?",
    sub: "감정이 조금 바뀌었다면, 어떤 변화였나요?",
    placeholder: "어떤 생각이 떠올랐는지 적어주세요",
  },
  {
    question: "오늘 해본 행동은, 그 감정에 어떤 영향을 줬나요?",
    sub: "감정이 바뀌었거나, 그대로였다면 이유도 적어주세요",
    placeholder: "감정의 변화나 그대로인 이유를 적어주세요",
  },
];

function EmotionPills({
  label,
  sub,
  selected,
  onToggle,
}: {
  label: string;
  sub?: string;
  selected: string[];
  onToggle: (emotion: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold text-text-primary">{label}</span>
        {sub && <span className="text-xs text-text-faint">{sub}</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        {EMOTION_LABELS.map((emotion) => (
          <button
            key={emotion}
            onClick={() => onToggle(emotion)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
              selected.includes(emotion)
                ? "bg-interactive text-on-accent"
                : "bg-surface-elevated text-text-muted"
            }`}
          >
            {emotion}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ReflectPage() {
  const searchParams = useSearchParams();
  const insertReflection = useInsertReflection();
  const updateReflection = useUpdateReflection();
  const deleteReflection = useDeleteReflection();
  const { showToast } = useToast();
  const { grantRewards } = useReflectRewards();

  const [isWriting, setIsWriting] = useState(false);
  const [step, setStep] = useState<Step>(0);
  const [writeMode, setWriteMode] = useState<WriteMode | null>(null);
  const [beforeEmotions, setBeforeEmotions] = useState<string[]>([]);
  const [afterEmotions, setAfterEmotions] = useState<string[]>([]);
  const [linkedQuestId, setLinkedQuestId] = useState<string | null>(null);
  const [linkedQuestTitle, setLinkedQuestTitle] = useState<string | null>(null);
  const [linkedQuestMemo, setLinkedQuestMemo] = useState<string | null>(null);
  const [editingReflection, setEditingReflection] = useState<Reflection | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // 퀘스트 완료 후 MoodCheckModal에서 넘어온 경우 또는 퀘스트에서 회고하러 가기
  const hasInitRef = useRef(false);
  useEffect(() => {
    if (hasInitRef.current) return;
    const write = searchParams.get("write");
    const mood = searchParams.get("mood");
    const questId = searchParams.get("questId");
    const questTitle = searchParams.get("questTitle");
    const questMemo = searchParams.get("questMemo");
    if (write === "true") {
      hasInitRef.current = true;
      setIsWriting(true);
      if (mood && EMOTION_LABELS.includes(mood)) {
        setBeforeEmotions([mood]);
      }
      if (questId) {
        setLinkedQuestId(questId);
        setLinkedQuestTitle(questTitle ?? null);
        setLinkedQuestMemo(questMemo ?? null);
      }
    }
  }, [searchParams]);
  const [freeText, setFreeText] = useState("");
  const [guidedAnswers, setGuidedAnswers] = useState<string[]>(
    GUIDED_QUESTIONS.map(() => ""),
  );
  const [summary, setSummary] = useState<SummaryData | null>(null);

  const toggleEmotion = (list: string[], emotion: string) =>
    list.includes(emotion) ? list.filter((e) => e !== emotion) : [...list, emotion];

  const resetForm = () => {
    setIsWriting(false);
    setStep(0);
    setWriteMode(null);
    setBeforeEmotions([]);
    setAfterEmotions([]);
    setFreeText("");
    setGuidedAnswers(GUIDED_QUESTIONS.map(() => ""));
    setLinkedQuestId(null);
    setLinkedQuestTitle(null);
    setLinkedQuestMemo(null);
    setEditingReflection(null);
  };

  const canGoNext = () => {
    if (step === 0) return afterEmotions.length > 0;
    if (step === 1) return writeMode !== null;
    return false;
  };

  const canSubmit = () => {
    if (writeMode === "free") return freeText.trim().length > 0;
    if (writeMode === "guided") return guidedAnswers.some((a) => a.trim().length > 0);
    return false;
  };

  const handleSubmit = () => {
    if (!canSubmit() || !writeMode) return;

    const text =
      writeMode === "free"
        ? freeText.trim()
        : guidedAnswers
            .map((a, i) =>
              a.trim() ? `${GUIDED_QUESTIONS[i].question}\n${a.trim()}` : "",
            )
            .filter(Boolean)
            .join("\n\n");

    const firstLine = text.split("\n").find((l) => l.trim()) ?? text;
    const oneLiner = firstLine.length > 50 ? firstLine.slice(0, 50) + "…" : firstLine;

    if (editingReflection) {
      updateReflection.mutate(
        {
          id: editingReflection.id,
          beforeEmotion: beforeEmotions.join(", "),
          afterEmotion: afterEmotions.join(", "),
          notes: text,
        },
        {
          onSuccess: () => {
            showToast("회고가 수정되었어요", "");
            resetForm();
          },
          onError: () => {
            showToast("수정에 실패했어요", "다시 시도해주세요");
          },
        },
      );
      return;
    }

    insertReflection.mutate(
      {
        questId: linkedQuestId ?? undefined,
        beforeEmotion: beforeEmotions.join(", "),
        afterEmotion: afterEmotions.join(", "),
        notes: text,
      },
      {
        onSuccess: async () => {
          try {
            const totalXP = await grantRewards();
            setSummary({
              emotionBefore: beforeEmotions.join(", ") || "—",
              emotionAfter: afterEmotions.join(", "),
              oneLiner,
              xp: totalXP,
            });
          } catch (e) {
            console.error("Failed to record reflection XP:", e);
          }
          resetForm();
        },
        onError: () => {
          showToast("저장에 실패했어요", "다시 시도해주세요");
        },
      },
    );
  };

  const updateGuidedAnswer = (index: number, value: string) => {
    setGuidedAnswers((prev) => prev.map((a, i) => (i === index ? value : a)));
  };

  const startEdit = (entry: Reflection) => {
    setEditingReflection(entry);
    setBeforeEmotions(entry.beforeEmotion ? entry.beforeEmotion.split(", ").filter(Boolean) : []);
    setAfterEmotions(entry.afterEmotion ? entry.afterEmotion.split(", ").filter(Boolean) : []);
    setFreeText(entry.notes);
    setWriteMode("free");
    setStep(2);
    setIsWriting(true);
  };

  const confirmDelete = (id: string) => {
    setDeleteTarget(id);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteReflection.mutate(deleteTarget, {
      onSuccess: () => {
        showToast("회고가 삭제되었어요", "");
        setDeleteTarget(null);
      },
      onError: () => {
        showToast("삭제에 실패했어요", "다시 시도해주세요");
        setDeleteTarget(null);
      },
    });
  };

  return (
    <div className="flex h-[calc(100dvh-10rem)] w-full max-w-(--ui-content-width) flex-col gap-6">
      {/* 요약 오버레이 */}
      <AnimatePresence>
        {summary && (
          <ReflectSummaryModal summary={summary} onClose={() => setSummary(null)} />
        )}
      </AnimatePresence>

      {/* 삭제 확인 모달 */}
      <AnimatePresence>
        {deleteTarget && (
          <ReflectDeleteModal
            isPending={deleteReflection.isPending}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-text-primary">
          {editingReflection ? "회고 수정" : "회고"}
        </h1>
        {!isWriting && (
          <button
            onClick={() => { setIsWriting(true); setStep(0); }}
            className="bg-brand-primary rounded-full px-4 py-2 text-sm font-bold text-on-accent"
          >
            회고 쓰기
          </button>
        )}
      </div>

      {/* 연동된 퀘스트 + 실행 메모 표시 */}
      {isWriting && linkedQuestTitle && (
        <div className="flex flex-col gap-1.5 rounded-xl bg-accent-gold-bg-light px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">연동 퀘스트</span>
            <span className="max-w-[16rem] truncate text-xs font-semibold text-interactive">
              {linkedQuestTitle}
            </span>
          </div>
          {linkedQuestMemo && (
            <div className="flex flex-col gap-0.5 border-t border-accent-gold/20 pt-1.5">
              <span className="text-[0.625rem] font-semibold text-text-faint">실행 전 다짐</span>
              <p className="text-xs leading-relaxed text-text-muted">{linkedQuestMemo}</p>
            </div>
          )}
        </div>
      )}

      {/* 스텝 폼 */}
      {isWriting && (
        <>
          {/* 스텝 인디케이터 */}
          <div className="flex items-center gap-2">
            {[0, 1, 2].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  s <= step ? "bg-point" : "bg-surface-elevated"
                }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 0: 감정 선택 */}
            {step === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.2 }}
                className="flex flex-1 flex-col gap-6 overflow-y-auto rounded-2xl border border-border-default bg-surface-card-glass px-5 py-5 backdrop-blur-lg"
              >
                <EmotionPills
                  label="퀘스트 전 기분은 어땠어요?"
                  sub="여러 개 선택할 수 있어요 (선택사항)"
                  selected={beforeEmotions}
                  onToggle={(e) => setBeforeEmotions((prev) => toggleEmotion(prev, e))}
                />
                <EmotionPills
                  label="퀘스트 후 기분이 어때요?"
                  sub="최소 하나를 선택해주세요"
                  selected={afterEmotions}
                  onToggle={(e) => setAfterEmotions((prev) => toggleEmotion(prev, e))}
                />
              </motion.div>
            )}

            {/* Step 1: 방식 선택 */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.2 }}
                className="flex flex-1 flex-col gap-4 overflow-y-auto rounded-2xl border border-border-default bg-surface-card-glass px-5 py-5 backdrop-blur-lg"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-text-primary">어떤 방식으로 회고할까요?</span>
                  <span className="text-xs text-text-faint">편한 방식을 선택해주세요</span>
                </div>
                <button
                  onClick={() => setWriteMode("guided")}
                  className={`flex flex-col gap-1.5 rounded-2xl px-5 py-4 text-left transition-all ${
                    writeMode === "guided"
                      ? "bg-accent-gold-bg ring-[1.5px] ring-[var(--interactive)]"
                      : "bg-surface-elevated"
                  }`}
                >
                  <span className="text-sm font-bold text-text-primary">질문으로 회고하기</span>
                  <span className="text-xs text-text-muted">
                    3가지 질문에 답하면서 오늘을 되돌아봐요. 뭘 써야 할지 모르겠을 때 추천.
                  </span>
                </button>
                <button
                  onClick={() => setWriteMode("free")}
                  className={`flex flex-col gap-1.5 rounded-2xl px-5 py-4 text-left transition-all ${
                    writeMode === "free"
                      ? "bg-accent-gold-bg ring-[1.5px] ring-[var(--interactive)]"
                      : "bg-surface-elevated"
                  }`}
                >
                  <span className="text-sm font-bold text-text-primary">자유롭게 작성하기</span>
                  <span className="text-xs text-text-muted">
                    형식 없이 느낀 점, 깨달은 것, 다음에 해보고 싶은 것을 자유롭게 적어요.
                  </span>
                </button>
              </motion.div>
            )}

            {/* Step 2: 작성 */}
            {step === 2 && writeMode === "guided" && (
              <motion.div
                key="step-2-guided"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.2 }}
                className="flex flex-1 flex-col gap-4 overflow-y-auto rounded-2xl border border-border-default bg-surface-card-glass px-5 py-5 backdrop-blur-lg"
              >
                <p className="text-xs text-text-faint">하나 이상 작성해주세요</p>
                {GUIDED_QUESTIONS.map((q, i) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-text-primary">{q.question}</span>
                      <span className="text-xs text-text-subtle">{q.sub}</span>
                    </div>
                    <textarea
                      value={guidedAnswers[i]}
                      onChange={(e) => updateGuidedAnswer(i, e.target.value)}
                      placeholder={q.placeholder}
                      rows={2}
                      className="resize-none rounded-[0.875rem] bg-surface-elevated px-4 py-3 text-sm leading-relaxed text-text-primary outline-none placeholder:text-text-faint focus:ring-1 focus:ring-accent-gold"
                    />
                  </div>
                ))}
              </motion.div>
            )}

            {step === 2 && writeMode === "free" && (
              <motion.div
                key="step-2-free"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.2 }}
                className="flex flex-1 flex-col gap-2 overflow-y-auto rounded-2xl border border-border-default bg-surface-card-glass px-5 py-5 backdrop-blur-lg"
              >
                <span className="text-sm font-semibold text-text-primary">오늘을 돌아보며</span>
                <textarea
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  placeholder="느낀 점, 깨달은 것, 다음에 해보고 싶은 것..."
                  rows={8}
                  className="flex-1 resize-none rounded-[0.875rem] bg-surface-elevated px-4 py-3 text-sm leading-relaxed text-text-primary outline-none placeholder:text-text-faint focus:ring-1 focus:ring-accent-gold"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* 하단 버튼 */}
          <div className="flex shrink-0 gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => (s - 1) as Step)}
                className="rounded-full bg-surface-elevated px-5 py-3 text-sm font-medium text-text-muted transition-colors hover:text-text-primary"
              >
                이전
              </button>
            )}
            {step < 2 ? (
              <button
                onClick={() => setStep((s) => (s + 1) as Step)}
                disabled={!canGoNext()}
                className="bg-point flex-1 rounded-full py-3 text-sm font-bold text-on-point transition-opacity disabled:opacity-40"
              >
                다음
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canSubmit() || insertReflection.isPending || updateReflection.isPending}
                className="bg-point flex-1 rounded-full py-3 text-sm font-bold text-on-point transition-opacity disabled:opacity-40"
              >
                {(insertReflection.isPending || updateReflection.isPending)
                  ? "저장 중..."
                  : editingReflection ? "수정하기" : "저장하기"}
              </button>
            )}
            {step === 0 && (
              <button
                onClick={resetForm}
                className="rounded-full bg-surface-elevated px-5 py-3 text-sm font-medium text-text-subtle transition-colors hover:text-text-muted"
              >
                취소
              </button>
            )}
          </div>
        </>
      )}

      {/* 회고 목록 */}
      {!isWriting && (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ReflectEntryList onEdit={startEdit} onDelete={confirmDelete} />
        </div>
      )}
    </div>
  );
}
