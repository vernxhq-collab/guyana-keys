import type { Metadata } from "next";
import { photoCredits } from "../../lib/attribution";
import { withCanonical } from "../../lib/seo";

export const metadata: Metadata = withCanonical("/credits", {
  title: "Photo credits | Guyana Keys",
  description: "Authors and licences for photographs on Guyana Keys. Photos are illustrative and are not listings.",
});

function shown(value: string) {
  const text = value.trim();
  return text || "Credit missing";
}

function CreditLink({ href, label }: { href: string; label: string }) {
  const url = href.trim();
  const text = label.trim();
  if (!url || !text) return <>Credit missing</>;
  return <a href={url} target="_blank" rel="noreferrer">{text}</a>;
}

export default function CreditsPage() {
  return (
    <main className="guide-page">
      <h1>Photo credits</h1>
      <p>Photos are illustrative and are not listings.</p>
      <ul className="credit-list">
        {photoCredits.map((photo) => (
          <li key={photo.file}>
            <p>{shown(photo.subject)}</p>
            <p>Photo: {shown(photo.author)}</p>
            <p><CreditLink href={photo.source} label="Source file" /></p>
            <p><CreditLink href={photo.licenceHref} label={photo.licence} /></p>
          </li>
        ))}
      </ul>
    </main>
  );
}
