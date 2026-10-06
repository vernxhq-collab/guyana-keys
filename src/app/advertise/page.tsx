const services = ["I'm an agent", "I'm a landlord", "I'm a developer", "Advertise a listing"];
export default function AdvertisePage() {
  return (
    <main>
      <section className="section wrap">
        <p className="kicker">For professionals</p>
        <h1>Your listings, backed by Guyana Keys.</h1>
        <p className="sub" style={{maxWidth:640}}>Draft a home, reply to a lead, and ask for featured placement. Buyers search in GYD and USD, then message on WhatsApp. Nothing goes public until it is approved.</p>
        <div className="grid" style={{marginTop:22}}>
          <article className="card"><div className="card-body"><h2>Leads in one desk</h2><p className="meta">Enquiries, viewing requests, and a reply draft stay on the desk. You send the WhatsApp message.</p></div></article>
          <article className="card"><div className="card-body"><h2>A listing from notes</h2><p className="meta">Paste the beds, area, and price. The draft fills the title and flags what is missing.</p></div></article>
          <article className="card"><div className="card-body"><h2>Free, then featured</h2><p className="meta">An agent can have 3 live listings free. Featured sits above search.</p></div></article>
        </div>
      </section>
      <section className="section wrap">
        <h2>Get started</h2>
        <div className="grid">{services.map((title) => (
          <article className="card" key={title}><div className="card-body" style={{textAlign:"center", padding:"28px 16px"}}><h2>{title}</h2><a className="btn" href="/pro">Get started</a></div></article>
        ))}</div>
      </section>
    </main>
  );
}
