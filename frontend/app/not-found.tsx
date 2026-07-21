import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex h-dvh flex-col items-center justify-center bg-[#F9FAFB] px-6 text-center">
      <p className="text-kmecca text-sm font-bold tracking-[0.2em]">K-MECCA</p>
      <h1 className="mt-4 text-7xl font-bold text-[#1E2939]">404</h1>
      <h2 className="mt-4 text-xl font-semibold text-[#1E2939]">페이지를 찾을 수 없어요</h2>
      <p className="mt-2 text-sm leading-6 text-[#6A7282]">
        요청하신 페이지가 사라졌거나
        <br />
        주소가 변경되었을 수 있습니다.
      </p>

      <Link
        href="/"
        className="bg-kmecca mt-8 w-full max-w-72 rounded-md px-5 py-4 text-sm font-semibold text-[#1E2939]">
        홈으로 돌아가기
      </Link>
    </main>
  );
}
