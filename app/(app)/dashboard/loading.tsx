export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6 bg-gray-50 p-6">
      <div className="h-8 w-56 rounded bg-gray-200" />
      <div className="h-16 rounded-xl bg-gray-200" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} className="h-24 rounded-xl bg-gray-200" />
        ))}
      </div>
      <div className="h-72 rounded-xl bg-gray-200" />
    </div>
  );
}