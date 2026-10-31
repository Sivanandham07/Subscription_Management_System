"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-5">
      <h2 className="font-semibold text-red-700">Could not load staff</h2>
      <p className="mt-1 text-sm text-red-600">{error.message}</p>
      <button
        onClick={reset}
        className="mt-3 rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
      >
        Try again
      </button>
    </div>
  );
}