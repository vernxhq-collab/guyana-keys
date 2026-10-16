import { cookies } from "next/headers";
import { authClient, serviceDb } from "./supabase";

export const SESSION_COOKIE = "gk_session";

export type Role = "buyer" | "agent" | "admin";

export type Profile = {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: Role;
  company: string;
  address: string;
  photoUrl: string;
  graLicence: string;
  verified: boolean;
  areas: string[];
  plan: string;
  listingCap: number;
  abroad: boolean;
  suspended: boolean;
};

export type SessionUser = { id: string; name: string; email: string };

const redirects = {
  buyer: "https://guyana-keys.vercel.app/account",
  agent: "https://guyana-keys.vercel.app/agent",
  admin: "https://guyana-keys.vercel.app/admin",
} as const;

export type Desk = keyof typeof redirects;

export function redirectFor(desk: Desk) {
  return redirects[desk];
}

export function isAdminEmail(email: string) {
  const list = (process.env.ADMIN_EMAILS || "")
    .split(/[,;\s]+/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.trim().toLowerCase());
}

export function canUseAgentDesk(profile: Profile | null | undefined, email?: string) {
  if (!profile || profile.suspended) return false;
  if (profile.role === "agent") return true;
  return profile.role === "admin" && isAdminEmail(email || profile.email);
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export function liveCap(plan: string, listingCap: number) {
  const cap = Number.isFinite(listingCap) && listingCap > 0 ? listingCap : 3;
  return plan === "agency" ? cap : Math.min(cap, 3);
}

export function mapProfile(row: Record<string, unknown>): Profile {
  const role = text(row.role, "buyer");
  const plan = text(row.plan, "starter") || "starter";
  return {
    id: text(row.id),
    email: text(row.email),
    name: text(row.name),
    phone: text(row.phone),
    role: role === "agent" || role === "admin" ? role : "buyer",
    company: text(row.company),
    address: text(row.address),
    photoUrl: text(row.photo_url),
    graLicence: text(row.gra_licence),
    verified: Boolean(row.verified),
    areas: Array.isArray(row.areas) ? row.areas.filter((item): item is string => typeof item === "string") : [],
    plan,
    listingCap: liveCap(plan, Number(row.listing_cap ?? 3)),
    abroad: Boolean(row.abroad),
    suspended: Boolean(row.suspended),
  };
}

export async function userFromToken(token: string): Promise<SessionUser | null> {
  const client = authClient();
  if (!client || !token) return null;
  const { data } = await client.auth.getUser(token);
  const user = data.user;
  if (!user?.email) return null;
  const meta = user.user_metadata?.name;
  const name = typeof meta === "string" && meta.trim() ? meta.trim() : user.email.split("@")[0];
  return { id: user.id, name, email: user.email };
}

export async function readToken() {
  return (await cookies()).get(SESSION_COOKIE)?.value || "";
}

export async function readSession() {
  const token = await readToken();
  if (!token) return null;
  const user = await userFromToken(token);
  if (!user) return null;
  const profile = await loadProfile(user.id);
  return { token, user, profile };
}

export async function loadProfile(id: string) {
  const db = serviceDb();
  if (!db) return null;
  const { data } = await db.from("profiles").select("*").eq("id", id).maybeSingle();
  return data ? mapProfile(data as Record<string, unknown>) : null;
}

async function insertProfile(user: SessionUser, role: Role) {
  const db = serviceDb();
  if (!db) return null;
  const row = {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: "",
    role,
    company: "",
    photo_url: "",
    areas: [],
    plan: "starter",
    listing_cap: 3,
    abroad: false,
    suspended: false,
  };
  const { error } = await db.from("profiles").insert(row);
  if (error) {
    const again = await loadProfile(user.id);
    if (again) return again;
    return null;
  }
  return mapProfile(row);
}

async function withEmail(user: SessionUser, profile: Profile | null) {
  if (!profile || profile.email || !user.email) return profile;
  const db = serviceDb();
  if (!db) return { ...profile, email: user.email };
  await db.from("profiles").update({ email: user.email }).eq("id", user.id);
  return { ...profile, email: user.email };
}

export async function grantAdmin(user: SessionUser) {
  if (!isAdminEmail(user.email)) return withEmail(user, await loadProfile(user.id));
  const existing = await withEmail(user, await loadProfile(user.id));
  if (!existing) return insertProfile(user, "admin");
  if (existing.role === "admin") return existing;
  const db = serviceDb();
  if (!db) return existing;
  const { error } = await db.from("profiles").update({ role: "admin" }).eq("id", user.id);
  if (error) return existing;
  return { ...existing, role: "admin" as const };
}

export async function ensureProfile(user: SessionUser, desk: Desk) {
  if (desk === "admin") return isAdminEmail(user.email) ? grantAdmin(user) : withEmail(user, await loadProfile(user.id));
  const existing = await withEmail(user, await loadProfile(user.id));
  if (existing) return existing;
  if (desk === "agent") return insertProfile(user, "agent");
  return insertProfile(user, "buyer");
}
