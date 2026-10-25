import Link from "next/link";

export function PrivacyNote() {
  return (
    <p className="quiet privacy-note">
      Read our <Link href="/privacy">privacy notice</Link> and <Link href="/terms">terms</Link>.
    </p>
  );
}
