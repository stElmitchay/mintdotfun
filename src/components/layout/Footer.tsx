import { Twitter, Send, Github } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-dark-800 border-t border-white/5 py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-12">
          <div>
            <div className="text-2xl font-bold text-gradient mb-4">MintAI</div>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Create stunning AI-generated artwork and mint them as 1-of-1 NFTs
              on Solana. From concept to on-chain in minutes.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="p-2.5 bg-dark-700 hover:bg-primary rounded-full transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="p-2.5 bg-dark-700 hover:bg-primary rounded-full transition-colors"
              >
                <Send className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="p-2.5 bg-dark-700 hover:bg-primary rounded-full transition-colors"
              >
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Pages</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/create"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Create NFT
                </Link>
              </li>
              <li>
                <Link
                  href="/gallery"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Gallery
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Info</h3>
            <ul className="space-y-3">
              <li>
                <span className="text-gray-400 text-sm">
                  Built on Solana + Metaplex Core
                </span>
              </li>
              <li>
                <span className="text-gray-400 text-sm">
                  Images stored on Arweave
                </span>
              </li>
              <li>
                <span className="text-gray-400 text-sm">
                  AI powered by Replicate
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} MintAI. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a
              href="#"
              className="text-gray-500 hover:text-white text-sm transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-gray-500 hover:text-white text-sm transition-colors"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
