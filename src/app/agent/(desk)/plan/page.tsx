"use client";

import { useEffect, useState } from "react";
import { DeskSkeleton } from "../../../../components/DeskSkeleton";

type RequestRow = { id: string; kind: string; property_id: string | null; status: string; instructions: string; message: string; listing?: string; featured?: boolean };
type Live = { id: string; title: string; area: string; featured?: boolean };

function paymentLine(kind: string, status: string, stillFeatured = true) {
  if (status === "submitted") return "Sent to the admin. They will write payment instructions here. Nothing changes until they confirm payment.";
  if (status === "instructions") return kind === "feature"
    ? "Pay the admin using these instructions. The listing is not featured until they confirm payment."
    : "Pay the admin using these instructions. The package stays as it is until they confirm payment.";
  if (status === "paid" || status === "on") {
    if (kind === "feature" && !stillFeatured) return "Payment was confirmed before. This listing is not featured now. Contact the admin again if you want it featured.";
    return kind === "feature" ? "Paid. This listing is featured." : "Paid. Your package is upgraded.";
  }
  if (status === "done") return "Done.";
  return "With the admin.";
}

export default function PlanPage() {
  const [plan, setPlan] = useState("");
  const [cap, setCap] = useState(3);
  const [live, setLive] = useState(0);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [listings, setListings] = useState<Live[]>([]);
  const [propertyId, setPropertyId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function load(prefer = "") {
    return fetch("/api/agent?part=plan")
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then(({ ok, data }) => {
        if (!ok || data.error) setError(data.error || "Could not load the plan.");
        else {
          const liveListings: Live[] = data.liveListings || [];
          const rows: RequestRow[] = data.requests || [];
          setPlan(data.plan);
          setCap(data.cap);
          setLive(data.live);
          setRequests(rows);
          setListings(liveListings);
          const pending = new Set(rows.filter((item) => item.kind === "feature" && (item.status === "submitted" || item.status === "instructions")).map((item) => item.property_id));
          const open = liveListings.filter((item) => !item.featured && !pending.has(item.id));
          setPropertyId((current) => {
            const wanted = prefer || current;
            return open.some((item) => item.id === wanted) ? wanted : (open[0]?.id || "");
          });
        }
      })
      .catch(() => setError("Could not load the plan."));
  }

  useEffect(() => {
    const listing = new URLSearchParams(window.location.search).get("listing") || "";
    void load(listing);
  }, []);

  async function send(body: Record<string, unknown>) {
    const res = await fetch("/api/agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "request", ...body }) });
    const data = await res.json();
    setMessage(res.ok ? "Sent to the admin." : data.error || "The request could not be sent.");
    if (res.ok) await load();
  }

  if (error) return <p>{error}</p>;
  if (!plan) return <DeskSkeleton count={3} />;

  const planRequest = requests.find((item) => item.kind === "plan");
  const featureRequests = requests.filter((item) => item.kind === "feature");
  const pendingIds = new Set(featureRequests.filter((item) => item.status === "submitted" || item.status === "instructions").map((item) => item.property_id));
  const featureable = listings.filter((item) => !item.featured && !pendingIds.has(item.id));
  const waiting = requests.some((item) => (item.kind === "plan" || item.kind === "feature") && (item.status === "submitted" || item.status === "instructions"));
  const paidPlan = plan === "Agency";
  const upgradeOpen = Boolean(planRequest && planRequest.status !== "done" && planRequest.status !== "paid" && planRequest.status !== "on");
  const upgradePrimary = !waiting && !paidPlan && (live >= cap || featureable.length === 0);
  const featurePrimary = !waiting && featureable.length > 0 && !upgradePrimary;
  const withAdmin = requests.filter((item) => (item.kind === "plan" || item.kind === "feature") && (item.status === "submitted" || item.status === "instructions")).length;
  const nextLine = requests.some((item) => item.status === "instructions" && item.kind !== "help")
    ? "Pay the admin using the instructions below."
    : requests.some((item) => item.status === "submitted" && item.kind !== "help")
      ? "Waiting on the admin for payment instructions."
      : !paidPlan && live >= cap
        ? "Contact the admin to upgrade your package."
        : featureable.length
          ? "Contact the admin to feature a listing."
          : "Your plan is in place.";

  return (
    <div className="stack">
      <p className="eyebrow">Plan</p>
      <h1>{plan}</h1>
      <p className="quiet">{paidPlan ? "Paid plan." : "Free plan. 3 live listings."} Featuring, advertising, and a larger package are arranged with the admin. This desk does not take payment.</p>
      <div className="stats">
        <article className="stat"><p className="quiet">Live listings</p><strong>{live} / {cap}</strong><p className="quiet">{live >= cap ? "Cap reached" : `${cap - live} still open`}</p></article>
        <article className="stat"><p className="quiet">Package</p><strong>{paidPlan ? "Paid" : "Free"}</strong><p className="quiet">{paidPlan ? "Upgraded" : "Contact the admin to upgrade"}</p></article>
        <article className={withAdmin > 0 ? "stat attention" : "stat"}><p className="quiet">With the admin</p><strong>{withAdmin}</strong><p className="quiet">{withAdmin > 0 ? "Payment in progress" : "None open"}</p></article>
      </div>
      <p className="ai-bar next"><span>{nextLine}</span></p>

      <h2>Upgrade</h2>
      <p className="quiet">Advertising and a larger package are the same conversation. Contact the admin, pay them, and wait. A free plan stays at 3 live listings until they confirm payment.</p>
      {planRequest && (upgradeOpen || (paidPlan && (planRequest.status === "paid" || planRequest.status === "on"))) ? (
        <article className="panel">
          <strong>Package</strong>
          <p>{paymentLine("plan", planRequest.status)}</p>
          {planRequest.instructions ? <p>{planRequest.instructions}</p> : null}
        </article>
      ) : null}
      {!paidPlan && !upgradeOpen ? (
        <button className={upgradePrimary ? "btn" : "btn ghost"} type="button" onClick={() => void send({ kind: "plan" })}>Contact admin to upgrade</button>
      ) : null}

      <h2>Feature a listing</h2>
      <p className="quiet">Contact the admin and pay before a listing is featured. A hidden listing cannot be featured.</p>
      {featureable.length === 0 ? <p>{listings.length === 0 ? "Publish a live listing before you ask for it to be featured." : "Every live listing is featured, or already with the admin."}</p> : (
        <>
          <label>Listing
            <select value={propertyId} onChange={(event) => setPropertyId(event.target.value)}>
              {featureable.map((item) => <option key={item.id} value={item.id}>{item.title} · {item.area}</option>)}
            </select>
          </label>
          <button className={featurePrimary ? "btn" : "btn ghost"} type="button" disabled={!propertyId} onClick={() => void send({ kind: "feature", propertyId })}>Contact admin to feature</button>
        </>
      )}
      {featureRequests.map((item) => (
        <article className="panel" key={item.id}>
          <strong>{item.listing || "Listing"}</strong>
          <p>{paymentLine("feature", item.status, Boolean(item.featured))}</p>
          {item.instructions ? <p>{item.instructions}</p> : null}
        </article>
      ))}
      {message ? <p>{message}</p> : null}
    </div>
  );
}
