"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function DeskNav({ label, items }: { label: string; items: [string, string][] }) {
  const path = usePathname();
  return (
    <nav className="desk-nav" aria-label={label}>
      {items.map(([name, href]) => {
        const on = href === "/agent" || href === "/admin" || href === "/account" ? path === href : path === href || path.startsWith(href + "/");
        return <Link key={href} className={on ? "on" : ""} href={href}>{name}</Link>;
      })}
    </nav>
  );
}
