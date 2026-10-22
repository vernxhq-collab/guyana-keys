/** Stay false until Boss turns a daily briefing on. No scheduler is registered. */
export const DAILY_BRIEFING_ENABLED = false;

export function dailyBriefingJob() {
  if (!DAILY_BRIEFING_ENABLED) return { ran: false as const, reason: "disabled" as const };
  return { ran: true as const };
}
