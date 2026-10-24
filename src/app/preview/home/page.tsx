import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarketHome } from "../../../components/MarketHome";
import { previewEnabled } from "../../../lib/preview/http";
import { marketSample } from "../../../lib/market-sample";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Market preview", robots: { index: false, follow: false } };

export default function PreviewHomePage() {
  if (!previewEnabled()) notFound();
  return <MarketHome cards={marketSample} sample />;
}
