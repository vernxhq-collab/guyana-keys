import Link from "next/link";
const services = [
  { title: "I'm an agent", text: "List up to 3 homes free. Featured placement is the paid step.", href: "/dashboard", label: "Open the desk" },
  { title: "I'm a landlord", text: "Put a rental on the map and take enquiries on WhatsApp.", href: "/dashboard", label: "Draft a rental" },
  { title: "I'm a developer", text: "Advertise a new scheme or house-lot development. It is reviewed before it is public.", href: "/dashboard", label: "Submit a scheme" },
  { title: "Advertise a listing", text: "A featured home sits above search.", href: "/listings", label: "See featured placement" },
];
export default function AdvertisePage() {
  return (
    <main className="wrap section">
      <h1>Advertise on Guyana Keys</h1>
      <p className="sub">Agents, landlords, and developers. A listing is reviewed before it goes live.</p>
      <div className="grid">{services.map((item) => (
        <article className="card" key={item.title}><div className="card-body"><h2>{item.title}</h2><p className="meta">{item.text}</p><Link className="btn" href={item.href}>{item.label}</Link></div></article>
      ))}</div>
    </main>
  );
}
