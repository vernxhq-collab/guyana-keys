import type { ReactNode } from "react";
import type { Listing } from "../lib/data";
import { labelFor, roadAccesses, sizeFact, waterSupplies, electricitySupplies, emptyFacts } from "../lib/place-facts";
import { titleCopy } from "../lib/trust";

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#1a1f1c" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

function RowIcon({ children }: { children: ReactNode }) {
  return (
    <svg className="key-icon" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#1a1f1c" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

export function KeyFacts({ listing }: { listing: Listing }) {
  const facts = listing.facts || emptyFacts;
  const size = sizeFact(listing.type, listing.sqft);
  const title = listing.titleStatus ? titleCopy(listing.titleStatus).label : "Not set";
  const beds = listing.beds > 0 ? `${listing.beds} bed${listing.beds === 1 ? "" : "s"}` : "Not listed";
  const baths = listing.baths > 0 ? `${listing.baths} bath${listing.baths === 1 ? "" : "s"}` : "Not listed";
  const mobile = facts.mobileNetworks.join(", ");
  const broadband = facts.broadbandProviders.join(", ");
  const speed = facts.broadbandSpeed;
  const water = labelFor(facts.waterSupply, waterSupplies);
  const power = labelFor(facts.electricity, electricitySupplies);
  const road = labelFor(facts.roadAccess, roadAccesses);
  const agent = "Provided by the agent";
  const rows = [
    { label: "Mobile networks", value: mobile ? `${mobile}. ${agent}.` : "", icon: "signal" },
    { label: "Broadband", value: broadband ? `${speed ? `${broadband} · ${speed}` : broadband}. ${agent}.` : "", icon: "wifi" },
    { label: "Water", value: water ? `${water}. ${agent}.` : "", icon: "water" },
    { label: "Electricity", value: power ? `${power}. ${agent}.` : "", icon: "power" },
    { label: "Road access", value: road ? `${road}. ${agent}.` : "", icon: "road" },
    { label: "Drainage", value: facts.drainageNote ? `${facts.drainageNote} ${agent}.` : "", icon: "drop" },
    { label: "Around the area", value: facts.areaNote ? `${facts.areaNote} ${agent}.` : "", icon: "pin" },
  ];

  return (
    <section className="listing-facts">
      <div className="fact-strip">
        <div>
          <Icon><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" /></Icon>
          <span>{listing.type || "Type"}</span>
        </div>
        <div>
          <Icon><path d="M3 18V9h18v9" /><path d="M3 14h18" /><path d="M7 9V6h4v3" /></Icon>
          <span>{beds}</span>
        </div>
        <div>
          <Icon><path d="M6 20V10h4v10" /><path d="M6 14h4" /><path d="M14 20v-6h4v6" /><path d="M8 10V6h8v4" /></Icon>
          <span>{baths}</span>
        </div>
        <div>
          <Icon><path d="M4 16V8l8-4 8 4v8" /><path d="M9 16v-4h6v4" /></Icon>
          <span className="fact-size">{size.primary}</span>
          {size.secondary ? <span className="meta">{size.secondary}</span> : null}
        </div>
        <div>
          <Icon><path d="M7 3h10v18H7z" /><path d="M9 7h6M9 11h6M9 15h4" /></Icon>
          <span>{title}</span>
        </div>
      </div>
      {listing.type === "Land" && listing.sqft > 0 ? <p className="meta">Acres are calculated from the square feet on the listing.</p> : null}
      <section className="key-info">
        <h2>Key information</h2>
        <p className="sub">Entered by the agent. Guyana Keys does not measure signal, speed, water, or power.</p>
        <ul>
          {rows.map((row) => (
            <li key={row.label}>
              <RowIcon>
                {row.icon === "signal" ? <><rect x="8" y="3" width="8" height="18" rx="1.5" /><path d="M11 18h2" /></> : null}
                {row.icon === "wifi" ? <><path d="M5 10a10 10 0 0 1 14 0" /><path d="M8 13a6 6 0 0 1 8 0" /><path d="M12 17h.01" /></> : null}
                {row.icon === "water" ? <path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z" /> : null}
                {row.icon === "power" ? <path d="M13 2 4 14h7l-1 8 9-12h-7z" /> : null}
                {row.icon === "road" ? <><path d="M4 19 10 5h4l6 14" /><path d="M12 8v2M12 13v2" /></> : null}
                {row.icon === "drop" ? <><path d="M3 8c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2" /><path d="M3 14c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2" /><path d="M3 20c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2" /></> : null}
                {row.icon === "pin" ? <><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" /><circle cx="12" cy="10" r="2" /></> : null}
              </RowIcon>
              <span>
                <strong>{row.label}: </strong>
                <span className={row.value ? "" : "meta"}>{row.value || "Not provided by the agent."}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
