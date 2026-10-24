"use client";

import { useEffect, useState } from "react";

export function FilterSheet({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="filter-sheet">
      <button className="btn ghost filter-sheet-open" type="button" aria-expanded={open} aria-controls="listing-filters" onClick={() => setOpen(true)}>Filters</button>
      {open ? <button className="filter-sheet-backdrop" type="button" aria-label="Close filters" onClick={() => setOpen(false)} /> : null}
      <div className={open ? "filter-sheet-panel open" : "filter-sheet-panel"} id="listing-filters">
        <div className="filter-sheet-bar">
          <strong>Filters</strong>
          <button className="btn ghost" type="button" onClick={() => setOpen(false)}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}
