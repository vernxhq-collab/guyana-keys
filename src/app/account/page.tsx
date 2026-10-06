export default function AccountPage() {
  return (
    <main className="wrap section" style={{display:"grid", placeItems:"center", minHeight:"60vh"}}>
      <form className="card" style={{width:"min(440px, 100%)", padding:28, display:"grid", gap:14}} action="/account">
        <h1 style={{margin:0, fontSize:28}}>Sign in or register</h1>
        <label htmlFor="email"><strong>Enter your email address</strong></label>
        <input id="email" name="email" type="email" required style={{border:"1px solid #d5dbd8", borderRadius:12, padding:14}} />
        <button className="btn" type="button" style={{borderRadius:999, padding:14}}>Next</button>
      </form>
    </main>
  );
}
