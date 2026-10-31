'use client';

import { useToast } from '../../../components/ui/Toast';

export function ReminderButton({
  customerName,
  invoiceNumber,
}: {
  customerName: string;
  invoiceNumber: string;
}) {
  const toast = useToast();

  return (
    <button
      type="button"
      onClick={() => toast.success(`Reminder sent to ${customerName} for ${invoiceNumber} (simulated)`)}
      className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50"
    >
      Send reminder
    </button>
  );
}