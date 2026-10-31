import Link from "next/link";
import PlanForm from "../PlanForm";

export default function NewPlanPage() {
  return (
    <div className="p-6 max-w-3xl">
      <Link href="/admin/plans" className="text-sm text-blue-600 hover:underline">
        ← Back to plans
      </Link>
      <h1 className="text-2xl font-semibold text-gray-900 mt-2 mb-6">Add plan</h1>
      <PlanForm />
    </div>
  );
}