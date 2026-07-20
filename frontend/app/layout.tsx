import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body
        suppressHydrationWarning
        className="mx-auto h-screen w-full max-w-[400px]">
        {children}
      </body>
    </html>
  );
}
