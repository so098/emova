export default function SectionTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl px-4 py-2 text-center text-sm font-bold text-[#3a3a3a]">
      {children}
    </div>
  );
}
