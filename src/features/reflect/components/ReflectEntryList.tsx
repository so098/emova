"use client";

import { useReflections } from "../hooks/useReflections";
import ReflectEntryCard from "./ReflectEntryCard";
import type { Reflection } from "@/lib/supabase/reflectionApi";

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
  onEdit: (entry: Reflection) => void;
  onDelete: (id: string) => void;
}

export default function ReflectEntryList({ onEdit, onDelete }: ReflectEntryListProps) {
  const { data, isLoading } = useReflections();
  const entries = Array.isArray(data) ? data : [];

  if (isLoading) return <SkeletonCards />;

  if (entries.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className="text-sm font-medium text-text-subtle">아직 회고가 없어요</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {entries.map((entry) => (
        <ReflectEntryCard key={entry.id} entry={entry} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
