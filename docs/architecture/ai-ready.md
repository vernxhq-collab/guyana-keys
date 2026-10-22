# AI-ready foundations

Nothing in this layer calls a paid model. The pieces below are so a later lead score, a follow-up draft, WhatsApp, or a morning briefing can be added without replacing the desk.

## Leads and activity

Enquiries are already the lead record. `lead_activity` is a timeline of notes and events for one enquiry. `follow_up_tasks` is a due date and a done flag. The preview desk shows the pipeline as Lead, Contacted, Viewing, Offer, Closed. Those labels match the existing stages `new`, `contacted`, `viewing`, `offer`, and `closed`. The database stage names are unchanged.

## Drafts must be approved

`message_drafts.status` is `draft`, `approved`, or `sent`. A database trigger rejects an insert that is already sent, and rejects an update to sent unless the row was approved. `nextDraftStatus` in `src/lib/ai/drafts.ts` is the same rule in code. The preview inbox shows a draft in a read-only box. Nothing on that page sends.

`approved_at` is set when a draft becomes approved. `sent_at` is set when it becomes sent.

## Channels

`src/lib/ai/channel.ts` names two channels, email and WhatsApp. Both senders return "not connected". A later adapter implements `ChannelSender` for one channel. The desk and the draft table do not need a new shape.

## Outbox

`event_outbox` stores `kind`, a JSON payload, and `pending`, `done`, or `failed`. `pendingEvent` builds that shape and does not write a row. A later worker can insert a pending row when a lead is created or a draft is approved, then mark it done after the channel send. This is separate from the older `outbox` table used by the preview world.

## Model provider

`LlmProvider.draft` returns text and a provider id. `activeProvider` returns the noop provider, which returns an empty string and does not use the network. The existing listing and reply copy still uses the local templates in `src/lib/ai/local.ts`. Replacing the noop provider is the only change required to try a hosted model, and that replacement stays behind an explicit approval.

## Daily briefing

`DAILY_BRIEFING_ENABLED` is false. `dailyBriefingJob` returns `{ ran: false, reason: "disabled" }`. No scheduler is registered. When it is turned on later, it should read the agent's new enquiries, due follow-ups, and viewings, and write a draft. It should not send that draft.

## What can plug in later

- A score can read enquiry fields and activity. It should use budget, timing, and area. It must not use ethnicity or national origin.
- A follow-up draft can call the provider, insert `message_drafts` as `draft`, and stop. A person approves, then a person sends.
- WhatsApp can implement the WhatsApp sender. The draft status gate stays.
- The briefing job can be enabled once there is a queue to read. It still writes drafts, not messages.
