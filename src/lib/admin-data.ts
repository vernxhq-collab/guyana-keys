import { adminSummary } from "./assist";
import { mapProperty } from "./catalog";
import { hoursSince, newId, planLabel, requestStatusLabel, stageLabel } from "./labels";
import { serviceDb } from "./supabase";

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

type Db = NonNullable<ReturnType<typeof serviceDb>>;

async function remember(db: Db, detail: string) {
  await db.from("admin_events").insert({ id: newId("log"), detail });
}

function shownCap(plan: string, cap: number) {
  const safe = Number.isFinite(cap) && cap > 0 ? cap : 3;
  return plan === "agency" ? safe : Math.min(safe, 3);
}

export async function adminHome() {
  const db = serviceDb();
  if (!db) return { error: "The desk is not connected." as const };
  const [agents, listings, enquiries, requests, profiles, events] = await Promise.all([
    db.from("profiles").select("id", { count: "exact", head: true }).eq("role", "agent"),
    db.from("properties").select("id", { count: "exact", head: true }).eq("status", "live"),
    db.from("enquiries").select("id,agent_reply,stage,created_at"),
    db.from("requests").select("id,agent_id,kind,property_id,status,message,created_at").in("status", ["submitted", "instructions"]).order("created_at", { ascending: false }),
    db.from("profiles").select("id,name"),
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
  };
}

export async function adminPeople(query = "") {
  const db = serviceDb();
  if (!db) return { error: "The desk is not connected." as const };
  const [profiles, listings, saves, enquiries] = await Promise.all([
    db.from("profiles").select("id,name,email,company,role,plan,listing_cap,suspended").order("created_at", { ascending: false }),
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
      plan: planLabel(String(row.plan || "starter")),
      planKey: String(row.plan || "starter"),
      live: live.get(String(row.id)) || 0,
      cap: shownCap(String(row.plan || "starter"), Number(row.listing_cap || 3)),
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
    agents: result.agents.filter((agent) => `${agent.name} ${agent.company} ${agent.email}`.toLowerCase().includes(q)),
    buyers: result.buyers.filter((buyer) => `${buyer.name} ${buyer.email}`.toLowerCase().includes(q)),
  };
}

export async function adminListings(query: string) {
  const db = serviceDb();
  if (!db) return { error: "The desk is not connected." as const };
  const [props, profiles, requests] = await Promise.all([
    db.from("properties").select("*").order("created_at", { ascending: false }).limit(300),
    db.from("profiles").select("id,name,company").eq("role", "agent"),
    db.from("requests").select("property_id,status").eq("kind", "feature").in("status", ["paid", "on"]),
  ]);
  const names = new Map((profiles.data || []).map((row) => [String(row.id), `${row.name || "Agent"}${row.company ? " · " + row.company : ""}`]));
  const paid = new Set((requests.data || []).map((row) => String(row.property_id || "")));
  const q = query.trim().toLowerCase();
  const listings = (props.data || [])
    .map((row) => {
      const listing = mapProperty(row as Record<string, unknown>);
      return { ...listing, agentName: names.get(listing.agentId) || "Agent", featurePaid: paid.has(listing.id) };
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

export async function markPaid(id: string) {
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
  const { error } = await db.from("requests").update({ status: "paid" }).eq("id", id);
  if (error) return { error: "The request could not be updated." };
  if (data.kind === "plan" && data.agent_id) {
    await db.from("profiles").update({ plan: "agency", listing_cap: 20 }).eq("id", data.agent_id);
    const agent = await db.from("profiles").select("name").eq("id", data.agent_id).maybeSingle();
    await remember(db, `Marked ${agent.data?.name || "an agent"}'s plan paid. The plan is agency and the cap is 20.`);
  }
  if (data.kind === "feature" && data.property_id) {
    await db.from("properties").update({ featured: true }).eq("id", data.property_id);
    const listing = await db.from("properties").select("title").eq("id", data.property_id).maybeSingle();
    await remember(db, `Marked the feature request paid for ${listing.data?.title || "a listing"}.`);
  }
  return { ok: true };
}

export async function setCap(agentId: string, cap: number) {
  const db = serviceDb();
  if (!db) return { error: "The cap could not be saved." };
  if (!Number.isFinite(cap) || cap < 1 || cap > 500) return { error: "Enter a cap from 1 to 500." };
  const { data } = await db.from("profiles").select("name,plan").eq("id", agentId).eq("role", "agent").maybeSingle();
  if (!data) return { error: "That agent was not found." };
  const rounded = Math.round(cap);
  if (String(data.plan || "starter") !== "agency" && rounded > 3) return { error: "A free plan stays at 3 live listings." };
  const { error } = await db.from("profiles").update({ listing_cap: rounded }).eq("id", agentId).eq("role", "agent");
  if (error) return { error: "The cap could not be saved." };
  await remember(db, `Set ${data.name || "an agent"}'s cap to ${rounded}.`);
  return { ok: true };
}

export async function setPlan(agentId: string, plan: string) {
  const db = serviceDb();
  if (!db) return { error: "The plan could not be saved." };
  if (plan !== "starter" && plan !== "agency") return { error: "Choose starter or agency." };
  const listingCap = plan === "agency" ? 20 : 3;
  const { data } = await db.from("profiles").select("name").eq("id", agentId).eq("role", "agent").maybeSingle();
  if (!data) return { error: "That agent was not found." };
  const { error } = await db.from("profiles").update({ plan, listing_cap: listingCap }).eq("id", agentId).eq("role", "agent");
  if (error) return { error: "The plan could not be saved." };
  await remember(db, plan === "agency"
    ? `Set ${data.name || "an agent"} to agency. The cap is 20.`
    : `Set ${data.name || "an agent"} to the free plan. The cap is 3.`);
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
