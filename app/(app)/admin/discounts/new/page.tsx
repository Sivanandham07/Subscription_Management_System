import Link from "next/link";
import { createClient } from "../../../../../lib/supabase/server";
import DiscountForm from "../DiscountForm";

export default async function NewDiscountPage() {
  const supabase = await createClient();
  const { data: products, error } = await supabase
    .from("products")
    .select("id, name")
    .eq("active", true)
    .order("name")
    .limit(200);

  if (error) throw new Error(error.message);

  return (
    <div className="p-6 max-w-3xl">
      <Link href="/admin/discounts" className="text-sm text-blue-600 hover:underline">
        ← Back to discounts
      </Link>
      <h1 className="text-2xl font-semibold text-gray-900 mt-2 mb-6">Add discount</h1>
      <DiscountForm products={products ?? []} />
    </div>
  );
}