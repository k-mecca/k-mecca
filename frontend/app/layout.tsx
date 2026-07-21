import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const pretendard = localFont({
  src: "../public/font/PretendardVariable.woff2",
  display: "swap",
  weight: "100 900",
  variable: "--font-pretendard",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "K-MECCA",
  description: "상품 인식으로 재고·가격 확인까지 도와주는 쇼핑 어시스턴트",
  openGraph: {
    title: "K-MECCA",
    description: "상품 인식으로 재고·가격 확인까지 도와주는 쇼핑 어시스턴트",
    images: [
      {
        url: "/images/k-mecca.png",
        width: 1200,
        height: 630,
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${pretendard.variable} h-full antialiased`}>
      <body
        suppressHydrationWarning
        className={`mx-auto h-screen w-full max-w-[400px] ${pretendard.className}`}>
        {children}
      </body>
    </html>
  );
}
