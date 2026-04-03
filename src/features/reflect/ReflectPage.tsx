"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, SmilePlus, Minus, Frown, Sun } from "lucide-react";

const EMOTION_OPTIONS = [
  { label: "좋아졌어", Icon: SmilePlus, color: "#3b82f6", value: "better" },
  { label: "비슷해", Icon: Minus, color: "#10b981", value: "same" },
  { label: "아직 힘들어", Icon: Frown, color: "#ef4444", value: "worse" },
] as const;

type EmotionValue = (typeof EMOTION_OPTIONS)[number]["value"];
type WriteMode = null | "guided" | "free";

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

interface ReflectEntry {
  id: number;
  date: string;
  questTitle: string;
  emotionBefore: string;
  emotionAfter: EmotionValue;
  text: string;
  type: "guided" | "free";
}

const MOCK_ENTRIES: ReflectEntry[] = [
  {
    id: 1,
    date: "2026.04.03",
    questTitle: "따뜻한 물로 손 씻기",
    emotionBefore: "불안",
    emotionAfter: "better",
    text: "별것 아닌 행동인데 하고 나니까 마음이 좀 가라앉았다. 손이 따뜻해지니까 긴장이 풀리는 느낌.",
    type: "free",
  },
  {
    id: 2,
    date: "2026.04.02",
    questTitle: "창문 열고 3번 심호흡",
    emotionBefore: "무기력",
    emotionAfter: "same",
    text: "솔직히 크게 달라진 건 없는데, 그래도 밖 공기 마시니까 잠깐은 깨는 느낌이었다.",
    type: "guided",
  },
];

interface SummaryData {
  emotionBefore: string;
  emotionAfter: string;
  questTitle: string;
  oneLiner: string;
  xp: number;
}

let nextId = 10;

export default function ReflectPage() {
  const [entries, setEntries] = useState(MOCK_ENTRIES);
  const [writeMode, setWriteMode] = useState<WriteMode>(null);
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionValue | null>(
    null,
  );
  const [freeText, setFreeText] = useState("");
  const [guidedAnswers, setGuidedAnswers] = useState<string[]>(
    GUIDED_QUESTIONS.map(() => ""),
  );
  const [summary, setSummary] = useState<SummaryData | null>(null);

  const isWriting = writeMode !== null;

  const resetForm = () => {
    setWriteMode(null);
    setSelectedEmotion(null);
    setFreeText("");
    setGuidedAnswers(GUIDED_QUESTIONS.map(() => ""));
  };

  const canSubmit = () => {
    if (!selectedEmotion) return false;
    if (writeMode === "free") return freeText.trim().length > 0;
    if (writeMode === "guided")
      return guidedAnswers.some((a) => a.trim().length > 0);
    return false;
  };

  const handleSubmit = () => {
    if (!canSubmit() || !selectedEmotion || !writeMode) return;
    const today = new Date();
    const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;

    const text =
      writeMode === "free"
        ? freeText.trim()
        : guidedAnswers
            .map((a, i) =>
              a.trim() ? `${GUIDED_QUESTIONS[i].question}\n${a.trim()}` : "",
            )
            .filter(Boolean)
            .join("\n\n");

    const afterLabel = emotionLabel(selectedEmotion)?.label ?? "";

    // 한 줄 요약: 첫 문장 또는 50자 컷
    const firstLine = text.split("\n").find((l) => l.trim()) ?? text;
    const oneLiner =
      firstLine.length > 50 ? firstLine.slice(0, 50) + "…" : firstLine;

    setEntries((prev) => [
      {
        id: nextId++,
        date: dateStr,
        questTitle: "오늘의 퀘스트",
        emotionBefore: "—",
        emotionAfter: selectedEmotion,
        text,
        type: writeMode,
      },
      ...prev,
    ]);

    setSummary({
      emotionBefore: "—",
      emotionAfter: afterLabel,
      questTitle: "오늘의 퀘스트",
      oneLiner,
      xp: 20,
    });

    resetForm();
  };

  const updateGuidedAnswer = (index: number, value: string) => {
    setGuidedAnswers((prev) => prev.map((a, i) => (i === index ? value : a)));
  };

  const emotionLabel = (value: EmotionValue) =>
    EMOTION_OPTIONS.find((o) => o.value === value);

  return (
    <div className="flex h-[calc(100dvh-16rem)] w-full max-w-(--ui-content-width) flex-col gap-6">
      {/* 요약 오버레이 */}
      <AnimatePresence>
        {summary && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSummary(null)}
              className="fixed inset-0 z-40 bg-black/30"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="fixed inset-x-4 top-1/2 z-50 mx-auto flex max-w-[26rem] -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-[0_8px_32px_rgba(0,0,0,0.15)]"
            >
              {/* 상단 */}
              <div className="flex flex-col items-center gap-2 bg-[linear-gradient(135deg,var(--brand-logo)_0%,var(--ui-button-primary)_100%)] px-6 pt-8 pb-6">
                <Sun size={32} strokeWidth={1.8} color="white" />
                <span className="text-lg font-bold text-white">
                  오늘 하루, 고생했어요
                </span>
              </div>

              <div className="flex flex-col gap-5 px-6 pt-5 pb-6">
                {/* 흐름 */}
                <div className="flex items-center justify-center gap-2.5 text-sm">
                  <span className="rounded-full bg-[#f5f5f5] px-3 py-1.5 font-medium text-[#777777]">
                    {summary.emotionBefore}
                  </span>
                  <span className="text-xs text-[#cccccc]">→</span>
                  <span className="rounded-full bg-[#f5f5f5] px-3 py-1.5 font-medium text-[#777777]">
                    {summary.questTitle}
                  </span>
                  <span className="text-xs text-[#cccccc]">→</span>
                  <span className="rounded-full bg-[#eaf7ee] px-3 py-1.5 font-medium text-[#5aba6e]">
                    done
                  </span>
                </div>

                {/* 한 줄 회고 */}
                <p className="text-center text-sm leading-relaxed text-[#555555]">
                  &ldquo;{summary.oneLiner}&rdquo;
                </p>

                {/* 구분선 */}
                <div className="h-px bg-[#f0f0f0]" />

                {/* XP */}
                <div className="flex items-center justify-between rounded-[0.875rem] bg-[#fffaf3] px-4 py-3">
                  <span className="text-sm text-[#999999]">경험치</span>
                  <span className="text-sm font-bold text-[#c8a96e]">
                    +{summary.xp} XP
                  </span>
                </div>

                {/* 닫기 */}
                <p className="text-center text-xs text-[#bbbbbb]">
                  내일 또 봐요.
                </p>
                <button
                  onClick={() => setSummary(null)}
                  className="bg-brand-primary w-full rounded-full py-3 text-sm font-bold text-white shadow-[0_4px_12px_rgba(255,148,55,0.3)]"
                >
                  닫기
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#1a1a1a]">회고</h1>
        {!isWriting && (
          <button
            onClick={() => setWriteMode("guided")}
            className="bg-brand-primary rounded-full px-4 py-2 text-sm font-bold text-white shadow-[0_4px_12px_rgba(255,148,55,0.3)]"
          >
            회고 쓰기
          </button>
        )}
      </div>

      {/* 작성 폼 */}
      <AnimatePresence>
        {isWriting && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-1 flex-col gap-5 overflow-y-auto rounded-2xl border border-white/50 bg-white/65 px-5 py-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)] backdrop-blur-lg"
          >
            {/* 모드 선택 탭 */}
            <div className="flex gap-2 rounded-[0.75rem] bg-[#f5f5f5] p-1">
              <button
                onClick={() => setWriteMode("guided")}
                className={`flex-1 rounded-[0.625rem] py-2.5 text-sm font-semibold transition-all ${
                  writeMode === "guided"
                    ? "bg-white text-[#1a1a1a] shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
                    : "text-[#999999]"
                }`}
              >
                질문으로 회고하기
              </button>
              <button
                onClick={() => setWriteMode("free")}
                className={`flex-1 rounded-[0.625rem] py-2.5 text-sm font-semibold transition-all ${
                  writeMode === "free"
                    ? "bg-white text-[#1a1a1a] shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
                    : "text-[#999999]"
                }`}
              >
                자유롭게 작성하기
              </button>
            </div>

            {/* 감정 변화 선택 */}
            <div className="flex flex-col gap-2.5">
              <span className="text-sm font-semibold text-[#1a1a1a]">
                퀘스트 후 기분이 어때요?
              </span>
              <div className="flex gap-2">
                {EMOTION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedEmotion(opt.value)}
                    className={`flex flex-1 flex-col items-center gap-1.5 rounded-[0.875rem] py-3 text-sm font-medium transition-all ${
                      selectedEmotion === opt.value
                        ? "bg-[#fff5e9] text-[#c8a96e] shadow-[0_0_0_1.5px_#e8c97a]"
                        : "bg-[#f8f8f8] text-[#999999]"
                    }`}
                  >
                    <opt.Icon size={20} strokeWidth={1.8} color={opt.color} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 질문 가이드 모드 */}
            <AnimatePresence mode="wait">
              {writeMode === "guided" && (
                <motion.div
                  key="guided"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col gap-4"
                >
                  <p className="text-xs text-[#b5b5b5]">
                    하나 이상 작성해주세요
                  </p>
                  {GUIDED_QUESTIONS.map((q, i) => (
                    <div key={i} className="flex flex-col gap-1.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-[#1a1a1a]">
                          {q.question}
                        </span>
                        <span className="text-xs text-[#b5b5b5]">{q.sub}</span>
                      </div>
                      <textarea
                        value={guidedAnswers[i]}
                        onChange={(e) => updateGuidedAnswer(i, e.target.value)}
                        placeholder={q.placeholder}
                        rows={2}
                        className="resize-none rounded-[0.875rem] bg-[#f8f8f8] px-4 py-3 text-sm leading-relaxed text-[#1a1a1a] outline-none placeholder:text-[#cccccc] focus:ring-1 focus:ring-[#e8c97a]"
                      />
                    </div>
                  ))}
                </motion.div>
              )}

              {/* 자유 작성 모드 */}
              {writeMode === "free" && (
                <motion.div
                  key="free"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col gap-2"
                >
                  <span className="text-sm font-semibold text-[#1a1a1a]">
                    오늘을 돌아보며
                  </span>
                  <textarea
                    value={freeText}
                    onChange={(e) => setFreeText(e.target.value)}
                    placeholder="느낀 점, 깨달은 것, 다음에 해보고 싶은 것..."
                    rows={5}
                    className="resize-none rounded-[0.875rem] bg-[#f8f8f8] px-4 py-3 text-sm leading-relaxed text-[#1a1a1a] outline-none placeholder:text-[#cccccc] focus:ring-1 focus:ring-[#e8c97a]"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 버튼 — 폼 바깥 하단 고정 */}
      {isWriting && (
        <div className="flex shrink-0 gap-2">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit()}
            className="bg-brand-primary flex-1 rounded-full py-3 text-sm font-bold text-white shadow-[0_4px_12px_rgba(255,148,55,0.3)] transition-opacity disabled:opacity-40"
          >
            저장하기
          </button>
          <button
            onClick={resetForm}
            className="rounded-full bg-[#f0f0f0] px-5 py-3 text-sm font-medium text-[#bbbbbb] transition-colors hover:text-[#999999]"
          >
            취소
          </button>
        </div>
      )}

      {/* 회고 목록 — 작성 중에는 숨김 */}
      {!isWriting && (
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
          {entries.length === 0 && (
            <div className="flex flex-1 items-center justify-center">
              <span className="text-sm font-medium text-[#bbbbbb]">
                아직 회고가 없어요
              </span>
            </div>
          )}

          {entries.map((entry) => {
            const after = emotionLabel(entry.emotionAfter);
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex min-h-[7.5rem] flex-col gap-3 rounded-2xl border border-white/50 bg-white/65 px-5 py-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)] backdrop-blur-lg"
              >
                {/* 상단: 날짜 + 감정 변화 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#b5b5b5]">{entry.date}</span>
                    <span className="text-[#d9d9d9]">·</span>
                    <span className="text-xs font-medium text-[#c8a96e]">
                      {entry.questTitle}
                    </span>
                  </div>
                  {after && (
                    <span className="rounded-full bg-[#fff5e9] px-2.5 py-1 text-xs font-medium text-[#c8a96e]">
                      {after.label}
                    </span>
                  )}
                </div>

                {/* 감정 흐름 */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="rounded-full bg-[#f5f5f5] px-2.5 py-1 font-medium text-[#999999]">
                    {entry.emotionBefore}
                  </span>
                  <ArrowRight size={16} strokeWidth={1.8} color="#d4d4d4" />
                  {after && (
                    <span className="rounded-full bg-[#fff5e9] px-2.5 py-1 font-medium text-[#c8a96e]">
                      {after.label}
                    </span>
                  )}
                </div>

                {/* 회고 텍스트 */}
                <p className="text-sm leading-relaxed whitespace-pre-line text-[#555555]">
                  {entry.text}
                </p>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
