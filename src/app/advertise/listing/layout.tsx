import type { Metadata } from "next";
import { withCanonical } from "../../../lib/seo";

export const metadata: Metadata = withCanonical("/advertise/listing", {
  title: "Advertise a listing | Guyana Keys",
  description: "Listings are free. Contact Guyana Keys to feature a listing or advertise.",
});

export default function AdvertiseListingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
