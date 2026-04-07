"use client";

import { useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { ROUTES } from "@/constants/routes";

export default function ShopButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(ROUTES.SHOP)}
      className="relative flex h-8 w-8 items-center justify-center rounded-full border border-border-default/60 transition-opacity hover:opacity-80"
      style={{ background: "var(--brand-deco-circle)" }}
    >
      <ShoppingBag size={14} color="var(--ui-button-primary)" strokeWidth={2.2} />
    </button>
  );
}
