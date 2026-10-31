"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../../lib/supabase/client";
import { formatINR } from "../../../../lib/format";
import ToastBox, { ToastState } from "../../../../components/ui/ToastBox";

export type PlanOption = { id: string; name: string };
export type ProductOption = { id: string; name: string; sales_price: number };
export type VariantOption = {
  id: string;
  product_id: string;
  attribute: string;
  value: string;
  extra_price: number;
};
export type TaxOption = { id: string; name: string; percentage: number };

export type SavedLine = {
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_price: number;
  tax_id: string | null;
};

type Template = {
  id: string;
  name: string;
  plan_id: string | null;
  validity_days: number;
  lines: SavedLine[];
};

type LineState = {
  key: number;
  product_id: string;
  variant_id: string;
  quantity: string;
  unit_price: string;
  tax_id: string;
};

export default function TemplateForm({
  template,
  plans,
  products,
  variants,
  taxes,
}: {
  template?: Template;
  plans: PlanOption[];
  products: ProductOption[];
  variants: VariantOption[];
  taxes: TaxOption[];
}) {
  const router = useRouter();
  const isEdit = !!template;
  const nextKey = useRef(1000);

  function newKey() {
    nextKey.current += 1;
    return nextKey.current;
  }

  function blankLine(): LineState {
    return {
      key: newKey(),
      product_id: "",
      variant_id: "",
      quantity: "1",
      unit_price: "",
      tax_id: "",
    };
  }

  const [name, setName] = useState(template?.name ?? "");
  const [planId, setPlanId] = useState(template?.plan_id ?? "");
  const [validityDays, setValidityDays] = useState(
    template ? String(template.validity_days) : "30"
  );
  const [lines, setLines] = useState<LineState[]>(
    template && template.lines.length > 0
      ? template.lines.map((l, i) => ({
          key: i + 1,
          product_id: l.product_id,
          variant_id: l.variant_id ?? "",
          quantity: String(l.quantity),
          unit_price: String(l.unit_price),
          tax_id: l.tax_id ?? "",
        }))
      : [blankLine()]
  );
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  function fail(text: string) {
    setToast({ type: "error", text });
  }

  function updateLine(key: number, patch: Partial<LineState>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function handleProductChange(key: number, productId: string) {
    const product = products.find((p) => p.id === productId);
    updateLine(key, {
      product_id: productId,
      variant_id: "",
      unit_price: product ? String(product.sales_price) : "",
    });
  }

  function handleVariantChange(key: number, productId: string, variantId: string) {
    const product = products.find((p) => p.id === productId);
    const variant = variants.find((v) => v.id === variantId);
    const base = product ? product.sales_price : 0;
    const extra = variant ? variant.extra_price : 0;
    updateLine(key, {
      variant_id: variantId,
      unit_price: product ? String(base + extra) : "",
    });
  }

  function removeLine(key: number) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }

  function lineAmount(l: LineState) {
    const q = Number(l.quantity);
    const p = Number(l.unit_price);
    if (Number.isNaN(q) || Number.isNaN(p)) return 0;
    return q * p;
  }

  const subtotal = lines.reduce((sum, l) => sum + lineAmount(l), 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const days = Number(validityDays);

    if (!name.trim()) return fail("Name is required.");
    if (!planId) return fail("Please choose a plan.");
    if (!Number.isInteger(days) || days < 1) {
      return fail("Validity must be a whole number of days, 1 or more.");
    }
    if (lines.length === 0) return fail("Add at least one product line.");

    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      const q = Number(l.quantity);
      const p = Number(l.unit_price);
      if (!l.product_id) return fail(`Line ${i + 1}: choose a product.`);
      if (!Number.isInteger(q) || q < 1) {
        return fail(`Line ${i + 1}: quantity must be a whole number, 1 or more.`);
      }
      if (l.unit_price === "" || Number.isNaN(p) || p < 0) {
        return fail(`Line ${i + 1}: unit price must be 0 or more.`);
      }
    }

    const lineRows = lines.map((l) => ({
      product_id: l.product_id,
      variant_id: l.variant_id || null,
      quantity: Number(l.quantity),
      unit_price: Number(l.unit_price),
      tax_id: l.tax_id || null,
    }));

    setSaving(true);
    const supabase = createClient();

    if (isEdit) {
      const { data: updated, error: updateError } = await supabase
        .from("quotation_templates")
        .update({ name: name.trim(), plan_id: planId, validity_days: days })
        .eq("id", template!.id)
        .select();

      if (updateError) {
        setSaving(false);
        return fail(updateError.message);
      }
      if (!updated || updated.length === 0) {
        setSaving(false);
        return fail("Nothing was saved. Are you logged in as an admin?");
      }

      const { error: deleteError } = await supabase
        .from("template_lines")
        .delete()
        .eq("template_id", template!.id);

      if (deleteError) {
        setSaving(false);
        return fail(deleteError.message);
      }

      const { error: insertError } = await supabase
        .from("template_lines")
        .insert(lineRows.map((r) => ({ ...r, template_id: template!.id })));

      setSaving(false);
      if (insertError) return fail(insertError.message);

      setToast({ type: "success", text: "Template saved." });
      router.refresh();
    } else {
      const { data: created, error: createError } = await supabase
        .from("quotation_templates")
        .insert({ name: name.trim(), plan_id: planId, validity_days: days })
        .select("id")
        .single();

      if (createError || !created) {
        setSaving(false);
        return fail(createError?.message ?? "Nothing was saved. Are you logged in as an admin?");
      }

      const { error: linesError } = await supabase
        .from("template_lines")
        .insert(lineRows.map((r) => ({ ...r, template_id: created.id })));

      if (linesError) {
        await supabase.from("quotation_templates").delete().eq("id", created.id);
        setSaving(false);
        return fail(linesError.message);
      }

      setSaving(false);
      router.push("/admin/templates");
      router.refresh();
    }
  }

  const inputClass = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <>
      <ToastBox toast={toast} onClose={() => setToast(null)} />
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Plan</label>
              <select value={planId} onChange={(e) => setPlanId(e.target.value)} className={inputClass}>
                <option value="">Choose a plan...</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Validity (days)</label>
              <input
                type="number"
                step="1"
                min="1"
                value={validityDays}
                onChange={(e) => setValidityDays(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Product lines</h2>

          <div className="space-y-3">
            {lines.map((l) => {
              const productVariants = variants.filter((v) => v.product_id === l.product_id);
              return (
                <div
                  key={l.key}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end border border-gray-100 rounded-md p-3"
                >
                  <div className="md:col-span-3">
                    <label className={labelClass}>Product</label>
                    <select
                      value={l.product_id}
                      onChange={(e) => handleProductChange(l.key, e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Choose...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className={labelClass}>Variant</label>
                    <select
                      value={l.variant_id}
                      onChange={(e) => handleVariantChange(l.key, l.product_id, e.target.value)}
                      disabled={!l.product_id || productVariants.length === 0}
                      className={`${inputClass} disabled:bg-gray-100`}
                    >
                      <option value="">None</option>
                      {productVariants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.attribute}: {v.value} (+{formatINR(v.extra_price)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-1">
                    <label className={labelClass}>Qty</label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={l.quantity}
                      onChange={(e) => updateLine(l.key, { quantity: e.target.value })}
                      className={inputClass}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className={labelClass}>Unit price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={l.unit_price}
                      onChange={(e) => updateLine(l.key, { unit_price: e.target.value })}
                      className={inputClass}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className={labelClass}>Tax</label>
                    <select
                      value={l.tax_id}
                      onChange={(e) => updateLine(l.key, { tax_id: e.target.value })}
                      className={inputClass}
                    >
                      <option value="">No tax</option>
                      {taxes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.percentage}%)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {formatINR(lineAmount(l))}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeLine(l.key)}
                      className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-4">
            <button
              type="button"
              onClick={() => setLines((prev) => [...prev, blankLine()])}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              + Add line
            </button>
            <div className="text-sm text-gray-700">
              Subtotal (before tax):{" "}
              <span className="font-semibold text-gray-900">{formatINR(subtotal)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : isEdit ? "Save changes" : "Create template"}
          </button>
        </div>
      </form>
    </>
  );
}