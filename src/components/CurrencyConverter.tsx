"use client";

import { useState } from "react";
import { GYD_PER_USD, gyd, usdFromGyd } from "../lib/mortgage";
import { usdGuideNote } from "../lib/usd-guide";

function grouped(value: string) {
  const clean = value.replace(/[^\d]/g, "").replace(/^0+(?=\d)/, "");
  if (!clean) return "";
  return new Intl.NumberFormat("en-GY").format(Number(clean));
}

export function CurrencyConverter() {
  const [amount, setAmount] = useState(grouped("1000000"));
  const [fromUsd, setFromUsd] = useState(false);
  const value = Number(amount.replace(/,/g, "")) || 0;
  const result = fromUsd ? gyd(value * GYD_PER_USD) : usdFromGyd(value);

  function swap() {
    const next = fromUsd ? Math.round(value * GYD_PER_USD) : Math.round(value / GYD_PER_USD);
    setAmount(grouped(String(next)));
    setFromUsd((current) => !current);
  }

  return (
    <div className="panel converter">
      <label className="field" htmlFor="fx-amount">
        <span>{fromUsd ? "US dollars" : "Guyana dollars"}</span>
        <span className="money-field">
          <span>{fromUsd ? "USD" : "GYD"}</span>
          <input id="fx-amount" inputMode="numeric" value={amount} onChange={(event) => setAmount(grouped(event.target.value))} />
        </span>
      </label>
      <button className="btn ghost swap" type="button" onClick={swap}>Swap</button>
      <div className="convert-out">
        <p className="convert-label">{fromUsd ? "Guyana dollars" : "US dollars"}</p>
        <p className="convert-result">{result}</p>
      </div>
      <p className="note">{usdGuideNote()}</p>
    </div>
  );
}
