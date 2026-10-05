"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const links = [["/listings","For sale"],["/listings?purpose=Rent","To rent"],["/areas","Neighbourhoods"],["/agents","Agents"]];
export function Header() {
  const path = usePathname();
  return (
    <div className="wrap"><nav className="nav"><Link className="brand" href="/">Guyana <span>Keys</span></Link><div className="nav-links">{links.map(([href,label]) => <Link key={label} href={href}>{label}</Link>)}</div><Link className="btn" href="/guides">Buying from abroad</Link></nav></div>
  );
}
