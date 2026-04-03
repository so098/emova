"use client";

import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Smile, Zap, BookOpen } from "lucide-react";
import { ROUTES } from "@/constants/routes";

const ITEMS = [
  { label: "모바",   Icon: Smile,    href: ROUTES.HOME },
  { label: "퀘스트", Icon: Zap,      href: ROUTES.QUEST },
  { label: "회고",   Icon: BookOpen, href: "#" },
];

const spring = { layout: { type: "spring" as const, stiffness: 380, damping: 28 } };

/** 현재 경로가 해당 메뉴 항목에 속하는지 판별 */
function isActive(href: string, pathname: string) {
  if (href === ROUTES.HOME) return pathname === ROUTES.HOME;
  return pathname.startsWith(href);
}

function NavItem({
  label,
  Icon,
  active,
  layoutId,
  onClick,
  horizontal,
}: {
  label: string;
  Icon: React.ElementType;
  active: boolean;
  layoutId: string;
  onClick: () => void;
  horizontal?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2.5 transition-colors duration-200 ${
        horizontal
          ? "flex-1 flex-col justify-center py-2.5"
          : "w-full rounded-[0.875rem] px-4 py-3"
      }`}
    >
      {active && (
        <motion.div
          layoutId={layoutId}
          className="absolute inset-0 rounded-[0.875rem] bg-[linear-gradient(135deg,var(--brand-logo)_0%,var(--ui-button-primary)_100%)] shadow-[0_4px_14px_rgba(255,148,55,0.35)]"
          initial={false}
          transition={spring}
        />
      )}
      <span className="relative z-10 flex items-center gap-2.5">
        <Icon
          size={horizontal ? 18 : 16}
          strokeWidth={2.2}
          color={active ? "#ffffff" : "#888888"}
        />
        {!horizontal && (
          <span
            className="text-sm font-semibold"
            style={{ color: active ? "#ffffff" : "#666666" }}
          >
            {label}
          </span>
        )}
      </span>
      {horizontal && (
        <span
          className="relative z-10 text-[0.625rem] font-semibold"
          style={{ color: active ? "#ffffff" : "#666666" }}
        >
          {label}
        </span>
      )}
    </button>
  );
}

export default function NavMenu() {
  const router = useRouter();
  const pathname = usePathname();

  const handleClick = (href: string) => {
    if (href === "#") return;
    router.push(href);
  };

  return (
    <>
      {/* 데스크톱: 왼쪽 세로 중앙 */}
      <div className="fixed left-4 top-1/2 z-20 hidden -translate-y-1/2 md:block">
        <div className="flex w-[11rem] flex-col gap-1 rounded-[1.25rem] bg-white p-2 shadow-[0_4px_24px_rgba(0,0,0,0.07)]">
          {ITEMS.map(({ label, Icon, href }) => (
            <NavItem
              key={label}
              label={label}
              Icon={Icon}
              active={isActive(href, pathname)}
              layoutId="active-pill-desktop"
              onClick={() => handleClick(href)}
            />
          ))}
        </div>
      </div>

      {/* 태블릿/모바일: 하단 고정 */}
      <div className="fixed bottom-0 left-0 right-0 z-20 md:hidden">
        <div className="flex items-stretch bg-white px-2 pb-safe pt-1 shadow-[0_-2px_16px_rgba(0,0,0,0.06)]">
          {ITEMS.map(({ label, Icon, href }) => (
            <NavItem
              key={label}
              label={label}
              Icon={Icon}
              active={isActive(href, pathname)}
              layoutId="active-pill-mobile"
              onClick={() => handleClick(href)}
              horizontal
            />
          ))}
        </div>
      </div>
    </>
  );
}
