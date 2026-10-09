export const STAGES = ["new", "contacted", "viewing", "offer", "closed"] as const;

const stageNames: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  viewing: "Viewing",
  offer: "Offer",
  closed: "Closed",
};

const requestNames: Record<string, string> = {
  submitted: "Submitted",
  instructions: "Payment instructions",
  paid: "Paid",
  on: "On",
  done: "Done",
};

const eventNames: Record<string, string> = {
  enquiry_received: "Enquiry received",
  reply_drafted: "Reply drafted",
  stage_changed: "Stage changed",
  viewing_set: "Viewing set",
  viewing_requested: "Viewing requested",
  viewing_cleared: "Viewing time removed",
  review_asked: "Review asked",
};

export function stageLabel(stage: string) {
  return stageNames[stage] || "New";
}

export function requestStatusLabel(status: string) {
  return requestNames[status] || "Submitted";
}

export function requestKindLabel(kind: string) {
  if (kind === "plan") return "Package";
  if (kind === "feature") return "Feature";
  if (kind === "help") return "Help";
  return "Request";
}

export function eventLabel(kind: string) {
  return eventNames[kind] || kind;
}

export function planLabel(plan: string) {
  if (plan === "agency") return "Agency";
  return "Starter";
}

export function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function digits(phone: string) {
  return phone.replace(/\D/g, "");
}

export function hoursSince(iso: string) {
  const time = new Date(iso).getTime();
  if (!Number.isFinite(time)) return 0;
  return (Date.now() - time) / 36e5;
}
