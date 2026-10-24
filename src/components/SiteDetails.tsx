import type { Listing } from "../lib/data";
import { floodChoices, furnishedChoices, generatorChoices, labelForSite, parkingChoices, waterTankChoices } from "../lib/site-facts";

export function SiteDetails({ listing }: { listing: Listing }) {
  const site = listing.site;
  const generator = labelForSite(site?.generator || "", generatorChoices);
  const tank = labelForSite(site?.waterTank || "", waterTankChoices);
  const parking = labelForSite(site?.parking || "", parkingChoices);
  const spaces = site?.parkingSpaces;
  const parkingLine = parking ? `${parking}${spaces != null ? ` · ${spaces} space${spaces === 1 ? "" : "s"}` : ""}` : "";
  const flood = labelForSite(site?.floodRisk || "", floodChoices);
  const furnished = labelForSite(site?.furnished || "", furnishedChoices);
  const notes = site?.waterNotes || "";
  const rows = [
    { label: "Generator", value: generator },
    { label: "Water tank", value: tank },
    { label: "Water notes", value: notes },
    { label: "Parking", value: parkingLine },
    { label: "Furnished", value: furnished },
  ].filter((row) => row.value);
  return (
    <section className="panel">
      <h2>At the property</h2>
      <p className="quiet">Optional details from the person who listed this home. Guyana Keys has not inspected the generator, water, parking, or furniture.</p>
      {rows.length === 0 && !flood ? <p>The lister has not added these details.</p> : (
        <ul>
          {rows.map((row) => <li key={row.label}><strong>{row.label}: </strong>{row.value}</li>)}
        </ul>
      )}
      {flood ? <p><strong>Flooding risk, as reported by the lister: </strong>{flood}. This is not a Guyana Keys assessment.</p> : null}
    </section>
  );
}
