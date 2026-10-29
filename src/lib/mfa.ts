import { cookies } from "next/headers";
import { authClient } from "./supabase";

// Two-step sign-in for reviewers, on Supabase Auth's built-in TOTP factor (free on every plan).
// A reviewer signs in with the email link (aal1), then enters a 6-digit code from an
// authenticator app. Supabase then issues a session at aal2. The admin desk and admin APIs
// only open at aal2.

export const REFRESH_COOKIE = "gk_refresh";

export { cleanCode, qrImageSrc, tokenAal, twoStepDone } from "./mfa-token.ts";

/** A short-lived Supabase client acting as the signed-in reviewer. Nothing is stored. */
export async function reviewerClient(accessToken: string) {
  const client = authClient();
  if (!client || !accessToken) return null;
  const refresh = (await cookies()).get(REFRESH_COOKIE)?.value || "";
  if (!refresh) return null;
  const { error } = await client.auth.setSession({ access_token: accessToken, refresh_token: refresh });
  if (error) return null;
  return client;
}
