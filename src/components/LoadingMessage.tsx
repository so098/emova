"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ROUTES } from "@/constants/routes";
import { useProgressStore } from "@/store/progressStore";

interface LoadingMessageProps {
  message: string;
  redirectTo?: string;
  delay?: number; // ms
}

export default function LoadingMessage({
  message,
  redirectTo = ROUTES.QUESTION,
  delay = 2500,
}: LoadingMessageProps) {
  const router = useRouter();
  const advance = useProgressStore((s) => s.advance);

  useEffect(() => {
    const timer = setTimeout(() => {
      advance();
      router.push(redirectTo);
    }, delay);
    return () => clearTimeout(timer);
  }, [router, redirectTo, delay, advance]);

  return (
    <div className="flex flex-col items-center gap-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
        className="h-12 w-12 rounded-full border-[3px] border-brand-deco border-t-brand-primary"
      />

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="max-w-[22rem] text-center text-base font-semibold leading-relaxed text-[#3a3a3a]"
      >
        {message}
      </motion.p>
    </div>
  );
}
