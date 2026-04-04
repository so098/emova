"use client";

import { createContext, useContext, useCallback, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Toast {
  id: number;
  message: string;
  sub: string;
}

interface ToastContextValue {
  showToast: (message: string, sub: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const showToast = useCallback((message: string, sub: string) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, message, sub }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastOverlay toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

/** 토스트를 퀘스트 리스트 오른쪽에 위→아래 순으로 표시 */
function ToastOverlay({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: number) => void;
}) {
  return (
    <div className="pointer-events-none fixed inset-0 z-[200] flex justify-center">
      {/* 퀘스트 리스트와 같은 max-width 기준으로 오른쪽에 배치 */}
      <div className="relative w-full max-w-(--ui-content-width)">
        <div className="absolute top-28 -right-[13.5rem] flex w-[12rem] flex-col gap-2 max-lg:-right-0 max-lg:left-1/2 max-lg:top-20 max-lg:w-auto max-lg:-translate-x-1/2">
          <AnimatePresence>
            {toasts.map((toast) => (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: -12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                onClick={() => onRemove(toast.id)}
                className="pointer-events-auto flex cursor-pointer flex-col gap-0.5 rounded-[0.875rem] bg-surface px-4 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.1)]"
              >
                <span className="text-sm font-bold text-text-primary">
                  {toast.message}
                </span>
                {toast.sub && (
                  <span className="text-xs text-text-muted">{toast.sub}</span>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
