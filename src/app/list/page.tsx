import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { withCanonical } from "../../lib/seo";

export const metadata: Metadata = withCanonical("/list", {
  title: "Continue to list your property | Guyana Keys",
  description: "This address continues to the page where you list a property. Free to list, no limits.",
});

export default function ListRedirect() {
  redirect("/advertise");
}
