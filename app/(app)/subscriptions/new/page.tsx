import Link from "next/link";
import { createClient } from "../../../../lib/supabase/server";
import { relField } from "../helpers";
import { todayISO } from "../dates";
import NewSubscription from "./NewSubscription";

export default async function NewSubscriptionPage() {
  const supabase = await createClient();

  const [templatesRes, plansRes, productsRes, variantsRes, taxesRes] =
    await Promise.all([
      supabase
        .from("quotation_templates")
        .select("id, name, plans(name)")
        .order("name")
        .limit(200),
      supabase
        .from("plans")
        .select("id, name")
        .eq("status", "active")
        .order("name")
        .limit(200),
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
    templatesRes.error ||
    plansRes.error ||
    productsRes.error ||
    variantsRes.error ||
    taxesRes.error;
  if (firstError) throw new Error(firstError.message);

  return (
    <div className="p-6 max-w-6xl">
      <Link href="/subscriptions" className="text-sm text-blue-600 hover:underline">
        ← Back to subscriptions
      </Link>
      <h1 className="text-2xl font-semibold text-gray-900 mt-2 mb-6">
        New subscription
      </h1>

      <NewSubscription
        today={todayISO()}
        templates={(templatesRes.data ?? []).map((t) => ({
          id: t.id,
          name: `${t.name} (${relField(t.plans, "name")})`,
        }))}
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