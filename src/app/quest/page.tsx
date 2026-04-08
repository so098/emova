import { Suspense } from "react";
import QuestPage from "@/features/quest/components/QuestPage";

function QuestSkeleton() {
  return (
    <div className="flex w-full max-w-(--ui-content-width) flex-col gap-4">
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface-elevated h-[2.25rem] w-[4.5rem] animate-pulse rounded-full" />
        ))}
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-surface-elevated h-[4rem] animate-pulse rounded-2xl" />
      ))}
    </div>
  );
}

export default function QuestRoute() {
  return (
    <main className="flex flex-1 items-start justify-center px-4 pt-7 pb-8">
      <Suspense fallback={<QuestSkeleton />}>
        <QuestPage />
      </Suspense>
    </main>
  );
}
