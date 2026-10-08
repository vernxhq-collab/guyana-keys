const services = [
  { title: "I'm an agent", href: "/agent/login", image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=900&q=80" },
  { title: "I'm a landlord", href: "/landlords", image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80" },
  { title: "I'm a developer", href: "/developers", image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=80" },
  { title: "Advertise a listing", href: "/advertise/listing", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80" },
];
export default function AdvertisePage() {
  return (
    <main className="wrap section">
      <h1>Advertise on Guyana Keys</h1>
      <div className="grid" style={{marginTop:22}}>{services.map((item) => (
        <a className="card" key={item.title} href={item.href}><img src={item.image} alt="" /><div className="card-body" style={{textAlign:"center", padding:"22px 16px 26px"}}><h2>{item.title}</h2><span className="btn">Get started</span></div></a>
      ))}</div>
    </main>
  );
}
