"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-6 max-w-5xl">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h2 className="font-semibold text-red-800">Something went wrong</h2>
        <p className="text-sm text-red-700 mt-1">{error.message}</p>
        <button
          onClick={reset}
          className="mt-3 px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}