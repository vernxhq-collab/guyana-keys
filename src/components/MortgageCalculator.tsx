"use client";

import { useMemo, useState } from "react";
import { GYD_PER_USD, amortise, groupAmount, gyd, purchaseEstimate, usdFromGyd } from "../lib/mortgage";
import { rateLine, type MortgageRate } from "../lib/rates";

const years = [10, 15, 20, 25, 30, 35];

function amount(raw: string) {
  const value = Number(raw.replace(/,/g, ""));
  return Number.isFinite(value) ? value : 0;
}

export function MortgageCalculator({ priceGyd = 0, rates = [] }: { priceGyd?: number; rates?: MortgageRate[] }) {
  const [price, setPrice] = useState(priceGyd > 0 ? groupAmount(String(priceGyd)) : "");
  const [usdPrice, setUsdPrice] = useState(priceGyd > 0 ? groupAmount(String(Math.round(priceGyd / GYD_PER_USD))) : "");
  const [down, setDown] = useState("20");
  const [picked, setPicked] = useState("");
  const [rate, setRate] = useState("");
  const [term, setTerm] = useState("20");
  const [income, setIncome] = useState("");
  const [stamp, setStamp] = useState("");
  const [legal, setLegal] = useState("");

  const chosen = rates.find((item) => item.id === picked) || null;

  const result = useMemo(() => {
    const priceValue = amount(price);
    const downPct = Math.min(100, Math.max(0, Number(down) || 0));
    const loan = Number.isFinite(priceValue) ? Math.max(0, priceValue * (1 - downPct / 100)) : 0;
    const annual = Number(rate);
    const hasRate = rate.trim() !== "" && Number.isFinite(annual) && annual >= 0;
    const payment = hasRate ? amortise(loan, annual, Number(term)) : null;
    const costs = purchaseEstimate(amount(stamp), amount(legal));
    const cash = (Number.isFinite(priceValue) ? priceValue * (downPct / 100) : 0) + costs.fees;
    const incomeValue = amount(income);
    let afford = "Add monthly income for a simple affordability note.";
    if (payment && incomeValue > 0 && payment.monthly > 0) {
      const share = payment.monthly / incomeValue;
      afford = share <= 0.3
        ? `This payment is about ${Math.round(share * 100)}% of the income you entered. That is within a common 30% guide.`
        : `This payment is about ${Math.round(share * 100)}% of the income you entered. That is above a common 30% guide.`;
    }
    const matchesBank = chosen && Math.abs(chosen.rate - annual) < 0.001;
    return { loan, payment, costs, cash, afford, downPct, hasRate, matchesBank };
  }, [price, down, rate, term, income, stamp, legal, chosen]);

  return (
    <div className="split">
      <form className="tool-form panel" onSubmit={(event) => event.preventDefault()}>
        <label>Property price (GYD)
          <input inputMode="decimal" value={price} onChange={(event) => {
            const next = groupAmount(event.target.value);
            setPrice(next);
            setUsdPrice(groupAmount(String(Math.round(amount(next) / GYD_PER_USD))));
          }} />
        </label>
        <label>Property price (USD guide)
          <input inputMode="decimal" value={usdPrice} onChange={(event) => {
            const next = groupAmount(event.target.value);
            setUsdPrice(next);
            setPrice(groupAmount(String(Math.round(amount(next) * GYD_PER_USD))));
          }} />
        </label>
        <p className="disclaimer">The USD box uses a guide of {GYD_PER_USD} GYD. It is not a bank rate.</p>
        <label>Down payment %<input inputMode="decimal" value={down} onChange={(event) => setDown(event.target.value)} /></label>
        <label>Checked bank rate
          <select value={picked} onChange={(event) => {
            const id = event.target.value;
            setPicked(id);
            const next = rates.find((item) => item.id === id);
            if (next) setRate(String(next.rate));
          }}>
            <option value="">I will type a rate</option>
            {rates.map((item) => <option key={item.id} value={item.id}>{item.bank} · {item.product} · {item.rate}%</option>)}
          </select>
        </label>
        <label>Interest rate %
          <input inputMode="decimal" value={rate} placeholder="Rate you were quoted" onChange={(event) => setRate(event.target.value)} />
        </label>
        {chosen && result.matchesBank ? (
          <p className="disclaimer">{rateLine(chosen)}. <a href={chosen.sourceUrl}>Source</a></p>
        ) : rate.trim() ? (
          <p className="disclaimer">You entered this rate. It is not a rate from a bank page.</p>
        ) : (
          <p className="disclaimer">Choose a checked rate, or type the rate you were quoted.</p>
        )}
        <label>Loan term (years)
          <select value={term} onChange={(event) => setTerm(event.target.value)}>
            {years.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>Monthly income (GYD, optional)
          <input inputMode="decimal" value={income} onChange={(event) => setIncome(groupAmount(event.target.value))} />
        </label>
        <label>Stamp or transfer amount you enter (GYD)
          <input inputMode="decimal" value={stamp} placeholder="Leave blank if you have no figure" onChange={(event) => setStamp(groupAmount(event.target.value))} />
        </label>
        <label>Legal amount you enter (GYD)
          <input inputMode="decimal" value={legal} placeholder="Leave blank if you have no figure" onChange={(event) => setLegal(groupAmount(event.target.value))} />
        </label>
      </form>
      <div className="panel">
        <p className="meta">Monthly payment</p>
        {result.payment ? (
          <>
            <p className="figure">{gyd(result.payment.monthly)}</p>
            <p className="meta">{usdFromGyd(result.payment.monthly)}</p>
            <p>Total interest {gyd(result.payment.totalInterest)} · {usdFromGyd(result.payment.totalInterest)}</p>
            <p>Total of payments {gyd(result.payment.totalPaid)} · {usdFromGyd(result.payment.totalPaid)}</p>
            <p>Loan amount {gyd(result.loan)} · {usdFromGyd(result.loan)}</p>
            <p>{result.afford}</p>
          </>
        ) : <p>Enter an interest rate to estimate a payment.</p>}
        <h2>Purchase costs</h2>
        <p>Stamp or transfer you entered · {gyd(result.costs.stamp)} · {usdFromGyd(result.costs.stamp)}</p>
        <p>Legal amount you entered · {gyd(result.costs.legal)} · {usdFromGyd(result.costs.legal)}</p>
        <p>Cash at the start, with the {result.downPct}% down payment · {gyd(result.cash)} · {usdFromGyd(result.cash)}</p>
        <p className="disclaimer">This is an estimate, not financial advice. Confirm the rate and every fee with the lender and your attorney.</p>
      </div>
    </div>
  );
}
