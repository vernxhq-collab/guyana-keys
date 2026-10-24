"use client";

import { useState } from "react";

const modes = [
  { id: "buy", label: "Buy", purpose: "Sale", type: "" },
  { id: "rent", label: "Rent", purpose: "Rent", type: "" },
  { id: "land", label: "Land", purpose: "", type: "Land" },
  { id: "commercial", label: "Commercial", purpose: "", type: "Commercial" },
] as const;

export function HomeSearch({ areas }: { areas: { slug: string; name: string }[] }) {
  const [mode, setMode] = useState<(typeof modes)[number]["id"]>("buy");
  const current = modes.find((item) => item.id === mode) || modes[0];

  return (
    <form className="home-search" action="/listings" id="home-search">
      <div className="home-search-tabs" role="tablist" aria-label="Buy, rent, land, or commercial">
        {modes.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={mode === item.id}
            className={mode === item.id ? "on" : ""}
            onClick={() => setMode(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {current.purpose ? <input type="hidden" name="purpose" value={current.purpose} /> : null}
      {current.type ? <input type="hidden" name="type" value={current.type} /> : null}
      <div className="home-search-fields">
        <label>
          <span>Area</span>
          <input name="q" list="home-areas" placeholder="Neighbourhood, such as Bel Air Park" aria-label="Area" />
        </label>
        <datalist id="home-areas">{areas.map((area) => <option key={area.slug} value={area.name} />)}</datalist>
        <label>
          <span>Budget</span>
          <select name="budget" defaultValue="" aria-label="Budget">
            <option value="">Any budget</option>
            <option value="20000000">Up to 20 million GYD</option>
            <option value="50000000">Up to 50 million GYD</option>
            <option value="100000000">Up to 100 million GYD</option>
          </select>
        </label>
        <button className="btn" type="submit">Search</button>
      </div>
    </form>
  );
}
