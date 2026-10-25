import Link from "next/link";

export function GuideArticle({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="guide-page">
      <p className="guide-kicker">Guides</p>
      <h1>{title}</h1>
      {children}
      <p className="guide-back"><Link href="/guides">All guides</Link></p>
    </main>
  );
}
