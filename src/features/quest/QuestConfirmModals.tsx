"use client";

import { motion, AnimatePresence } from "framer-motion";

interface ConvertModalProps {
  targetId: string | null;
  onConfirm: (id: string) => void;
  onCancel: () => void;
}

export function ConvertToShortModal({
  targetId,
  onConfirm,
  onCancel,
}: ConvertModalProps) {
  return (
    <AnimatePresence>
      {targetId && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 z-40 bg-black/30"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="bg-surface fixed inset-x-4 top-1/2 z-50 mx-auto flex max-w-[24rem] -translate-y-1/2 flex-col gap-5 rounded-2xl px-5 pt-6 pb-5 shadow-[0_8px_32px_rgba(0,0,0,0.15)]"
          >
            <p className="text-sm leading-relaxed font-medium text-[#333333]">
              현재 관련 단기 퀘스트가 있습니다.
              <br />
              <br />
              <span className="text-text-muted">
                장기 퀘스트를 단기로 변경 시, 연결된 단기 퀘스트들은 전체
                해제되어 별도 단기 퀘스트로 변경됩니다.
              </span>
              <br />
              <br />
              변경하시겠습니까?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => onConfirm(targetId)}
                className="bg-brand-primary text-on-accent flex-1 rounded-full py-3 text-sm font-bold"
              >
                네
              </button>
              <button
                onClick={onCancel}
                className="text-text-secondary flex-1 rounded-full bg-[#f0f0f0] py-3 text-sm font-bold"
              >
                아니요
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface DeleteModalProps {
  targetId: string | null;
  hasChildren: boolean;
  onDetachAndDelete: (id: string) => void;
  onDeleteAll: (id: string) => void;
  onCancel: () => void;
}

export function DeleteQuestModal({
  targetId,
  hasChildren,
  onDetachAndDelete,
  onDeleteAll,
  onCancel,
}: DeleteModalProps) {
  return (
    <AnimatePresence>
      {targetId && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 z-40 bg-black/30"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="bg-surface fixed inset-x-4 top-1/2 z-50 mx-auto flex max-w-[24rem] -translate-y-1/2 flex-col gap-5 rounded-2xl px-5 pt-6 pb-5 shadow-[0_8px_32px_rgba(0,0,0,0.15)]"
          >
            <p className="text-sm leading-relaxed font-medium text-[#333333]">
              {hasChildren ? (
                <>
                  장기 퀘스트 삭제 시 단기 퀘스트은 해제되어
                  별도 단기 퀘스트으로 변경하시겠어요?
                  <br />
                  아니면 단기 퀘스트도 같이 삭제하시겠어요?
                </>
              ) : (
                "정말 삭제하시겠습니까?"
              )}
            </p>
            <div className="flex gap-2">
              {hasChildren ? (
                <>
                  <button
                    onClick={() => onDetachAndDelete(targetId)}
                    className="bg-brand-primary text-on-accent flex-1 rounded-full py-3 text-sm font-bold"
                  >
                    단기 퀘스트 별도 관리
                  </button>
                  <button
                    onClick={() => onDeleteAll(targetId)}
                    className="flex-1 rounded-full bg-[#ffe5e5] py-3 text-sm font-bold text-[#e04040]"
                  >
                    단기 퀘스트 포함 삭제
                  </button>
                  <button
                    onClick={onCancel}
                    className="text-text-secondary flex-1 rounded-full bg-[#f0f0f0] py-3 text-sm font-bold"
                  >
                    취소
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => onDetachAndDelete(targetId)}
                    className="bg-brand-primary text-on-accent flex-1 rounded-full py-3 text-sm font-bold"
                  >
                    예
                  </button>
                  <button
                    onClick={onCancel}
                    className="text-text-secondary flex-1 rounded-full bg-[#f0f0f0] py-3 text-sm font-bold"
                  >
                    아니오
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface RestoreModalProps {
  target: { id: string } | null;
  onRestore: (id: string) => void;
  onAddAsNew: (id: string) => void;
  onCancel: () => void;
}

export function RestoreModal({
  target,
  onRestore,
  onAddAsNew,
  onCancel,
}: RestoreModalProps) {
  return (
    <AnimatePresence>
      {target && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 z-40 bg-black/30"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="bg-surface fixed inset-x-4 top-1/2 z-50 mx-auto flex max-w-[24rem] -translate-y-1/2 flex-col gap-5 rounded-2xl px-5 pt-6 pb-5 shadow-[0_8px_32px_rgba(0,0,0,0.15)]"
          >
            <p className="text-sm leading-relaxed font-medium text-[#333333]">
              새로 생성하시겠어요, 기존 것을 복원하시겠어요?
              <br />
              <span className="text-text-muted">
                복원 시 받은 보상은 취소됩니다.
              </span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => onRestore(target.id)}
                className="bg-brand-primary text-on-accent flex-1 rounded-full py-3 text-sm font-bold"
              >
                복원하기
              </button>
              <button
                onClick={() => onAddAsNew(target.id)}
                className="text-text-secondary flex-1 rounded-full bg-[#f0f0f0] py-3 text-sm font-bold"
              >
                새로 생성하기
              </button>
              <button
                onClick={onCancel}
                className="text-text-secondary flex-1 rounded-full bg-[#f0f0f0] py-3 text-sm font-bold"
              >
                취소
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
