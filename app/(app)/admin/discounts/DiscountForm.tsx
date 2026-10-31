"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../../lib/supabase/client";
import ToastBox, { ToastState } from "../../../../components/ui/ToastBox";

type Discount = {
  id: string;
  name: string;
  type: string;
  value: number;
  min_purchase: number | null;
  min_quantity: number | null;
  start_date: string | null;
  end_date: string | null;
  usage_limit: number | null;
  applies_to: string;
  product_id: string | null;
  active: boolean;
};

type ProductOption = { id: string; name: string };

export default function DiscountForm({
  discount,
  products,
}: {
  discount?: Discount;
  products: ProductOption[];
}) {
  const router = useRouter();
  const isEdit = !!discount;

  const [name, setName] = useState(discount?.name ?? "");
  const [type, setType] = useState(discount?.type ?? "percent");
  const [value, setValue] = useState(discount ? String(discount.value) : "");
  const [minPurchase, setMinPurchase] = useState(
    discount?.min_purchase != null ? String(discount.min_purchase) : ""
  );
  const [minQuantity, setMinQuantity] = useState(
    discount?.min_quantity != null ? String(discount.min_quantity) : ""
  );
  const [startDate, setStartDate] = useState(discount?.start_date?.slice(0, 10) ?? "");
  const [endDate, setEndDate] = useState(discount?.end_date?.slice(0, 10) ?? "");
  const [usageLimit, setUsageLimit] = useState(
    discount?.usage_limit != null ? String(discount.usage_limit) : ""
  );
  const [appliesTo, setAppliesTo] = useState(discount?.applies_to ?? "subscription");
  const [productId, setProductId] = useState(discount?.product_id ?? "");
  const [active, setActive] = useState(discount?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  function fail(text: string) {
    setToast({ type: "error", text });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const valueNum = Number(value);
    const minPurchaseNum = minPurchase === "" ? null : Number(minPurchase);
    const minQuantityNum = minQuantity === "" ? null : Number(minQuantity);
    const usageLimitNum = usageLimit === "" ? null : Number(usageLimit);

    if (!name.trim()) return fail("Name is required.");
    if (value === "" || Number.isNaN(valueNum) || valueNum <= 0) {
      return fail("Value must be greater than 0.");
    }
    if (type === "percent" && (valueNum < 1 || valueNum > 100)) {
      return fail("A percent discount must be between 1 and 100.");
    }
    if (minPurchaseNum !== null && (Number.isNaN(minPurchaseNum) || minPurchaseNum < 0)) {
      return fail("Minimum purchase must be 0 or more.");
    }
    if (minQuantityNum !== null && (!Number.isInteger(minQuantityNum) || minQuantityNum < 0)) {
      return fail("Minimum quantity must be a whole number, 0 or more.");
    }
    if (usageLimitNum !== null && (!Number.isInteger(usageLimitNum) || usageLimitNum < 1)) {
      return fail("Usage limit must be a whole number, 1 or more.");
    }
    if (startDate && endDate && endDate < startDate) {
      return fail("End date cannot be before the start date.");
    }
    if (appliesTo === "product" && !productId) return fail("Please choose a product.");

    const payload = {
      name: name.trim(),
      type,
      value: valueNum,
      min_purchase: minPurchaseNum,
      min_quantity: minQuantityNum,
      start_date: startDate || null,
      end_date: endDate || null,
      usage_limit: usageLimitNum,
      applies_to: appliesTo,
      product_id: appliesTo === "product" ? productId : null,
      active,
    };

    setSaving(true);
    const supabase = createClient();

    if (isEdit) {
      const { data, error } = await supabase
        .from("discounts")
        .update(payload)
        .eq("id", discount!.id)
        .select();
      setSaving(false);

      if (error) return fail(error.message);
      if (!data || data.length === 0) return fail("Nothing was saved. Are you logged in as an admin?");
      setToast({ type: "success", text: "Discount saved." });
      router.refresh();
    } else {
      const { data, error } = await supabase
        .from("discounts")
        .insert({ ...payload, times_used: 0 })
        .select();
      setSaving(false);

      if (error) return fail(error.message);
      if (!data || data.length === 0) return fail("Nothing was saved. Are you logged in as an admin?");
      router.push("/admin/discounts");
      router.refresh();
    }
  }

  const inputClass = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <>
      <ToastBox toast={toast} onClose={() => setToast(null)} />
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-lg p-6 space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
              <option value="percent">Percent (%)</option>
              <option value="fixed">Fixed amount (₹)</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>
              {type === "percent" ? "Value (1 to 100 %)" : "Value (₹)"}
            </label>
            <input
              type="number"
              step="0.01"
              min={type === "percent" ? "1" : "0.01"}
              max={type === "percent" ? "100" : undefined}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Minimum purchase (₹, optional)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={minPurchase}
              onChange={(e) => setMinPurchase(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Minimum quantity (optional)</label>
            <input
              type="number"
              step="1"
              min="0"
              value={minQuantity}
              onChange={(e) => setMinQuantity(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Usage limit (optional)</label>
            <input
              type="number"
              step="1"
              min="1"
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value)}
              placeholder="Leave empty for no limit"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>End date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Applies to</label>
            <select
              value={appliesTo}
              onChange={(e) => setAppliesTo(e.target.value)}
              className={inputClass}
            >
              <option value="subscription">Whole subscription</option>
              <option value="product">Specific product</option>
            </select>
          </div>
          {appliesTo === "product" && (
            <div>
              <label className={labelClass}>Product</label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className={inputClass}
              >
                <option value="">Choose a product...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Active
        </label>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : isEdit ? "Save changes" : "Create discount"}
          </button>
        </div>
      </form>
    </>
  );
}