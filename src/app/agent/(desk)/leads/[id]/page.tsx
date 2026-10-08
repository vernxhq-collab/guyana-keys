"use client";

import { useParams } from "next/navigation";
import { LeadDesk } from "../../../../../components/LeadDesk";

export default function LeadPage() {
  const params = useParams<{ id: string }>();
  return <LeadDesk id={params.id} />;
}
