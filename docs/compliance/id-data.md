# Identity documents

Facial images and ID scans are sensitive personal data, and a face image is biometric data, under Guyana's Data Protection Act 18 of 2023. Guyana Keys keeps them only for identity and licence checks. This file describes what the app does. It is not a legal opinion.

## What is collected

- An ID scan (JPEG, PNG, or PDF), uploaded by the signed-in agent after they confirm the consent text.
- An optional selfie. The selfie box stores a file the agent chooses. No liveness provider is connected. Didit is not integrated. A liveness provider is paid and stays out until Boss approves it.

The public profile photo is a different file. It goes in the public `listing-photos` bucket. An ID scan or selfie never goes there.

## Why

The file is used to check identity and a licence, to reduce fraud, and to keep Guyana Keys' own record of that check for a later review. It is not used for marketing or profiling. The upload route does not send the bytes to an AI model, a chat route, or an assist route.

## Where it lives

- Bucket name: `identity-documents`.
- The bucket is private. The app does not build a public object URL for these files.
- The object path starts with the agent's id.
- Metadata is in `id_documents`: kind (`id_scan` or `selfie`), storage path, `consent_version`, `consent_at`, `retention_months` (default 24), and `deleted_at`.
- Row level security lets an agent read and insert only their own metadata. An agent cannot read another agent's row. Anonymous users have no select grant.
- The app uploads and opens files with the service role. A missing bucket returns "The private identity bucket is not set up yet." It does not fall back to `listing-photos`.

## Who can see a file

- The agent can see that a file is on their account. They do not get a stored public link.
- An admin can open a file only through a signed URL that lasts 60 seconds.
- Before that URL is created, the app writes `audit_events` with action `id_document_view` or `id_document_download`. If the audit insert fails, the URL is not created.
- A purge writes `id_document_purge`.

## Consent

The checks page shows the consent text in `src/lib/compliance/retention.ts` before the file input can be used. The text covers what is collected, why, how long it is kept, who can see it, and the right to ask for access or deletion. The stored version is `2026-10-22` (`ID_CONSENT_VERSION`). A file without that version and a timestamp is rejected.

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

Sample partners and sample listings are preview-only. Identity files are not mocked. If the bucket or the table is missing, the desk says so and stores nothing.
