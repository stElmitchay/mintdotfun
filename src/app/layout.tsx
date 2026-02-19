import type { Metadata } from "next";
import "./globals.css";
import PrivyProvider from "@/components/providers/PrivyProvider";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SmoothScroll from "@/components/effects/SmoothScroll";

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
          <SmoothScroll>
            <div className="min-h-screen bg-gray-1 text-gray-12 overflow-x-hidden">
              <div className="relative z-10">
                <Header />
                <main className="min-h-[calc(100vh-4rem)]">{children}</main>
                <Footer />
              </div>
            </div>
          </SmoothScroll>
        </PrivyProvider>
      </body>
    </html>
  );
}
