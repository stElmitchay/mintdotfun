"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-white antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
          <h1 className="text-4xl font-bold text-zinc-300">Something went wrong</h1>
          <p className="max-w-md text-center text-sm text-zinc-500">
            {error.message || "A critical error occurred."}
          </p>
          <button
            onClick={reset}
            className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-500"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
