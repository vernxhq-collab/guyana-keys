# Identity documents and Keys Check

Facial images, ID scans, and a short code clip are sensitive personal data. A face image is biometric data under Guyana's Data Protection Act 18 of 2023. Guyana Keys keeps them only so a person can check identity and a licence. This file describes what the app does. It is not a legal opinion, and it does not claim that a check is accurate or certified.

## Keys Check

Keys Check is the in-house check. A person reviews the files. There is no Didit integration and no other identity company. The running provider is `manual`.

`src/lib/keys-check.ts` exports `verificationProvider()`. Its id is `manual` and its review is `human`. The same file names two ids that are not implemented:

- `future_inhouse_auto` is the slot for a later open-source document reader, such as OCR or MRZ reading, if Boss asks for it. There is no `readDocument` method in this phase.
- `future_eid_registry` is the slot for a later lookup against Guyana's Digital Identity Card registry, if government access exists. There is no registry client in this phase.

There is no face-recognition function and no face-match model. The reviewer checkbox that asks whether the face looks like the ID photo is a human note. The words on that checkbox say that software did not compare the photos.

## What is collected

After the agent confirms the consent text, Keys Check can store:

- The front and the back of a national ID, a passport, or a driver's licence.
- One or more licence documents.
- A selfie of the agent holding the ID next to their face.
- A one-time code, the time it was issued, and either a photo of the agent holding paper with that code or a short clip of them saying it. The code expires after 30 minutes.

The browser warns about a small photo, a soft photo, or a very bright photo. Those warnings use a canvas sample in the browser. They are warnings, not a score, and they are not a decision. A short clip is not scored.

Each stored file has a sha256 hash. If the same hash, or the same ID number, is already on another account, the check is flagged. The agent sees that fact and not the other account's files.

The public profile photo is a different file. It goes in the public `listing-photos` bucket. A Keys Check file never goes there.

## Why

The files are used so a person can check identity and a licence, to reduce fraud, and to keep Guyana Keys' own record of that check. They are not used for marketing or profiling. The upload route does not send the bytes to an AI model, a chat route, or an assist route.

## Review

The admin page shows the ID, the selfie, the code photo or clip, and the licence. Opening the set writes one audit row per file before any 60-second link is created. If an audit insert fails, no link is returned.

The reviewer saves a checklist and a note. That step does not approve the check. A second step approves, rejects, or asks for the files again, and that step stores the reason, the person, and the time. Both steps are written to `audit_events`. This desk has one admin role, so the two steps are two actions rather than two logins.

Approval can add "ID" to the public check line. The line still names what was checked. It does not say only "Verified".

## Where it lives

- Bucket name: `identity-documents`.
- The bucket is private. The app does not build a public object URL for these files.
- The object path starts with the agent's id.
- Metadata is in `id_documents`: kind (`id_front`, `id_back`, `licence`, `selfie_with_id`, `code_selfie`, `code_video`), storage path, sha256, quality note, `consent_version`, `consent_at`, `retention_months` (default 24), and `deleted_at`.
- The check itself is in `keys_checks`, including the code and `code_issued_at`. Flags are in `keys_check_flags`.
- Row level security lets an agent read and insert only their own rows. An agent cannot read another agent's documents. An agent cannot set a check to approved. Anonymous users have no select grant on the document table.
- The app uploads and opens files with the service role. A missing bucket returns "The private identity bucket is not set up yet." It does not fall back to `listing-photos`.

## Who can see a file

- The agent can see that a file is on their account. They do not get a stored public link.
- An admin can open a file only through a signed URL that lasts 60 seconds.
- Before that URL is created, the app writes `audit_events` with action `id_document_view` or `id_document_download`. If the audit insert fails, the URL is not created.
- A purge writes `id_document_purge`. A review note writes `keys_check_noted`. A decision writes `keys_check_approve`, `keys_check_reject`, or `keys_check_resubmit`.

## Consent

The checks page shows the consent text in `src/lib/compliance/retention.ts` before a file input can be used. The text covers the ID photos, the licence, the selfie holding the ID, the code photo or code video, why the files are kept, how long they are kept, who can see them, and the right to ask for access or deletion. The stored version is `2026-10-22-keys` (`ID_CONSENT_VERSION`). A file without that version and a timestamp is rejected.

## How long it is kept

The default is while the account is active, plus 24 months after the account closes. `retention_months` is 24. `retention_until` is not set while the account is active. The retention review in `retentionReviewJob()` is switched off (`RETENTION_REVIEW_ENABLED` is false). Nothing is scheduled, and the job does not delete files.

## Access and deletion

- The agent can ask for a file to be deleted from the checks page. That inserts `id_deletion_requests` with status `requested`.
- An admin purges the object, sets `deleted_at`, and marks open requests `purged`.
- An admin can mark a request `declined`.
- Asking for the file to be shown is the same admin open path, which is audited.

## What Boss does in the Supabase dashboard

The migration file can insert the bucket when `storage.buckets` exists. Confirm these steps in the dashboard anyway. This app does not create the live bucket from the agent runtime.

1. Open the project `yednogdlhokowqddznht` in the Supabase dashboard.
2. Go to Storage.
3. If `identity-documents` is missing, create a bucket with that exact name.
4. Leave **Public bucket** off. There must be no public URL and no policy that allows `anon` or the public to read objects.
5. Confirm the two policies from `supabase/phase1-market.sql` if they are not already there: an authenticated user may select or insert only objects whose first folder is their own user id. Do not add a public read policy.
6. Run `supabase/phase1-market.sql` yourself if the tables are not there yet. Do not run it from the app, and do not run it against a preview database that is not this project.
7. Open Storage again and confirm the bucket still shows as private after the SQL.

## What is mocked

`/preview/keys-check` shows the form and empty reviewer boxes when `PREVIEW_DESK=1`. It does not store a file, a code, or a decision, and it has no sample ID image. Sample partners and sample listings stay on their own preview routes. If the bucket or the table is missing, the desk says so and stores nothing.
