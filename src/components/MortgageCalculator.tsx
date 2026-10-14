"use client";

import { useEffect, useMemo, useState } from "react";
import { GYD_PER_USD, amortise, banks, gyd, purchaseEstimate, rateFor, usdFromGyd, type BankId } from "../lib/mortgage";

const years = [10, 15, 20, 25, 30, 35];

export function MortgageCalculator({ priceGyd = 0 }: { priceGyd?: number }) {
  const [price, setPrice] = useState(priceGyd > 0 ? String(priceGyd) : "");
  const [down, setDown] = useState("20");
  const [bank, setBank] = useState<BankId | "custom">("custom");
  const [rate, setRate] = useState("5");
  const [rateNote, setRateNote] = useState("Enter the rate you were quoted, or pick a bank.");
  const [term, setTerm] = useState("20");
  const [income, setIncome] = useState("");
  const [stamp, setStamp] = useState("2");
  const [customRate, setCustomRate] = useState(true);

  useEffect(() => {
    if (customRate || bank === "custom") return;
    const priceValue = Number(price.replace(/,/g, ""));
    const downPct = Math.min(100, Math.max(0, Number(down) || 0));
    const loan = Number.isFinite(priceValue) ? Math.max(0, priceValue * (1 - downPct / 100)) : 0;
    const picked = rateFor(bank, loan);
    setRate(String(picked.rate));
    setRateNote(picked.note);
  }, [price, down, bank, customRate]);

  const result = useMemo(() => {
    const priceValue = Number(price.replace(/,/g, ""));
    const downPct = Math.min(100, Math.max(0, Number(down) || 0));
    const loan = Number.isFinite(priceValue) ? Math.max(0, priceValue * (1 - downPct / 100)) : 0;
    const annual = Number(rate);
    const payment = amortise(loan, annual, Number(term));
    const costs = purchaseEstimate(priceValue, Number(stamp));
    const cash = (Number.isFinite(priceValue) ? priceValue * (downPct / 100) : 0) + costs.fees;
    const incomeValue = Number(income.replace(/,/g, ""));
    let afford = "Add monthly income for a simple affordability note.";
    if (incomeValue > 0 && payment.monthly > 0) {
      const share = payment.monthly / incomeValue;
      afford = share <= 0.3
        ? `This payment is about ${Math.round(share * 100)}% of the income you entered. That is within a common 30% guide.`
        : `This payment is about ${Math.round(share * 100)}% of the income you entered. That is above a common 30% guide.`;
    }
    return { loan, payment, costs, cash, afford, downPct };
  }, [price, down, rate, term, income, stamp]);

  function chooseBank(next: BankId | "custom") {
    setBank(next);
    if (next === "custom") {
      setCustomRate(true);
      setRateNote("Enter the rate you were quoted.");
      return;
    }
    const priceValue = Number(price.replace(/,/g, ""));
    const downPct = Math.min(100, Math.max(0, Number(down) || 0));
    const loan = Number.isFinite(priceValue) ? Math.max(0, priceValue * (1 - downPct / 100)) : 0;
    const picked = rateFor(next, loan);
    setRate(String(picked.rate));
    setRateNote(picked.note);
    setCustomRate(false);
  }

  return (
    <div className="split">
      <form className="tool-form panel" onSubmit={(event) => event.preventDefault()}>
        <label>Property price (GYD)<input inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} /></label>
        <label>Down payment %<input inputMode="decimal" value={down} onChange={(event) => setDown(event.target.value)} /></label>
        <label>Bank rate
          <select value={bank} onChange={(event) => chooseBank(event.target.value as BankId | "custom")}>
            <option value="custom">Custom rate</option>
            {banks.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label>Interest rate %<input inputMode="decimal" value={rate} onChange={(event) => { setRate(event.target.value); setCustomRate(true); setBank("custom"); setRateNote("Custom rate. Confirm it with the bank."); }} /></label>
        <p className="disclaimer">{rateNote}</p>
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
        <p className="figure">{gyd(result.payment.monthly)}</p>
        <p className="meta">{usdFromGyd(result.payment.monthly)}</p>
        <p>Total interest {gyd(result.payment.totalInterest)} · {usdFromGyd(result.payment.totalInterest)}</p>
        <p>Total of payments {gyd(result.payment.totalPaid)} · {usdFromGyd(result.payment.totalPaid)}</p>
        <p>Loan amount {gyd(result.loan)} · {usdFromGyd(result.loan)}</p>
        <p>{result.afford}</p>
        <h2>Purchase costs</h2>
        <p>Stamp duty about {result.costs.stampRate}% · {gyd(result.costs.stamp)} · {usdFromGyd(result.costs.stamp)}</p>
        <p>Legal fees about 1.5% · {gyd(result.costs.legal)} · {usdFromGyd(result.costs.legal)}</p>
        <p>Cash at the start, with the {result.downPct}% down payment · {gyd(result.cash)} · {usdFromGyd(result.cash)}</p>
        <p className="disclaimer">Estimates only. Confirm the rate, stamp duty, and legal fees with the bank and your attorney. The USD figure uses a guide of {GYD_PER_USD} GYD.</p>
      </div>
    </div>
  );
}
