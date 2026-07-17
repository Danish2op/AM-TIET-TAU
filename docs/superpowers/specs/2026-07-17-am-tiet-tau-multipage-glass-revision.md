# AM TIET TAU Multipage Glass Revision

## Feedback Being Addressed

- Images are too large and static.
- The current UI is professional but too old-school.
- The client does not want one long page; the site should be divided into different pages.

## Approved Direction

Revise the site into a modern multipage research-centre website with restrained glassmorphism, smaller contextual images, and clear page-level navigation.

## Page Model

- `/` Home: compact hero, capability preview, small image stack, and links into deeper pages.
- `/about` About: centre mission, TIET-TAU collaboration, and leadership.
- `/facilities` Facilities: DED, Wire EDM, characterization/testing, and post-processing.
- `/research` Research: research areas and material/application directions.
- `/industry` Industry: offerings, training, consultancy, and collaboration routes.
- `/gallery` Gallery: smaller interactive image grid/lightbox.
- `/contact` Contact: email, address, and collaboration CTA.

## Visual Direction

- Move from old academic serif-heavy styling to modern lab-tech styling.
- Use Inter/Space Grotesk-style sans typography.
- Use navy/blue gradients, frosted glass panels, fine grid/line texture, and compact white/blue cards.
- Keep glassmorphism restrained and contrast-safe: avoid unreadable transparent text.
- Keep images smaller and contextual: thumbnails, stacked previews, facility cards, gallery tiles.
- Add subtle transitions: hover lift, active nav state, route-level visual continuity, lightbox open/close.
- Respect reduced motion.

## Non-Goals

- Do not use fake dashboards, neon sci-fi, decorative orbs, stock images, or AI-generated machinery.
- Do not invent new claims beyond the brochure/source content.
- Do not turn the website into a heavy animation showcase.

## Technical Requirements

- Use clean URLs with React Router.
- Add Vercel SPA rewrite support for direct route refreshes.
- Keep brochure wording: "Centre of Excellence in Advanced Manufacturing".
- Preserve existing content tests and add tests for the page model.
- Production deployment remains through Vercel CLI only.

