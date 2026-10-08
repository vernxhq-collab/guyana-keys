"use client";

import { useParams } from "next/navigation";
import { ListingEditor } from "../../../../../components/ListingEditor";

export default function AgentListingPage() {
  const params = useParams<{ id: string }>();
  return <ListingEditor id={params.id} />;
}
