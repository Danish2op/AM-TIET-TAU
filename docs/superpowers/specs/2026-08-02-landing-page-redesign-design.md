# Landing Page Redesign — Design Spec

Date: 2026-08-02

## Goal

Client feedback on current landing page: floating nav pill unwanted, background too generic, right-side image cluster cluttered, no About/Director content on landing, no institutional branding in contact area. This spec covers a full landing-page (and shared shell) revision addressing each point.

## Scope

- `src/App.tsx` — `Layout()` header, `HomePage()` component restructure.
- `src/styles.css` — background system (sitewide), nav bar, carousel, director section, contact banner.
- `src/content/siteContent.ts` — add About copy (brochure-exact), director placeholder fields, logo asset paths.
- New assets: TIET logo, Tel Aviv University logo (fetched from official sources), director photo placeholder.
- No changes to inner pages' content/layout beyond the shared background system and nav bar (both sitewide).

## 1. Background system (sitewide)

Replace current plain dot-grid (`body::before`) with a layered "blueprint" system, still applied via fixed pseudo-elements so it doesn't affect layout:

- **Base layer:** crosshair/blueprint grid (finer than current, subtle tick marks at intersections) in low-opacity navy, same technique as today (`background-image` linear-gradients).
- **Motif layer:** a handful of large-scale abstract technical-drawing motifs (dimension line with arrow ticks, corner crop marks, a coordinate axis marker, a faint circular toolpath spiral) positioned as inline SVG background images at fixed large sizes, low opacity (4-8%), placed off to page edges so they never sit under body text. These are generic engineering-drawing motifs — not depictions of actual CoE-AM equipment — to avoid implying fabricated schematics of real machines.
- Applied via CSS custom properties/pseudo-elements on `body`, same z-index layering as today (`z-index: -2 / -3`), so no component changes needed.
- Respects `prefers-reduced-motion` (motifs are static, no animation needed here).

## 2. Nav bar (sitewide)

Current: floating rounded pill with margin, `border-radius: 22px`, inset from edges.

New: full-width frosted bar, edge-to-edge, no rounding, sits flush at the very top of the viewport, `position: sticky; top: 0`, merges directly into the page (no gap/margin before content below it). Same frosted-glass treatment (`backdrop-filter: blur(18px)`, translucent white) — just stretched full width and de-rounded. Brand mark + wordmark stay left, nav links right, same content/order as today. Mobile behavior (stacked layout under 980px) unaffected in structure, just full-width styling carries through.

## 3. Landing page (`HomePage`) — new section order

1. **Hero** — existing copy (eyebrow/title/summary/actions) stays left. Right side: replace 3-card `image-stack` with an **auto-rotating carousel** cycling all 6 gallery images (`siteContent.gallery`).
   - Auto-advances every 4s, pauses on hover/focus.
   - Dot indicators (one per image), clickable to jump.
   - Arrow-key accessible when carousel is focused; `aria-live="off"` region with alt text per slide, `prefers-reduced-motion` disables auto-advance (manual dots/arrows still work).
   - Same rounded glass-card visual treatment as current stack cards.

2. **About** — new section, full brochure "ABOUT THE CENTRE" copy verbatim (both paragraphs, from `Advanced Manufacturing Centre brochure v4.pdf` page 2), placed in `siteContent.ts` as `aboutCentre: string[]` (array of paragraphs). Rendered in a `glass-panel` matching existing section styling.

3. **Capability map** — existing section unchanged (kept per user decision), still links into facilities/industry.

4. **Message from Director, CoE-AM** — new section. Two-column: left = heading "Message from Director, CoE-AM" + lorem ipsum placeholder paragraph(s); right = placeholder photo frame (fixed aspect-ratio box, neutral gray fill, person-outline icon centered, alt text noting placeholder). Content flagged clearly as placeholder in code (comment) so it's swapped before launch — lorem ipsum text stored in `siteContent.ts` as `directorMessage` block with `isPlaceholder: true` marker used only for the code comment, not rendered.

5. **Contact banner** — new section directly below director message (previously landing page had no contact section — old 3-card `route-grid` linking to subpages is dropped since About section now covers overview and nav covers routing). Banner shows: centre email + address (reuse existing contact data), plus **TIET logo** and **Tel Aviv University logo** side by side (real institutional marks, sourced from official sites), CTA button to `/contact`.

## 4. Assets

- Fetch official TIET logo (red "ti" mark + wordmark, matches brochure) and official Tel Aviv University logo from their public websites via WebFetch, save as optimized SVG/PNG into `public/assets/`.
- Director photo: placeholder box, no image fetch — styled empty frame, not a stock photo (per CLAUDE.md "no stock photos" rule, a styled placeholder frame is used instead of a fake photo).

## 5. Content changes (`siteContent.ts`)

- Add `aboutCentre: string[]` — brochure-exact paragraphs.
- Add `directorMessage: { heading: string; paragraphs: string[] }` — lorem ipsum placeholder.
- Add `partnerLogos: { name: string; src: string; alt: string }[]` — TIET + TAU entries for contact banner.
- No changes to existing brochure-validated fields (leadership, coreInfrastructure, etc.) — existing `siteContent.test.ts` assertions stay valid.

## 6. Testing

- Extend `siteContent.test.ts` with assertions for new `aboutCentre` content matching brochure wording (guards against future accidental edits), and presence of `partnerLogos` entries.
- Manual: verify carousel keyboard/reduced-motion behavior, nav sticky behavior, mobile stacking (existing breakpoints), contact banner logo rendering.

## Out of scope

- Inner page (`/about`, `/facilities`, etc.) content/layout changes beyond shared nav + background.
- Real director photo (placeholder only, per explicit instruction).
- CMS/editable content — all copy stays in `siteContent.ts` as today.
