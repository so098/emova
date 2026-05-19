import { Suspense } from "react";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import AppLayout from "@/components/layout/AppLayout";
import AuthProvider from "@/components/providers/AuthProvider";
import QueryProvider from "@/components/providers/QueryProvider";
import { ToastProvider } from "@/components/feedback/ToastStack";
import RewardSync from "@/features/reward/RewardSync";
import Onboarding from "@/components/ui/Onboarding";

const pretendard = localFont({
  src: "../../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  display: "swap",
  weight: "45 920",
  variable: "--font-pretendard",
});

export const metadata: Metadata = {
  title: "Emova - 감정 기반 루틴 코칭",
  description: "감정을 시작점으로, 지금 할 수 있는 작은 루틴을 제안하는 코치",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body className="font-pretendard antialiased">
        <div className="noise-layer" aria-hidden="true" />
        <QueryProvider>
        <AuthProvider>
        <RewardSync />
        <ToastProvider>
          <div className="relative z-10 mx-auto flex min-h-dvh flex-col">
            {/* 고정 UI — 페이지 전환 시 유지 */}
            <Suspense>
              <AppLayout />
            </Suspense>

            {/* 페이지별 콘텐츠 — 헤더 아래 남은 공간 채움 */}
            <Suspense>
              <div className="flex flex-1 flex-col">{children}</div>
            </Suspense>
          </div>
        </ToastProvider>
        <Onboarding />
        </AuthProvider>
        </QueryProvider>
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-2 bg-background px-6 text-center lg:hidden">
          <p className="text-xl font-semibold">이 화면은 준비중이에요</p>
          <p className="text-sm opacity-60">데스크톱에서 접속해 주세요</p>
        </div>
      </body>
    </html>
  );
}
