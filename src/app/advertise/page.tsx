import Link from "next/link";
const services = [
  ["I'm an agent", "/dashboard"],
  ["I'm a landlord", "/dashboard"],
  ["I'm a developer", "/dashboard"],
  ["Advertise a listing", "/listings"],
];
export default function AdvertisePage() {
  return (
    <main className="wrap section">
      <h1>Advertise on Guyana Keys</h1>
      <div className="grid" style={{marginTop:18}}>{services.map(([title, href]) => (
        <article className="card" key={title}><div className="card-body" style={{textAlign:"center", padding:"28px 16px"}}><h2>{title}</h2><Link className="btn" href={href}>Get started</Link></div></article>
      ))}</div>
    </main>
  );
}
