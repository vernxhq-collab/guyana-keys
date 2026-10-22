# Implementation plan

Sequence is the order to do the work. Effort is the size of the change: small is one module, medium is several files, large needs an outside account or a product decision. No calendar dates.

## A. Build now, in this repo, at no cost

| Seq | Work | Effort | Notes |
| --- | --- | --- | --- |
| 1 | Market home and desk previews, gated by `PREVIEW_DESK` | Medium | In this pull request. Sample cards only on `/preview/home` and `/preview/desk`. |
| 2 | Real home uses the same cards from the database | Small | In this pull request. Empty state when nothing is live. |
| 3 | Search understands budget and `purpose=Land` | Small | In this pull request. Buy and rent URLs stay as they are. |
| 4 | Free plan cap of 3 live listings, in code and in SQL | Medium | Code is in this pull request. `supabase/founding.sql` is for Boss to run. Agency plans can still use a higher cap. |
| 5 | Live listings need 3 photos and owner permission | Small | In this pull request. Pixel size and logos are a confirmation, not a scan. |
| 6 | Public application form and admin checklist | Medium | In this pull request. The table has to exist before a row can be saved. |
| 7 | Founding badge for the first five approvals | Small | In this pull request. Needs the new column. |
| 8 | Message draft gate, noop model, disabled briefing | Small | In this pull request. No paid model call. |

## B. Needs an external integration

Boss has to approve the spend before any of these are connected. None of them are turned on here.

| Seq | Work | Effort | Cost note |
| --- | --- | --- | --- |
| 9 | Email that actually sends | Medium | Resend is already the mail path for alerts. Free tier is 3,000 emails a month, then a paid plan. Preview deployments already skip sending. |
| 10 | WhatsApp Business API | Large | A business account, templates, and per-message fees. The channel interface is a stub. Do not connect WaSender or another sender for CRM until this is approved. |
| 11 | Maps beyond the current basemap | Medium | The listing map already draws tiles. A paid geocoder or places API is a separate approval. |
| 12 | Payments | Large | Featuring and advertising are marked paid by an admin today. A card processor is a new vendor and a new fee. |
| 13 | A hosted language model | Medium | The provider interface returns an empty draft. A model API is a paid call and stays unwired. |

## C. Depends on agents or real inventory

| Seq | Work | Effort | Notes |
| --- | --- | --- | --- |
| 14 | Run `supabase/founding.sql` on the project | Small | Boss runs it. This pull request does not. |
| 15 | Review the first applications and approve accounts | Medium | The checklist is in `verification.md`. Approval on People is what allows a live listing. |
| 16 | First live photos and prices | Large | Comes from the inventory goals in `inventory.md`. The home stays empty until those rows exist. |
| 17 | Daily briefing and follow-up drafts | Medium | The job is disabled. It becomes useful after there are enquiries to summarise. |
| 18 | Lead scoring | Medium | The activity table is ready for notes. A score needs real enquiry history, and it must use budget, timing, and area, not ethnicity or national origin. |
