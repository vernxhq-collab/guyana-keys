import { adminSummary } from "./assist";
import { mapProperty } from "./catalog";
import { hoursSince, newId, planLabel, requestStatusLabel, stageLabel } from "./labels";
import { MIN_LIVE_PHOTOS } from "./listing-rules";
import { serviceDb } from "./supabase";

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

type Db = NonNullable<ReturnType<typeof serviceDb>>;

async function remember(db: Db, detail: string) {
  await db.from("admin_events").insert({ id: newId("log"), detail });
}

export async function adminHome() {
  const db = serviceDb();
  if (!db) return { error: "The desk is not connected." as const };
  const [agents, listings, enquiries, requests, profiles, events] = await Promise.all([
    db.from("profiles").select("id", { count: "exact", head: true }).eq("role", "agent"),
    db.from("properties").select("id", { count: "exact", head: true }).eq("status", "live"),
    db.from("enquiries").select("id,agent_reply,stage,created_at"),
    db.from("requests").select("id,agent_id,kind,property_id,status,message,created_at").in("status", ["submitted", "instructions"]).order("created_at", { ascending: false }),
    db.from("profiles").select("*"),
    db.from("admin_events").select("id,detail,created_at").order("created_at", { ascending: false }).limit(20),
  ]);
  const names = new Map((profiles.data || []).map((row) => [String(row.id), String(row.name || "Agent")]));
  const propertyIds = [...new Set((requests.data || []).map((row) => String(row.property_id || "")).filter(Boolean))];
  const titles = new Map<string, string>();
  if (propertyIds.length) {
    const props = await db.from("properties").select("id,title").in("id", propertyIds);
    for (const row of props.data || []) titles.set(String(row.id), String(row.title || "a listing"));
  }
  const unanswered = (enquiries.data || []).filter((row) => {
    if (String(row.stage || "") === "closed") return false;
    if (String(row.agent_reply || "").trim()) return false;
    return hoursSince(String(row.created_at || "")) >= 24;
  }).length;
  return {
    agents: agents.count || 0,
    live: listings.count || 0,
    unanswered,
    openRequests: (requests.data || []).length,
    requests: (requests.data || []).map((row) => {
      const summary = adminSummary({
        agentName: names.get(String(row.agent_id || "")) || "An agent",
        kind: String(row.kind || "help"),
        listingTitle: titles.get(String(row.property_id || "")),
        status: String(row.status || "submitted"),
      });
      return {
        id: String(row.id),
        kind: String(row.kind),
        status: requestStatusLabel(String(row.status || "")),
        line: summary.line,
      };
    }),
    record: events.error ? [] : (events.data || []).map((row) => ({ id: String(row.id), detail: String(row.detail || ""), createdAt: String(row.created_at || "") })),
    agentList: (profiles.data || []).filter((row) => row.role === "agent").map((row) => ({
      id: String(row.id),
      name: String(row.name || ""),
      email: String(row.email || ""),
      phone: String(row.phone || ""),
      company: String(row.company || ""),
      address: String(row.address || ""),
    })),
  };
}

export async function adminPeople(query = "") {
  const db = serviceDb();
  if (!db) return { error: "The desk is not connected." as const };
  const [profiles, listings, saves, enquiries] = await Promise.all([
    db.from("profiles").select("*").order("created_at", { ascending: false }),
    db.from("properties").select("agent_id,status"),
    db.from("saved_homes").select("user_id"),
    db.from("enquiries").select("buyer_id"),
  ]);
  const live = new Map<string, number>();
  for (const row of listings.data || []) {
    if (row.status !== "live" || !row.agent_id) continue;
    const id = String(row.agent_id);
    live.set(id, (live.get(id) || 0) + 1);
  }
  const saved = new Map<string, number>();
  for (const row of saves.data || []) {
    const id = String(row.user_id || "");
    saved.set(id, (saved.get(id) || 0) + 1);
  }
  const asked = new Map<string, number>();
  for (const row of enquiries.data || []) {
    const id = String(row.buyer_id || "");
    if (!id) continue;
    asked.set(id, (asked.get(id) || 0) + 1);
  }
  const rows = profiles.data || [];
  const q = query.trim().toLowerCase();
  const result = {
    agents: rows.filter((row) => row.role === "agent").map((row) => ({
      id: String(row.id),
      name: String(row.name || ""),
      company: String(row.company || ""),
      email: String(row.email || ""),
      phone: String(row.phone || ""),
      address: String(row.address || ""),
      areas: Array.isArray(row.areas) ? row.areas.map(String) : [],
      plan: planLabel(String(row.plan || "starter")),
      planKey: String(row.plan || "starter"),
      live: live.get(String(row.id)) || 0,
      suspended: Boolean(row.suspended),
    })),
    buyers: rows.filter((row) => row.role === "buyer").map((row) => ({
      id: String(row.id),
      name: String(row.name || ""),
      email: String(row.email || ""),
      saved: saved.get(String(row.id)) || 0,
      enquiries: asked.get(String(row.id)) || 0,
    })),
  };
  if (!q) return result;
  return {
    agents: result.agents.filter((agent) => `${agent.name} ${agent.company} ${agent.email} ${agent.phone} ${agent.address}`.toLowerCase().includes(q)),
    buyers: result.buyers.filter((buyer) => `${buyer.name} ${buyer.email}`.toLowerCase().includes(q)),
  };
}

export async function adminAgent(id: string) {
  const db = serviceDb();
  if (!db) return { error: "The desk is not connected." as const };
  const { data } = await db.from("profiles").select("*").eq("id", id).eq("role", "agent").maybeSingle();
  if (!data) return { error: "That agent was not found." as const };
  const [props, enquiries, requests] = await Promise.all([
    db.from("properties").select("id,title,area,purpose,price_gyd,status,featured").eq("agent_id", id).order("created_at", { ascending: false }),
    db.from("enquiries").select("id,name,phone,stage,property_id,created_at,agent_reply").eq("agent_id", id).order("created_at", { ascending: false }).limit(40),
    db.from("requests").select("id,kind,status,property_id,message,instructions,created_at").eq("agent_id", id).order("created_at", { ascending: false }).limit(20),
  ]);
  const listings = props.data || [];
  const titles = new Map(listings.map((row) => [String(row.id), String(row.title || "")]));
  return {
    agent: {
      id: String(data.id),
      name: String(data.name || ""),
      email: String(data.email || ""),
      phone: String(data.phone || ""),
      company: String(data.company || ""),
      address: String(data.address || ""),
      photoUrl: String(data.photo_url || ""),
      areas: Array.isArray(data.areas) ? data.areas.map(String) : [],
      plan: planLabel(String(data.plan || "starter")),
      planKey: String(data.plan || "starter"),
      live: listings.filter((row) => row.status === "live").length,
      suspended: Boolean(data.suspended),
      graLicence: String(data.gra_licence || ""),
      verified: Boolean(data.verified),
      approved: data.approved === undefined ? true : data.approved !== false,
      createdAt: String(data.created_at || ""),
    },
    listings: listings.map((row) => ({
      id: String(row.id),
      title: String(row.title || "Untitled home"),
      area: String(row.area || ""),
      purpose: String(row.purpose || "Sale") === "Rent" ? "Rent" : "Sale",
      priceGyd: Number(row.price_gyd || 0) || 0,
      status: row.status === "live" ? "live" : "hidden",
      featured: Boolean(row.featured),
    })),
    leads: (enquiries.data || []).map((row) => ({
      id: String(row.id),
      name: String(row.name || ""),
      phone: String(row.phone || ""),
      stage: String(row.stage || "new"),
      home: titles.get(String(row.property_id || "")) || "",
      createdAt: String(row.created_at || ""),
      answered: Boolean(String(row.agent_reply || "").trim()),
    })),
    requests: (requests.data || []).map((row) => ({
      id: String(row.id),
      kind: String(row.kind || ""),
      status: String(row.status || ""),
      listing: titles.get(String(row.property_id || "")) || "",
      message: String(row.message || ""),
      createdAt: String(row.created_at || ""),
    })),
  };
}

export async function adminListings(query: string) {
  const db = serviceDb();
  if (!db) return { error: "The desk is not connected." as const };
  const [props, profileQuery, requests] = await Promise.all([
    db.from("properties").select("*").order("created_at", { ascending: false }).limit(300),
    db.from("profiles").select("id,name,company,approved").eq("role", "agent"),
    db.from("requests").select("property_id,status").eq("kind", "feature").in("status", ["paid", "on"]),
  ]);
  const profiles = profileQuery.error && String(profileQuery.error.message || "").toLowerCase().includes("approved")
    ? await db.from("profiles").select("id,name,company").eq("role", "agent")
    : profileQuery;
  const names = new Map((profiles.data || []).map((row) => [String(row.id), `${row.name || "Agent"}${row.company ? " · " + row.company : ""}`]));
  const approved = new Map((profiles.data || []).map((row) => [String(row.id), (row as { approved?: boolean }).approved !== false]));
  const paid = new Set((requests.data || []).map((row) => String(row.property_id || "")));
  const q = query.trim().toLowerCase();
  const listings = (props.data || [])
    .map((row) => {
      const listing = mapProperty(row as Record<string, unknown>);
      const canPublish = approved.get(listing.agentId) !== false;
      return { ...listing, agentName: names.get(listing.agentId) || "Agent", featurePaid: paid.has(listing.id), waiting: listing.status !== "live" && !canPublish };
    })
    .filter((item) => !q || `${item.area} ${item.region} ${item.title} ${item.agentName}`.toLowerCase().includes(q));
  return { listings };
}

export async function adminRequests() {
  const db = serviceDb();
  if (!db) return { error: "The desk is not connected." as const };
  const { data } = await db.from("requests").select("id,agent_id,kind,property_id,status,created_at").order("created_at", { ascending: false }).limit(200);
  const agentIds = [...new Set((data || []).map((row) => String(row.agent_id || "")).filter(Boolean))];
  const names = new Map<string, string>();
  if (agentIds.length) {
    const profiles = await db.from("profiles").select("id,name").in("id", agentIds);
    for (const row of profiles.data || []) names.set(String(row.id), String(row.name || "Agent"));
  }
  return {
    requests: (data || []).map((row) => ({
      id: String(row.id),
      kind: String(row.kind),
      status: requestStatusLabel(String(row.status || "")),
      agent: names.get(String(row.agent_id || "")) || "Agent",
      createdAt: String(row.created_at || ""),
    })),
  };
}

export async function adminRequest(id: string) {
  const db = serviceDb();
  if (!db) return { error: "The desk is not connected." as const };
  const { data } = await db.from("requests").select("*").eq("id", id).maybeSingle();
  if (!data) return { error: "That request was not found." as const };
  const agent = data.agent_id ? await db.from("profiles").select("name,company,email").eq("id", data.agent_id).maybeSingle() : { data: null };
  const listing = data.property_id ? await db.from("properties").select("title,area").eq("id", data.property_id).maybeSingle() : { data: null };
  const summary = adminSummary({
    agentName: String(agent.data?.name || "An agent"),
    kind: String(data.kind),
    listingTitle: listing.data?.title ? String(listing.data.title) : "",
    status: String(data.status),
  });
  return {
    request: {
      id: String(data.id),
      kind: String(data.kind),
      status: String(data.status),
      statusLabel: requestStatusLabel(String(data.status || "")),
      instructions: text(data.instructions),
      message: text(data.message),
      agent: String(agent.data?.name || "Agent"),
      company: String(agent.data?.company || ""),
      listing: listing.data?.title ? `${listing.data.title}${listing.data.area ? " · " + listing.data.area : ""}` : "",
      line: summary.line,
      amountGyd: Number(data.amount_gyd || 0),
      paidAt: data.paid_at ? String(data.paid_at) : "",
      paidBy: text(data.paid_by),
    },
  };
}

export async function saveInstructions(id: string, instructions: string) {
  const db = serviceDb();
  if (!db) return { error: "The instructions could not be saved." };
  const { data } = await db.from("requests").select("status,kind").eq("id", id).maybeSingle();
  if (!data) return { error: "That request was not found." };
  if (data.kind === "help") return { error: "Help requests do not use payment instructions." };
  if (data.status === "paid" || data.status === "on" || data.status === "done") return { error: "This request is already finished." };
  const textValue = instructions.trim();
  if (!textValue) return { error: "Write the payment instructions." };
  const { error } = await db.from("requests").update({ instructions: textValue, status: "instructions" }).eq("id", id);
  if (error) return { error: "The instructions could not be saved." };
  return { ok: true };
}

export async function markPaid(id: string, receipt: { amountGyd?: number; paidBy?: string } = {}) {
  const db = serviceDb();
  if (!db) return { error: "The request could not be updated." };
  const { data } = await db.from("requests").select("*").eq("id", id).maybeSingle();
  if (!data) return { error: "That request was not found." };
  if (data.status === "paid" || data.status === "on" || data.status === "done") return { error: "This request is already finished." };
  if (data.kind === "help") {
    const { error } = await db.from("requests").update({ status: "done" }).eq("id", id);
    if (error) return { error: "The request could not be updated." };
    const agent = data.agent_id ? await db.from("profiles").select("name").eq("id", data.agent_id).maybeSingle() : { data: null };
    await remember(db, `Marked ${agent.data?.name || "an agent"}'s help request done.`);
    return { ok: true };
  }
  const amount = Math.round(Number(receipt.amountGyd || 0));
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter the amount paid in GYD." };
  const paidBy = String(receipt.paidBy || "").trim().slice(0, 120);
  const paidAt = new Date().toISOString();
  const { error } = await db.from("requests").update({ status: "paid", amount_gyd: amount, paid_at: paidAt, paid_by: paidBy }).eq("id", id);
  if (error) {
    if (String(error.message || "").toLowerCase().includes("amount_gyd")) return { error: "Payment receipt is not ready on this desk yet." };
    return { error: "The request could not be updated." };
  }
  if (data.kind === "plan" && data.agent_id) {
    await db.from("profiles").update({ plan: "agency" }).eq("id", data.agent_id);
    const agent = await db.from("profiles").select("name").eq("id", data.agent_id).maybeSingle();
    await remember(db, `Marked ${agent.data?.name || "an agent"}'s plan paid. GYD ${amount.toLocaleString("en-GY")}${paidBy ? `, marked by ${paidBy}` : ""}. Listings stay free.`);
  }
  if (data.kind === "advertise" && data.agent_id) {
    const agent = await db.from("profiles").select("name").eq("id", data.agent_id).maybeSingle();
    await remember(db, `Marked ${agent.data?.name || "an agent"}'s advertising paid. GYD ${amount.toLocaleString("en-GY")}${paidBy ? `, marked by ${paidBy}` : ""}. Listings stay free.`);
  }
  if (data.kind === "feature" && data.property_id) {
    await db.from("properties").update({ featured: true }).eq("id", data.property_id);
    const listing = await db.from("properties").select("title").eq("id", data.property_id).maybeSingle();
    await remember(db, `Marked the feature request paid for ${listing.data?.title || "a listing"}. GYD ${amount.toLocaleString("en-GY")}${paidBy ? `, marked by ${paidBy}` : ""}.`);
  }
  return { ok: true };
}

export async function setApproved(agentId: string, approved: boolean) {
  const db = serviceDb();
  if (!db) return { error: "Approval could not be saved." };
  const { data } = await db.from("profiles").select("name").eq("id", agentId).eq("role", "agent").maybeSingle();
  if (!data) return { error: "That agent was not found." };
  let founding = false;
  if (approved) {
    const counted = await db.from("profiles").select("id", { count: "exact", head: true }).eq("founding_agent", true);
    const missing = String(counted.error?.message || "").toLowerCase().includes("founding_agent");
    if (!missing && !counted.error && (counted.count || 0) < 5) founding = true;
  }
  const patch: Record<string, boolean> = { approved };
  if (founding) patch.founding_agent = true;
  let { error } = await db.from("profiles").update(patch).eq("id", agentId).eq("role", "agent");
  if (error && founding && String(error.message || "").toLowerCase().includes("founding_agent")) {
    founding = false;
    ({ error } = await db.from("profiles").update({ approved }).eq("id", agentId).eq("role", "agent"));
  }
  if (error && String(error.message || "").toLowerCase().includes("approved")) return { error: "Approval is not ready on this desk yet." };
  if (error) return { error: "Approval could not be saved." };
  const name = data.name || "an agent";
  await remember(db, approved
    ? `Approved ${name} to publish.${founding ? " Founding agent badge assigned." : ""}`
    : `Approval removed for ${name}.`);
  return { ok: true, founding };
}

export async function adminPublish(propertyId: string) {
  const db = serviceDb();
  if (!db) return { error: "The listing could not be published." };
  let row = await db.from("properties").select("title,agent_id,photo_urls,owner_permission,status").eq("id", propertyId).maybeSingle();
  if (row.error && String(row.error.message || "").toLowerCase().includes("owner_permission")) {
    row = await db.from("properties").select("title,agent_id,photo_urls,status").eq("id", propertyId).maybeSingle();
  }
  const data = row.data as { title?: string; agent_id?: string; photo_urls?: unknown; owner_permission?: boolean; status?: string } | null;
  if (row.error || !data) return { error: "That listing was not found." };
  const photos = Array.isArray(data.photo_urls) ? data.photo_urls.filter((item) => typeof item === "string" && item.length > 0) : [];
  if (photos.length < MIN_LIVE_PHOTOS) return { error: "Add at least 3 photos before this listing goes live." };
  if (data.owner_permission === false) return { error: "Confirm owner permission on the listing before it goes live." };
  if (data.agent_id) {
    const agent = await db.from("profiles").select("approved").eq("id", data.agent_id).maybeSingle();
    if (agent.data && agent.data.approved === false) return { error: "Approve the agent before this listing goes live." };
  }
  const { error } = await db.from("properties").update({ status: "live" }).eq("id", propertyId);
  if (error) return { error: "The listing could not be published." };
  await remember(db, `Published ${data.title || "a listing"}.`);
  return { ok: true };
}

export async function setVerified(agentId: string, verified: boolean) {
  const db = serviceDb();
  if (!db) return { error: "Verification could not be saved." };
  const { data } = await db.from("profiles").select("name").eq("id", agentId).eq("role", "agent").maybeSingle();
  if (!data) return { error: "That agent was not found." };
  const { error } = await db.from("profiles").update({ verified }).eq("id", agentId).eq("role", "agent");
  if (error && String(error.message || "").toLowerCase().includes("verified")) return { error: "Verification is not ready on this desk yet." };
  if (error) return { error: "Verification could not be saved." };
  await remember(db, verified ? `Set an internal flag for ${data.name || "an agent"}. This is not a public badge.` : `Cleared the internal flag for ${data.name || "an agent"}.`);
  return { ok: true };
}

export async function setPlan(agentId: string, plan: string) {
  const db = serviceDb();
  if (!db) return { error: "The plan could not be saved." };
  if (plan !== "starter" && plan !== "agency") return { error: "Choose starter or agency." };
  const { data } = await db.from("profiles").select("name").eq("id", agentId).eq("role", "agent").maybeSingle();
  if (!data) return { error: "That agent was not found." };
  const { error } = await db.from("profiles").update({ plan }).eq("id", agentId).eq("role", "agent");
  if (error) return { error: "The plan could not be saved." };
  await remember(db, `Set ${data.name || "an agent"} to ${plan}. Listings stay free. Featuring and advertising are paid.`);
  return { ok: true };
}

export async function suspendAgent(agentId: string) {
  const db = serviceDb();
  if (!db) return { error: "The agent could not be suspended." };
  const { data } = await db.from("profiles").select("name").eq("id", agentId).eq("role", "agent").maybeSingle();
  if (!data) return { error: "That agent was not found." };
  await db.from("properties").update({ status: "hidden", held_live: true }).eq("agent_id", agentId).eq("status", "live");
  const { error } = await db.from("profiles").update({ suspended: true }).eq("id", agentId).eq("role", "agent");
  if (error) return { error: "The agent could not be suspended." };
  await remember(db, `Suspended ${data.name || "an agent"}. Live listings are hidden.`);
  return { ok: true };
}

export async function unsuspendAgent(agentId: string) {
  const db = serviceDb();
  if (!db) return { error: "The agent could not be restored." };
  const { data } = await db.from("profiles").select("name").eq("id", agentId).eq("role", "agent").maybeSingle();
  if (!data) return { error: "That agent was not found." };
  await db.from("properties").update({ status: "live", held_live: false }).eq("agent_id", agentId).eq("held_live", true);
  const { error } = await db.from("profiles").update({ suspended: false }).eq("id", agentId).eq("role", "agent");
  if (error) return { error: "The agent could not be restored." };
  await remember(db, `Restored ${data.name || "an agent"}. Listings that were live show again.`);
  return { ok: true };
}

export async function adminHide(propertyId: string) {
  const db = serviceDb();
  if (!db) return { error: "The listing could not be hidden." };
  const { data } = await db.from("properties").select("title").eq("id", propertyId).maybeSingle();
  if (!data) return { error: "That listing was not found." };
  const { error } = await db.from("properties").update({ status: "hidden", held_live: false }).eq("id", propertyId);
  if (error) return { error: "The listing could not be hidden." };
  await remember(db, `Hid ${data.title || "a listing"}.`);
  return { ok: true };
}

export async function adminFeature(propertyId: string, featured: boolean) {
  const db = serviceDb();
  if (!db) return { error: "The listing could not be updated." };
  if (featured) {
    const { data } = await db.from("requests").select("id").eq("property_id", propertyId).eq("kind", "feature").in("status", ["paid", "on"]).limit(1);
    if (!data?.length) return { error: "Featured is available after that feature request is paid." };
  }
  const { error } = await db.from("properties").update({ featured }).eq("id", propertyId);
  if (error) return { error: "The listing could not be updated." };
  return { ok: true };
}

export async function adminInbox(query = "") {
  const db = serviceDb();
  if (!db) return { error: "The desk is not connected." as const };
  const [enquiries, reviews, profiles] = await Promise.all([
    db.from("enquiries").select("id,name,phone,stage,property_id,agent_id,created_at").order("created_at", { ascending: false }).limit(200),
    db.from("review_requests").select("id,enquiry_id,agent_id,buyer_id,created_at").order("created_at", { ascending: false }).limit(100),
    db.from("profiles").select("id,name"),
  ]);
  const names = new Map((profiles.data || []).map((row) => [String(row.id), String(row.name || "")]));
  const propertyIds = [...new Set((enquiries.data || []).map((row) => String(row.property_id || "")).filter(Boolean))];
  const titles = new Map<string, string>();
  if (propertyIds.length) {
    const props = await db.from("properties").select("id,title").in("id", propertyIds);
    for (const row of props.data || []) titles.set(String(row.id), String(row.title || "Home"));
  }
  const q = query.trim().toLowerCase();
  const leads = (enquiries.data || []).map((row) => ({
      id: String(row.id),
      name: String(row.name || "Lead"),
      phone: String(row.phone || ""),
      home: titles.get(String(row.property_id || "")) || "Home",
      stage: stageLabel(String(row.stage || "new")),
      agent: names.get(String(row.agent_id || "")) || "Unassigned",
      createdAt: String(row.created_at || ""),
    })).filter((lead) => !q || `${lead.name} ${lead.home} ${lead.agent} ${lead.stage}`.toLowerCase().includes(q));
  return {
    leads,
    reviews: (reviews.data || []).map((row) => ({
      id: String(row.id),
      enquiryId: String(row.enquiry_id || ""),
      agent: names.get(String(row.agent_id || "")) || "Agent",
      buyer: names.get(String(row.buyer_id || "")) || "Buyer",
      createdAt: String(row.created_at || ""),
    })).filter((review) => !q || `${review.buyer} ${review.agent}`.toLowerCase().includes(q)),
  };
}

export async function adminLead(id: string) {
  const db = serviceDb();
  if (!db) return { error: "The desk is not connected." as const };
  const { data } = await db.from("enquiries").select("id,property_id,buyer_id,agent_id,name,phone,note,abroad,move_in,occupants,stage,agent_reply,score,next_step,viewing_at,viewing_request,private_note,created_at").eq("id", id).maybeSingle();
  if (!data) return { error: "That lead was not found." as const };
  const [agent, buyer, property] = await Promise.all([
    data.agent_id ? db.from("profiles").select("name").eq("id", data.agent_id).maybeSingle() : Promise.resolve({ data: null }),
    data.buyer_id ? db.from("profiles").select("name,email").eq("id", data.buyer_id).maybeSingle() : Promise.resolve({ data: null }),
    data.property_id ? db.from("properties").select("title,area").eq("id", data.property_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  return {
    lead: {
      id: String(data.id),
      name: String(data.name || ""),
      phone: String(data.phone || ""),
      note: String(data.note || ""),
      abroad: Boolean(data.abroad),
      moveIn: String(data.move_in || ""),
      occupants: data.occupants,
      stage: stageLabel(String(data.stage || "new")),
      agentReply: String(data.agent_reply || ""),
      score: String(data.score || ""),
      nextStep: String(data.next_step || ""),
      viewingAt: data.viewing_at ? String(data.viewing_at) : "",
      viewingRequest: String(data.viewing_request || ""),
      privateNote: String(data.private_note || ""),
      home: property.data?.title ? String(property.data.title) : "Home",
      area: property.data?.area ? String(property.data.area) : "",
      agent: String(agent.data?.name || "Unassigned"),
      buyer: String(buyer.data?.name || data.name || "Buyer"),
      email: String(buyer.data?.email || ""),
    },
  };
}

export type AgentApplication = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  areas: string;
  message: string;
  status: string;
  idChecked: boolean;
  licenceChecked: boolean;
  phoneChecked: boolean;
  referenceChecked: boolean;
  notes: string;
  createdAt: string;
};

function mapApplication(row: Record<string, unknown>): AgentApplication {
  return {
    id: text(row.id),
    name: text(row.name),
    email: text(row.email),
    phone: text(row.phone),
    company: text(row.company),
    areas: text(row.areas),
    message: text(row.message),
    status: text(row.status) || "submitted",
    idChecked: row.id_checked === true,
    licenceChecked: row.licence_checked === true,
    phoneChecked: row.phone_checked === true,
    referenceChecked: row.reference_checked === true,
    notes: text(row.notes),
    createdAt: text(row.created_at),
  };
}

export async function adminApplications() {
  const db = serviceDb();
  if (!db) return { applications: [] as AgentApplication[], error: "The desk is not connected." };
  const { data, error } = await db.from("agent_applications").select("*").order("created_at", { ascending: false }).limit(100);
  if (error) {
    const missing = String(error.message || "").toLowerCase().includes("agent_applications");
    return { applications: [] as AgentApplication[], error: missing ? "Applications are not ready on this desk yet." : "Applications could not be loaded." };
  }
  return { applications: (data || []).map((row) => mapApplication(row as Record<string, unknown>)) };
}

export async function reviewApplication(id: string, body: Record<string, unknown>) {
  const db = serviceDb();
  if (!db) return { error: "The application could not be saved." };
  const status = body.status === "approved" || body.status === "declined" ? body.status : "submitted";
  const patch = {
    status,
    id_checked: body.idChecked === true,
    licence_checked: body.licenceChecked === true,
    phone_checked: body.phoneChecked === true,
    reference_checked: body.referenceChecked === true,
    notes: String(body.notes || "").slice(0, 2000),
  };
  const { data, error } = await db.from("agent_applications").update(patch).eq("id", id).select("name").maybeSingle();
  if (error && String(error.message || "").toLowerCase().includes("agent_applications")) return { error: "Applications are not ready on this desk yet." };
  if (error || !data) return { error: "The application could not be saved." };
  await remember(db, `Recorded application ${status} for ${data.name || "an applicant"}. This does not approve a login.`);
  return { ok: true };
}
