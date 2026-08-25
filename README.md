# CrazyWolves Community — B2C Website

Phase 1: the complete public-facing experience. One website with two halves —
a community/gaming/streaming platform and the official merchandise shop —
sharing a single shell, design system and component library.

**No admin panel.** Everything here is customer-facing. The data layer is
deliberately shaped like an API response so a backend and admin panel can be
connected in phase 2 without a redesign.

---

## Running it

Open `index.html` in a browser. No build step, no `npm install`, no server.

Scripts are classic (non-module) specifically so the site also runs from the
file system — `file://` blocks ES module imports.

---

## Files

| File | Contains |
|---|---|
| `index.html` | Document shell, font loading, script order, pre-boot screen |
| `cw-theme.css` | **Design tokens.** Every colour, font, space, radius, shadow |
| `cw-base.css` | Reset, typography scale, layout primitives, a11y utilities |
| `cw-components.css` | The full component library and all of its states |
| `cw-pages.css` | Page layouts + the complete responsive system |
| `cw-data-community.js` | Games, teams, players, streams, matches, achievements, news, events, partners |
| `cw-data-shop.js` | Products, variants, categories, collections, coupons, FAQ, legal copy |
| `cw-core.js` | Utilities, icon set, formatting, storage, store, router, toasts |
| `cw-components.js` | Header, mobile nav, footer, drawers, search, card library |
| `cw-pages-community.js` | 14 community/platform views |
| `cw-pages-shop.js` | 6 shop and checkout views |
| `cw-pages-account.js` | Account, FAQ, policy and 404 views |
| `cw-app.js` | Route table, page behaviour, form validation, boot |
| `cw-theme-pack-gold.md` | The custom theme, documented |

Flat filenames rather than folders — the authoring environment could not create
subdirectories. Renaming to `assets/css/theme.css` etc. only requires updating
the `<link>` and `<script>` paths in `index.html`.

---

## Pages

**Community** — Home · News listing · News article · Streaming schedule ·
Matches & tournaments · Players · Player profile · Teams · Team detail ·
Achievements · Events · Community · About · Partners · Contact

**Shop** — Shop landing · Category listing · Product detail · Cart ·
Checkout · Order confirmation (plus a cart drawer available site-wide)

**Account** — Login · Register · Forgot password · Overview · Personal
information · Saved addresses · Order history · Order detail · Wishlist

**Support & legal** — FAQ · Shipping · Returns · Privacy · Terms · Cookies · 404

---

## Architecture

### Data → view separation

Views never hold data. They read from `CW.data.*`, which mirrors API shapes:

```js
CW.data.players   // GET /api/players
CW.data.products  // GET /api/products   — variants[] carry the sellable SKUs
CW.data.streams   // GET /api/streams?from=&to=
```

Relations are by ID, dates are ISO strings, prices are integers in cents.
Schedule dates use a `dayOffset` resolved at load so the demo always shows
live / upcoming / completed states — replace `CW.resolveDate` with server
timestamps at integration.

### Store

`CW.store` owns cart, wishlist, session, recently-viewed and coupon state, and
persists through a storage adapter that falls back to memory if `localStorage`
is unavailable. Swap the adapter for a server session without touching views.

### Router

Hash-based (`#/shop/apparel?collection=limited`), so deep links and the back
button work with no server config. Filters, sort and pagination all live in the
query string, which makes every filtered view shareable.

### Rendering

Views are functions returning HTML strings; behaviour is attached through
delegated `[data-act]` handlers. Nothing holds a reference to a DOM node across
renders, so any surface can be re-rendered freely. This is the layer a React or
Next.js port would replace — the data files and all CSS carry over untouched.

---

## What is demonstrated

**States** — default, hover, active, focus, disabled, loading, empty, success,
warning, error, out-of-stock, live, upcoming, completed, sale, new,
limited edition.

**Toasts** — added to cart, added/removed from wishlist, coupon applied,
coupon rejected, form submitted, form error, stock limit reached,
event registered, calendar reminder.

**Loading** — skeleton screens on news, players and the product grid; button
spinners on every form; a route progress bar.

**Validation** — the product page blocks add-to-cart until a required
variation is chosen, with a shake, an inline message and a toast. Checkout
validates per-field with focus management. Card fields are only required when
card is the selected payment method.

**Responsive** — every page at mobile, tablet, laptop and desktop. Mobile is
not a shrunken desktop: the week grid collapses to a day list, the schedule
date block becomes a header row, the product gallery becomes a swipe rail,
add-to-cart goes sticky, modals become bottom sheets, and filters move into a
drawer.

**Accessibility** — semantic landmarks, visible focus rings, a skip link,
labelled controls, `aria-live` regions for toasts and form status, focus
trapping in overlays, `prefers-reduced-motion` support, and status that is
never signalled by colour alone.

---

## Before launch

1. **Legal review.** Returns, Privacy, Terms and Cookies are structured
   placeholders and are flagged in the UI with an amber "Requires legal review"
   badge. Individual unfinished clauses carry an inline "To be completed" flag.
2. **Replace image placeholders.** Every `.ph` element is a styled stand-in
   carrying a `data-ph` label describing the shot required. Swap for `<img>`
   with the photography direction from the brand guide.
3. **Real payment processing.** The checkout is a front-end demonstration —
   nothing is transmitted or stored.
4. **Confirm the entity details** in the Privacy Policy and Terms.

---

## Phase 2 hooks

- `CW.data.*` → REST or GraphQL endpoints
- `CW.storage` → server-backed session
- `CW.store.placeOrder` → real order API
- `CW.store.applyCoupon` → server-side validation (the client-side check is
  demonstration only and must not be trusted)
- Every page is admin-manageable as-is: products, players, schedules,
  articles, achievements, events and partners are all flat, ID-keyed
  collections with no derived state stored in the view layer.
