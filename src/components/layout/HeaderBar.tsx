"use client";

import UserHUD from "@/components/nav/UserHUD";
import CurrencyHUD from "@/components/nav/CurrencyHUD";
import ShopButton from "@/components/nav/ShopButton";
import NotificationBell from "@/components/nav/NotificationBell";

export default function HeaderBar() {
  return (
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
  );
}
