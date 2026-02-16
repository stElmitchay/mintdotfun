import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 pt-24">
      <h1 className="text-6xl font-bold text-primary">404</h1>
      <p className="text-gray-500 text-sm">Page not found.</p>
      <Link
        href="/"
        className="bg-primary px-6 py-3 rounded-full text-sm text-white font-medium hover:bg-primary-dark transition-colors"
      >
        Go Home
      </Link>
    </div>
  );
}
