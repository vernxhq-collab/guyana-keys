import type { Metadata } from "next";
import { publicEmail } from "../../lib/contact";
import { withCanonical } from "../../lib/seo";

export const metadata: Metadata = withCanonical("/privacy", {
  title: "Privacy notice | Guyana Keys",
  description: "What Guyana Keys collects, how long we keep it, and how to ask for a correction or deletion.",
});

export default function PrivacyPage() {
  return (
    <main className="guide-page">
      <p className="guide-kicker">Privacy</p>
      <h1>Privacy notice</h1>
      <p>Last updated: 25 October 2026</p>
      <p>Guyana Keys is the name on this website. Write to <a href={`mailto:${publicEmail}`}>{publicEmail}</a> if you have a question about your information.</p>

      <h2>What we collect</h2>
      <p>When you send an enquiry, we keep your name, phone number, what you wrote, and the listing or page you wrote from. If you are signed in, we also keep that the enquiry came from your account.</p>
      <p>When you apply to list, we keep your name, email, phone number, company if you give one, the areas you name, and your message. The public application does not ask for an identity image.</p>
      <p>When you create an alert or a saved search, we keep your email and the area you asked about. You can stop an alert or delete a saved search from the link we email you.</p>
      <p>When you sign in, we use cookies so you stay signed in. On your account you can save homes and see the enquiries you sent.</p>
      <p>When someone lists a property, we keep the property details and photos they supply.</p>
      <p>If an agent later sends identity documents from the signed-in desk, they do that only after confirming they have read the consent on that page. A person at Guyana Keys reviews those files. You can ask us to delete them. The public application does not ask for an identity image.</p>

      <h2>What we do not do</h2>
      <p>We do not sell personal information. We do not run a separate analytics product.</p>

      <h2>Who handles it</h2>
      <p>Trusted service providers who host our website, store our data and deliver our email. They handle that information so the site can work.</p>

      <h2>How long we keep it</h2>
      <p>We keep an account, a listing, an enquiry, or an alert while it is in use. Write to us if you want it corrected or deleted.</p>

      <h2>Your choices</h2>
      <p>Write to <a href={`mailto:${publicEmail}`}>{publicEmail}</a> to ask for a copy of your personal information, to correct it, or to delete it. The Data Protection Act 2023 (Act No. 18 of 2023) and other applicable law in Guyana apply to this notice.</p>
    </main>
  );
}
