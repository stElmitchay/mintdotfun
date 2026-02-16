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
          <div className="min-h-screen bg-dark-900 text-white overflow-x-hidden">
            {/* Fixed Background Orbs */}
            <div className="fixed inset-0 pointer-events-none">
              <div className="absolute top-20 left-10 w-72 h-72 bg-accent-purple/15 rounded-full blur-3xl animate-float" />
              <div className="absolute top-40 right-20 w-96 h-96 bg-accent-cyan/10 rounded-full blur-3xl" />
              <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-float" />
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
