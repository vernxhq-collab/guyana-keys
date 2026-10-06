const services = ["I'm an agent", "I'm a landlord", "I'm a developer", "Advertise a listing"];
export default function AdvertisePage() {
  return (
    <main className="wrap section">
      <h1>Advertise on Guyana Keys</h1>
      <div className="grid" style={{marginTop:18}}>{services.map((title) => (
        <article className="card" key={title}><div className="card-body" style={{textAlign:"center", padding:"28px 16px"}}><h2>{title}</h2><a className="btn" href="/pro">Get started</a></div></article>
      ))}</div>
    </main>
  );
}
