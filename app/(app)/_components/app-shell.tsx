"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./logout-button";

type NavLink = { href: string; label: string };

const BADGE_COLORS: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700",
  staff: "bg-blue-100 text-blue-700",
  customer: "bg-green-100 text-green-700",
};

export default function AppShell({
  name,
  role,
  links,
  children,
}: {
  name: string;
  role: string;
  links: NavLink[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false); // mobile menu

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <div className="min-h-screen bg-gray-50 md:flex">
      {/* Dark backdrop on mobile when menu is open */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-60 transform border-r border-gray-200 bg-white transition-transform md:static md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-5 py-5">
          <div className="text-lg font-bold text-indigo-600">Brightloop</div>
          <div className="text-xs text-gray-500">Subscription Management</div>
        </div>
        <nav className="space-y-1 px-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`block rounded px-3 py-2 text-sm font-medium ${
                isActive(link.href)
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Right side: top bar + page content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 md:hidden"
          >
            Menu
          </button>
          <div className="hidden md:block" />

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-800">{name}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                BADGE_COLORS[role] ?? "bg-gray-100 text-gray-700"
              }`}
            >
              {role}
            </span>
            <LogoutButton />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}