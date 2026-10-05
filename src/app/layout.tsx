import type { Metadata } from "next";
import "./globals.css";
import { Header } from "../components/Header";
export const metadata: Metadata = { title: "Guyana Keys | Homes for sale and rent", description: "Search homes, land, and rentals in Guyana." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><Header />{children}<footer className="site-footer"><div className="wrap"><strong>Guyana Keys</strong><p>Homes for sale and to rent in Guyana.</p></div></footer></body></html>;
}
