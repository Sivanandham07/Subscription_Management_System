import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "../../../../../lib/supabase/server";
import DiscountForm from "../DiscountForm";

export default async function EditDiscountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: discount, error } = await supabase
    .from("discounts")
    .select(
      "id, name, type, value, min_purchase, min_quantity, start_date, end_date, usage_limit, applies_to, product_id, active"
    )
    .eq("id", id)
    .maybeSingle();

  if (error && error.code !== "22P02") throw new Error(error.message);
  if (!discount) notFound();

  const { data: products, error: pError } = await supabase
    .from("products")
    .select("id, name")
    .eq("active", true)
    .order("name")
    .limit(200);

  if (pError) throw new Error(pError.message);

  return (
    <div className="p-6 max-w-3xl">
      <Link href="/admin/discounts" className="text-sm text-blue-600 hover:underline">
        ← Back to discounts
      </Link>
      <h1 className="text-2xl font-semibold text-gray-900 mt-2 mb-6">
        Edit discount: {discount.name}
      </h1>
      <DiscountForm
        products={products ?? []}
        discount={{
          id: discount.id,
          name: discount.name,
          type: discount.type,
          value: Number(discount.value),
          min_purchase: discount.min_purchase !== null ? Number(discount.min_purchase) : null,
          min_quantity: discount.min_quantity,
          start_date: discount.start_date,
          end_date: discount.end_date,
          usage_limit: discount.usage_limit,
          applies_to: discount.applies_to,
          product_id: discount.product_id,
          active: discount.active,
        }}
      />
    </div>
  );
}