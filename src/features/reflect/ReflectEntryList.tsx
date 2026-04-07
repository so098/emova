"use client";

import { useCallback } from "react";
import { Virtuoso } from "react-virtuoso";
import { useReflections } from "./useReflections";
import ReflectEntryCard from "./ReflectEntryCard";
import type { Reflection } from "@/lib/supabase/reflectionApi";

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-6">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
    </div>
  );
}

function SkeletonCards() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-surface-elevated h-[7.5rem] animate-pulse rounded-2xl" />
      ))}
    </div>
  );
}

interface ReflectEntryListProps {
  scrollParent: HTMLElement | null;
  onEdit: (entry: Reflection) => void;
  onDelete: (id: string) => void;
}

export default function ReflectEntryList({ scrollParent, onEdit, onDelete }: ReflectEntryListProps) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useReflections();

  const entries = data?.pages.flatMap((page) => page.data) ?? [];

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <SkeletonCards />;

  if (entries.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className="text-sm font-medium text-text-subtle">아직 회고가 없어요</span>
      </div>
    );
  }

  if (!scrollParent) return <SkeletonCards />;

  return (
    <Virtuoso
      customScrollParent={scrollParent}
      data={entries}
      overscan={0}
      endReached={handleEndReached}
      itemContent={(_index, entry) => (
        <div className="pb-3">
          <ReflectEntryCard entry={entry} onEdit={onEdit} onDelete={onDelete} />
        </div>
      )}
      components={{
        Footer: () =>
          isFetchingNextPage ? <LoadingSpinner /> : null,
      }}
    />
  );
}
