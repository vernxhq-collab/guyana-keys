import Link from "next/link";
export function Header() {
  return (
    <div className="wrap"><nav className="nav"><Link className="brand" href="/"><svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4l6 6-8 8-2-2 1.2-1.2L7 10.6 4.5 13 3 11.5 8.2 6.3 9.4 7.5 11 5.9 14 4z" fill="#0c6b4c"/></svg>Guyana <span>Keys</span></Link><div className="nav-links"><Link href="/listings?purpose=Sale">For sale</Link><Link href="/listings?purpose=Rent">To rent</Link><Link href="/listings?type=Land">Land</Link><Link href="/areas">Neighbourhoods</Link><Link href="/agents">Agents</Link><Link href="/guides">From abroad</Link></div><div className="nav-actions"><Link className="btn ghost" href="/account">Sign in</Link></div></nav></div>
  );
}
