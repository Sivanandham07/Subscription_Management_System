import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "../../../../../lib/supabase/server";
import ProductForm from "../ProductForm";
import VariantManager from "../VariantManager";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("id, name, type, sales_price, cost_price, notes, active")
    .eq("id", id)
    .maybeSingle();

  if (error && error.code !== "22P02") throw new Error(error.message);
  if (!product) notFound();

  const { data: variants, error: variantError } = await supabase
    .from("product_variants")
    .select("id, attribute, value, extra_price")
    .eq("product_id", id)
    .order("attribute")
    .order("value");

  if (variantError) throw new Error(variantError.message);

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div>
        <Link href="/admin/products" className="text-sm text-blue-600 hover:underline">
          ← Back to products
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900 mt-2">{product.name}</h1>
      </div>

      <ProductForm
        product={{
          id: product.id,
          name: product.name,
          type: product.type,
          sales_price: Number(product.sales_price),
          cost_price: Number(product.cost_price),
          notes: product.notes,
          active: product.active,
        }}
      />

      <VariantManager
        productId={product.id}
        salesPrice={Number(product.sales_price)}
        variants={(variants ?? []).map((v) => ({
          id: v.id,
          attribute: v.attribute,
          value: v.value,
          extra_price: Number(v.extra_price),
        }))}
      />
    </div>
  );
}