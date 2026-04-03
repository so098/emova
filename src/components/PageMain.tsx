export default function PageMain({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 pb-[var(--ui-bottom-bar-height)]">
      {children}
    </main>
  );
}
