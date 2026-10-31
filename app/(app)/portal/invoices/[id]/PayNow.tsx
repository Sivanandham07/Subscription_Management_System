'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../../../lib/supabase/client';
import { useToast } from '../../../../../components/ui/Toast';
import { formatINR } from '../../../../../lib/format';

type Method = 'card' | 'upi';

export function PayNow({ invoiceId, amount }: { invoiceId: string; amount: number }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<Method>('card');
  const [paying, setPaying] = useState(false);

  async function handlePay() {
    setPaying(true);

    // Pretend the bank is thinking for one second
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const supabase = createClient();
    const { error } = await supabase.rpc('portal_pay_invoice', {
      p_invoice_id: invoiceId,
      p_method: method,
    });

    setPaying(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Payment successful (simulated)');
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <div className="print:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Pay now · {formatINR(amount)}
        </button>
      </div>
    );
  }

  const inputClass = 'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm';

  return (
    <div className="max-w-md rounded-xl border border-indigo-200 bg-white p-5 shadow-sm print:hidden">
      <h2 className="font-semibold">Pay {formatINR(amount)}</h2>
      <p className="mt-1 rounded-md bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
        Simulated payment for demo. No real money moves. Do not enter real card details.
      </p>

      <div className="mt-4 flex gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="radio" name="method" checked={method === 'card'} onChange={() => setMethod('card')} />
          Card
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="method" checked={method === 'upi'} onChange={() => setMethod('upi')} />
          UPI
        </label>
      </div>

      {/* These fields are for show only: their values are never read or sent anywhere */}
      {method === 'card' ? (
        <div className="mt-4 space-y-3">
          <input className={inputClass} defaultValue="Demo Customer" aria-label="Name on card" />
          <input className={inputClass} defaultValue="4242 4242 4242 4242" aria-label="Card number" />
          <div className="grid grid-cols-2 gap-3">
            <input className={inputClass} defaultValue="12/30" aria-label="Expiry" />
            <input className={inputClass} defaultValue="123" aria-label="CVV" />
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <input className={inputClass} defaultValue="demo@upi" aria-label="UPI ID" />
        </div>
      )}

      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={handlePay}
          disabled={paying}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {paying ? 'Processing…' : `Pay ${formatINR(amount)}`}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={paying}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}