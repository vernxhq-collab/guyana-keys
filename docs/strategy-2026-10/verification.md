# Founding agent verification

This is the checklist for the first applications. Record the outcome. Keys Check keeps the ID images, the selfie, the code photo or short clip, and the licence scan in the private `identity-documents` bucket. The bucket is not public. A file is stored only with consent, an audit row before any signed link, and a deletion request. See `docs/compliance/id-data.md`.

## Before anyone is approved to publish

1. Identity, where it applies. The person uploads the ID images in Keys Check and consents to Boss keeping them for the review. Tick "ID checked" only after a person has looked. The app does not compare faces and does not score the photo.
2. Licence or business registration, where it applies. Keys Check can keep that scan in the same private bucket. Tick "Licence or business registration checked" only after a person has looked. Some applicants will not have one. Leave it unticked and say why in the notes.
3. Phone. Call or message the number on the application and confirm the person applied. Tick "Phone checked".
4. A reference, or proof they can list. One of: a named person who will confirm they work with the applicant, or a property the applicant can show they are allowed to list. Tick "A reference or a listing proof checked".

Notes are for the review outcome. The ID number sits on the Keys Check row so a repeat across accounts can be flagged. It is not copied into the public listing.

## What approval means

- Marking an application approved stores a review record. It does not create a login and it does not set `profiles.approved`.
- After the person has an account, an admin approves that profile on People. That is the switch that lets a listing go live.
- The first five profiles set to approved after this change can receive `founding_agent`. The public badge says "Founding agent". It does not say the person is verified, and it is not a promise about title or conduct.
- Removing approval does not clear the badge. A slot is not reused. Profiles that were already approved before this column exists are not badged unless an admin approves them again while fewer than five badges exist.

## Listing photos

A live listing needs at least three photos and a ticked owner-permission box. The agent also confirms the photos are landscape, clear enough to see the property, with no watermark and no other agency logo. The app does not measure pixels and does not scan for logos. That check is a confirmation, not an inspection.

Proposed later, if an image library is approved: refuse a live listing when the longest side is under 1200 pixels, or when the photo is portrait. Still no automatic logo detection in that step.
