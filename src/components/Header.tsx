import Link from "next/link";
export function Header() {
  return (
    <header className="top"><div className="wrap"><nav className="nav"><Link className="brand" href="/"><svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path fill="#116b4a" d="M14.5 3.5l6 6-7.8 7.8-2.1-2.1 1.1-1.1-4.2-4.2-2.4 2.4L3.6 10.8l5.4-5.4 1.1 1.1 1.5-1.5 2.9-1.5z"/></svg>Guyana <span>Keys</span></Link><div className="nav-links"><Link href="/listings?purpose=Sale">For sale</Link><Link href="/listings?purpose=Rent">To rent</Link><Link href="/listings?type=Land">Land</Link><Link href="/areas">Neighbourhoods</Link><Link href="/agents">Find an agent</Link></div><div className="nav-actions"><Link className="btn ghost" href="/account">Sign in / Register</Link></div></nav></div></header>
  );
}
