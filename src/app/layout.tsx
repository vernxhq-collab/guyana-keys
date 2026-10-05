import type { Metadata } from "next";
import "./globals.css";
import { Header } from "../components/Header";
import { LiveChat } from "../components/LiveChat";
import Link from "next/link";
export const metadata: Metadata = { title: "Guyana Keys | Property for sale and rent", description: "Search homes, land, and rentals in Guyana." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><Header />{children}<footer className="site-footer"><div className="wrap"><strong>Guyana Keys</strong><p>Homes, land, and rentals across Guyana. A listing is not proof of title.</p><p><Link href="/listings?purpose=Sale">For sale</Link> · <Link href="/listings?purpose=Rent">To rent</Link> · <Link href="/areas">Neighbourhoods</Link> · <Link href="/agents">Agents</Link> · <Link href="/guides">Buying from abroad</Link></p></div></footer><LiveChat /></body></html>;
}
