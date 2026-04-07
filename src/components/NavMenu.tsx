"use client";

import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Smile, Zap, BookOpen, User } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { useSessionStore } from "@/store/sessionStore";
import { useProgressStore } from "@/store/progressStore";
import ThemeToggle from "@/components/ThemeToggle";

const ITEMS = [
  { label: "모바",   Icon: Smile,    href: ROUTES.HOME },
  { label: "퀘스트", Icon: Zap,      href: ROUTES.QUEST },
  { label: "회고",   Icon: BookOpen, href: ROUTES.REFLECT },
  { label: "내 정보", Icon: User,    href: ROUTES.PROFILE },
];

const spring = { layout: { type: "spring" as const, stiffness: 380, damping: 28 } };

const MOVA_ROUTES = [ROUTES.HOME, ROUTES.EMOTION, ROUTES.QUESTION, ROUTES.RECOMMEND];

/** 현재 경로가 해당 메뉴 항목에 속하는지 판별 */
function isActive(href: string, pathname: string) {
  if (href === ROUTES.HOME) return MOVA_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
  // /quest와 /question 구분: 정확히 일치하거나 /quest/ 하위만 매칭
  return pathname === href || pathname.startsWith(href + "/");
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
          className="absolute inset-0 rounded-[0.875rem] bg-brand-primary"
          initial={false}
          transition={spring}
        />
      )}
      <span className="relative z-10 flex items-center gap-2.5">
        <Icon
          size={horizontal ? 18 : 16}
          strokeWidth={2.2}
          color={active ? "var(--on-accent)" : "var(--text-muted)"}
        />
        {!horizontal && (
          <span
            className="text-sm font-semibold"
            style={{ color: active ? "var(--on-accent)" : "var(--text-secondary)" }}
          >
            {label}
          </span>
        )}
      </span>
      {horizontal && (
        <span
          className="relative z-10 text-[0.625rem] font-bold"
          style={{ color: active ? "var(--on-accent)" : "var(--text-secondary)" }}
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

  const resetSession = useSessionStore((s) => s.reset);
  const resetProgress = useProgressStore((s) => s.reset);
  const handleClick = (href: string) => {
    if (href === "#") return;
    if (href === ROUTES.HOME) {
      resetSession();
      resetProgress();
    }
    router.push(href);
  };

  return (
    <>
      {/* 데스크톱: 왼쪽 세로 중앙 */}
      <div className="fixed left-[max(1rem,calc((100vw-60rem)/2+1rem))] top-1/2 z-20 hidden -translate-y-1/2 md:block">
        <div className="flex w-[11rem] flex-col gap-1 rounded-[1.25rem] border border-border-light bg-surface-glass-heavy p-2 backdrop-blur-xl">
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
        <div className="flex items-stretch border-t border-border-light bg-surface-glass-heavy px-2 pb-safe pt-1 backdrop-blur-xl">
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
          <div className="flex items-center justify-center px-2">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </>
  );
}
