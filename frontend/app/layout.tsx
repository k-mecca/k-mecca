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
  title: "케이메카",
  description: "상품을 쉽게 찾게 해주는 서비스",
  openGraph: {
    title: "케이메카",
    description: "상품을 쉽게 찾게 해주는 서비스",
    images: [
      {
        url: "images/kmecca.png",
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
