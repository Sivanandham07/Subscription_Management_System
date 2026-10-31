export default function Loading() {
  return (
    <div className="p-6 max-w-5xl animate-pulse">
      <div className="h-8 w-56 bg-gray-200 rounded mb-6" />
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="h-5 bg-gray-200 rounded" />
        <div className="h-5 bg-gray-200 rounded" />
        <div className="h-5 bg-gray-200 rounded" />
        <div className="h-5 bg-gray-200 rounded" />
      </div>
    </div>
  );
}