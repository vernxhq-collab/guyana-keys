"use client";

import { useState } from "react";
import { GYD_PER_USD, gyd, usdFromGyd } from "../lib/mortgage";

export function CurrencyConverter() {
  const [gydAmount, setGydAmount] = useState("1000000");
  const [usdAmount, setUsdAmount] = useState(String(Math.round(1_000_000 / GYD_PER_USD)));

  return (
    <div className="panel tool-form">
      <label>GYD<input inputMode="decimal" value={gydAmount} onChange={(event) => {
        setGydAmount(event.target.value);
        const value = Number(event.target.value.replace(/,/g, ""));
        setUsdAmount(Number.isFinite(value) ? String(Math.round(value / GYD_PER_USD)) : "");
      }} /></label>
      <p className="meta">{usdFromGyd(Number(gydAmount.replace(/,/g, "")) || 0)}</p>
      <label>USD<input inputMode="decimal" value={usdAmount} onChange={(event) => {
        setUsdAmount(event.target.value);
        const value = Number(event.target.value.replace(/,/g, ""));
        setGydAmount(Number.isFinite(value) ? String(Math.round(value * GYD_PER_USD)) : "");
      }} /></label>
      <p className="meta">{gyd(Number(usdAmount.replace(/,/g, "") || 0) * GYD_PER_USD)}</p>
      <p className="disclaimer">Guide only: 1 USD ≈ {GYD_PER_USD} GYD. Banks use their own rate on the day.</p>
    </div>
  );
}
