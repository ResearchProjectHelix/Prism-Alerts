# PRISM Alerts — PWA

Rebuild of PRISM Alerts as a Vite + React Progressive Web App, replacing the
Expo/React Native app. Read-only clinical alerts, blood results, and imaging
scans for clinicians on the go — same Supabase backend as the desktop PRISM
app, no separate login system.

## Where this goes

Drop this `mobile-web/` folder into your `Prism-Alerts` repo, alongside the
existing `artifacts/mobile/` (Expo app — left untouched) and `artifacts/api-server/`,
e.g. as `artifacts/mobile-web/`. Don't delete the old Expo app yet; keep it
until this is verified working end-to-end.

## First-time setup

```
cd artifacts/mobile-web
npm install
cp .env.example .env
```

Fill in `.env` with:
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — same values as the desktop
  app's Supabase project (Supabase dashboard → Settings → API).
- `VITE_VAPID_PUBLIC_KEY` — a real keypair was generated during this build:

  ```
  Public Key:
  BDe2tYzMAoidYt-XYybwqYdRgoVAuZb4oC_yiXOHhza0LVtc6396-CQ0zGuLCU2S_l5tXPdSifOJObmHsqCo5KE

  Private Key:
  PHj9ZrUYnVhvS2cvF4vEw4fRC8FSRcWzb4GrpVLQL3o
  ```

  Put the **public** key in `.env` here (and later in Vercel's environment
  variables). The **private** key never goes in this project — it only goes
  into Supabase secrets (see the desktop-repo additions below). You can
  generate a fresh pair anytime with `npx web-push generate-vapid-keys` if
  you'd rather not reuse this one.

```
npm run dev       # local dev server
npm run build     # production build — already verified to compile cleanly
```

## Before this actually works end-to-end

Two pieces live in the **desktop repo** (`Project-Helix`), not here — they
were generated alongside this but need to be added there separately:

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
   supabase secrets set VAPID_PUBLIC_KEY=BDe2tYzMAoidYt-XYybwqYdRgoVAuZb4oC_yiXOHhza0LVtc6396-CQ0zGuLCU2S_l5tXPdSifOJObmHsqCo5KE
   supabase secrets set VAPID_PRIVATE_KEY=PHj9ZrUYnVhvS2cvF4vEw4fRC8FSRcWzb4GrpVLQL3o
   supabase secrets set WEBHOOK_SECRET=<make up a random string>
   ```
   Then in the Supabase dashboard → Database → Webhooks, create two webhooks
   (one on `blood_tests` INSERT, one on `documents` INSERT) pointing at this
   function's URL, each with header `x-webhook-secret: <same random string>`.

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

See the deployment walkthrough already covered in chat — short version:
Import the `Prism-Alerts` repo into Vercel, set **Root Directory** to
`artifacts/mobile-web`, add the three env vars above, deploy, then add the
resulting URL to Supabase Auth → URL Configuration.
