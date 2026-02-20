import type { Metadata } from "next";
import "./globals.css";
import PrivyProvider from "@/components/providers/PrivyProvider";
import LayoutShell from "@/components/layout/LayoutShell";

export const metadata: Metadata = {
  title: "MintAI - AI-Powered NFT Creator",
  description:
    "Describe your vision, let AI generate the art, and mint directly on Solana. From concept to NFT in minutes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="preload"
          href="/fonts/dd.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased">
        <PrivyProvider>
          <LayoutShell>{children}</LayoutShell>
        </PrivyProvider>
      </body>
    </html>
  );
}
