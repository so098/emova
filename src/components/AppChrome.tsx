"use client";

import { usePathname } from "next/navigation";
import NavMenu from "@/components/NavMenu";
import BottomBar from "@/components/BottomBar";
import UserHUD from "@/components/UserHUD";
import NotificationBell from "@/components/NotificationBell";
import ShopButton from "@/components/ShopButton";
import CurrencyHUD from "@/components/CurrencyHUD";
import {
  HIDE_NAV_ROUTES,
  HIDE_BOTTOM_BAR_ROUTES,
  ROUTES,
} from "@/constants/routes";
import SkipLink from "@/components/SkipLink";
import ThemeToggle from "@/components/ThemeToggle";
import SessionSidePanel from "@/features/home/SessionSidePanel";

const MOVA_ROUTES = [ROUTES.HOME, ROUTES.EMOTION, ROUTES.QUESTION, ROUTES.RECOMMEND];

export default function AppChrome() {
  const pathname = usePathname();
  const hideNav = HIDE_NAV_ROUTES.includes(pathname);
  const hideBottomBar = hideNav || HIDE_BOTTOM_BAR_ROUTES.includes(pathname);

  return (
    <>
      {/* 헤더 — 고정 높이, 콘텐츠 밀어내기 */}
      <header className="sticky top-0 z-30 mx-auto flex h-(--ui-header-height) w-full max-w-[60rem] shrink-0 items-center justify-between px-6">
        <div className="shrink-0">
          <UserHUD />
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <CurrencyHUD />
          <ShopButton />
          <NotificationBell />
        </div>
      </header>
      {!hideNav && <NavMenu />}
      {!hideBottomBar && <BottomBar />}
      {pathname.startsWith(ROUTES.QUESTION) && (
        <div className="fixed bottom-[7rem] left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2">
          {pathname !== ROUTES.QUESTION && (
            <SkipLink href={ROUTES.QUESTION} label="질문 다시 고르기" />
          )}
          <SkipLink href={ROUTES.RECOMMEND} />
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
