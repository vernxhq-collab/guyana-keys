# Keys Check roadmap

Keys Check is Guyana Keys' own identity and licence check. A person reviews the files. This note is a plan. It is not a claim that any stage is certified, and the product does not state an accuracy rate.

The provider ids live in `src/lib/keys-check.ts`: `manual`, `future_inhouse_auto`, and `future_eid_registry`. Only `manual` runs.

## Stage 1, now

A signed-in agent uses the phone browser. They photograph the front and back of a national ID, passport, or driver's licence, add the licence document, take a selfie holding the ID, and either photograph a one-time code written on paper or record a short clip saying that code. The code and the time it was issued are stored.

The browser can warn that a photo looks small, soft, or very bright. Those warnings are not a decision. Each file is hashed with sha256. The same file hash, or the same ID number, on two accounts is flagged for the reviewer.

An admin opens the files side by side for 60 seconds. Each open is audited. The reviewer saves a checklist and a note. A second action approves, rejects, or asks for the files again, with a reason, a name, and a time. No face-matching model runs.

Each row stores `subject_type`: `agent`, `tenant`, `purchaser`, or `landlord`. The provider does not change with that value. This phase writes `agent` only. A later tenant, purchaser, or landlord check uses the same table. That later use is described in `docs/strategy-2026-10/tenancy-toolkit.md` and is not built.

Retention, consent, the private `identity-documents` bucket, signed URLs, the audit log, and deletion requests are described in `docs/compliance/id-data.md`.

## Stage 2, assisted reading

This stage is not built. If Boss asks for it, an open-source reader could sit behind `future_inhouse_auto` in `src/lib/keys-check.ts`. A later method could read text from a document image, including a passport MRZ, and could repeat the duplicate-hash check that stage 1 already does in the database.

That method would return text for a person to compare. It would not approve a check, and it would not compare faces. A face-match model is a separate decision and is not part of this slot. The bytes would still stay out of marketing and out of general chat tools.

## Stage 3, e-ID registry

This stage is not built. If the government later allows a check against Guyana's Digital Identity Card registry, that client would sit behind `future_eid_registry` in the same file. The manual review, the private files, and the audit log would stay. Registry access would need its own agreement, and this plan does not assume that access exists.

## Stage 4, offering Keys Check to other businesses

This stage is not built. Offering the check to other Guyanese businesses would need, at least:

- A security certification such as ISO 27001.
- Independent testing of liveness and of resistance to spoofed photos and clips.
- Engagement with the Data Protection Commissioner.
- A legal entity that can hold the processing responsibility.
- Insurance that covers the service.

None of those is in place. The app must not say that Keys Check is certified, insured, or measured for accuracy.
