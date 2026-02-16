import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 pt-24">
      <h1 className="text-7xl font-bold text-gradient">404</h1>
      <p className="text-xl text-gray-400">Page not found.</p>
      <Link
        href="/"
        className="bg-gradient-primary px-6 py-3 rounded-full text-white font-semibold hover:shadow-neon transition-all"
      >
        Go Home
      </Link>
    </div>
  );
}
