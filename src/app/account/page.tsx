export default function AccountPage() {
  return (
    <main className="wrap section"><h1>Sign in</h1><p className="sub">Save a search and send an enquiry. The email code is connected when mail is switched on.</p><form className="search-card" action="/account"><input placeholder="Email" type="email" /><input placeholder="Password" type="password" /><button className="btn" type="button">Continue</button></form></main>
  );
}
