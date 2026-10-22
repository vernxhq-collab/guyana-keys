# Tenancy toolkit

This is a plan for a lettings workflow on Guyana Keys, in the spirit of Goodlord. Goodlord is a UK lettings platform: it references tenants, holds a digital tenancy agreement, tracks move-in payments, and walks a landlord through compliance. This note is not a copy of that product, and none of the workflow below is built.

The only change in this pull request is that a Keys Check row can name who it is about. `subject_type` is `agent`, `tenant`, `purchaser`, or `landlord`. The same table and the same manual provider serve every role. This phase writes `agent` only.

Basics for owners and agents stay free. Paid referencing and a tenancy pack are a later price, not a price set here. Nothing here claims that a check, a signature, or a template has been certified, or that it is legally sufficient.

## 1. Tenant and purchaser Keys Check

A tenant or a purchaser can go through the same Keys Check an agent uses today: the front and back of a national ID, passport, or driver's licence, a selfie holding that ID, and a one-time code on paper or in a short clip. The code and the time it was issued are stored.

The check runs only after that person has agreed, in the same way an agent agrees today. The consent text has to name the selfie and the code clip. The files stay in the private `identity-documents` bucket, with the same retention, signed-link, audit, and deletion rules in `docs/compliance/id-data.md`.

The row's `subject_type` is `tenant` or `purchaser`. No separate check table is required. No face-matching model is part of this plan.

## 2. Tenant referencing

Referencing is a set of documents and replies, not a score.

- Affordability: income documents or a letter from the employer. The page shows rent against that income as a fact, for example the monthly rent and the stated monthly income side by side. It does not turn that into a pass mark or a points total.
- A reference from a previous landlord, where the applicant has one.
- A reference from the employer.
- A guarantor, as an option when the applicant offers one. The guarantor's own consent is required before their details are stored.

The criteria are written down and applied in the same way to every applicant for that listing. The same questions, the same documents, and the same facts.

The check does not ask about, and does not filter on, ethnicity, religion, nationality, gender, family status, disability, or a similar characteristic. There is no shared tenant blacklist, and no list of people who are refused across landlords.

The landlord sees the result and decides whether to offer the tenancy. Guyana Keys does not make that decision. The applicant sees what was checked and can correct a wrong document, a wrong figure, or a wrong reply.

## 3. Purchaser checks

A purchaser check is for a buyer, including someone buying from outside Guyana, and it is also something a seller can ask to see.

- Keys Check, with `subject_type` set to `purchaser`, and with the buyer's consent.
- An upload of proof of funds, or of a mortgage agreement in principle. The file is stored as a private document. The page records that it was uploaded. It does not say the funds are cleared or that a lender has approved a loan.
- The name and contact of the solicitor or attorney the buyer will use.

A listing still does not prove title. The existing title line stays "Stated by agent/owner" unless a lawyer partner has checked it.

## 4. Digital tenancy agreement

A tenancy template can be filled in the app: the parties, the property, the rent, the term, and the deposit. Signing, in the first version, is a typed name, the time, and the IP address of the browser that sent it. That record is free. There is no paid signature vendor in this plan.

A Guyana attorney has to review the template before it is offered to anyone. Until that review is recorded, the template stays unpublished. The app must not say that a typed name is enough for a particular tenancy. The attorney's review is what allows the template to be used.

## 5. Move-in

When a tenancy is agreed, the move-in record has three parts.

- An inventory and condition report, with photos of the rooms and of anything already damaged. The photos are property photos for that tenancy, not identity photos.
- A checklist for the deposit and the first month's rent: the amount, whether the landlord has marked it received, and the date. Marking it received is a note. It is not a payment.
- Key handover: how many keys, and the date they were handed over.

## 6. Rent reminders and receipts

A landlord can record a due date, send a reminder, and record a receipt: the amount, the period, and the date. The receipt is a note the landlord made. It is not a bank confirmation.

Taking the money in the app needs a payment provider. That sits with the other external integrations. It has a vendor cost, and it waits for Boss to approve the spend. No provider is connected in this plan.

## 7. Commercial model

Owners and agents can use the basic record at no charge: the checklist, the inventory, the reminder, and the receipt note. That matches the self-serve idea already on the market home, where an owner can list without buying a package first.

A later upgrade can charge per reference, or for a tenancy pack that bundles the check, the references, and the agreement. No amount is set here. The free plan for listings is unchanged.

## What this pull request does not build

No tenant form, no purchaser form, no reference request, no agreement, no inventory, no reminder, and no receipt. The agent Keys Check is unchanged apart from storing `subject_type` as `agent`. Stages 2 to 4 of `keys-check-roadmap.md` are also unchanged.
