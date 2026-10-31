import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "../../../../../lib/supabase/server";
import TemplateForm from "../TemplateForm";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const [templateRes, linesRes, plansRes, productsRes, variantsRes, taxesRes] =
    await Promise.all([
      supabase
        .from("quotation_templates")
        .select("id, name, plan_id, validity_days")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("template_lines")
        .select("product_id, variant_id, quantity, unit_price, tax_id")
        .eq("template_id", id),
      supabase.from("plans").select("id, name").order("name").limit(200),
      supabase.from("products").select("id, name, sales_price").order("name").limit(200),
      supabase
        .from("product_variants")
        .select("id, product_id, attribute, value, extra_price")
        .limit(1000),
      supabase.from("taxes").select("id, name, percentage").order("name").limit(200),
    ]);

  // 22P02 = the id in the URL is not a valid uuid, so show "not found"
  if (templateRes.error && templateRes.error.code === "22P02") notFound();

  const firstError =
    templateRes.error ||
    linesRes.error ||
    plansRes.error ||
    productsRes.error ||
    variantsRes.error ||
    taxesRes.error;
  if (firstError) throw new Error(firstError.message);

  const template = templateRes.data;
  if (!template) notFound();

  return (
    <div className="p-6 max-w-6xl">
      <Link href="/admin/templates" className="text-sm text-blue-600 hover:underline">
        ← Back to templates
      </Link>
      <h1 className="text-2xl font-semibold text-gray-900 mt-2 mb-6">
        Edit template: {template.name}
      </h1>
      <TemplateForm
        template={{
          id: template.id,
          name: template.name,
          plan_id: template.plan_id,
          validity_days: template.validity_days,
          lines: (linesRes.data ?? []).map((l) => ({
            product_id: l.product_id,
            variant_id: l.variant_id,
            quantity: l.quantity,
            unit_price: Number(l.unit_price),
            tax_id: l.tax_id,
          })),
        }}
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