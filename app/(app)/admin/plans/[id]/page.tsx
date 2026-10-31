import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "../../../../../lib/supabase/server";
import PlanForm from "../PlanForm";

export default async function EditPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: plan, error } = await supabase
    .from("plans")
    .select(
      "id, name, price, billing_period, min_quantity, start_date, end_date, auto_close, allow_close, allow_pause, allow_renew"
    )
    .eq("id", id)
    .maybeSingle();

  if (error && error.code !== "22P02") throw new Error(error.message);
  if (!plan) notFound();

  return (
    <div className="p-6 max-w-3xl">
      <Link href="/admin/plans" className="text-sm text-blue-600 hover:underline">
        ← Back to plans
      </Link>
      <h1 className="text-2xl font-semibold text-gray-900 mt-2 mb-6">Edit plan: {plan.name}</h1>
      <PlanForm
        plan={{
          id: plan.id,
          name: plan.name,
          price: Number(plan.price),
          billing_period: plan.billing_period,
          min_quantity: plan.min_quantity,
          start_date: plan.start_date,
          end_date: plan.end_date,
          auto_close: plan.auto_close,
          allow_close: plan.allow_close,
          allow_pause: plan.allow_pause,
          allow_renew: plan.allow_renew,
        }}
      />
    </div>
  );
}