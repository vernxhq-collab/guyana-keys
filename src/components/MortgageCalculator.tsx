"use client";

import { useMemo, useState } from "react";
import { GYD_PER_USD, amortise, gyd, purchaseEstimate, usdFromGyd } from "../lib/mortgage";

const years = [10, 15, 20, 25, 30, 35];

export function MortgageCalculator({ priceGyd = 0 }: { priceGyd?: number }) {
  const [price, setPrice] = useState(priceGyd > 0 ? String(priceGyd) : "");
  const [down, setDown] = useState("20");
  const [rate, setRate] = useState("");
  const [term, setTerm] = useState("20");
  const [income, setIncome] = useState("");
  const [stamp, setStamp] = useState("2");

  const result = useMemo(() => {
    const priceValue = Number(price.replace(/,/g, ""));
    const downPct = Math.min(100, Math.max(0, Number(down) || 0));
    const loan = Number.isFinite(priceValue) ? Math.max(0, priceValue * (1 - downPct / 100)) : 0;
    const annual = Number(rate);
    const hasRate = rate.trim() !== "" && Number.isFinite(annual) && annual >= 0;
    const payment = hasRate ? amortise(loan, annual, Number(term)) : null;
    const costs = purchaseEstimate(priceValue, Number(stamp));
    const cash = (Number.isFinite(priceValue) ? priceValue * (downPct / 100) : 0) + costs.fees;
    const incomeValue = Number(income.replace(/,/g, ""));
    let afford = "Add monthly income for a simple affordability note.";
    if (payment && incomeValue > 0 && payment.monthly > 0) {
      const share = payment.monthly / incomeValue;
      afford = share <= 0.3
        ? `This payment is about ${Math.round(share * 100)}% of the income you entered. That is within a common 30% guide.`
        : `This payment is about ${Math.round(share * 100)}% of the income you entered. That is above a common 30% guide.`;
    }
    return { loan, payment, costs, cash, afford, downPct, hasRate };
  }, [price, down, rate, term, income, stamp]);

  return (
    <div className="split">
      <form className="tool-form panel" onSubmit={(event) => event.preventDefault()}>
        <label>Property price (GYD)<input inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} /></label>
        <label>Down payment %<input inputMode="decimal" value={down} onChange={(event) => setDown(event.target.value)} /></label>
        <label>Interest rate %<input inputMode="decimal" value={rate} placeholder="Rate you were quoted" onChange={(event) => setRate(event.target.value)} /></label>
        <p className="disclaimer">Enter the rate you were quoted. Guyana Keys does not publish lender rates.</p>
        <label>Loan term (years)
          <select value={term} onChange={(event) => setTerm(event.target.value)}>
            {years.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>Monthly income (GYD, optional)<input inputMode="decimal" value={income} onChange={(event) => setIncome(event.target.value)} /></label>
        <label>Stamp duty estimate
          <select value={stamp} onChange={(event) => setStamp(event.target.value)}>
            <option value="2">About 2%</option>
            <option value="2.5">About 2.5%</option>
          </select>
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
        <p>Stamp duty about {result.costs.stampRate}% · {gyd(result.costs.stamp)} · {usdFromGyd(result.costs.stamp)}</p>
        <p>Legal fees about 1.5% · {gyd(result.costs.legal)} · {usdFromGyd(result.costs.legal)}</p>
        <p>Cash at the start, with the {result.downPct}% down payment · {gyd(result.cash)} · {usdFromGyd(result.cash)}</p>
        <p className="disclaimer">Estimates only. Confirm the rate, stamp duty, and legal fees with the lender and your attorney. The USD figure uses a guide of {GYD_PER_USD} GYD.</p>
      </div>
    </div>
  );
}
