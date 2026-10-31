'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatINR } from '../../../lib/format';

type Point = { label: string; revenue: number };

// Short money for the axis: 1250000 -> "₹12.5L"
const compactINR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function RevenueChart({ data }: { data: Point[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-gray-500">No revenue data yet.</p>;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis
            tickFormatter={(value) => compactINR.format(Number(value))}
            tick={{ fontSize: 12 }}
            width={70}
          />
          <Tooltip formatter={(value) => formatINR(Number(value))} />
          <Bar dataKey="revenue" name="Revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}