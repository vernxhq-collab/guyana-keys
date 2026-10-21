"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { areas } from "../lib/areas";
import { broadbandProviders, electricitySupplies, mobileNetworks, roadAccesses, waterSupplies } from "../lib/place-facts";
import { titleStatuses } from "../lib/trust";
import { compressImage } from "../lib/photos";
import { DeskSkeleton } from "./DeskSkeleton";
import { PinMap } from "./PinMap";

type Draft = {
  id: string;
  purpose: "Sale" | "Rent";
  type: string;
  title: string;
  area: string;
  region: string;
  priceGyd: string;
  priceSuggested: boolean;
  beds: string;
  baths: string;
  sqft: string;
  description: string;
  titleRef: string;
  titleStatus: string;
  mobileNetworks: string[];
  broadbandProviders: string[];
  broadbandSpeed: string;
  waterSupply: string;
  electricity: string;
  roadAccess: string;
  drainageNote: string;
  areaNote: string;
  lat: number;
  lng: number;
  status: "live" | "hidden";
  photos: string[];
  featured: boolean;
};

const empty: Draft = { id: "new", purpose: "Sale", type: "House", title: "", area: "", region: "", priceGyd: "", priceSuggested: false, beds: "", baths: "", sqft: "", description: "", titleRef: "", titleStatus: "", mobileNetworks: [], broadbandProviders: [], broadbandSpeed: "", waterSupply: "", electricity: "", roadAccess: "", drainageNote: "", areaNote: "", lat: 6.8, lng: -58.16, status: "hidden", photos: [], featured: false };

export function ListingEditor({ id }: { id: string }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(empty);
  const [notes, setNotes] = useState("");
  const [live, setLive] = useState(0);
  const [cap, setCap] = useState(3);
  const [message, setMessage] = useState("");
  const [aiNote, setAiNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/agent?part=listing&id=${id}`)
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then(({ ok, data }) => {
        if (!ok) {
          setMessage(data.error || "Could not load this listing.");
          setLoading(false);
          return;
        }
        setLive(data.live || 0);
        setCap(data.cap || 3);
        if (data.listing) {
          const listing = data.listing;
          setDraft({
            id: listing.id,
            purpose: listing.purpose === "Rent" ? "Rent" : "Sale",
            type: listing.type || "House",
            title: listing.title || "",
            area: listing.area || "",
            region: listing.region || "",
            priceGyd: listing.priceGyd ? String(listing.priceGyd) : "",
            priceSuggested: false,
            beds: String(listing.beds || ""),
            baths: String(listing.baths || ""),
            sqft: String(listing.sqft || ""),
            description: listing.description || "",
            titleRef: listing.titleRef || "",
            titleStatus: listing.titleStatus || "",
            mobileNetworks: listing.facts?.mobileNetworks || [],
            broadbandProviders: listing.facts?.broadbandProviders || [],
            broadbandSpeed: listing.facts?.broadbandSpeed || "",
            waterSupply: listing.facts?.waterSupply || "",
            electricity: listing.facts?.electricity || "",
            roadAccess: listing.facts?.roadAccess || "",
            drainageNote: listing.facts?.drainageNote || "",
            areaNote: listing.facts?.areaNote || "",
            lat: listing.lat || 6.8,
            lng: listing.lng || -58.16,
            status: listing.status === "live" ? "live" : "hidden",
            photos: listing.photos || [],
            featured: Boolean(listing.featured),
          });
        }
        setLoading(false);
      })
      .catch(() => {
        setMessage("Could not load this listing.");
        setLoading(false);
      });
  }, [id]);

  const checks = [
    { ok: draft.photos.length > 0, label: "Add a photo." },
    { ok: Number.isFinite(draft.lat) && Number.isFinite(draft.lng), label: "Drop a pin on the map." },
    { ok: Number(draft.priceGyd.replace(/,/g, "")) > 0, label: "Enter a price in GYD." },
    { ok: Boolean(draft.area), label: "Choose an area." },
    { ok: draft.description.trim().length >= 40, label: "Write a description of 40 characters or more." },
  ];

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setMessage("");
    const next = [...draft.photos];
    try {
      for (const file of Array.from(files)) {
        if (next.length >= 12) break;
        const blob = await compressImage(file);
        const body = new FormData();
        body.set("file", new File([blob], "photo.jpg", { type: "image/jpeg" }));
        const res = await fetch("/api/agent/photos", { method: "POST", body });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "That photo could not be saved.");
        next.push(data.url);
      }
      setDraft({ ...draft, photos: next });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "That photo could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  function movePhoto(index: number, dir: number) {
    const target = index + dir;
    if (target < 0 || target >= draft.photos.length) return;
    const photos = [...draft.photos];
    const [item] = photos.splice(index, 1);
    photos.splice(target, 0, item);
    setDraft({ ...draft, photos });
  }

  async function writeListing() {
    setAiNote("");
    const res = await fetch("/api/assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task: "listing-draft", notes }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setAiNote("AI is not available, continue manually.");
      return;
    }
    if (data.error) {
      setAiNote(data.error);
      return;
    }
    const area = areas.find((item) => item.name === data.area);
    setDraft({
      ...draft,
      title: data.title || draft.title,
      description: data.description || draft.description,
      purpose: data.purpose === "Rent" ? "Rent" : "Sale",
      type: data.type || draft.type,
      area: area?.name || draft.area,
      region: area?.region || draft.region,
      beds: data.beds || draft.beds,
      baths: data.baths || draft.baths,
      priceGyd: data.priceGyd ? String(data.priceGyd) : draft.priceGyd,
      priceSuggested: Boolean(data.priceGyd),
    });
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const res = await fetch("/api/agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "saveListing", ...draft, priceGyd: draft.priceGyd }) });
    const data = await res.json();
    setBusy(false);
    if (data.error === "Publishing another live listing is blocked." || res.status === 403) {
      setMessage(`${data.live ?? live} of ${data.cap ?? cap} live listings are in use. Publishing another live listing is blocked.`);
      return;
    }
    if (!res.ok) {
      setMessage(data.error || "The listing could not be saved.");
      return;
    }
    if (data.pending) {
      setMessage("Saved as hidden. An admin has to approve this account before a listing can go live.");
      if (data.id && data.id !== id) router.replace(`/agent/listings/${data.id}`);
      return;
    }
    else setMessage("Saved.");
  }

  if (loading) return <DeskSkeleton count={3} />;
  const missing = checks.find((check) => !check.ok);
  const blocked = message.includes("blocked");
  const nextLine = blocked ? message : missing ? `Still needed: ${missing.label.replace(/\.$/, "")}.` : "Listing check is complete.";

  return (
    <form className="stack" onSubmit={save}>
      <p className="eyebrow">Listing</p>
      <h1>{id === "new" ? "New listing" : "Edit listing"}</h1>
      <p className="quiet">{live} live. Listings are free. A hidden listing stays off the public site.</p>
      <p className="ai-bar next"><span>{nextLine}</span></p>
      <div className="panel">
        <p className="quiet">Rough notes</p>
        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="3 bed house in Kitty, sale, 45 million, raised timber" />
        <button className="btn ghost" type="button" onClick={() => void writeListing()}>Write the listing</button>
        {aiNote ? <p>{aiNote}</p> : null}
      </div>
      <label>Purpose
        <select value={draft.purpose} onChange={(event) => setDraft({ ...draft, purpose: event.target.value === "Rent" ? "Rent" : "Sale" })}>
          <option>Sale</option><option>Rent</option>
        </select>
      </label>
      <label>Type
        <select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value })}>
          <option>House</option><option>Apartment</option><option>Land</option><option>Commercial</option>
        </select>
      </label>
      <label>Title<input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
      <label>Area
        <select value={draft.area} onChange={(event) => {
          const area = areas.find((item) => item.name === event.target.value);
          setDraft({ ...draft, area: area?.name || "", region: area?.region || "" });
        }}>
          <option value="">Choose an area</option>
          {areas.map((area) => <option key={area.slug}>{area.name}</option>)}
        </select>
      </label>
      <p className="quiet">Region: {draft.region || "Chosen with the area"}</p>
      <label>Price GYD
        <input value={draft.priceGyd} onChange={(event) => setDraft({ ...draft, priceGyd: event.target.value, priceSuggested: false })} inputMode="numeric" />
      </label>
      {draft.priceSuggested ? <p className="quiet">Suggestion</p> : null}
      <label>Beds<input value={draft.beds} onChange={(event) => setDraft({ ...draft, beds: event.target.value })} inputMode="numeric" /></label>
      <label>Baths<input value={draft.baths} onChange={(event) => setDraft({ ...draft, baths: event.target.value })} inputMode="numeric" /></label>
      <label>Sqft<input value={draft.sqft} onChange={(event) => setDraft({ ...draft, sqft: event.target.value })} inputMode="numeric" /></label>
      <label>Description<textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
      <label>Title reference
        <input value={draft.titleRef} onChange={(event) => setDraft({ ...draft, titleRef: event.target.value })} placeholder="Transport or certificate of title" />
      </label>
      <label>Title status
        <select value={draft.titleStatus} onChange={(event) => setDraft({ ...draft, titleStatus: event.target.value })}>
          <option value="">Not set</option>
          {titleStatuses.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </label>
      <p className="quiet">A listing is not proof of title. Status is what the agent has on file. Buyers can request a title check.</p>
      <div className="panel">
        <strong>Services at the property</strong>
        <p className="quiet">Optional. Enter only what you know. Leave speed blank unless you have a figure to share. Guyana Keys does not check signal or coverage.</p>
        <p>Mobile networks</p>
        <div className="check-row">
          {mobileNetworks.map((name) => (
            <label key={name}><input type="checkbox" checked={draft.mobileNetworks.includes(name)} onChange={(event) => setDraft({ ...draft, mobileNetworks: event.target.checked ? [...draft.mobileNetworks, name] : draft.mobileNetworks.filter((item) => item !== name) })} /> {name}</label>
          ))}
        </div>
        <p>Broadband or fibre</p>
        <div className="check-row">
          {broadbandProviders.map((name) => (
            <label key={name}><input type="checkbox" checked={draft.broadbandProviders.includes(name)} onChange={(event) => setDraft({ ...draft, broadbandProviders: event.target.checked ? [...draft.broadbandProviders, name] : draft.broadbandProviders.filter((item) => item !== name) })} /> {name}</label>
          ))}
        </div>
        <label>Broadband speed, optional<input value={draft.broadbandSpeed} onChange={(event) => setDraft({ ...draft, broadbandSpeed: event.target.value })} placeholder="Leave blank if you have no measured speed" /></label>
        <label>Water
          <select value={draft.waterSupply} onChange={(event) => setDraft({ ...draft, waterSupply: event.target.value })}>
            <option value="">Not set</option>
            {waterSupplies.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <label>Electricity
          <select value={draft.electricity} onChange={(event) => setDraft({ ...draft, electricity: event.target.value })}>
            <option value="">Not set</option>
            {electricitySupplies.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <label>Road access
          <select value={draft.roadAccess} onChange={(event) => setDraft({ ...draft, roadAccess: event.target.value })}>
            <option value="">Not set</option>
            {roadAccesses.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <label>Drainage or flood note<textarea value={draft.drainageNote} onChange={(event) => setDraft({ ...draft, drainageNote: event.target.value })} placeholder="Only what you have observed or been told" /></label>
        <label>Around the area<textarea value={draft.areaNote} onChange={(event) => setDraft({ ...draft, areaNote: event.target.value })} placeholder="A short note about the streets nearby" /></label>
      </div>
      <label>Status
        <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value === "live" ? "live" : "hidden" })}>
          <option value="hidden">Hidden</option>
          <option value="live">Live</option>
        </select>
      </label>
      <div className="panel">
        <strong>Photos</strong>
        <p className="quiet">Up to twelve. The first photo is the cover. Drag a photo onto another to reorder.</p>
        <input type="file" accept="image/*" multiple onChange={(event) => void upload(event.target.files)} />
        <div className="photo-grid">
          {draft.photos.map((url, index) => (
            <div key={url}
              draggable
              onDragStart={(event) => event.dataTransfer.setData("text/plain", String(index))}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const from = Number(event.dataTransfer.getData("text/plain"));
                if (!Number.isFinite(from) || from === index) return;
                const photos = [...draft.photos];
                const [item] = photos.splice(from, 1);
                photos.splice(index, 0, item);
                setDraft({ ...draft, photos });
              }}>
              <img src={url} alt="" style={{ height: 120 }} />
              <p className="quiet">{index === 0 ? "Cover" : `Photo ${index + 1}`}</p>
              <button className="btn ghost" type="button" onClick={() => movePhoto(index, -1)}>Move earlier</button>
              <button className="btn ghost" type="button" onClick={() => setDraft({ ...draft, photos: draft.photos.filter((item) => item !== url) })}>Remove photo</button>
            </div>
          ))}
        </div>
      </div>
      <div className="panel">
        <strong>Pin</strong>
        <p className="quiet">Click or drag the pin. It starts near Georgetown.</p>
        <PinMap lat={draft.lat} lng={draft.lng} onChange={(lat, lng) => setDraft((current) => ({ ...current, lat, lng }))} />
        <p className="quiet">Pin: {draft.lat.toFixed(5)}, {draft.lng.toFixed(5)}</p>
      </div>
      <ul className="tick-list">
        {checks.map((check) => <li key={check.label} className={check.ok ? "ok" : ""}>{check.ok ? "Done. " : ""}{check.label}</li>)}
      </ul>
      {message && !blocked ? <p>{message}</p> : null}
      <div className="actions">
        <button className={blocked ? "btn ghost" : "btn"} type="submit" disabled={busy}>{busy ? "Please wait..." : "Save listing"}</button>
        {blocked ? <a className="btn" href="/agent/plan">Contact admin to upgrade</a> : null}
      </div>
      {id !== "new" && draft.featured ? <p className="quiet">This listing is featured.</p> : null}
      {id !== "new" && !draft.featured && draft.status !== "live" ? <p className="quiet">A hidden listing cannot be featured. Publish it live, then contact the admin.</p> : null}
      {id !== "new" ? (
        <div className="actions">
          {draft.status === "live" && !draft.featured ? <a className="btn ghost" href={`/agent/plan?listing=${id}`}>Contact admin to feature</a> : null}
          <button className="btn ghost" type="button" onClick={async () => {
            const res = await fetch("/api/agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "duplicate", id }) });
            const data = await res.json();
            if (res.ok && data.id) router.push(`/agent/listings/${data.id}`);
            else setMessage(data.error || "The copy could not be made.");
          }}>Duplicate</button>
          <button className="btn ghost" type="button" onClick={async () => {
            await fetch("/api/agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "hide", id }) });
            setDraft({ ...draft, status: "hidden" });
            setMessage("Hidden. It is off the public site.");
          }}>Hide</button>
          <button className="btn ghost" type="button" onClick={async () => {
            if (!window.confirm("Delete this listing? Enquiries stay.")) return;
            const res = await fetch("/api/agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete", id }) });
            if (res.ok) router.push("/agent/listings");
            else setMessage("The listing could not be deleted.");
          }}>Delete</button>
        </div>
      ) : null}
    </form>
  );
}
