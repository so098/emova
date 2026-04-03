"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useProgressStore } from "@/store/progressStore";
import { useSessionStore } from "@/store/sessionStore";
import { ROUTES } from "@/constants/routes";

const TOTAL = 4;

export default function BottomBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { filled, next, advance } = useProgressStore();
  const { questionLabel, questionText } = useSessionStore();

  const isQuestionDetail = pathname.startsWith(ROUTES.QUESTION) && pathname !== ROUTES.QUESTION;
  const buttonLabel = isQuestionDetail ? "다 작성했어요" : "다 골랐어요";

  const handleClick = () => {
    const params = new URLSearchParams(searchParams.toString());

    if (isQuestionDetail) {
      advance();
      params.set("q", questionLabel);
      params.set("t", questionText);
      router.push(`${ROUTES.RECOMMEND}?${params.toString()}`);
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
            style={{ background: i < filled ? "var(--brand-logo)" : "#e5e5e5" }}
          />
        ))}
      </div>

      {/* 버튼 */}
      <button
        onClick={handleClick}
        className="h-[2.875rem] w-full rounded-xl bg-brand-primary text-sm font-semibold text-white transition-opacity hover:opacity-85"
      >
        {buttonLabel}
      </button>
    </div>
  );
}
