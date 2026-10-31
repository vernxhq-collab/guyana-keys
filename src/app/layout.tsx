import type { Metadata } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Header } from "../components/Header";
import { LiveChat } from "../components/LiveChat";
import { SessionCatcher } from "../components/SessionCatcher";
import Link from "next/link";
import { facebookPage, publicEmail } from "../lib/contact";
import { publicOrigin } from "../lib/seo";
import { showCompanyWhatsApp } from "../lib/public-flags";

const description = "Guyana property for locals and diaspora — find, list, invest.";

const manrope = Manrope({ subsets: ["latin"], display: "swap", variable: "--font-ui" });
const playfair = Playfair_Display({ subsets: ["latin"], display: "swap", variable: "--font-display" });

export const metadata: Metadata = {
  metadataBase: new URL(publicOrigin),
  generator: null,
  title: { default: "Guyana Keys", template: "%s" },
  description,
  openGraph: {
    title: "Guyana Keys",
    description,
    siteName: "Guyana Keys",
    type: "website",
    locale: "en_GY",
    images: [{ url: "/brand/og.jpg", width: 1200, height: 630, alt: "Guyana Keys" }],
  },
  twitter: { card: "summary_large_image", title: "Guyana Keys", description, images: ["/brand/og.jpg"] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${playfair.variable}`}>
      <body>
        <Header />
        <SessionCatcher />
        {children}
        <footer className="site-footer">
          <div className="wrap footer-grid">
            <div>
              <strong className="footer-brand">Guyana Keys</strong>
              <p className="footer-tag">Property & investment</p>
              <p>Homes, land, and rentals across Guyana.</p>
              <p><a href={`mailto:${publicEmail}`}>{publicEmail}</a></p>
              <p><a href={facebookPage} target="_blank" rel="noreferrer">Facebook</a></p>
              {showCompanyWhatsApp ? <p>Message us</p> : null}
            </div>
            <div>
              <p className="footer-label">Explore</p>
              <p><Link href="/listings?purpose=Sale">Buy</Link></p>
              <p><Link href="/listings?purpose=Rent">Rent</Link></p>
              <p><Link href="/listings?type=Land">Land</Link></p>
              <p><Link href="/areas">Areas</Link></p>
              <p><Link href="/guides">Guides</Link></p>
            </div>
            <div>
              <p className="footer-label">List</p>
              <p><Link href="/advertise">List a property</Link></p>
              <p><Link href="/agents/apply">Apply to list</Link></p>
              <p><Link href="/agents">Agents</Link></p>
              <p><Link href="/alerts">Alerts</Link></p>
            </div>
            <div>
              <p className="footer-label">Company</p>
              <p><Link href="/tools">Tools</Link></p>
              <p><Link href="/about">About</Link></p>
              <p><Link href="/partners">Partner with us</Link></p>
              <p><Link href="/contact">Contact</Link></p>
              <p><Link href="/privacy">Privacy</Link></p>
              <p><Link href="/terms">Terms</Link></p>
              <p><Link href="/credits">Photo credits</Link></p>
            </div>
          </div>
          <div className="wrap footer-base">
            <p className="footer-free">Free to list, no limits.</p>
            <p>Listings are provided by owners and agents. Please take independent professional advice and confirm title before paying any deposit. Every home is open to every buyer and renter.</p>
          </div>
        </footer>
        <LiveChat />
      </body>
    </html>
  );
}
