"use client";
import { useRouter } from "next/navigation";

export default function ClickRow({ href, children }: { href: string; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <tr onClick={() => router.push(href)} className="cursor-pointer border-t hover:bg-gray-50">
      {children}
    </tr>
  );
}