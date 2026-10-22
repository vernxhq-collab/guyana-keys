# Founding agent verification

This is the checklist for the first applications. Record the outcome. Do not store an ID image, a licence scan, or a registration document in the app. There is no private bucket for those files yet.

Proposed later, and not built here: a private Supabase Storage bucket that only the service role can read, with a short retention rule, and no public URL. Until that exists, keep documents outside the app.

## Before anyone is approved to publish

1. Identity, where it applies. Look at a government ID. Tick "ID checked" only after that look. Do not upload the image.
2. Licence or business registration, where it applies. Tick "Licence or business registration checked" only after that look. Some applicants will not have one. Leave it unticked and say why in the notes.
3. Phone. Call or message the number on the application and confirm the person applied. Tick "Phone checked".
4. A reference, or proof they can list. One of: a named person who will confirm they work with the applicant, or a property the applicant can show they are allowed to list. Tick "A reference or a listing proof checked".

Notes are for the outcome, not for copying an ID number into the database.

## What approval means

- Marking an application approved stores a review record. It does not create a login and it does not set `profiles.approved`.
- After the person has an account, an admin approves that profile on People. That is the switch that lets a listing go live.
- The first five profiles set to approved after this change can receive `founding_agent`. The public badge says "Founding agent". It does not say the person is verified, and it is not a promise about title or conduct.
- Removing approval does not clear the badge. A slot is not reused. Profiles that were already approved before this column exists are not badged unless an admin approves them again while fewer than five badges exist.

## Listing photos

A live listing needs at least three photos and a ticked owner-permission box. The agent also confirms the photos are landscape, clear enough to see the property, with no watermark and no other agency logo. The app does not measure pixels and does not scan for logos. That check is a confirmation, not an inspection.

Proposed later, if an image library is approved: refuse a live listing when the longest side is under 1200 pixels, or when the photo is portrait. Still no automatic logo detection in that step.
