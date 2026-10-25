"use client";

import { useMemo, useState } from "react";
import { amortise, gyd, purchaseEstimate, usdFromGyd } from "../lib/mortgage";
import { usdGuideNote } from "../lib/usd-guide";

const terms = [5, 10, 15, 20, 25, 30, 35];

function grouped(value: string) {
  const clean = value.replace(/[^\d]/g, "").replace(/^0+(?=\d)/, "");
  if (!clean) return "";
  return new Intl.NumberFormat("en-GY").format(Number(clean));
}

function rateText(value: string) {
  const cleaned = value.replace(/[^\d.]/g, "");
  const [whole, fraction = ""] = cleaned.split(".");
  if (!cleaned.includes(".")) return whole.slice(0, 4);
  return `${whole.slice(0, 2)}.${fraction.replace(/\./g, "").slice(0, 2)}`;
}

function money(amount: number, unit: "GYD" | "USD") {
  return unit === "USD" ? usdFromGyd(amount) : gyd(amount);
}

export function MortgageCalculator({ priceGyd = 0 }: { priceGyd?: number }) {
  const opening = priceGyd > 0 ? priceGyd : 20_000_000;
  const [price, setPrice] = useState(grouped(String(opening)));
  const [down, setDown] = useState("20");
  const [downAmount, setDownAmount] = useState(grouped(String(Math.round(opening * 0.2))));
  const [rate, setRate] = useState("");
  const [term, setTerm] = useState("20");
  const [income, setIncome] = useState("");
  const [stamp, setStamp] = useState("");
  const [legal, setLegal] = useState("");
  const [unit, setUnit] = useState<"GYD" | "USD">("GYD");

  const priceValue = Number(price.replace(/,/g, "")) || 0;
  const downPct = Math.min(100, Math.max(0, Number(down) || 0));
  const loan = Number.isFinite(priceValue) ? Math.max(0, priceValue * (1 - downPct / 100)) : 0;

  const result = useMemo(() => {
    const annual = Number(rate);
    const hasRate = rate.trim() !== "" && Number.isFinite(annual) && annual >= 0;
    const payment = hasRate ? amortise(loan, annual, Number(term)) : null;
    const costs = purchaseEstimate(Number(stamp.replace(/,/g, "")), Number(legal.replace(/,/g, "")));
    const cash = (Number.isFinite(priceValue) ? priceValue * (downPct / 100) : 0) + costs.fees;
    const incomeValue = Number(income.replace(/,/g, ""));
    let afford = "Add monthly income for a simple affordability note.";
    if (payment && incomeValue > 0 && payment.monthly > 0) {
      const share = payment.monthly / incomeValue;
      afford = share <= 0.3
        ? `This payment is about ${Math.round(share * 100)}% of the income you entered. That is within a common 30% guide.`
        : `This payment is about ${Math.round(share * 100)}% of the income you entered. That is above a common 30% guide.`;
    }
    return { loan, payment, costs, cash, afford, downPct, hasRate, priceValue };
  }, [loan, priceValue, downPct, rate, term, income, stamp, legal]);

  function applyPrice(raw: string) {
    const next = grouped(raw);
    setPrice(next);
    const nextPrice = Number(next.replace(/,/g, "")) || 0;
    const pct = Math.min(100, Math.max(0, Number(down) || 0));
    setDownAmount(grouped(String(Math.round(nextPrice * pct / 100))));
  }

  function applyPct(raw: string) {
    const cleaned = raw.replace(/[^\d.]/g, "");
    const [whole, fraction = ""] = cleaned.split(".");
    const next = cleaned.includes(".") ? `${whole.slice(0, 3)}.${fraction.slice(0, 1)}` : whole.slice(0, 3);
    setDown(next);
    const nextPrice = Number(price.replace(/,/g, "")) || 0;
    const pct = Math.min(100, Math.max(0, Number(next) || 0));
    setDownAmount(grouped(String(Math.round(nextPrice * pct / 100))));
  }

  function applyAmount(raw: string) {
    const next = grouped(raw);
    setDownAmount(next);
    const nextPrice = Number(price.replace(/,/g, "")) || 0;
    const amount = Number(next.replace(/,/g, "")) || 0;
    if (nextPrice > 0) {
      const pct = Math.min(100, Math.max(0, (amount / nextPrice) * 100));
      setDown(String(Math.round(pct * 10) / 10));
    }
  }

  function typeRate(raw: string) {
    setRate(rateText(raw));
  }

  const other = unit === "GYD" ? "USD" : "GYD";
  const interest = result.payment?.totalInterest || 0;
  const chart = [
    { label: "Principal", value: result.loan, color: "#116b4a" },
    { label: "Interest", value: result.hasRate ? interest : 0, color: "#8fcfb0" },
    { label: "Cash upfront", value: result.cash, color: "#0c3d2c" },
  ].filter((part) => part.value > 0);
  const chartTotal = chart.reduce((sum, part) => sum + part.value, 0);
  let cursor = 0;
  const gradient = chartTotal <= 0
    ? "conic-gradient(#e7eae8 0 100%)"
    : `conic-gradient(${chart.map((part) => {
      const start = cursor;
      cursor += (part.value / chartTotal) * 100;
      return `${part.color} ${start}% ${cursor}%`;
    }).join(", ")})`;

  const rows: [string, string][] = [
    ["Loan amount", money(result.loan, unit)],
    ["Total interest", result.hasRate && result.payment ? money(result.payment.totalInterest, unit) : "Enter a rate"],
    ["Total repaid", result.hasRate && result.payment ? money(result.payment.totalPaid, unit) : "Enter a rate"],
    ["Stamp duty", result.costs.stamp > 0 ? money(result.costs.stamp, unit) : "Enter a figure"],
    ["Legal fees", result.costs.legal > 0 ? money(result.costs.legal, unit) : "Enter a figure"],
    ["Cash needed upfront", money(result.cash, unit)],
  ];

  return (
    <div className="calc-shell">
      <div className="calc">
        <form className="tool-form panel calc-form" onSubmit={(event) => event.preventDefault()}>
          <label className="field" htmlFor="calc-price">
            <span>Property price</span>
            <span className="money-field">
              <span>GYD</span>
              <input id="calc-price" inputMode="numeric" value={price} onChange={(event) => applyPrice(event.target.value)} />
            </span>
          </label>
          <div className="field-pair">
            <label className="field" htmlFor="calc-down">
              <span>Down payment</span>
              <span className="money-field">
                <span>%</span>
                <input id="calc-down" inputMode="decimal" value={down} onChange={(event) => applyPct(event.target.value)} />
              </span>
            </label>
            <label className="field" htmlFor="calc-down-amount">
              <span>Down payment amount</span>
              <span className="money-field">
                <span>GYD</span>
                <input id="calc-down-amount" inputMode="numeric" value={downAmount} onChange={(event) => applyAmount(event.target.value)} />
              </span>
            </label>
          </div>
          <label className="field" htmlFor="calc-rate">
            <span>Interest rate</span>
            <span className="slider-row">
              <input type="range" min="0" max="20" step="0.1" aria-label="Interest rate slider" value={rate === "" ? "0" : rate} onChange={(event) => typeRate(event.target.value)} />
              <span className="money-field slim">
                <input id="calc-rate" inputMode="decimal" value={rate} placeholder="Quoted" onChange={(event) => typeRate(event.target.value)} />
                <span>%</span>
              </span>
            </span>
          </label>
          <label className="field" htmlFor="calc-term">
            <span>Loan term</span>
            <span className="slider-row">
              <input type="range" min={terms[0]} max={terms[terms.length - 1]} step="1" aria-label="Loan term slider" value={term} onChange={(event) => setTerm(event.target.value)} />
              <span className="money-field slim">
                <input id="calc-term" inputMode="numeric" value={term} onChange={(event) => setTerm(event.target.value.replace(/[^\d]/g, "").slice(0, 2))} />
                <span>yrs</span>
              </span>
            </span>
          </label>
          <label className="field" htmlFor="calc-income">
            <span>Monthly income, optional</span>
            <span className="money-field">
              <span>GYD</span>
              <input id="calc-income" inputMode="numeric" value={income} onChange={(event) => setIncome(grouped(event.target.value))} />
            </span>
          </label>
          <div className="field-pair">
            <label className="field" htmlFor="calc-stamp">
              <span>Stamp duty, GYD</span>
              <span className="money-field">
                <span>GYD</span>
                <input id="calc-stamp" inputMode="numeric" value={stamp} placeholder="You enter this" onChange={(event) => setStamp(grouped(event.target.value))} />
              </span>
            </label>
            <label className="field" htmlFor="calc-legal">
              <span>Legal fees, GYD</span>
              <span className="money-field">
                <span>GYD</span>
                <input id="calc-legal" inputMode="numeric" value={legal} placeholder="You enter this" onChange={(event) => setLegal(grouped(event.target.value))} />
              </span>
            </label>
          </div>
        </form>
        <div className="panel calc-results">
          <div className="calc-head">
            <p className="meta">Monthly payment</p>
            <div className="unit-toggle" role="group" aria-label="Currency">
              <button type="button" className={unit === "GYD" ? "on" : ""} onClick={() => setUnit("GYD")}>GYD</button>
              <button type="button" className={unit === "USD" ? "on" : ""} onClick={() => setUnit("USD")}>USD</button>
            </div>
          </div>
          {result.hasRate && result.payment && result.payment.monthly > 0 ? (
            <>
              <p className="pay-figure">{money(result.payment.monthly, unit)}</p>
              <p className="pay-secondary">{money(result.payment.monthly, other)}</p>
            </>
          ) : (
            <>
              <p className="pay-figure quiet-figure">Add a rate</p>
              <p className="pay-secondary">The monthly payment appears after you type one.</p>
            </>
          )}
          <table className="cost-table">
            <tbody>
              {rows.map(([label, value]) => (
                <tr key={label}><td>{label}</td><td>{value}</td></tr>
              ))}
            </tbody>
          </table>
          <div className="donut-row">
            <div className="donut" style={{ background: gradient }} role="img" aria-label={chart.map((part) => `${part.label} ${money(part.value, unit)}`).join(", ")}>
              <div className="donut-hole" />
            </div>
            <ul className="donut-key">
              {chart.map((part) => (
                <li key={part.label}><i style={{ background: part.color }} />{part.label}<span>{money(part.value, unit)}</span></li>
              ))}
              {!result.hasRate ? <li className="note">Interest is shown after you enter a rate.</li> : null}
            </ul>
          </div>
          <p className="note">{result.afford}</p>
          <p className="note">Estimates only. Confirm the rate, stamp duty, and fees with the lender, and take independent professional advice. {usdGuideNote()}</p>
        </div>
      </div>
    </div>
  );
}
