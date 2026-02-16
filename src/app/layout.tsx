import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import PrivyProvider from "@/components/providers/PrivyProvider";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

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
      <body className={`${spaceGrotesk.variable} antialiased`}>
        <PrivyProvider>
          <div className="min-h-screen bg-surface-0 text-white overflow-x-hidden">
            {/* Ambient background — very subtle */}
            <div className="fixed inset-0 pointer-events-none">
              <div
                className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[160px] opacity-[0.04]"
                style={{ background: "#0D9488" }}
              />
              <div
                className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[140px] opacity-[0.03]"
                style={{ background: "#22D3EE" }}
              />
            </div>

            {/* Content */}
            <div className="relative z-10">
              <Header />
              <main className="min-h-[calc(100vh-4rem)]">{children}</main>
              <Footer />
            </div>
          </div>
        </PrivyProvider>
      </body>
    </html>
  );
}
