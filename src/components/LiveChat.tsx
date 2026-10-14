"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";

function isDesk(path: string) {
  return path === "/account" || path.startsWith("/account/") || path === "/agent" || path.startsWith("/agent/") || path === "/admin" || path.startsWith("/admin/");
}

export function LiveChat() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<{ from: string; body: string }[]>([{ from: "Keys", body: "Ask about a neighbourhood, a price, a sale, a rental, or the title check." }]);
  if (isDesk(path)) return null;
  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!text.trim()) return;
    const asked = text;
    setText("");
    setMessages((current) => [...current, { from: "You", body: asked }]);
    const data = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: asked }) }).then((res) => res.json());
    setMessages((current) => [...current, { from: "Keys", body: data.reply }]);
  }
  return (
    <div className="chat-widget">{open && <form className="chat-panel" onSubmit={send}><strong>Guyana Keys</strong><div className="chat-log">{messages.map((item, index) => <p key={index}><b>{item.from}:</b> {item.body}</p>)}</div><input value={text} onChange={(e) => setText(e.target.value)} placeholder="3 bed house in Bel Air" /><button className="btn" type="submit">Send</button></form>}<button className="btn" type="button" onClick={() => setOpen(!open)}>{open ? "Close" : "Ask Keys"}</button></div>
  );
}
