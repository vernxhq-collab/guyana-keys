"use client";

import { useMemo, useState } from "react";
import { ListingCard } from "./ListingCard";
import { money, usd, type Listing } from "../lib/data";
import { whenLabel } from "../lib/assist";

type Enquiry = {
  id: string;
  propertyId: string;
  name: string;
  phone: string;
  note: string;
  abroad: boolean;
  moveIn: string;
  occupants: number | null;
  stageLabel: string;
  agentReply: string;
  viewingAt: string;
  viewingRequest: string;
  viewingCleared: boolean;
  listing: Listing | null;
};

type Home = { listing: Listing; saved: boolean; enquiry: Enquiry | null };
type Search = { id: string; label: string; purpose: string; area: string; beds: number; maxPrice: number };

export type BuyerPayload = {
  profile: { name: string; email: string; phone: string; abroad: boolean };
  homes: Home[];
  enquiries: Enquiry[];
  searches: Search[];
  recent: Listing[];
};

function statusOf(home: Home) {
  if (home.enquiry?.viewingAt) return "Viewing set";
  if (home.enquiry?.viewingRequest) return "Viewing requested";
  if (home.enquiry) return "Enquiry sent";
  if (home.saved) return "Saved";
  return "";
}

export function BuyerDesk({ data, reload }: { data: BuyerPayload; reload: () => Promise<void> }) {
  const [tab, setTab] = useState<"home" | "enquiries" | "searches" | "profile">("home");
  const [purpose, setPurpose] = useState<"Sale" | "Rent">("Sale");
  const [query, setQuery] = useState("");
  const [why, setWhy] = useState<Record<string, string>>({});
  const [searchNote, setSearchNote] = useState("");
  const [parsed, setParsed] = useState<{ purpose: string; area: string; beds: number; maxPrice: number; understood: boolean } | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [profile, setProfile] = useState(data.profile);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const saleCount = data.homes.filter((home) => home.listing.purpose === "Sale").length;
  const rentCount = data.homes.filter((home) => home.listing.purpose === "Rent").length;
  const shown = useMemo(() => {
    return data.homes.filter((home) => {
      if (home.listing.purpose !== purpose) return false;
      if (parsed?.understood && why[home.listing.id] === undefined && Object.keys(why).length) return false;
      if (parsed?.understood && !why[home.listing.id]) return false;
      return true;
    });
  }, [data.homes, purpose, parsed, why]);

  async function post(body: Record<string, unknown>) {
    const res = await fetch("/api/buyer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(payload.error || "Could not save that.");
    await reload();
  }

  async function runSearch(event: React.FormEvent) {
    event.preventDefault();
    setSearchNote("");
    setMessage("");
    const res = await fetch("/api/assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task: "buyer-search", query, homes: data.homes.map((home) => ({ id: home.listing.id, title: home.listing.title, area: home.listing.area, purpose: home.listing.purpose, beds: home.listing.beds, baths: home.listing.baths, priceGyd: home.listing.priceGyd, type: home.listing.type })) }) });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setSearchNote("AI is not available, continue manually.");
      return;
    }
    if (!payload.understood) {
      setParsed(null);
      setWhy({});
      setSearchNote("Say sale or rent, an area, beds, or a max price.");
      return;
    }
    if (payload.purpose === "Rent" || payload.purpose === "Sale") setPurpose(payload.purpose);
    const next: Record<string, string> = {};
    for (const match of payload.matches || []) next[match.id] = match.why;
    setWhy(next);
    setParsed({ purpose: payload.purpose || "", area: payload.area || "", beds: payload.beds || 0, maxPrice: payload.maxPrice || 0, understood: true });
    setSearchNote(payload.matches?.length ? "Open a home to read the details." : "Nothing in your homes matches that.");
  }

  async function saveThisSearch() {
    if (!parsed) return;
    setBusy(true);
    try {
      await post({ action: "search", label: query || "Saved search", ...parsed });
      setMessage("Saved. Email is not sending yet.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The search could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function removeHome(id: string) {
    if (!window.confirm("Remove this home?")) return;
    await post({ action: "unsave", propertyId: id });
  }

  function toggleCompare(id: string) {
    setPicked((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 3) {
        setMessage("No more than three.");
        return current;
      }
      setMessage("");
      return [...current, id];
    });
  }

  const compared = picked.map((id) => data.homes.find((home) => home.listing.id === id)?.listing).filter((item): item is Listing => Boolean(item));

  return (
    <div className="stack">
      <div className="desk-nav" aria-label="Your homes">
        {([["home", "Home"], ["enquiries", "Enquiries"], ["searches", "Searches"], ["profile", "Profile"]] as const).map(([id, label]) => (
          <button key={id} className={tab === id ? "on" : ""} type="button" onClick={() => { setTab(id); setMessage(""); }} style={{ border: "1px solid #cfd6d2", borderRadius: 999, padding: "10px 14px", minHeight: 44, background: tab === id ? "#0c3d2c" : "#fff", color: tab === id ? "#fff" : "inherit" }}>{label}</button>
        ))}
      </div>

      {tab === "home" ? (
        <div className="stack">
          <h1>Hello, {data.profile.name}.</h1>
          <p className="quiet">Only homes you saved or enquired about.</p>
          <form className="ai-bar" onSubmit={runSearch}>
            <label className="quiet" htmlFor="look">What home are you looking for?</label>
            <input id="look" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Sale, area, beds, max price" />
            <button className="btn" type="submit">Search</button>
          </form>
          {searchNote ? <p>{searchNote}</p> : <p className="quiet">Search your saved homes and enquiries.</p>}
          {parsed?.understood && !Object.keys(why).length ? <button className="btn" type="button" disabled={busy} onClick={() => void saveThisSearch()}>Save this search</button> : null}
          <div className="desk-nav" aria-label="Your homes by purpose">
            <button type="button" className={purpose === "Sale" ? "on" : ""} onClick={() => setPurpose("Sale")} style={{ border: "1px solid #cfd6d2", borderRadius: 999, padding: "10px 14px", minHeight: 44, background: purpose === "Sale" ? "#116b4a" : "#fff", color: purpose === "Sale" ? "#fff" : "inherit" }}>For sale ({saleCount})</button>
            <button type="button" className={purpose === "Rent" ? "on" : ""} onClick={() => setPurpose("Rent")} style={{ border: "1px solid #cfd6d2", borderRadius: 999, padding: "10px 14px", minHeight: 44, background: purpose === "Rent" ? "#116b4a" : "#fff", color: purpose === "Rent" ? "#fff" : "inherit" }}>To rent ({rentCount})</button>
          </div>
          {shown.length === 0 && !parsed?.understood ? <p>Nothing in this list yet. Open a home and press Save, or send an enquiry.</p> : null}
          <div className="grid">
            {shown.map((home) => (
              <div key={home.listing.id} className="stack">
                <p className="meta">{statusOf(home)}{home.enquiry?.viewingCleared ? " · The viewing time was removed." : ""}</p>
                {why[home.listing.id] ? <p>{why[home.listing.id]}</p> : null}
                <ListingCard listing={home.listing} />
                {home.saved ? <button className="btn ghost" type="button" onClick={() => void removeHome(home.listing.id)}>Remove</button> : null}
                <label className="quiet"><input type="checkbox" checked={picked.includes(home.listing.id)} onChange={() => toggleCompare(home.listing.id)} /> Compare</label>
              </div>
            ))}
          </div>
          <section className="stack">
            <h2>Recently viewed</h2>
            {data.recent.length === 0 ? <p className="quiet">Homes you open while signed in will show here.</p> : <div className="grid">{data.recent.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div>}
          </section>
          <section className="stack">
            <h2>Compare</h2>
            <p className="quiet">Choose up to three homes. No more than three.</p>
            {compared.length < 2 ? <p>Choose two or three homes to compare.</p> : (
              <table className="compare">
                <thead><tr><th> </th>{compared.map((listing) => <th key={listing.id}>{listing.area}</th>)}</tr></thead>
                <tbody>
                  <tr><th>Price</th>{compared.map((listing) => <td key={listing.id}>{money(listing.priceGyd, listing.purpose)}</td>)}</tr>
                  <tr><th>Area</th>{compared.map((listing) => <td key={listing.id}>{listing.area}</td>)}</tr>
                  <tr><th>Beds</th>{compared.map((listing) => <td key={listing.id}>{listing.beds}</td>)}</tr>
                  <tr><th>Baths</th>{compared.map((listing) => <td key={listing.id}>{listing.baths}</td>)}</tr>
                  <tr><th>Sqft</th>{compared.map((listing) => <td key={listing.id}>{listing.sqft.toLocaleString()}</td>)}</tr>
                  <tr><th>Sale or rent</th>{compared.map((listing) => <td key={listing.id}>{listing.purpose === "Rent" ? "Rent" : "Sale"}</td>)}</tr>
                </tbody>
              </table>
            )}
          </section>
        </div>
      ) : null}

      {tab === "enquiries" ? (
        <div className="stack">
          <h1>Enquiries</h1>
          {data.enquiries.length === 0 ? <p>Open a home and press Send enquiry.</p> : data.enquiries.map((enquiry) => (
            <article className="panel" key={enquiry.id}>
              <strong>{enquiry.listing?.title || "Home"}</strong>
              <p className="quiet">{enquiry.listing ? `${enquiry.listing.area} · ${money(enquiry.listing.priceGyd, enquiry.listing.purpose)} · Guide USD ${usd(enquiry.listing.priceGyd).toLocaleString()}` : ""}</p>
              <p>{enquiry.note || "No note."}</p>
              <p>WhatsApp {enquiry.phone}</p>
              <p>Abroad: {enquiry.abroad ? "Yes" : "No"}</p>
              {enquiry.moveIn || enquiry.occupants ? <p>Move-in {enquiry.moveIn || "not set"} · Occupants {enquiry.occupants || "not set"}</p> : null}
              <p>Stage: {enquiry.stageLabel}</p>
              <p>Agent reply: {enquiry.agentReply || "No reply yet."}</p>
              <p>Viewing: {enquiry.viewingAt ? whenLabel(enquiry.viewingAt) : enquiry.viewingRequest ? `Requested ${enquiry.viewingRequest}` : "Not set"}</p>
              {enquiry.viewingCleared ? <p>The viewing time was removed.</p> : null}
            </article>
          ))}
        </div>
      ) : null}

      {tab === "searches" ? (
        <div className="stack">
          <h1>Searches</h1>
          <p>Saved. Email is not sending yet.</p>
          {data.searches.length === 0 ? <p className="quiet">Save a search from Home when nothing matches.</p> : data.searches.map((search) => (
            <article className="panel" key={search.id}>
              <strong>{search.label}</strong>
              <p className="quiet">{[search.purpose, search.area, search.beds ? `${search.beds}+ beds` : "", search.maxPrice ? `max ${search.maxPrice.toLocaleString()}` : ""].filter(Boolean).join(" · ") || "Any home"}</p>
              <button className="btn ghost" type="button" onClick={() => void post({ action: "deleteSearch", id: search.id })}>Delete</button>
            </article>
          ))}
        </div>
      ) : null}

      {tab === "profile" ? (
        <form className="panel" onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setMessage("");
          try {
            await post({ action: "profile", name: profile.name, phone: profile.phone, abroad: profile.abroad });
            setMessage("Saved.");
          } catch (error) {
            setMessage(error instanceof Error ? error.message : "The profile could not be saved.");
          } finally {
            setBusy(false);
          }
        }}>
          <h1>Profile</h1>
          <label>Name<input value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} /></label>
          <label>Phone<input value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} /></label>
          <label>Email<input value={profile.email} readOnly /></label>
          <label className="quiet"><input type="checkbox" checked={profile.abroad} onChange={(event) => setProfile({ ...profile, abroad: event.target.checked })} /> Buying from abroad, as the default for the next enquiry</label>
          <button className="btn" type="submit" disabled={busy}>Save</button>
          <button className="btn ghost" type="button" onClick={async () => { await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) }); window.location.href = "/account"; }}>Log off</button>
        </form>
      ) : null}
      {message ? <p>{message}</p> : null}
    </div>
  );
}
