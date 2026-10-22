"use client";

import { useState } from "react";
import { LeadForm } from "./LeadForm";

export function TitleRequest({ propertyId, lawyers }: { propertyId: string; lawyers: { id: string; name: string }[] }) {
  const [partnerId, setPartnerId] = useState(lawyers[0]?.id || "");
  return (
    <div className="stack">
      {lawyers.length === 0 ? (
        <p>No lawyer partner is listed yet. This request is still saved as a Guyana Keys lead.</p>
      ) : (
        <label>Lawyer partner
          <select value={partnerId} onChange={(event) => setPartnerId(event.target.value)}>
            {lawyers.map((lawyer) => <option key={lawyer.id} value={lawyer.id}>{lawyer.name}</option>)}
          </select>
        </label>
      )}
      <LeadForm propertyId={propertyId} preset="Request title check" button="Request title check" leadKind="title_check" partnerId={partnerId} />
    </div>
  );
}
