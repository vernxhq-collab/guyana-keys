export default function AccountPage() {
  return (
    <main className="wrap section">
      <h1>Sign in / Register</h1>
      <p className="sub">Save a home, save a search, and send an enquiry. Agents use the same sign-in and reach their desk after login.</p>
      <form className="search-card" action="/account"><input placeholder="Email" type="email" /><input placeholder="Password" type="password" /><button className="btn" type="button">Continue</button></form>
    </main>
  );
}
