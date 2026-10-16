import type { Metadata } from "next";
import "./globals.css";
import { Header } from "../components/Header";
import { LiveChat } from "../components/LiveChat";
import { SessionCatcher } from "../components/SessionCatcher";
import Link from "next/link";
import { deskEmail, siteUrl } from "../lib/contact";

const description = "Guyana property for locals and diaspora — find, list, invest.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Guyana Keys", template: "%s" },
  description,
  openGraph: {
    title: "Guyana Keys",
    description,
    siteName: "Guyana Keys",
    type: "website",
    locale: "en_GY",
  },
  twitter: { card: "summary", title: "Guyana Keys", description },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><Header /><SessionCatcher />{children}<footer className="site-footer"><div className="wrap"><strong>Guyana Keys</strong><p>Homes, land, and rentals across Guyana.</p><p><a href={`mailto:${deskEmail}`}>{deskEmail}</a></p><p><Link href="/listings?purpose=Sale">For sale</Link> · <Link href="/listings?purpose=Rent">To rent</Link> · <Link href="/areas">Neighbourhoods</Link> · <Link href="/agents">Agents</Link> · <Link href="/tools">Tools</Link> · <Link href="/partners">Partner with us</Link> · <Link href="/guides">Buying safely</Link></p></div></footer><LiveChat /></body></html>;
}
