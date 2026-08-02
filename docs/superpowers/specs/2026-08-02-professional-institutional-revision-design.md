# Professional Institutional Revision — Design Spec

Date: 2026-08-02
Supersedes parts of: `2026-08-02-landing-page-redesign-design.md`

## Problem

Client review of the deployed landing page raised five issues:

1. Contact banner is weak — needs proper structure and text alignment. Client supplied a reference (IIT Madras Department of Physics footer): full-bleed dark band, large institutional logos, thin rule dividers, two left-aligned info columns, no cards or rounding.
2. Background rejected. Client wants an engineering theme grounded in **materials and mechanical engineering**, keeping the existing color palette.
3. Landing page carries sections that were never asked for. The agreed structure is nav → About → Director message → Contact banner. Nothing else.
4. Overall site reads "cool modern startup". Client wants a professional, institutional register.
5. Mobile navigation has no hamburger. One is required, built properly.

Additionally: the `/about` page is no longer needed and must be removed, along with its team/leadership content.

## 1. Visual system — professional tone-down

Glassmorphism is retained but dialed back (client chose "tone down glass, keep it" over a full flat rebuild). Changes to `src/styles.css`:

- `backdrop-filter: blur(18px)` → `blur(10px)`.
- Panel radius `28px` → `10px`; card radius `22px` → `8px`; hero/carousel radius `24px` → `10px`.
- Surfaces become more opaque (`--glass` from `0.68` → `0.82`, `--glass-strong` `0.84` → `0.92`) so panels read as solid institutional surfaces rather than floating glass.
- Shadows tightened: `--shadow` from `0 20px 60px rgba(3,20,38,0.12)` → `0 6px 18px rgba(3,20,38,0.10)`.
- Buttons: pill (`border-radius: 999px`) → `4px`. Same for `.spec-list li` pills and nav links (`999px` → `4px`).
- New `--rule` token for the thin divider lines used throughout (matching the IIT Madras reference), applied under section headings and around the contact banner logo row.
- Type tightened: heading sizes reduced at the top of their clamp ranges, `letter-spacing: -0.01em` on headings, body line-height 1.7 for reading comfort.

Color palette is unchanged. `CLAUDE.md` is updated to document the revised system so the "frosted glass `blur(12px) saturate(180%)`" instruction no longer contradicts the code.

## 2. Background — materials + mechanical

Replaces the rejected blueprint-grid system on `body::before` / `body::after`:

- **Base:** flat near-white page (existing `--bg` gradient retained, simplified).
- **Materials layer:** brushed-steel micro-grain — fine repeating linear-gradient striations in cool gray at ~3% opacity, evoking a ground/brushed metal surface.
- **Mechanical layer:** large concentric arcs reading as lathe/facing turning marks on a machined part, anchored off the page edges (top-right and bottom-left) at ~5% opacity, sized in `vw`/`vh` so they scale at any viewport.
- Nothing exceeds ~6% opacity; no motif sits in the content column; both layers stay on fixed pseudo-elements at `z-index: -2` / `-3` so no component markup changes.
- Behind the director and contact sections the page uses a solid dark navy band where the metal grain reads slightly stronger.

No fabricated schematics of real CoE-AM equipment, no decorative orbs or AI-glow — per CLAUDE.md.

## 3. Landing page structure

`HomePage` is reduced to exactly:

1. **About section** — sits directly below the nav (no hero). Heading `Centre of Excellence in Advanced Manufacturing`, subheading/eyebrow `About`, then the exact brochure text already in `siteContent.aboutCentre`. Carousel sits to its right, auto-advancing every 4s (existing `HeroCarousel`, unchanged behavior).
2. **Message from Director** — existing placeholder lorem ipsum + placeholder photo frame to its right.
3. **Contact banner** — redesigned, see below.

**Deleted:** the `home-hero` section (eyebrow, h1, hero title, summary, both CTA buttons) and the entire capability-map section. `siteContent.heroTitle`, `heroSummary`, and `capabilityStrip` become unused by the landing page; `capabilityStrip` is removed from `siteContent.ts` along with the `capabilityIcons` array in `App.tsx`. `heroTitle`/`heroSummary` are retained in content only if still referenced elsewhere — otherwise removed.

## 4. Contact banner

Modeled on the client's IIT Madras reference:

- Full-bleed (edge-to-edge, breaking out of `.section-shell`) solid dark navy band.
- Logo row: TIET logo + wordmark on the left, TAU logo on the right, with a thin horizontal rule above and below the row, matching the reference's flanking-rule treatment.
- Below the rule: two columns, both left-aligned.
  - Left: centre name, then the postal address block (Thapar Institute of Engineering & Technology, Patiala-147004, Punjab, India).
  - Right: centre mailbox `coeam@thapar.edu` and website `https://am.thapar.edu/`.
- White/light text on navy, generous line-height, no cards, no glass, no rounded corners, no CTA button.
- Individual team member emails from the brochure's CONTACT US block are deliberately omitted, consistent with dropping team content.

## 5. Navigation

- Desktop unchanged in structure: full-width sticky bar, brand left, links right.
- **Mobile (< 900px):** a real hamburger. Requirements:
  - Toggle button with `aria-expanded`, `aria-controls`, and an accessible label.
  - Panel slides down below the bar containing all nav links at full tap size.
  - `Escape` closes it; focus is trapped inside while open; focus returns to the toggle on close.
  - Closes automatically on route change.
  - Body scroll locked while open.
- Links are never hidden without a visible, reachable control.

## 6. Routes and content removal

- `AboutPage` component and `LeadershipBlock` component deleted from `App.tsx`.
- `siteContent.leadership` array deleted.
- `/about` route replaced with a redirect to `/` (React Router `<Navigate to="/" replace />`) so existing inbound links don't 404.
- `/about` removed from `siteContent.navigation`; nav becomes Home, Facilities, Research, Industry, Gallery, Contact.
- `siteContent.test.ts` route assertion updated to the new six-path array. A test is added asserting `/about` is absent and that `leadership` is gone.

## 7. Testing

- Existing brochure-claim assertions stay untouched and must keep passing.
- Route-model test updated to six paths.
- New assertions: no `/about` in navigation; `siteContent` has no `leadership` key; contact banner content fields (`website`) present and well-formed.
- Carousel index tests unchanged.
- Manual responsive QA at 375, 414, 768, 900 (hamburger boundary), 1024, 1440, 1920, 2560 px — including hamburger open/close, focus trap, and contact banner column stacking.

## Out of scope

- Real director photo and real director message copy (placeholders remain by explicit instruction).
- Inner page content rewrites — `/facilities`, `/research`, `/industry`, `/gallery`, `/contact` keep their content, inheriting only the shared nav, background, and tone-down styling.
