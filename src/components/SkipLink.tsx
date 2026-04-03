"use client";

import { useRouter } from "next/navigation";

interface SkipLinkProps {
  label?: string;
  href: string;
  onBeforeNavigate?: () => void;
}

export default function SkipLink({
  label = "지금 생각 안 나요. 다음으로 넘어갈게요",
  href,
  onBeforeNavigate,
}: SkipLinkProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => {
        onBeforeNavigate?.();
        router.push(href);
      }}
      className="whitespace-nowrap text-sm text-[#aaaaaa] transition-colors hover:text-brand-primary"
    >
      {label}
    </button>
  );
}
