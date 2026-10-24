"use client";

import { useEffect, useState } from "react";

type Saved = { label: string; href: string };

const storageKey = "gk-saved-searches";

function readSaved(): Saved[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is Saved => item && typeof item.label === "string" && typeof item.href === "string" && item.href.startsWith("/listings"));
  } catch {
    return [];
  }
}

export function SaveSearch({ href, label }: { href: string; label: string }) {
  const [saved, setSaved] = useState<Saved[]>([]);
  const [note, setNote] = useState("");

  useEffect(() => {
    setSaved(readSaved());
  }, []);

  function save() {
    const next = [{ label, href }, ...readSaved().filter((item) => item.href !== href)].slice(0, 12);
    localStorage.setItem(storageKey, JSON.stringify(next));
    setSaved(next);
    setNote("Saved on this browser. It is not sent to Guyana Keys.");
  }

  function remove(hrefToRemove: string) {
    const next = readSaved().filter((item) => item.href !== hrefToRemove);
    localStorage.setItem(storageKey, JSON.stringify(next));
    setSaved(next);
  }

  return (
    <div className="saved-search">
      <button className="btn ghost" type="button" onClick={save}>Save this search</button>
      {note ? <p className="quiet">{note}</p> : <p className="quiet">Saved searches stay in this browser. No account and no email.</p>}
      {saved.length > 0 ? (
        <ul>
          {saved.map((item) => (
            <li key={item.href}>
              <a href={item.href}>{item.label}</a>
              <button className="text-btn" type="button" onClick={() => remove(item.href)}>Remove</button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
