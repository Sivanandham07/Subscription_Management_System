export default function Loading() {
  return (
    <div className="p-6 max-w-5xl animate-pulse">
      <div className="h-8 w-40 bg-gray-200 rounded mb-6" />
      <div className="h-10 w-72 bg-gray-200 rounded mb-4" />
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="h-6 bg-gray-100 rounded" />
        <div className="h-6 bg-gray-100 rounded" />
        <div className="h-6 bg-gray-100 rounded" />
        <div className="h-6 bg-gray-100 rounded" />
      </div>
    </div>
  );
}