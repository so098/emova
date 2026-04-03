import { Suspense } from "react";
import QuestPage from "@/features/quest/QuestPage";

export default function QuestRoute() {
  return (
    <main className="flex flex-1 items-start justify-center px-4 pt-28 pb-8">
      <Suspense>
        <QuestPage />
      </Suspense>
    </main>
  );
}
