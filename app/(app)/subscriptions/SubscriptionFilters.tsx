"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SUBSCRIPTION_STATUSES } from "./helpers";

export default function SubscriptionFilters({
  initialQ,
  initialStatus,
}: {
  initialQ: string;
  initialStatus: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQ);
  const [status, setStatus] = useState(initialStatus);

  function go(nextQ: string, nextStatus: string) {
    const params = new URLSearchParams();
    if (nextQ.trim()) params.set("q", nextQ.trim());
    if (nextStatus) params.set("status", nextStatus);
    const qs = params.toString();
    router.push(qs ? `/subscriptions?${qs}` : "/subscriptions");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    go(q, status);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-2">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by number..."
        className="w-64 border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900"
      />
      <select
        value={status}
        onChange={(e) => {
          setStatus(e.target.value);
          go(q, e.target.value);
        }}
        className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900"
      >
        <option value="">All statuses</option>
        {SUBSCRIPTION_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
      >
        Search
      </button>
    </form>
  );
}