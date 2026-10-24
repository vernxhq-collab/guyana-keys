import type { Metadata } from "next";
import Link from "next/link";
import { ComingSoon } from "../../components/ComingSoon";
import { ListingCard } from "../../components/ListingCard";
import { MapView } from "../../components/MapView";
import { SaveSearch } from "../../components/SaveSearch";
import { SearchPanel } from "../../components/SearchPanel";
import { loadCatalog } from "../../lib/catalog";
import { filterListings, listingsPath, searchFormState, type SearchQuery } from "../../lib/listing-search";
import { withCanonical } from "../../lib/seo";

function emptyListing(purpose?: string, type?: string) {
  if (type === "Land") return { heading: "No land listed yet", line: "Land will appear here as it is listed." };
  if (purpose === "Rent") return { heading: "No rentals listed yet", line: "Rentals will appear here as they are listed." };
  if (purpose === "Sale") return { heading: "No homes for sale yet", line: "Homes for sale will appear here as they are listed." };
  return { heading: "No homes listed yet", line: "Homes, rentals, and land will appear here as they are listed." };
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
  return withCanonical(listingsPath(params), {
    title: "Property in Guyana | Guyana Keys",
    description: "Search homes, rentals, and land in Guyana. Free to list, no limits. A listing is not proof of title.",
  });
}

export default async function ListingsPage({ searchParams }: { searchParams: Promise<SearchQuery> }) {
  const params = await searchParams;
  const { listings } = await loadCatalog();
  const { shown, purpose, type } = filterListings(listings, params);
  const share = listingsPath(params);
  const form = searchFormState(params);
  return (
    <main className="wrap section">
      <h1>Search property in Guyana</h1>
      <SearchPanel initial={form} />
      <SaveSearch href={share} label={searchLabel(params)} />
      {listings.length === 0 ? <ComingSoon {...emptyListing(purpose, type)} /> : (
        <>
          <p className="sub">{shown.length} homes · Listed on Guyana Keys · GYD with a USD guide · not proof of title · <Link href="/listings">Clear</Link></p>
          {shown.length === 0 ? <p>No home matches. Try a neighbourhood, or clear a filter.</p> : <div className="grid">{shown.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div>}
        </>
      )}
      <MapView listings={shown} />
    </main>
  );
}
