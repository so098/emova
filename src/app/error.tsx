"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppError } from "@/lib/errors";

export default function Error({
  error,
}: {
  error: Error & { digest?: string };
}) {
  const router = useRouter();

  useEffect(() => {
    if (error instanceof AppError) {
      console.error(`[AppError] ${error.code}:`, error.message);
    } else {
      console.error("[UnhandledError]:", error);
    }
    router.replace("/");
  }, [error, router]);

  return null;
}
