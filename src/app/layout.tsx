import type { Metadata } from "next";
import "./globals.css";
import { Header } from "../components/Header";
import { LiveChat } from "../components/LiveChat";
export const metadata: Metadata = { title: "Guyana Keys | Property for sale and rent", description: "Search homes, land, and rentals in Guyana." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><Header />{children}<footer className="site-footer"><div className="wrap"><strong>Guyana Keys</strong><p>Homes, land, and rentals across Guyana. A listing is not proof of title.</p></div></footer><LiveChat /></body></html>;
}
