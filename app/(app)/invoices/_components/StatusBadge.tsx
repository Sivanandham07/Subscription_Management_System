const styles: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  confirmed: "bg-blue-100 text-blue-700",
  partially_paid: "bg-amber-100 text-amber-700",
  overdue: "bg-red-100 text-red-700",
  paid: "bg-green-100 text-green-700",
  cancelled: "bg-gray-200 text-gray-500",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${styles[status] ?? "bg-gray-100"}`}>
      {status.replace("_", " ")}
    </span>
  );
}