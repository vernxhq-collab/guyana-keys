"use client";

import { useEffect, useState } from "react";

function linkNote(raw: string) {
  const lower = raw.toLowerCase();
  if (lower.includes("expired") || lower.includes("invalid") || lower.includes("already")) {
    return "That sign-in link has already been used. Request a new one.";
  }
  return "That sign-in link was not accepted.";
}

function deskFor(path: string): "buyer" | "agent" | "admin" {
  if (path.startsWith("/admin")) return "admin";
  if (path.startsWith("/agent")) return "agent";
  return "buyer";
}

export function SessionCatcher() {
  const [note, setNote] = useState("");
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = hash.get("access_token");
    const problem = hash.get("error_description") || hash.get("error");
    if (!accessToken) {
      if (problem) {
        setNote(linkNote(problem));
        window.history.replaceState({}, "", window.location.pathname);
      }
      return;
    }
    const path = window.location.pathname;
    setNote("Signing you in...");
    fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "session", accessToken, refreshToken: hash.get("refresh_token") || "", desk: deskFor(path) }),
    })
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then(({ ok, data }) => {
        if (!ok) {
          window.history.replaceState({}, "", path);
          setNote(data.error || "That sign-in link was not accepted.");
          return;
        }
        const role = data.profile?.role;
        if (role === "admin" && !path.startsWith("/admin") && !path.startsWith("/agent")) {
          window.location.replace("/admin");
          return;
        }
        if (role === "agent" && (path === "/" || path.startsWith("/account"))) {
          window.location.replace("/agent");
          return;
        }
        window.location.replace(path);
      })
      .catch(() => setNote("That sign-in link was not accepted."));
  }, []);
  return note ? <p className="wrap">{note}</p> : null;
}
