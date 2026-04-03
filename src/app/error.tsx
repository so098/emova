"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-white px-4">
      <p className="text-[5rem] font-bold leading-none text-brand-logo">오류</p>
      <div className="flex flex-col items-center gap-2">
        <p className="text-lg font-bold text-[#1a1a1a]">문제가 발생했어요</p>
        <p className="text-sm text-[#999999]">잠시 후 다시 시도해주세요</p>
      </div>
      <button
        onClick={reset}
        className="rounded-full bg-brand-primary px-6 py-3 text-sm font-bold text-white"
      >
        다시 시도하기
      </button>
    </main>
  );
}
