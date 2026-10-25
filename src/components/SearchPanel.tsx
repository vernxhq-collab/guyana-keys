"use client";

import { useState } from "react";
import { areas, regionSlug } from "../lib/areas";
import { GYD_PER_USD } from "../lib/data";
import { usdGuideNote } from "../lib/usd-guide";
import { searchPlaceholder } from "../lib/search";
import { generatorChoices, parkingChoices, waterTankChoices } from "../lib/site-facts";

type Initial = {
  q?: string;
  purpose?: string;
  type?: string;
  beds?: string;
  region?: string;
  area?: string;
  sort?: string;
  currency?: string;
  min?: string;
  max?: string;
  generator?: string;
  waterTank?: string;
  parking?: string;
};

export function SearchPanel({ initial }: { initial: Initial }) {
  const [currency, setCurrency] = useState(initial.currency === "usd" ? "usd" : "gyd");
  const [min, setMin] = useState(initial.min || "");
  const [max, setMax] = useState(initial.max || "");
  const regions = Array.from(new Set(areas.map((area) => area.region)));

  function flip(next: "gyd" | "usd") {
    if (next === currency) return;
    const convert = (value: string) => {
      const number = Number(String(value).replace(/,/g, ""));
      if (!value || !Number.isFinite(number)) return value;
      const out = next === "usd" ? number / GYD_PER_USD : number * GYD_PER_USD;
      return String(Math.round(out));
    };
    setMin(convert(min));
    setMax(convert(max));
    setCurrency(next);
  }

  return (
    <form className="search-panel plain" action="/listings">
      <label className="ask">
        <input name="q" list="areas" defaultValue={initial.q || ""} placeholder={searchPlaceholder} aria-label="Words or neighbourhood" />
      </label>
      <datalist id="areas">{areas.map((area) => <option key={area.slug} value={area.name} />)}</datalist>
      <div className="filter-row">
        <select name="purpose" defaultValue={initial.purpose || ""} aria-label="Buy or rent">
          <option value="">Buy or rent</option>
          <option value="Sale">Buy</option>
          <option value="Rent">Rent</option>
          <option value="Land">Land</option>
        </select>
        <select name="type" defaultValue={initial.type || ""} aria-label="Property type">
          <option value="">Any type</option>
          <option>House</option>
          <option>Apartment</option>
          <option>Land</option>
          <option>Commercial</option>
        </select>
        <select name="beds" defaultValue={initial.beds || ""} aria-label="Minimum bedrooms">
          <option value="">Any bedrooms</option>
          <option value="1">1+ bedrooms</option>
          <option value="2">2+ bedrooms</option>
          <option value="3">3+ bedrooms</option>
          <option value="4">4+ bedrooms</option>
          <option value="5">5+ bedrooms</option>
        </select>
        <select name="area" defaultValue={initial.area || ""} aria-label="Area">
          <option value="">Any area</option>
          {areas.map((area) => <option key={area.slug} value={area.slug}>{area.name}</option>)}
        </select>
        <select name="region" defaultValue={initial.region || ""} aria-label="Region">
          <option value="">Any region</option>
          {regions.map((item) => <option key={item} value={regionSlug(item)}>{item}</option>)}
        </select>
      </div>
      <div className="filter-row">
        <fieldset className="currency-toggle">
          <legend>Price</legend>
          <label><input type="radio" name="currency" value="gyd" checked={currency === "gyd"} onChange={() => flip("gyd")} /> GYD</label>
          <label><input type="radio" name="currency" value="usd" checked={currency === "usd"} onChange={() => flip("usd")} /> USD</label>
        </fieldset>
        <label>Minimum
          <input name="min" value={min} onChange={(event) => setMin(event.target.value)} inputMode="decimal" aria-label="Minimum price" />
        </label>
        <label>Maximum
          <input name="max" value={max} onChange={(event) => setMax(event.target.value)} inputMode="decimal" aria-label="Maximum price" />
        </label>
        <select name="generator" defaultValue={initial.generator || ""} aria-label="Generator">
          <option value="">Any generator</option>
          {generatorChoices.filter((item) => item.id !== "unknown").map((item) => <option key={item.id} value={item.id}>{item.id === "yes" ? "Has a generator" : "No generator"}</option>)}
        </select>
        <select name="waterTank" defaultValue={initial.waterTank || ""} aria-label="Water tank">
          <option value="">Any water tank</option>
          {waterTankChoices.map((item) => <option key={item.id} value={item.id}>{item.id === "yes" ? "Has a water tank" : "No water tank"}</option>)}
        </select>
        <select name="parking" defaultValue={initial.parking || ""} aria-label="Parking">
          <option value="">Any parking</option>
          {parkingChoices.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
        <select name="sort" defaultValue={initial.sort || "price-desc"} aria-label="Sort">
          <option value="price-desc">Highest price</option>
          <option value="price-asc">Lowest price</option>
        </select>
        <button className="btn" type="submit">Search</button>
      </div>
      <p className="quiet">{usdGuideNote()} A search link keeps these filters.</p>
    </form>
  );
}
