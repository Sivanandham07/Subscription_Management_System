import Link from "next/link";
import { createClient } from "../../../../../lib/supabase/server";
import TemplateForm from "../TemplateForm";

export default async function NewTemplatePage() {
  const supabase = await createClient();

  const [plansRes, productsRes, variantsRes, taxesRes] = await Promise.all([
    supabase.from("plans").select("id, name").order("name").limit(200),
    supabase
      .from("products")
      .select("id, name, sales_price")
      .eq("active", true)
      .order("name")
      .limit(200),
    supabase
      .from("product_variants")
      .select("id, product_id, attribute, value, extra_price")
      .limit(1000),
    supabase.from("taxes").select("id, name, percentage").order("name").limit(200),
  ]);

  const firstError =
    plansRes.error || productsRes.error || variantsRes.error || taxesRes.error;
  if (firstError) throw new Error(firstError.message);

  return (
    <div className="p-6 max-w-6xl">
      <Link href="/admin/templates" className="text-sm text-blue-600 hover:underline">
        ← Back to templates
      </Link>
      <h1 className="text-2xl font-semibold text-gray-900 mt-2 mb-6">Add quotation template</h1>
      <TemplateForm
        plans={plansRes.data ?? []}
        products={(productsRes.data ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          sales_price: Number(p.sales_price),
        }))}
        variants={(variantsRes.data ?? []).map((v) => ({
          id: v.id,
          product_id: v.product_id,
          attribute: v.attribute,
          value: v.value,
          extra_price: Number(v.extra_price),
        }))}
        taxes={(taxesRes.data ?? []).map((t) => ({
          id: t.id,
          name: t.name,
          percentage: Number(t.percentage),
        }))}
      />
    </div>
  );
}