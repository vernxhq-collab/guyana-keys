import Link from "next/link";
import { money, usd } from "../lib/data";
import { SAMPLE_LABEL } from "../lib/sample-label";

export type MarketCardData = {
  id: string;
  href: string;
  title: string;
  area: string;
  purpose: "Sale" | "Rent";
  type: string;
  priceGyd: number;
  beds: number;
  baths: number;
  sqft: number;
  agent?: string;
  founding?: boolean;
  isNew?: boolean;
  reduced?: boolean;
  sample?: boolean;
  image?: string;
};

export function MarketCard({ card }: { card: MarketCardData }) {
  const land = card.type === "Land";
  const facts = [
    land && card.sqft > 0 ? `${card.sqft.toLocaleString("en-GY")} sqft` : "",
    !land && card.beds > 0 ? `${card.beds} bed` : "",
    card.baths > 0 ? `${card.baths} bath` : "",
  ].filter(Boolean);
  return (
    <Link className="market-card" href={card.href}>
      <div className={card.sample ? "market-photo sample" : "market-photo"}>
        {card.image ? <img src={card.image} alt="" /> : null}
        {card.isNew ? <span className="market-flag">New</span> : null}
        {card.reduced ? <span className="market-flag alt">Reduced</span> : null}
      </div>
      <div className="market-card-body">
        <p className="market-price">{money(card.priceGyd, card.purpose)}</p>
        <p className="market-usd">Guide USD {usd(card.priceGyd).toLocaleString("en-US")}</p>
        <strong>{card.title}</strong>
        <p className="meta">{card.area}</p>
        {facts.length ? <p className="market-facts">{facts.join(" · ")}</p> : null}
        {card.agent ? <p className="market-agent">{card.agent}{card.founding ? " · Founding agent" : ""}</p> : null}
        {card.sample ? <p className="market-sample">{SAMPLE_LABEL}</p> : null}
      </div>
    </Link>
  );
}
