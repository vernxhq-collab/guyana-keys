import Link from "next/link";
import { guides, type GuideIconName } from "../lib/guides";

export function GuideIcon({ name }: { name: GuideIconName }) {
  if (name === "abroad") {
    return (
      <svg viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <circle cx="18" cy="18" r="12" />
        <path d="M6 18h24M18 6c3.2 3.6 3.2 20.4 0 24M18 6c-3.2 3.6-3.2 20.4 0 24" />
      </svg>
    );
  }
  if (name === "shield") {
    return (
      <svg viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M18 5l10 4v8c0 7-4.2 11.2-10 14-5.8-2.8-10-7-10-14V9l10-4z" />
        <path d="M13 18l3.2 3.2L23 14.5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <circle cx="13" cy="15" r="6" />
      <path d="M17.6 19.4L28 30M24 30h4v-4" />
    </svg>
  );
}

export function GuideCards() {
  return (
    <div className="guide-grid">
      {guides.map((guide) => (
        <Link className="guide-card" key={guide.slug} href={guide.href}>
          <span className="guide-icon"><GuideIcon name={guide.icon} /></span>
          <strong>{guide.title}</strong>
          <span className="guide-line">{guide.line}</span>
          <span className="guide-read">Read guide</span>
        </Link>
      ))}
    </div>
  );
}
