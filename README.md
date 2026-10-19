# Guyana Keys

Homes, land, and rentals in Guyana.

## Environment

Copy `.env.example` to `.env.local` and fill in the values there. `.env.example` lists names only. Do not commit secrets.

| Name | What it is for |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL. Use `https://yednogdlhokowqddznht.supabase.co`. A misspelling with an extra `g` in the project ref is rewritten so the site still loads, but the Vercel value should be the correct URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase key used for sign-in. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key. Never expose it in the browser. |
| `NEXT_PUBLIC_SITE_URL` | Public site origin, used for links in email and for the sitemap. |
| `ADMIN_EMAILS` | Comma-separated emails that can open the admin desk. |
| `RESEND_API_KEY` | Resend key for alert and enquiry email. Email is skipped when this is empty. |
| `ALERT_FROM_EMAIL` | From address for those emails. |
| `WASENDER_API_KEY` | WhatsApp sender key. Messages are skipped when this is empty. |
| `GUYANA_KEYS_SAMPLE_DATA` | Set to `1` to show the local sample catalog, including a Queenstown development pin at `6.8163, -58.1598` (`/listings/dev-georgetown`). Ignored when `NODE_ENV` is `production`, so a live site never falls back to sample homes, the pin, or agents. |

## Scripts

```bash
npm run dev
npm run build
npm run start
```
