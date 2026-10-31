import Link from 'next/link';

export default function InvoiceNotFound() {
  return (
    <div className="m-6 rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-900 shadow-sm">
      <h1 className="text-xl font-bold">Invoice not found</h1>
      <p className="mt-2 text-sm text-gray-500">
        This invoice doesn&apos;t exist, or it isn&apos;t on your account.
      </p>
      <Link href="/portal" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
        ← Back to my account
      </Link>
    </div>
  );
}