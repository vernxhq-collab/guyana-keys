import Link from "next/link";
export default function ProPage() {
  return (
    <main className="wrap section" style={{display:"grid", placeItems:"center"}}>
      <form className="card" action="/dashboard" style={{width:"min(440px, 100%)", padding:28, display:"grid", gap:14}}>
        <h1 style={{margin:0, fontSize:28}}>Sign in or register</h1>
        <label htmlFor="email"><strong>Enter your email address</strong></label>
        <input id="email" name="email" type="email" required style={{border:"1px solid #d5dbd8", borderRadius:12, padding:14}} />
        <button className="btn" style={{borderRadius:999, padding:14}}>Next</button>
        <p className="meta">Buyers use <Link href="/account">Sign in or register</Link>.</p>
      </form>
    </main>
  );
}
