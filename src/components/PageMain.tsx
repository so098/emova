export default function PageMain({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-24">
      {children}
    </main>
  );
}
