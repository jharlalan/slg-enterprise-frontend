# SLG Enterprise — Frontend

Next.js (App Router) frontend for the SLG Enterprise retail system —
staff-facing POS/inventory/khata screens plus a self-service customer
portal, bilingual (Hindi + English) throughout.

## Tech Stack

- **Framework:** Next.js 14 (App Router), React 18, TypeScript
- **Styling:** plain inline styles + design tokens (`theme/tokens.ts`) —
  no CSS framework. Bilingual labels (`components/ui/BilingualLabel.tsx`)
  are used everywhere a piece of text is user-facing
- **HTTP:** axios, with one shared client (`services/apiClient.ts`) that
  injects the auth token, a correlation ID, and handles session-expiry
  redirects centrally
- **Barcode scanning:** hardware scanner support via keystroke-timing
  detection (`components/shared/BarcodeScannerListener.tsx`), plus
  camera-capture and file-upload paths that send the image to the
  *backend* for decoding (see `AddProductLauncher.tsx`) — there is no
  client-side barcode-decoding library in this codebase
- **State:** plain React `useState`/`useEffect` throughout. `zustand` is
  in `package.json` but not currently used anywhere — safe to remove, or
  to actually adopt if a real cross-page global state need shows up

## Prerequisites

- Node.js 18+
- The backend running (see `../backend/README.md`) — this app talks to
  it over HTTP, nothing works standalone

## Setup

```bash
cd frontend
npm install
```

## Environment

One optional variable, in `.env.local`:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

Defaults to `http://localhost:8000/api/v1` if unset — fine for local dev
against the backend's default port.

## Running

```bash
npm run dev
```

Visit `http://localhost:3000`. The home screen is a public tile menu
(Inventory / POS / Khata / Digital Seva); staff and customer login are
reached from the profile icon in the top-right header.

## Project Structure

```
frontend/
├── public/
│   └── shop-logo.png          # Printed on bills — swap this file to
│                               # change the logo without touching code
├── src/
│   ├── app/                    # Next.js App Router — one folder per route
│   │   ├── page.tsx             # Home (public tile menu)
│   │   ├── login/                Staff login
│   │   ├── pos/                  POS / billing screen
│   │   ├── inventory/            Goods inventory
│   │   ├── khata/                Credit ledger, village/aging overview
│   │   ├── dashboard/            Owner dashboard
│   │   ├── portal/               Customer-facing (login/register/statement)
│   │   └── staff/create-cashier/
│   ├── components/
│   │   ├── ui/                   Generic atoms (BilingualLabel, ServiceTile)
│   │   ├── layout/                AppHeader, ProfileBadge — global chrome,
│   │   │                         rendered once in the root layout
│   │   ├── pos/                   Cart, payment panel, Add Product modal
│   │   │                         (barcode/camera/upload/search tabs),
│   │   │                         customer selection step
│   │   ├── inventory/              Product create/edit form
│   │   ├── khata/                  Statement, overview, payment queue
│   │   ├── portal/                 Customer-facing components
│   │   ├── print/                  ShopBillReceipt (the printed bill)
│   │   └── shared/                  Cross-feature components (e.g. the
│   │                               hardware barcode scanner listener)
│   ├── services/                   One file per API resource — thin
│   │                               wrappers over apiClient
│   ├── types/                      Shared TypeScript types, matching
│   │                               backend response shapes
│   ├── theme/tokens.ts             Colors, spacing, typography — the
│   │                               single source for the app's look
│   └── utils/                      Small shared helpers (e.g. date
│                                   formatting)
└── package.json
```

## Key Features Worth Knowing About

**POS "Add Product" — four ways in, one entry point.** A single large
"+ Add" button opens a modal with four tabs: type a barcode, capture a
photo with the camera, upload an image file, or search by product name.
Camera and Upload both send the image to the backend's
`POST /products/barcode/decode` — this app has no barcode-decoding
library itself.

**POS customer selection happens first.** Before any item can be added,
the cashier searches for a customer, quick-creates one, or explicitly
goes anonymous. A persistent card then shows who the sale is for
throughout billing.

**Printed bills** (`ShopBillReceipt.tsx`) are sized for a regular page
printer (A4/A5), not an 80mm thermal roll — the shop's actual reference
bill format needs the extra width. Colors and logo were taken directly
from a reference document the shop provided, not chosen arbitrarily.

**Discounts** support both a percentage and a flat ₹ amount as
alternative entry modes (toggle in the payment panel) — matching the
backend's `discount_percent`/`discount_amount` split.

## Known Gaps / Things to Watch

- **Camera access needs HTTPS in production** (or `localhost` for local
  dev) — browsers block `getUserMedia` over plain HTTP for any other
  host. Not an issue locally; will matter at deploy time.
- **`zustand` is an unused dependency** (see Tech Stack above) — either
  remove it or start actually using it; leaving it half-installed is the
  only real cruft in the dependency list.
- **No automated frontend test suite** — the backend has pytest coverage
  (55 tests); this app has none yet. Manual verification has been the
  practice so far (see `TROUBLESHOOTING.md` for how issues were actually
  found and fixed).

## More docs

- [`TROUBLESHOOTING.md`](./TROUBLESHOOTING.md) — real issues hit during
  development and their actual fixes
- Backend docs: `../backend/README.md`, `../backend/API_REFERENCE.md`
