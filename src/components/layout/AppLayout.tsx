"use client";

import { usePathname } from "next/navigation";
import HeaderBar from "@/components/layout/HeaderBar";
import NavMenu from "@/components/layout/NavMenu";
import BottomBar from "@/components/layout/BottomBar";
import {
  HIDE_NAV_ROUTES,
  HIDE_BOTTOM_BAR_ROUTES,
  ROUTES,
} from "@/constants/routes";
import SkipLink from "@/components/nav/SkipLink";
import ThemeToggle from "@/components/ui/ThemeToggle";
import SessionSidePanel from "@/features/home/SessionSidePanel";

const MOVA_ROUTES = [ROUTES.HOME, ROUTES.EMOTION, ROUTES.QUESTION, ROUTES.RECOMMEND];

export default function AppLayout() {
  const pathname = usePathname();
  const hideNav = HIDE_NAV_ROUTES.includes(pathname);
  const hideBottomBar = hideNav || HIDE_BOTTOM_BAR_ROUTES.includes(pathname);

  return (
    <>
      {!hideNav && <HeaderBar />}
      {!hideNav && <NavMenu />}
      {!hideBottomBar && <BottomBar />}
      {pathname.startsWith(ROUTES.QUESTION) && pathname !== ROUTES.QUESTION && (
        <div className="fixed bottom-[7rem] left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2">
          <SkipLink href={ROUTES.QUESTION} label="질문 다시 고르기" />
        </div>
      )}
      {/* 모바 플로우 — 데스크톱 세션 사이드 패널 */}
      {MOVA_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/")) && (
        <div className="fixed top-1/2 right-[max(1.5rem,calc((100vw-60rem)/2-3rem))] z-10 hidden -translate-y-1/2 lg:block">
          <SessionSidePanel />
        </div>
      )}
      {/* 데스크톱 — 네비 메뉴 아래 정렬 */}
      <div className="fixed bottom-6 left-[max(1rem,calc((100vw-60rem)/2+1rem))] z-30 hidden md:block">
        <ThemeToggle />
      </div>
    </>
  );
}
