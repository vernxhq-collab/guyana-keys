"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Role = "buyer" | "agent" | "admin" | "";

function deskLink(role: Role): [string, string] {
  if (role === "admin") return ["Admin desk", "/admin"];
  if (role === "agent") return ["Agent desk", "/agent"];
  return ["Your homes", "/account"];
}

export function Header() {
  const [signedIn, setSignedIn] = useState(false);
  const [role, setRole] = useState<Role>("");

  useEffect(() => {
    fetch("/api/auth").then((res) => res.json()).then((data) => {
      setSignedIn(Boolean(data.user));
      setRole(data.profile?.role || "");
    }).catch(() => setSignedIn(false));
  }, []);

  const [deskName, deskHref] = deskLink(role);

  return (
    <header className="top">
      <div className="wrap">
        <nav className="nav">
          <Link className="brand" href="/">
            <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path fill="#116b4a" d="M14.5 3.5l6 6-7.8 7.8-2.1-2.1 1.1-1.1-4.2-4.2-2.4 2.4L3.6 10.8l5.4-5.4 1.1 1.1 1.5-1.5 2.9-1.5z"/></svg>
            Guyana <span>Keys</span>
          </Link>
          <div className="nav-links">
            <Link href="/listings?purpose=Sale">Buy</Link>
            <Link href="/listings?purpose=Rent">Rent</Link>
            <Link href="/listings?type=Land">Land</Link>
            <Link href="/agents">Find an agent</Link>
            <Link href="/tools">Tools</Link>
            <Link href="/partners">Partner with us</Link>
          </div>
          <div className="nav-actions">
            {signedIn ? (
              <>
                <Link className="btn ghost" href={deskHref}>{deskName}</Link>
                <button className="btn ghost" type="button" onClick={async () => {
                  await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) });
                  window.location.href = "/";
                }}>Log out</button>
              </>
            ) : <><Link href="/account">Sign in</Link><Link className="btn" href="/advertise">For agents</Link></>}
          </div>
        </nav>
      </div>
    </header>
  );
}
