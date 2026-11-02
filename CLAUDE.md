# FoodDrink

Mobile-first web app for buying and selling food and drinks. Admin manages products and orders. Payments via Midtrans.

## Stack
- Next.js (App Router) + TypeScript
- Tailwind CSS
- Supabase (Auth, Postgres, Storage) using @supabase/ssr
- Midtrans Snap (midtrans-client), Sandbox mode first

## Rules
- Mobile-first, design target 390px width. Desktop only needs to not break (centered max-w-md container for customer pages).
- All UI text in Indonesian. Currency format "Rp 25.000".
- Clean, minimal UI. No gradients overload, no emoji as icons, use lucide-react icons.
- Colors: primary orange #F26B1D, success green #1F7A4D, background #FAF8F5, text #1C1917.
- Never expose SUPABASE_SERVICE_ROLE_KEY or MIDTRANS_SERVER_KEY to the client (no NEXT_PUBLIC_ prefix).
- Always compute order totals on the server from database prices. Never trust client totals.
- Enable RLS on every table. Admin-only writes enforced by RLS and by server-side checks.
- Payment status is updated only by the verified Midtrans webhook (check signature_key).
- Keep components small, put shared code in /lib, and no unused dependencies.