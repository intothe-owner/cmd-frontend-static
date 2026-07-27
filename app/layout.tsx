import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "제로브이",
  description: "제로브이 웹사이트",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <Script src="/runtime-config.js" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
