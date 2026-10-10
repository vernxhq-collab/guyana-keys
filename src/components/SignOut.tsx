"use client";

export function SignOut({ next }: { next: string }) {
  return (
    <button className="btn ghost" type="button" onClick={async () => {
      await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) });
      window.location.href = next;
    }}>Sign out</button>
  );
}
