"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 pt-24">
      <h1 className="text-4xl font-bold text-white">Something went wrong</h1>
      <p className="max-w-md text-center text-gray-400">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        onClick={reset}
        className="bg-gradient-primary px-6 py-3 rounded-full text-white font-semibold hover:shadow-neon transition-all"
      >
        Try Again
      </button>
    </div>
  );
}
