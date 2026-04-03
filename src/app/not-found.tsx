import Link from "next/link";

export default function NotFound() {
  return (
    <main className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-white px-4">
      <p className="text-[5rem] font-bold leading-none text-brand-logo">404</p>
      <div className="flex flex-col items-center gap-2">
        <p className="text-lg font-bold text-[#1a1a1a]">페이지를 찾을 수 없어요</p>
        <p className="text-sm text-[#999999]">주소가 잘못됐거나 삭제된 페이지예요</p>
      </div>
      <Link
        href="/"
        className="rounded-full bg-brand-primary px-6 py-3 text-sm font-bold text-white"
      >
        홈으로 돌아가기
      </Link>
    </main>
  );
}
