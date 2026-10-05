import type { Metadata } from "next";
import "./globals.css";
import { Header } from "../components/Header";
export const metadata: Metadata = { title: "Guyana Keys | Homes, land, and rentals", description: "Verified homes, land, and rentals across Guyana." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><Header />{children}<footer className="site-footer wrap"><strong>Guyana Keys</strong><p>Homes, land, and rentals in Guyana. Sample inventory until agents publish.</p></footer></body></html>;
}
