import type { Metadata } from "next";
import "./globals.css";
import { Header } from "../components/Header";
import { LiveChat } from "../components/LiveChat";

export const metadata: Metadata = {
  title: "Guyana Keys | Homes, land, and rentals",
  description: "Verified homes, land, and rentals across Guyana.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
        <LiveChat />
      </body>
    </html>
  );
}
