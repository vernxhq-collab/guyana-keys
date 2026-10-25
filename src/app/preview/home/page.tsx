import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarketHome } from "../../../components/MarketHome";
import { previewEnabled } from "../../../lib/preview/http";
import { marketSample } from "../../../lib/market-sample";
import { privateMeta } from "../../../lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = privateMeta("/preview/home", "Market preview | Guyana Keys", "Private sample of the homepage. These cards are not on the public site.");

export default function PreviewHomePage() {
  if (!previewEnabled()) notFound();
  return <MarketHome cards={marketSample} sample />;
}
