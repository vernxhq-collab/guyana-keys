import Link from "next/link";
export default function ProPage() {
  return (
    <main className="wrap section" style={{display:"grid", placeItems:"center"}}>
      <form className="card" action="/dashboard" style={{width:"min(480px, 100%)", padding:28, display:"grid", gap:12}}>
        <h1 style={{margin:0}}>Sign in to your desk</h1>
        <p className="meta">Agents, landlords, and developers. Draft a listing, reply to a lead, and request featured placement. Nothing goes live until it is approved.</p>
        <label htmlFor="email"><strong>Work email</strong></label>
        <input id="email" name="email" type="email" required style={{border:"1px solid #d5dbd8", borderRadius:12, padding:14}} />
        <button className="btn" style={{borderRadius:999}}>Continue</button>
        <p className="meta">Buyers use <Link href="/account">Sign in or register</Link>.</p>
      </form>
    </main>
  );
}
