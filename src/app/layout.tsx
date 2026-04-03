import { Suspense } from "react";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import AppChrome from "@/components/AppChrome";

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
        <div className="relative z-10 mx-auto min-h-dvh">
          {/* 고정 UI — 페이지 전환 시 유지 */}
          <Suspense>
            <AppChrome />
          </Suspense>

          {/* 페이지별 가운데 콘텐츠 */}
          <Suspense>{children}</Suspense>
        </div>
      </body>
    </html>
  );
}
