# Solfeasy deployment handoff

Project: `D:\上站\solfeasy.com`. Preview: http://127.0.0.1:3000/. Production canonical domain: https://solfeasy.com. Worker `solfeasy-com` is deployed with the custom domain route; D1 database `solfeasy-db` is connected.

## Run

Use Node 22+ and pnpm. `pnpm install`, configure `.env.development` from `.env.example`, `pnpm db:push`, then `pnpm dev --host 127.0.0.1`. `pnpm build` produces the Nitro server; `pnpm start` runs it with optional `.env` and `.env.production` files. Windows postinstall uses Node instead of shell-specific commands. Translation additions are merged with `node scripts/merge-music-copy.mjs`.

Local `.env.development`/`.env` contain generated application secrets and use SQLite `data/local.db`. They are ignored by Git. New music tables currently target SQLite/Turso/D1-compatible Drizzle schema; migrating to PostgreSQL or MySQL requires equivalent music schema adapters before changing database provider.

## Pages

Seven public pages: `/`, `/bass-clef-notes/`, `/treble-clef-notes/`, `/piano-chords/`, `/how-to-read-music/`, `/piano-lessons/`, `/pricing/`. English metadata matches the provided titles/descriptions/H1 with Solfeasy replacing Brand. Chinese versions, canonical links, hreflang, sitemap, and privacy/terms/refund pages are included.

Note practice shares 20 answers each UTC day across the three note pages. Anonymous browser identity is stored in an essential HTTP-only cookie; signing in uses the account identity. Public highlights contain aggregate scores only, never account names. Explore mode remains unlimited. The trial and paid entitlement checks run on the server. The four lessons provide real note-sequence and rhythm exercises, not microphone or MIDI assessment.

## Payments and trial

The initial editable catalog is $9/month or $72/year in `src/config/pricing.ts`. The trial lasts seven days, requires no card, is granted once per account, and does not automatically charge. A first-purchase seven-day refund policy is linked from pricing. No live payment provider is configured. Paid checkout explains its unavailable state until provider configuration is complete.

Create your account at `/sign-up`, then grant administrator access with `pnpm rbac:assign --email=YOUR_EMAIL --role=admin`. `/admin/settings` configures providers. For Stripe: configure secret key and signing secret, and register webhook `/api/payment/notify/stripe`. For Creem: API/signing keys, enabled flag, environment and `creem_product_ids_mapping` mapping `solfeasy_pro_monthly` and `solfeasy_pro_yearly` to actual recurring products. The webhook is `/api/payment/notify/creem`.

## Ads

The tool, lesson and pricing interfaces render no ads. Only explicit editorial slots exist on the four tool pages; they are hidden when IDs are absent. To enable manual AdSense slots, disable Auto ads in the AdSense account and set `VITE_ADSENSE_CLIENT`, `VITE_ADSENSE_SLOT_TOP`, `VITE_ADSENSE_SLOT_BOTTOM` at build time. Do not enable the template's global Auto ads loader. Configure applicable consent requirements and approved publisher/domain settings before activating ads. Analytics and payment provider keys are not bundled into public source.

## Repository

The original ShipAny clone is preserved. No commits or pushes were made. Point origin to your own repository before pushing: `git remote set-url origin YOUR_REPOSITORY_URL`. The template remote is kept as upstream for future sync.
