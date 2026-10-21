"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function DeskNav({ label, name, items, signOut }: { label: string; name: string; items: [string, string][]; signOut?: string }) {
  const path = usePathname();
  return (
    <div className="desk-bar">
      <nav className="desk-nav" aria-label={label}>
        <span className="desk-name">{name}</span>
        {items.map(([item, href]) => {
          const on = href === "/agent" || href === "/admin" || href === "/account" ? path === href : path === href || path.startsWith(href + "/");
          return <Link key={href} className={on ? "on" : ""} href={href}>{item}</Link>;
        })}
      </nav>
      {signOut ? (
        <button
          className="desk-logout"
          type="button"
          onClick={async () => {
            await fetch("/api/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "leave" }) }).catch(() => null);
            await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) });
            window.location.href = signOut;
          }}
        >
          Log out
        </button>
      ) : null}
    </div>
  );
}
