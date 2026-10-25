import type { Metadata } from "next";
import Link from "next/link";
import { FilterSheet } from "../../components/FilterSheet";
import { ListingCard } from "../../components/ListingCard";
import { MapView } from "../../components/MapView";
import { PrelaunchBoard } from "../../components/PrelaunchBoard";
import { SaveSearch } from "../../components/SaveSearch";
import { SearchPanel } from "../../components/SearchPanel";
import { loadCatalog } from "../../lib/catalog";
import { filterListings, listingsPath, searchFormState, type SearchQuery } from "../../lib/listing-search";
import { withCanonical } from "../../lib/seo";

function listingMode(purpose?: string, type?: string) {
  if (type === "Commercial") return { kind: "commercial" as const, title: "Commercial property in Guyana" };
  if (type === "Land" || purpose === "Land") return { kind: "land" as const, title: "Land in Guyana" };
  if (purpose === "Rent") return { kind: "rent" as const, title: "Property to rent in Guyana" };
  if (purpose === "Sale") return { kind: "buy" as const, title: "Property for sale in Guyana" };
  return { kind: "search" as const, title: "Search property in Guyana" };
}

function searchLabel(params: SearchQuery) {
  const bits = [
    params.purpose === "Rent" ? "Rent" : params.purpose === "Sale" ? "Buy" : params.purpose === "Land" ? "Land" : "",
    params.type || "",
    params.area || "",
    params.region || "",
    params.beds ? `${params.beds}+ bedrooms` : "",
    params.generator === "yes" ? "Generator" : params.generator === "no" ? "No generator" : "",
    params.waterTank === "yes" ? "Water tank" : params.waterTank === "no" ? "No water tank" : "",
    params.parking || "",
  ].filter(Boolean);
  return bits.length ? bits.join(" · ") : "All listings";
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchQuery> }): Promise<Metadata> {
  const params = await searchParams;
  const mode = listingMode(params.purpose, params.type);
  const label = searchLabel(params);
  const extra = label.split(" · ").map((bit) => bit.trim()).filter((bit) => bit && !["All listings", "Buy", "Rent", "Land", "Commercial"].includes(bit));
  const title = extra.length ? `${mode.title}: ${extra.join(" · ")} | Guyana Keys` : `${mode.title} | Guyana Keys`;
  const descriptions = {
    buy: "Houses and apartments for sale in Guyana.",
    rent: "Rentals across Guyana, with prices in GYD and a USD guide.",
    land: "House lots and other land in Guyana.",
    commercial: "Offices, shops, and commercial property in Guyana.",
    search: "Search homes, rentals, and land in Guyana. Free to list, no limits. A listing is not proof of title.",
  } as const;
  const description = extra.length ? `${descriptions[mode.kind]} ${extra.join(" · ")}.` : descriptions[mode.kind];
  return withCanonical(listingsPath(params), { title, description });
}

export default async function ListingsPage({ searchParams }: { searchParams: Promise<SearchQuery> }) {
  const params = await searchParams;
  const { listings } = await loadCatalog();
  const { shown, purpose, type } = filterListings(listings, params);
  const share = listingsPath(params);
  const form = searchFormState(params);
  const mode = listingMode(purpose, type);
  return (
    <main className="wrap section">
      <h1>{mode.title}</h1>
      <FilterSheet>
        <SearchPanel initial={form} />
      </FilterSheet>
      <SaveSearch href={share} label={searchLabel(params)} />
      {listings.length === 0 ? <PrelaunchBoard kind={mode.kind} /> : (
        <>
          <p className="sub">{shown.length} homes · Listed on Guyana Keys · GYD with a USD guide · not proof of title · <Link href="/listings">Clear</Link></p>
          {shown.length === 0 ? <p>No home matches. Try a neighbourhood, or clear a filter.</p> : <div className="grid">{shown.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div>}
        </>
      )}
      <MapView listings={shown} />
    </main>
  );
}
