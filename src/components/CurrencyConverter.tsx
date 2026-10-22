"use client";

import { useState } from "react";
import { GYD_PER_USD, groupAmount, gyd, usdFromGyd } from "../lib/mortgage";

export function CurrencyConverter() {
  const [gydAmount, setGydAmount] = useState(groupAmount("1000000"));
  const [usdAmount, setUsdAmount] = useState(groupAmount(String(Math.round(1_000_000 / GYD_PER_USD))));

  return (
    <div className="panel tool-form">
      <label>GYD<input inputMode="decimal" value={gydAmount} onChange={(event) => {
        const next = groupAmount(event.target.value);
        setGydAmount(next);
        const value = Number(next.replace(/,/g, ""));
        setUsdAmount(Number.isFinite(value) ? groupAmount(String(Math.round(value / GYD_PER_USD))) : "");
      }} /></label>
      <p className="meta">{usdFromGyd(Number(gydAmount.replace(/,/g, "")) || 0)}</p>
      <label>USD<input inputMode="decimal" value={usdAmount} onChange={(event) => {
        const next = groupAmount(event.target.value);
        setUsdAmount(next);
        const value = Number(next.replace(/,/g, ""));
        setGydAmount(Number.isFinite(value) ? groupAmount(String(Math.round(value * GYD_PER_USD))) : "");
      }} /></label>
      <p className="meta">{gyd(Number(usdAmount.replace(/,/g, "") || 0) * GYD_PER_USD)}</p>
      <p className="disclaimer">Guide only: 1 USD ≈ {GYD_PER_USD} GYD. Banks use their own rate on the day.</p>
    </div>
  );
}
