import { cookies } from "next/headers";
import { agentFromPhoneSession } from "./phone-scan-data";
import { PHONE_SCAN_COOKIE } from "./phone-token";
import { canUseAgentDesk, readSession } from "./session";

/** The signed-in agent, or the phone that just claimed a single-use link. */
export async function readCheckAgent() {
  const session = await readSession();
  if (session?.profile && canUseAgentDesk(session.profile, session.user.email)) {
    return { agentId: session.profile.id, phone: false };
  }
  const cookie = (await cookies()).get(PHONE_SCAN_COOKIE)?.value || "";
  const agentId = cookie ? await agentFromPhoneSession(cookie) : "";
  if (!agentId) return null;
  return { agentId, phone: true };
}
