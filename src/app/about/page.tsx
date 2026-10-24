import type { Metadata } from "next";
import Link from "next/link";
import { withCanonical } from "../../lib/seo";

const firstParagraph = "For too long, searching for property here has meant scrolling through endless posts, chasing numbers that never answer, and wondering whether the photos even match the place. If you live abroad, it's harder still: you're making one of the biggest decisions of your life from thousands of miles away.";

export const metadata: Metadata = withCanonical("/about", {
  title: "About Guyana Keys",
  description: firstParagraph,
});

export default function AboutPage() {
  return (
    <main className="about-story">
      <section className="about-hero">
        <div className="wrap about-measure">
          <h1>Finding a home in Guyana shouldn&apos;t feel like guesswork.</h1>
        </div>
      </section>
      <div className="wrap about-measure">
        <p>{firstParagraph}</p>
        <p className="about-turn">We knew there had to be a better way.</p>
        <section>
          <h2>Who we are</h2>
          <p>Guyana Keys is built by a tech-savvy team immersed in the digital world. We know how the best property portals work, and we asked a simple question: why shouldn&apos;t Guyana have the same?</p>
        </section>
        <section>
          <h2>What we&apos;re building</h2>
          <p>One clear place to find homes, land and commercial property across Guyana. Listings with the facts that matter here, like water, backup power, parking and flood risk. Photos that show the actual property. Simple tools, like our mortgage and purchase-cost calculator, so you can plan with your own numbers before you call anyone.</p>
        </section>
        <section>
          <h2>Why it matters</h2>
          <p>Guyana is changing fast, and more people are deciding where to live, rent and invest than ever. Whether you&apos;re in Georgetown, Berbice, New York or Toronto, you should be able to search with confidence and see the facts clearly.</p>
        </section>
        <section className="panel about-promise">
          <h2>Our promise</h2>
          <ul>
            <li>Honest listings. We never invent prices, availability or photos.</li>
            <li>Free to list, no limits, for owners and agents.</li>
            <li>Fair to everyone. The same listings and the same respect for every buyer and renter.</li>
          </ul>
        </section>
      </div>
      <section className="about-next">
        <div className="wrap about-measure">
          <span className="about-spark" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="8" cy="15" r="3.2"/><path d="M10.4 13.1L19 5.2M16.2 5.2H19V8"/></svg></span>
          <h2>We&apos;re not done here.</h2>
          <p>This is only the beginning. We&apos;re working on things that will change how Guyana finds, rents and buys property, and we can&apos;t wait to share them with you.</p>
          <p className="about-next-close">Stay close. The best is yet to come.</p>
        </div>
      </section>
      <div className="wrap about-measure about-close">
        <section>
          <h2>Join us at the start</h2>
          <p>We&apos;re just getting started, and the first owners and agents on Guyana Keys help shape what it becomes. Whether you&apos;re searching, selling or letting, there&apos;s a place for you here.</p>
          <p className="about-sign">The Guyana Keys team</p>
        </section>
        <div className="about-cta">
          <Link className="btn" href="/listings">Browse listings</Link>
          <Link className="btn ghost" href="/advertise">List your property free</Link>
        </div>
      </div>
    </main>
  );
}
