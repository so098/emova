"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useProgressStore } from "@/store/progressStore";
import { useSessionStore } from "@/store/sessionStore";
import { ROUTES } from "@/constants/routes";
import { useSaveEmotion } from "@/features/flow/useFlowMutations";
import { useToast } from "@/components/feedback/ToastStack";
import PrimaryButton from "@/components/ui/PrimaryButton";

const TOTAL = 4;

export default function BottomBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { filled, next, advance } = useProgressStore();
  const { selectedGrid, questionLabel, questionText, selectedEmotion, supabaseSessionId } = useSessionStore();
  const saveEmotion = useSaveEmotion();
  const { showToast } = useToast();

  const isEmotionPage = pathname === ROUTES.EMOTION;
  const isQuestionRoute = pathname.startsWith(ROUTES.QUESTION);
  const isQuestionList = pathname === ROUTES.QUESTION;

  const isHomePage = pathname === ROUTES.HOME;
  const needsSelection =
    (isHomePage && !selectedGrid) || (isEmotionPage && !selectedEmotion);

  const handleClick = () => {
    if (needsSelection) {
      showToast("선택해주세요", "");
      return;
    }
    const params = new URLSearchParams(searchParams.toString());

    // 감정 페이지 → DB 저장
    if (isEmotionPage && supabaseSessionId && selectedEmotion) {
      saveEmotion.mutate({ sessionId: supabaseSessionId, key: selectedEmotion });
    }

    if (isQuestionRoute) {
      advance();
      if (questionLabel) params.set("q", questionLabel);
      if (questionText) params.set("t", questionText);
      const qs = params.toString();
      router.push(qs ? `${ROUTES.RECOMMEND}?${qs}` : ROUTES.RECOMMEND);
      return;
    }
    const destination = next();
    advance();
    const qs = params.toString();
    router.push(qs ? `${destination}?${qs}` : destination);
  };

  return (
    <div className="fixed bottom-8 left-1/2 z-20 flex w-full max-w-(--ui-content-width) -translate-x-1/2 px-4 flex-col gap-3">
      {/* 인디케이터 선 4개 */}
      <div className="flex w-full gap-2">
        {Array.from({ length: TOTAL }).map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-colors duration-500"
            style={{ background: i < filled ? "var(--point-color)" : "var(--border-default)" }}
          />
        ))}
      </div>

      {/* 버튼 */}
      {isQuestionList ? (
        <button
          onClick={() => router.push(ROUTES.RECOMMEND)}
          className="h-[2.875rem] w-full rounded-xl border border-border-default bg-surface text-sm text-text-secondary transition-colors hover:bg-surface-elevated hover:text-text-primary"
        >
          오늘은 이만 넘어갈게요
        </button>
      ) : isQuestionRoute ? (
        <PrimaryButton onClick={handleClick} className="w-full">
          다 했어요
        </PrimaryButton>
      ) : (
        <PrimaryButton onClick={handleClick} className="w-full">
          다 골랐어요
        </PrimaryButton>
      )}
    </div>
  );
}
