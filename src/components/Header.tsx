"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type Role = "buyer" | "agent" | "admin" | "";

const primary = [
  { href: "/listings?purpose=Sale", label: "Buy" },
  { href: "/listings?purpose=Rent", label: "Rent" },
  { href: "/listings?type=Land", label: "Land" },
  { href: "/listings?type=Commercial", label: "Commercial" },
  { href: "/areas", label: "Explore Guyana" },
  { href: "/agents", label: "Agents" },
];

const more = [
  { href: "/tools", label: "Tools" },
  { href: "/guides", label: "Guides" },
  { href: "/partners", label: "Partner with us" },
];

function deskLink(role: Role): [string, string] {
  if (role === "admin") return ["Admin desk", "/admin"];
  if (role === "agent") return ["Agent desk", "/agent"];
  return ["Your homes", "/account"];
}

export function Header() {
  const path = usePathname();
  const [signedIn, setSignedIn] = useState(false);
  const [role, setRole] = useState<Role>("");
  const [moreOpen, setMoreOpen] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const [deskName, deskHref] = deskLink(role);

  useEffect(() => {
    fetch("/api/auth").then((res) => res.json()).then((data) => {
      setSignedIn(Boolean(data.user));
      setRole(data.profile?.role || "");
    }).catch(() => setSignedIn(false));
  }, []);

  useEffect(() => {
    setDrawer(false);
    setMoreOpen(false);
  }, [path]);

  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawer]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMoreOpen(false);
        setDrawer(false);
      }
    }
    function onPointer(event: MouseEvent) {
      if (!moreRef.current?.contains(event.target as Node)) setMoreOpen(false);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
    };
  }, []);

  async function logout() {
    await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) });
    window.location.href = "/";
  }

  function accountLinks(className = "") {
    if (!signedIn) return <Link className={className} href="/account">Sign in</Link>;
    return (
      <>
        <Link className={`btn ghost ${className}`.trim()} href={deskHref}>{deskName}</Link>
        <button className={`btn ghost ${className}`.trim()} type="button" onClick={() => void logout()}>Log out</button>
      </>
    );
  }

  return (
    <header className="top">
      <div className="wrap">
        <nav className="nav" aria-label="Primary">
          <Link className="brand" href="/">
            <span className="brand-name">Guyana <span>Keys</span></span>
            <span className="brand-tag">Property & investment</span>
          </Link>
          <div className="nav-links">
            {primary.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
            <div className="nav-more" ref={moreRef}>
              <button type="button" aria-expanded={moreOpen} aria-controls="more-menu" onClick={() => setMoreOpen((open) => !open)}>More</button>
              {moreOpen ? (
                <div className="nav-more-panel" id="more-menu">
                  {more.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
                </div>
              ) : null}
            </div>
          </div>
          <div className="nav-actions">
            {accountLinks("nav-signin")}
            <Link className="btn nav-list" href="/advertise">List a property</Link>
            <button
              className="nav-drawer-btn"
              type="button"
              aria-expanded={drawer}
              aria-controls="site-drawer"
              onClick={() => setDrawer((open) => !open)}
            >
              {drawer ? "Close" : "Menu"}
            </button>
          </div>
        </nav>
      </div>
      {drawer ? (
        <div className="nav-drawer" id="site-drawer">
          <div className="wrap nav-drawer-inner">
            {primary.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
            {more.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
            <div className="nav-drawer-account">{accountLinks()}</div>
            <Link className="btn" href="/advertise">List a property</Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
