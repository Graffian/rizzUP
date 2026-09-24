# Dodo Payments paywall setup (3 free tries + ₹499/month subscription)

Everything below is manual dashboard/config work — the code is already deployed.
Local vars live in `.env`, production vars go in **Netlify → Site settings → Environment variables**.

## 1. Supabase (the store that tracks free tries + who paid)

1. Create a project at supabase.com (free tier is fine).
2. Open **SQL Editor → New query**, paste the contents of `supabase.sql` (repo root), run it.
   This creates the `users` + `subscriptions` tables (with **RLS enabled** — no direct
   table access for anon keys) and the atomic `get_access` / `claim_trial` /
   `upsert_subscription` / `deactivate_subscription` functions. All reads/writes go
   through these security-definer functions, so a publishable key is safe.
3. Copy two values:
   - **Project Settings → API → Project URL** → `SUPABASE_URL`
   - **Project Settings → API → service_role key** → `SUPABASE_SERVICE_ROLE_KEY`.

> The app also works with the **publishable** (`sb_publishable_…`) key because every
> operation is a `security definer` RPC. The real `service_role` secret is still the
> right choice for production.

## 2. Dodo Payments (merchant + product)

1. Register at dodopayments.com, then in the dashboard:
   - **Products → Create product → Subscription**, price **₹499 / month** (min for subscriptions is $1/mo). Save and copy the `product_id`.
   - **Developer → API** → copy the API key.
   - **Developer → Webhooks → Add webhook**:
     - URL: `https://<your-netlify-site>/api/webhooks/dodo`
     - Events: `subscription.active`, `subscription.renewed`, `subscription.paused`, `subscription.unpaused`, `subscription.on_hold`, `subscription.cancelled`, `subscription.expired`, `subscription.failed`, `subscription.plan_changed`, `subscription.updated`, `payment.succeeded`
     - Copy the **webhook secret key**.
2. Dodo has test mode (uses `test.dodopayments.com` + test cards) — build against that first, flip to live later.

## 3. Environment variables

| var | where | notes |
|---|---|---|
| `SUPABASE_URL` | Netlify + `.env` | |
| `SUPABASE_SERVICE_ROLE_KEY` | Netlify + `.env` | private |
| `DODO_PAYMENTS_API_KEY` | Netlify + `.env` | private |
| `DODO_WEBHOOK_KEY` | Netlify + `.env` | matches the webhook secret |
| `DODO_SUBSCRIPTION_PRODUCT_ID` | Netlify + `.env` | from the product |
| `DODO_API_BASE` | Netlify + `.env` | `https://test.dodopayments.com` until live, then `https://live.dodopayments.com` |

> **Pricing display:** the Dodo product is priced **USD $6/month** (verified on the
> product). The unlock modal shows a **locale-aware price** — `≈₹575` for Indian
> users (the current $6 → INR conversion), `$6` for everyone else — detected
> client-side from the browser language (INR → ≈₹575, anything else → $6). No
> `NEXT_PUBLIC_DODO_PRICE` env var needed. Dodo's checkout page converts the
> charge to the buyer's local currency at the day's rate.

Until `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are both set, the paywall is **disabled** — the app behaves exactly like before (unlimited, no tracking).

## 4. Deploy & test locally

- Local webhook testing: run `netlify dev`, then tunnel the webhook port (e.g. `ngrok http 8888`) and point the Dodo webhook URL at `https://<tunnel>/api/webhooks/dodo`.
- Full flow to verify:
  1. Generate 3 times → free counter hits 3.
  2. 4th generate → 402 → unlock modal appears.
  3. Click **unlock with dodo payments** → Dodo test checkout → pay with a test card.
  4. `payment.succeeded` + `subscription.active` webhooks flip the row to `active` in Supabase.
  5. Back in the app, **generate** works without limit; counter stops applying.
  6. Cancel/pause the subscription in Dodo → `subscription.cancelled` → row turns inactive **and the user's free tries reset to 3** (fresh trial for a re-purchase).

## Notes / decisions

- "A try" = one **Generate** click. Swaps are free.
- Expired/cancelled subscribers get **3 fresh free tries**, then the paywall again.
- Free-try identity is a per-browser `device_id` (localStorage + cookie). Clearing storage resets the counter — buyers are still bound via the webhook, so a paid user opens payment for a new device.
- Buyer emails land in the `subscriptions.email` column and in the Dodo dashboard.
- If calls to Supabase fail, the app **fails open** (treats the user as allowed) so a DB hiccup never bricks the product.
- HF inference tokens are still required, separate from the plan.