"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function SessionCatcher({ desk }: { desk: "buyer" | "agent" | "admin" }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = hash.get("access_token");
    if (!accessToken) return;
    setNote("Signing you in...");
    fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "session", accessToken, desk }),
    })
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then(({ ok, data }) => {
        window.history.replaceState({}, "", window.location.pathname);
        if (!ok) setNote(data.error || "That sign-in link was not accepted.");
        else router.refresh();
      })
      .catch(() => setNote("That sign-in link was not accepted."));
  }, [desk, router]);
  return note ? <p>{note}</p> : null;
}
