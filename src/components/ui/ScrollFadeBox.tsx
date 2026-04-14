"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface ScrollFadeBoxProps {
  children: ReactNode;
  className?: string;
}

export default function ScrollFadeBox({ children, className = "" }: ScrollFadeBoxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [canScrollDown, setCanScrollDown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      setCanScrollDown(scrollHeight - scrollTop - clientHeight > 1);
    };

    update();
    el.addEventListener("scroll", update, { passive: true });

    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(el);

    const mutationObserver = new MutationObserver(update);
    mutationObserver.observe(el, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });

    return () => {
      el.removeEventListener("scroll", update);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  const fadeClass = canScrollDown
    ? "mask-[linear-gradient(to_bottom,black_calc(100%-2rem),transparent)] [-webkit-mask-image:linear-gradient(to_bottom,black_calc(100%-2rem),transparent)]"
    : "";

  return (
    <div
      ref={ref}
      className={`overflow-y-auto overscroll-contain pr-1 ${fadeClass} ${className}`}
    >
      {children}
    </div>
  );
}
