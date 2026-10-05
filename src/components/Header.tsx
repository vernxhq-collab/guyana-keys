import Link from "next/link";
export function Header() {
  return (
    <div className="wrap"><nav className="nav"><Link className="brand" href="/"><i />Guyana <span>Keys</span></Link><div className="nav-links"><Link href="/listings">For sale</Link><Link href="/listings?purpose=Rent">To rent</Link><Link href="/listings?type=Land">Land</Link><Link href="/areas">Neighbourhoods</Link><Link href="/agents">Agents</Link></div><div className="nav-actions"><Link className="btn ghost" href="/account">Sign in</Link></div></nav></div>
  );
}
