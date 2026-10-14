"use client";

import { useEffect, useState } from "react";
import { DeskSkeleton } from "../../../../components/DeskSkeleton";
import { whenLabel } from "../../../../lib/assist";
import { deskEmail } from "../../../../lib/contact";
import { money } from "../../../../lib/data";

type RequestRow = { id: string; kind: string; property_id: string | null; status: string; instructions: string; message: string; listing?: string; featured?: boolean; amountGyd?: number; paidAt?: string; paidBy?: string };
type Live = { id: string; title: string; area: string; featured?: boolean };

function receiptLine(item: RequestRow) {
  if (!item.amountGyd || item.amountGyd <= 0) return "";
  const when = item.paidAt ? whenLabel(item.paidAt) : "";
  return `Receipt: ${money(item.amountGyd, "Sale")}${when ? ` · ${when}` : ""}${item.paidBy ? ` · marked by ${item.paidBy}` : ""}`;
}

function paymentLine(kind: string, status: string, stillFeatured = true) {
  if (status === "submitted") return "Sent to the admin. They will write payment instructions here. Nothing changes until they confirm payment.";
  if (status === "instructions") return kind === "feature"
    ? "Pay the admin using these instructions. The listing is not featured until they confirm payment."
    : kind === "advertise"
      ? "Pay the admin using these instructions. Advertising stays off until they confirm payment. Listings stay free."
      : "Pay the admin using these instructions. The package stays as it is until they confirm payment.";
  if (status === "paid" || status === "on") {
    if (kind === "feature" && !stillFeatured) return "Payment was confirmed before. This listing is not featured now. Contact the admin again if you want it featured.";
    if (kind === "advertise") return "Paid. Advertising is confirmed. Listings stay free.";
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
  const advertiseRequest = requests.find((item) => item.kind === "advertise");
  const featureRequests = requests.filter((item) => item.kind === "feature");
  const pendingIds = new Set(featureRequests.filter((item) => item.status === "submitted" || item.status === "instructions").map((item) => item.property_id));
  const featureable = listings.filter((item) => !item.featured && !pendingIds.has(item.id));
  const waiting = requests.some((item) => (item.kind === "plan" || item.kind === "feature") && (item.status === "submitted" || item.status === "instructions"));
  const paidPlan = plan === "Agency";
  const upgradeOpen = Boolean(planRequest && planRequest.status !== "done" && planRequest.status !== "paid" && planRequest.status !== "on");
  const advertiseOpen = Boolean(advertiseRequest && advertiseRequest.status !== "done" && advertiseRequest.status !== "paid" && advertiseRequest.status !== "on");
  const featurePrimary = !waiting && featureable.length > 0;
  const withAdmin = requests.filter((item) => (item.kind === "plan" || item.kind === "feature" || item.kind === "advertise") && (item.status === "submitted" || item.status === "instructions")).length;
  const nextLine = requests.some((item) => item.status === "instructions" && item.kind !== "help")
    ? "Pay the admin using the instructions below."
    : requests.some((item) => item.status === "submitted" && item.kind !== "help")
      ? "Waiting on the admin for payment instructions."
      : featureable.length
        ? "Listings are free. Contact the admin to feature one."
        : "Listings are free. Feature or advertise when you want more reach.";

  return (
    <div className="stack">
      <p className="eyebrow">Plan</p>
      <h1>Plan</h1>
      <p className="quiet">Listings are free. Featuring and advertising are arranged with the admin at {deskEmail}. This desk does not take payment.</p>
      <div className="stats">
        <article className="stat"><p className="quiet">Live listings</p><strong>{live}</strong><p className="quiet">Free to publish</p></article>
        <article className="stat"><p className="quiet">Package</p><strong>{plan}</strong><p className="quiet">{paidPlan ? "Paid extras" : "Listings stay free"}</p></article>
        <article className={withAdmin > 0 ? "stat attention" : "stat"}><p className="quiet">With the admin</p><strong>{withAdmin}</strong><p className="quiet">{withAdmin > 0 ? "Payment in progress" : "None open"}</p></article>
      </div>
      <p className="ai-bar next"><span>{nextLine}</span></p>

      <article className="panel">
        <strong>Advertise</strong>
        <p className="quiet">Listings stay free. Advertising on the site is paid, and it starts after the admin confirms payment.</p>
        {advertiseRequest && (advertiseOpen || advertiseRequest.status === "paid" || advertiseRequest.status === "on") ? (
          <div className="record">
            <p>{paymentLine("advertise", advertiseRequest.status)}</p>
            {receiptLine(advertiseRequest) ? <p>{receiptLine(advertiseRequest)}</p> : null}
            {advertiseRequest.instructions ? <p>{advertiseRequest.instructions}</p> : null}
          </div>
        ) : null}
        {planRequest && (upgradeOpen || (paidPlan && (planRequest.status === "paid" || planRequest.status === "on"))) ? (
          <div className="record">
            <p>{paymentLine("plan", planRequest.status)}</p>
            {receiptLine(planRequest) ? <p>{receiptLine(planRequest)}</p> : null}
            {planRequest.instructions ? <p>{planRequest.instructions}</p> : null}
          </div>
        ) : null}
        {!advertiseOpen ? (
          <button className={featurePrimary ? "btn ghost" : "btn"} type="button" onClick={() => void send({ kind: "advertise" })}>Contact admin to advertise</button>
        ) : null}
      </article>

      <article className="panel">
        <strong>Feature a listing</strong>
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
          <div className="record" key={item.id}>
            <strong>{item.listing || "Listing"}</strong>
            <p>{paymentLine("feature", item.status, Boolean(item.featured))}</p>
            {receiptLine(item) ? <p>{receiptLine(item)}</p> : null}
            {item.instructions ? <p>{item.instructions}</p> : null}
          </div>
        ))}
      </article>
      {message ? <p>{message}</p> : null}
    </div>
  );
}
