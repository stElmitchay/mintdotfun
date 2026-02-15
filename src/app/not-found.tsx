import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-6xl font-bold text-zinc-700">404</h1>
      <p className="text-lg text-zinc-400">Page not found.</p>
      <Link
        href="/"
        className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-500"
      >
        Go Home
      </Link>
    </div>
  );
}
