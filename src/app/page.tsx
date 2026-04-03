import GridSection from "@/features/home/GridSection";
import ResetOnMount from "@/features/home/ResetOnMount";

export default function RootPage() {
  return (
    <main className="flex flex-1 items-center justify-center pb-[var(--ui-bottom-bar-height)]">
      <ResetOnMount />
      <GridSection />
    </main>
  );
}
