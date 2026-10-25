"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { showAskKeys } from "../lib/public-flags";

function isDesk(path: string) {
  return path === "/account" || path.startsWith("/account/") || path === "/agent" || path.startsWith("/agent/") || path === "/admin" || path.startsWith("/admin/");
}

export function LiveChat() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<{ from: string; body: string }[]>([{ from: "Keys", body: "Ask about a neighbourhood, a price, a sale, a rental, or the title check." }]);
  if (!showAskKeys || isDesk(path)) return null;
  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const website = String(new FormData(event.currentTarget).get("website") || "");
    if (!text.trim()) return;
    const asked = text;
    setText("");
    setMessages((current) => [...current, { from: "You", body: asked }]);
    const data = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: asked, website }) }).then((res) => res.json());
    setMessages((current) => [...current, { from: "Keys", body: data.reply || data.error || "Ask again in a moment." }]);
  }
  return (
    <div className="chat-widget">{open && <form className="chat-panel" onSubmit={send}><strong>Guyana Keys</strong><div className="chat-log">{messages.map((item, index) => <p key={index}><b>{item.from}:</b> {item.body}</p>)}</div><input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px" }} /><input value={text} onChange={(e) => setText(e.target.value)} placeholder="Neighbourhood, such as Bel Air Park" /><button className="btn" type="submit">Send</button></form>}<button className="btn" type="button" onClick={() => setOpen(!open)}>{open ? "Close" : "Ask Keys"}</button></div>
  );
}
