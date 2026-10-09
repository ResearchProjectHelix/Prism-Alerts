# PRISM Connect

PRISM Connect is the mobile companion for PRISM. Staff can sign in securely,
view clinical alerts, blood results, and imaging scans, and approve Desktop
sign-ins using a one-time QR request. It uses the same Supabase accounts and
backend as the PRISM desktop app.

## Where this goes

The Vercel project should use `artifacts/mobile-web` as its root directory.

## First-time setup

```
cd artifacts/mobile-web
npm install
cp .env.example .env
```

Fill in `.env` with:
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — same values as the desktop
  app's Supabase project (Supabase dashboard → Settings → API).
- `VITE_VAPID_PUBLIC_KEY` — the public key from the VAPID keypair configured
  in Supabase. The private key must stay in Supabase secrets and must not be
  stored in this repository.

  Set this in the local `.env` file and in Vercel's environment variables.
  Generate a new pair with `npx web-push generate-vapid-keys` if the current
  private key has been exposed.

```
npm run dev       # local dev server
npm run build     # production build — already verified to compile cleanly
```

## Before this actually works end-to-end

Push notifications also require the following in the **desktop repo**:

1. `supabase/migrations/20260812120000_add_push_subscriptions.sql` — paste
   into the Supabase SQL Editor and run (per project convention, saving the
   file alone does nothing). **Before running it**, open `patient_shared_access`
   in the Supabase Table Editor and confirm the actual column name for "which
   org this patient was shared with" — the migration guesses
   `shared_with_organization_id`, which was not verifiable against the
   migration files available during this session and needs a real check.
2. `supabase/functions/send-push-notification/index.ts` — new Edge Function,
   deploy with `supabase functions deploy send-push-notification`. Needs
   these secrets set first:
   ```
   supabase secrets set VAPID_PUBLIC_KEY=<your-public-key>
   supabase secrets set VAPID_PRIVATE_KEY=<your-private-key>
   supabase secrets set WEBHOOK_SECRET=<make up a random string>
   ```
   Then in the Supabase dashboard → Database → Webhooks, create two webhooks
   (one on `blood_tests` INSERT, one on `documents` INSERT) pointing at this
   function's URL, each with header `x-webhook-secret: <same random string>`.

## PRISM Connect

PRISM Connect lets a signed-in PRISM account approve a short-lived Desktop
sign-in request by scanning its QR code. The request is tied to the same active
organisation and PRISM licence, expires after 90 seconds, and can be redeemed
only once. No patient information is included in the QR code.

To enable it, apply
`supabase/migrations/20261009180000_add_desktop_connect_login.sql` from the
Desktop repository, then deploy these Edge Functions:

```
supabase functions deploy create-desktop-login-request
supabase functions deploy poll-desktop-login
supabase functions deploy approve-desktop-login
```

Deploy the updated PRISM Connect app and Desktop app after the database and
functions are ready.

## Known open items — don't skip these

- **`patient_shared_access` column name** (above) — unverified, must confirm
  before running the migration.
- **Desktop app category/type mismatch**: the radiologist upload RLS policy
  checks `documents.category IN ('CT','MRI','X-Ray','PET','Ultrasound')`, but
  `Project-Helix/src/renderer/models/document.js` defines `category` as
  broader values (`Imaging`, `Pathology`, etc.) with the modality on a
  separate `type` field. This PWA's scans query was written to match what RLS
  actually enforces, but worth checking whether radiologist uploads are
  silently failing this check in the desktop app.
- **Notification content is deliberately generic** ("A new scan has been
  uploaded...") rather than including patient name/details, since push
  notifications sit on lock screens. Revisit if you want more detail and are
  comfortable with that privacy tradeoff.
- **Icons are placeholders** — plain "P" on the brand blue, generated for this
  build. Swap `public/icons/*.png` for real PRISM branding before this goes in
  front of anyone official (e.g. YSTE judges installing it on their phone).

## Deploying to Vercel

Import the `Prism-Alerts` repository into Vercel, set **Root Directory** to
`artifacts/mobile-web`, add the required environment variables, deploy, then
add the resulting URL to Supabase Auth → URL Configuration.
