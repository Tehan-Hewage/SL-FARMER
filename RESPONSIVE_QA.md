# RESPONSIVE_QA

## How to run the app
1. From repository root:
   - `python -m http.server 4173`
2. Open:
   - `http://127.0.0.1:4173/index.html`
   - `http://127.0.0.1:4173/products.html`
   - `http://127.0.0.1:4173/gallery.html`
   - `http://127.0.0.1:4173/admin/index.html`
   - `http://127.0.0.1:4173/admin/dashboard.html`

## Pages tested
- Storefront:
  - `index.html` (Header/Nav, Hero, Featured products, About/Story, Contact form/map, Footer)
  - `products.html` (PLP product grid/cards, status badges, CTA, Footer)
  - `gallery.html` (Header/Nav, farm slideshow, filters, gallery grid/lightbox, Footer)
- Admin:
  - `admin/index.html` (auth/login and management shell)
  - `admin/dashboard.html` (product availability management, modal, toast)

## Architecture + Responsive baseline coverage
- Styling system used: existing Tailwind + existing `style.css`/admin CSS (no new competing system).
- Shared responsive primitives added/standardized:
  - Container: `.site-container`, `.site-container-wide`
  - Stack: `.layout-stack`
  - Grid: `.auto-fit-grid`, `.products-grid`, `.gallery-grid` (auto-fit + minmax)
  - Sidebar primitive: `.sidebar-layout`
  - Responsive table primitive: `.responsive-table`
  - Media wrapper: `.media-frame`
- Global baseline verified/implemented:
  - viewport meta present on all route HTML files
  - `box-sizing: border-box`
  - media max-width/auto sizing
  - overflow-wrap protection for text elements
  - form controls at 16px baseline
  - visible focus styles
  - safe-area-aware overlay/toast handling

## Full viewport matrix
### Widths tested
- 320, 344, 360, 375, 390, 412, 430, 480, 540, 600, 640, 720, 768, 820, 912, 1024, 1120, 1280, 1366, 1440, 1536, 1600, 1680, 1920, 2048, 2560

### Heights spot-checked
- 568, 640, 740, 844, 900, 1080, 1440

### Orientation checks
- Phone portrait: 390x844
- Phone landscape: 844x390
- Tablet portrait: 768x1024
- Tablet landscape: 1024x768
- Large phone/tablet transitions: 912x740 and 740x912

### Input checks
- Touch: tap targets >= 44px for primary interactive controls (nav links, mobile nav controls, product CTAs, filter buttons).
- Mouse/trackpad: hover enhancements preserved with touch-safe fallback.
- Keyboard:
  - Mobile nav drawer: open/close + ESC + focus trap + focus restore.
  - Gallery lightbox: ESC, arrow key navigation, focus trap.

## No horizontal scroll verification method
1. In browser DevTools, test each page at matrix widths.
2. Run in Console:
   - `document.documentElement.scrollWidth <= document.documentElement.clientWidth`
3. If false, locate culprit with:
   - Temporarily run `Array.from(document.querySelectorAll('*')).filter(el => el.scrollWidth > el.clientWidth)`
   - Inspect offending node(s) for fixed width/min-width, nowrap text, absolute offsets, or oversized media.
4. Re-test after each fix.

## Verification evidence captured in this pass
- Headless Chromium automation run across the matrix for:
  - `index.html`, `products.html`, `gallery.html`, `admin/index.html`, `admin/dashboard.html`
- Total checks executed: **143**
- Result: **PASS** for overflow checks (`scrollWidth <= clientWidth`) and key CTA visibility on targeted pages.

## Checklist by area
- Header/Nav/Search
  - [x] Mobile-first nav drawer behavior and safe-area handling
  - [x] Keyboard support (Tab trap, ESC close, focus restore)
  - [x] No overflow at intermediate widths (md/lg)
  - [ ] Search UI (not present in storefront routes)
- PLP (Listing)
  - [x] Fluid auto-fit product grid and card wrapping
  - [x] Product text wrapping/line clamping
  - [x] Touch-friendly interactive controls
- PDP
  - [ ] Not present in current storefront repository
- Cart
  - [ ] Not present in current storefront repository
- Checkout
  - [ ] Not present in current storefront repository
- Auth/Account/Orders (customer-facing)
  - [ ] Not present in current storefront repository
- Footer
  - [x] Mobile stacking and tap-friendly links
  - [x] Tooltip overflow risk removed on touch/smaller viewports

## Known fixed issues (with file paths)
1. Added fluid responsive primitives and baseline hardening.
   - `style.css`
2. Standardized responsive header shell and mobile nav overlay markup.
   - `index.html`
   - `products.html`
   - `gallery.html`
3. Improved mobile nav behavior (ESC/focus trap/focus restore/backdrop/body lock + dynamic header height).
   - `style.js`
   - `style.css`
4. Converted PLP and gallery grids to fluid auto-fit/minmax behavior.
   - `style.css`
   - `products.html`
   - `gallery.html`
   - `index.html`
5. Removed rigid fixed image height classes from product cards and hero/farm slideshow blocks; replaced with fluid CSS sizing.
   - `index.html`
   - `products.html`
   - `gallery.html`
   - `style.css`
6. Increased touch target sizing for slideshow/nav/filter/button controls.
   - `style.css`
7. Reduced-motion fallback added for heavy animations and motion effects.
   - `style.css`
   - `style.js`
8. Lightbox responsive sizing and keyboard/a11y hardening.
   - `style.js`
   - `style.css`
9. Footer social tooltip overflow mitigation (`social-tooltip`) and mobile suppression.
   - `index.html`
   - `products.html`
   - `gallery.html`
   - `style.css`
10. Admin responsive polish: mobile-safe toast sizing and modal safe-area/dvh constraints.
   - `admin/dashboard.html`
   - `admin/css/firebase-app.css`

## Remaining limitations
1. Customer PDP/cart/checkout/account/orders routes are not implemented in this repository, so those exact responsive flows cannot be executed without adding new business features.
2. Automated responsive assertions were executed as an ad-hoc run (not committed test harness) to keep dependency footprint unchanged.
