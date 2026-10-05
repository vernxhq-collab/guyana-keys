"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  ["/listings", "Listings"],
  ["/areas", "Neighbourhoods"],
  ["/agents", "Agents"],
  ["/guides", "Diaspora guide"],
  ["/dashboard", "Agent dashboard"],
];

export function Header() {
  const path = usePathname();
  return (
    <div className="wrap">
      <nav className="nav">
        <Link className="brand" href="/">Guyana Keys</Link>
        <div className="nav-links">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className={path.startsWith(href) ? "active" : ""}>{label}</Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
