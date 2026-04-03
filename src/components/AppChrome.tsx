"use client";

import { usePathname } from "next/navigation";
import NavMenu from "@/components/NavMenu";
import BottomBar from "@/components/BottomBar";
import UserHUD from "@/components/UserHUD";
import NotificationBell from "@/components/NotificationBell";
import EmotionGauge from "@/components/EmotionGauge";
import { HIDE_NAV_ROUTES, HIDE_BOTTOM_BAR_ROUTES, ROUTES } from "@/constants/routes";
import SkipLink from "@/components/SkipLink";

export default function AppChrome() {
  const pathname = usePathname();
  const hideNav = HIDE_NAV_ROUTES.includes(pathname);
  const hideBottomBar = hideNav || HIDE_BOTTOM_BAR_ROUTES.includes(pathname);

  return (
    <>
      <h1 className="absolute left-1/2 top-6 -translate-x-1/2 text-2xl font-bold text-brand-logo">
        emova
      </h1>
      <div className="absolute left-6 top-5">
        <UserHUD />
      </div>
      <div className="absolute right-6 top-6 flex items-center gap-2">
        <NotificationBell />
        <EmotionGauge value={40} label="모바 감정이해도" />
      </div>
      {!hideNav && <NavMenu />}
      {!hideBottomBar && <BottomBar />}
      {pathname.startsWith(ROUTES.QUESTION) && (
        <div className="absolute bottom-[7rem] left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
          {pathname !== ROUTES.QUESTION && (
            <SkipLink href={ROUTES.QUESTION} label="질문 다시 고르기" />
          )}
          <SkipLink href={ROUTES.HOME} />
        </div>
      )}
    </>
  );
}
