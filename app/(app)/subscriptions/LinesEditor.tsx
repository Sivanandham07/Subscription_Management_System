"use client";

import { formatINR } from "../../../lib/format";

export type ProductOption = { id: string; name: string; sales_price: number };
export type VariantOption = {
  id: string;
  product_id: string;
  attribute: string;
  value: string;
  extra_price: number;
};
export type TaxOption = { id: string; name: string; percentage: number };

export type LineState = {
  key: number;
  product_id: string;
  variant_id: string;
  quantity: string;
  unit_price: string;
  tax_id: string;
};

let counter = 0;
export function newLine(): LineState {
  counter += 1;
  return {
    key: counter,
    product_id: "",
    variant_id: "",
    quantity: "1",
    unit_price: "",
    tax_id: "",
  };
}

function lineAmount(l: LineState): number {
  const q = Number(l.quantity);
  const p = Number(l.unit_price);
  if (Number.isNaN(q) || Number.isNaN(p)) return 0;
  return q * p;
}

export function calcTotals(lines: LineState[], taxes: TaxOption[]) {
  let subtotal = 0;
  let tax = 0;
  for (const l of lines) {
    const amount = lineAmount(l);
    subtotal += amount;
    const t = taxes.find((x) => x.id === l.tax_id);
    if (t) tax += (amount * t.percentage) / 100;
  }
  return { subtotal, tax, total: subtotal + tax };
}

// Returns an error message, or null if all lines are fine
export function validateLines(lines: LineState[]): string | null {
  if (lines.length === 0) return "Add at least one product line.";
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const q = Number(l.quantity);
    const p = Number(l.unit_price);
    if (!l.product_id) return `Line ${i + 1}: choose a product.`;
    if (!Number.isInteger(q) || q < 1) {
      return `Line ${i + 1}: quantity must be a whole number, 1 or more.`;
    }
    if (l.unit_price === "" || Number.isNaN(p) || p < 0) {
      return `Line ${i + 1}: unit price must be 0 or more.`;
    }
  }
  return null;
}

// Converts the lines into rows ready to insert into subscription_lines
export function toRows(lines: LineState[]) {
  return lines.map((l) => ({
    product_id: l.product_id,
    variant_id: l.variant_id || null,
    quantity: Number(l.quantity),
    unit_price: Number(l.unit_price),
    tax_id: l.tax_id || null,
  }));
}

export default function LinesEditor({
  lines,
  onChange,
  products,
  variants,
  taxes,
  disabled = false,
}: {
  lines: LineState[];
  onChange: (lines: LineState[]) => void;
  products: ProductOption[];
  variants: VariantOption[];
  taxes: TaxOption[];
  disabled?: boolean;
}) {
  const totals = calcTotals(lines, taxes);

  function update(key: number, patch: Partial<LineState>) {
    onChange(lines.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function handleProduct(key: number, productId: string) {
    const product = products.find((p) => p.id === productId);
    update(key, {
      product_id: productId,
      variant_id: "",
      unit_price: product ? String(product.sales_price) : "",
    });
  }

  function handleVariant(key: number, productId: string, variantId: string) {
    const product = products.find((p) => p.id === productId);
    const variant = variants.find((v) => v.id === variantId);
    const base = product ? product.sales_price : 0;
    const extra = variant ? variant.extra_price : 0;
    update(key, {
      variant_id: variantId,
      unit_price: product ? String(base + extra) : "",
    });
  }

  const inputClass =
    "w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 disabled:bg-gray-100";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div>
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
                  disabled={disabled}
                  onChange={(e) => handleProduct(l.key, e.target.value)}
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
                  disabled={disabled || !l.product_id || productVariants.length === 0}
                  onChange={(e) => handleVariant(l.key, l.product_id, e.target.value)}
                  className={inputClass}
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
                  disabled={disabled}
                  onChange={(e) => update(l.key, { quantity: e.target.value })}
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
                  disabled={disabled}
                  onChange={(e) => update(l.key, { unit_price: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Tax</label>
                <select
                  value={l.tax_id}
                  disabled={disabled}
                  onChange={(e) => update(l.key, { tax_id: e.target.value })}
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
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => onChange(lines.filter((x) => x.key !== l.key))}
                    className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-start justify-between mt-4">
        {!disabled ? (
          <button
            type="button"
            onClick={() => onChange([...lines, newLine()])}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            + Add line
          </button>
        ) : (
          <span />
        )}

        <div className="text-sm text-gray-700 space-y-1 text-right min-w-56">
          <div className="flex justify-between gap-6">
            <span>Subtotal</span>
            <span className="text-gray-900">{formatINR(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between gap-6">
            <span>Tax</span>
            <span className="text-gray-900">{formatINR(totals.tax)}</span>
          </div>
          <div className="flex justify-between gap-6 border-t border-gray-200 pt-1 font-semibold">
            <span>Total</span>
            <span className="text-gray-900">{formatINR(totals.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}