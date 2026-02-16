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
      <h1 className="text-3xl font-bold text-white">Something went wrong</h1>
      <p className="max-w-md text-center text-gray-500 text-sm">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        onClick={reset}
        className="bg-primary px-6 py-3 rounded-full text-sm text-white font-medium hover:bg-primary-dark transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
