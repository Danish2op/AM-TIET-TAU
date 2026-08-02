# Professional Institutional Revision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the site's visual register from "modern startup" to professional institutional — toned-down glass, materials/mechanical background, IIT-Madras-style contact banner, a real mobile hamburger, a landing page cut down to About + Director + Contact, and the `/about` page removed.

**Architecture:** All structural markup changes live in `src/App.tsx` (existing single component file, matching codebase convention) plus one new `src/components/SiteNav.tsx` for the hamburger, which owns its own open/close state. All styling stays in `src/styles.css` (vanilla CSS, custom properties). Content and the route model stay in `src/content/siteContent.ts`, guarded by `src/content/siteContent.test.ts`.

**Tech Stack:** React 18 + TypeScript, Vite, Vitest (node environment — no jsdom/RTL, do not add), vanilla CSS, React Router v7, lucide-react.

**Spec:** `docs/superpowers/specs/2026-08-02-professional-institutional-revision-design.md`

## Global Constraints

- No new UI/styling frameworks. Vanilla CSS only.
- No stock photos, decorative orbs, fake dashboards, or AI-glow visuals.
- Every `<img>` keeps a meaningful, descriptive `alt`.
- `.skip-link` → `#main` stays intact.
- Brochure-backed copy only. Do not invent claims, credentials, or contact details.
- Existing brochure assertions in `siteContent.test.ts` must keep passing — extend, never weaken.
- Color palette unchanged: navy `#08213d`, navy-2 `#0d3766`, blue `#1976d2`, sky `#8fd0ff`, cyan `#dff4ff`, red `#c82032`, ink `#07182c`, muted `#536478`.
- Background layers stay at or below ~6% opacity and never sit under the content column.
- Mobile navigation must never hide links without a visible, reachable, accessible control.
- Verify at 375, 414, 768, 900, 1024, 1440, 1920, 2560 px.

---

## Execution Note (parallelization)

**Wave 1 — run in parallel** (fully disjoint files): Task 1 (`siteContent.ts` + its test) and Task 8 (`CLAUDE.md` + `README.md`).

**Wave 2 — strictly sequential** (Tasks 2–7 all share `src/App.tsx` and/or `src/styles.css`): 2 → 3 → 4 → 5 → 6 → 7. One agent at a time.

**Wave 3:** Task 9 (QA) last.

---

### Task 1: Route model and content cleanup

**Files:**
- Modify: `src/content/siteContent.ts`
- Modify: `src/content/siteContent.test.ts`

**Interfaces:**
- Produces: `siteContent.navigation` reduced to 6 entries (no `/about`); `siteContent.leadership` and `siteContent.capabilityStrip` removed; `siteContent.contact.website` added. Consumed by Tasks 2, 6, 7.

- [ ] **Step 1: Write the failing tests**

In `src/content/siteContent.test.ts`, replace the existing `"defines a multipage route model instead of one long anchored page"` test with:

```ts
  it("defines the six-page route model with no standalone about page", () => {
    expect(siteContent.navigation.map((item) => item.path)).toEqual([
      "/",
      "/facilities",
      "/research",
      "/industry",
      "/gallery",
      "/contact"
    ]);
    expect(siteContent.navigation.some((item) => item.path === "/about")).toBe(false);
  });
```

And add these new tests:

```ts
  it("no longer carries team or capability strip content", () => {
    expect("leadership" in siteContent).toBe(false);
    expect("capabilityStrip" in siteContent).toBe(false);
  });

  it("exposes the centre website for the contact banner", () => {
    expect(siteContent.contact.website).toBe("https://am.thapar.edu/");
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test`
Expected: FAIL — navigation still has 7 paths including `/about`; `leadership` and `capabilityStrip` still present; `contact.website` undefined.

- [ ] **Step 3: Update the content**

In `src/content/siteContent.ts`:

1. Add `website` to the `contact` object:

```ts
  contact: {
    email: "coeam@thapar.edu",
    website: "https://am.thapar.edu/",
    address:
      "Thapar Institute of Engineering & Technology, Patiala-147004, Punjab, India"
  },
```

2. Delete the entire `/about` entry from the `navigation` array (the object with `label: "About"`).

3. Delete the entire `capabilityStrip` array.

4. Delete the entire `leadership` array.

Leave `heroTitle` and `heroSummary` in place for now — Task 2 removes them once their last consumer is gone.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test`
Expected: PASS. Note `npm run build` will still fail at this point because `App.tsx` references the removed fields — that is expected and is fixed by Task 2. Do not "fix" it here.

- [ ] **Step 5: Commit**

```bash
git add src/content/siteContent.ts src/content/siteContent.test.ts
git commit -m "refactor: drop about route, team, and capability strip content"
```

---

### Task 2: Strip the landing page and remove the About page

**Depends on:** Task 1.

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Produces: `HomePage` containing exactly three sections (About, Director, Contact banner). `AboutPage` and `LeadershipBlock` gone. `/about` redirects to `/`.

- [ ] **Step 1: Update imports and routing**

In `src/App.tsx`:

1. Add `Navigate` to the router import:

```tsx
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
```

2. Replace the `/about` route with a redirect:

```tsx
          <Route path="/about" element={<Navigate to="/" replace />} />
```

3. Delete the `capabilityIcons` const (line ~21) and remove `Factory`, `Layers3`, `Microscope`, `Wrench`, `GraduationCap` from the lucide-react import. Keep `Users` (used by the director photo placeholder), `Mail`, `MapPin`, `ArrowRight`, `ChevronRight`, `Maximize2`, `Sparkles`, `X`.

- [ ] **Step 2: Delete the About page and Leadership block**

Delete the entire `function AboutPage() { ... }` block and the entire `function LeadershipBlock() { ... }` block from `src/App.tsx`.

- [ ] **Step 3: Cut `HomePage` down to three sections**

Replace the whole body of `HomePage` with:

```tsx
function HomePage() {
  return (
    <>
      <section className="section-shell about-section">
        <div className="about-copy glass-panel">
          <p className="eyebrow">About</p>
          <h1>{siteContent.centreName}</h1>
          <span className="rule" aria-hidden="true" />
          {siteContent.aboutCentre.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
        <HeroCarousel items={siteContent.gallery} />
      </section>

      <section className="section-shell director-section">
        <div className="glass-panel director-copy">
          <p className="eyebrow">Leadership</p>
          <h2>{siteContent.directorMessage.heading}</h2>
          <span className="rule" aria-hidden="true" />
          {siteContent.directorMessage.paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
        <div
          className="director-photo"
          role="img"
          aria-label="Director photo placeholder — to be replaced before launch"
        >
          <Users aria-hidden="true" size={48} />
        </div>
      </section>

      <ContactBanner />
    </>
  );
}
```

- [ ] **Step 4: Add a temporary ContactBanner stub**

Add this function above `Footer` — Task 7 replaces its internals:

```tsx
function ContactBanner() {
  return (
    <section className="contact-banner">
      <div className="contact-banner-inner">
        <div className="contact-banner-logos">
          {siteContent.partnerLogos.map((logo) => (
            <img key={logo.src} src={logo.src} alt={logo.alt} />
          ))}
        </div>
        <div className="contact-banner-grid">
          <div>
            <strong>{siteContent.centreName}</strong>
            <p>{siteContent.contact.address}</p>
          </div>
          <div>
            <a href={`mailto:${siteContent.contact.email}`}>{siteContent.contact.email}</a>
            <a href={siteContent.contact.website}>{siteContent.contact.website}</a>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Remove now-unused hero content fields**

Confirm nothing references them: `grep -n "heroTitle\|heroSummary" src/`. If the only hits were in the deleted hero markup, delete `heroTitle` and `heroSummary` from `src/content/siteContent.ts`.

- [ ] **Step 6: Verify**

Run: `npm run test` — expected PASS.
Run: `npm run build` — expected clean, no TypeScript errors, no unused-import errors.

Manually check `grep -rn "home-hero\|capability-grid\|capability-card\|leadership-grid\|contact-banner-landing" src/` — any hits in `App.tsx` mean leftover markup; hits in `styles.css` are fine for now (Task 3 removes dead CSS).

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx src/content/siteContent.ts
git commit -m "refactor: cut landing page to about, director, and contact sections"
```

---

### Task 3: Professional tone-down of the design system

**Depends on:** Task 2.

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: Update tokens**

In the `:root` block of `src/styles.css`, change these values (leave every color hex untouched):

```css
  --glass: rgba(255, 255, 255, 0.82);
  --glass-strong: rgba(255, 255, 255, 0.92);
  --line: rgba(114, 160, 198, 0.34);
  --rule: rgba(114, 160, 198, 0.45);
  --shadow: 0 6px 18px rgba(3, 20, 38, 0.1);
```

- [ ] **Step 2: Tone down the glass surfaces**

```css
.glass-panel,
.glass-card {
  backdrop-filter: blur(10px);
  background: var(--glass);
  border: 1px solid var(--line);
  box-shadow: var(--shadow);
}

.glass-panel {
  border-radius: 10px;
  padding: clamp(1.25rem, 2.6vw, 2.25rem);
}

.glass-card {
  border-radius: 8px;
  overflow: hidden;
}
```

- [ ] **Step 3: Square off the pill shapes**

Change `border-radius: 999px` to `border-radius: 4px` in `.button`, `nav a`, and `.spec-list li`. Change `.hero-carousel` and `.hero-carousel-frame` `border-radius: 24px` to `10px`. Change `.pill-item` `border-radius: 18px` to `6px`, `address a`/`address span` `18px` to `6px`, `.director-photo` `22px` to `8px`.

Leave `.hero-carousel-dots button` and `.lightbox-close` at `999px` — those are genuinely circular controls.

- [ ] **Step 4: Add the rule divider**

```css
.rule {
  background: var(--rule);
  display: block;
  height: 1px;
  margin: 1.1rem 0 1.4rem;
  width: 100%;
}
```

- [ ] **Step 5: Tighten typography**

```css
h1,
h2 {
  letter-spacing: -0.01em;
}

h1 {
  font-size: clamp(2rem, 3.4vw, 3.1rem);
  max-width: 20ch;
}

h2 {
  font-size: clamp(1.4rem, 2.2vw, 2.1rem);
}

p {
  line-height: 1.7;
}
```

Note: `h1`'s existing `max-width: 12ch` must be replaced by the `20ch` above — the About heading is the full centre name and would otherwise wrap into a narrow column.

- [ ] **Step 6: Delete dead CSS**

Remove rules for classes no longer rendered anywhere: `.home-hero`, `.home-copy`, `.hero-title`, `.capability-grid`, `.capability-card`, `.leadership-grid`, `.person`, `.role`, `.contact-banner-landing`, `.contact-banner-info`, and `.section-heading.compact`. Also remove those selectors from the shared grouped rules (the `display: grid` list, the `:hover` list, and both media-query blocks) — but keep `.facility-grid`, `.offering-grid`, `.gallery-grid`, `.pill-grid` and their responsive behavior, which the inner pages still use.

Verify with `grep -rn "home-hero\|capability-\|leadership-grid\|hero-title\|contact-banner-landing" src/` — expect zero hits after this step except `.contact-banner-logos`/`.contact-banner-grid`/`.contact-banner-inner`, which are the new banner's classes and stay.

- [ ] **Step 7: Verify**

Run: `npm run test` and `npm run build` — both expected clean.

- [ ] **Step 8: Commit**

```bash
git add src/styles.css
git commit -m "style: tone glass system down to a professional institutional register"
```

---

### Task 4: Materials and mechanical background

**Depends on:** Task 3.

**Files:**
- Modify: `src/styles.css` (the `body::before` / `body::after` blocks and their media query)

- [ ] **Step 1: Replace the background layers**

Replace the existing `body::before`, `body::after`, and the `@media (max-width: 980px) { body::after { ... } }` block with:

```css
/* Materials layer: brushed-steel micro-grain. */
body::before {
  background-image: repeating-linear-gradient(
    90deg,
    rgba(83, 100, 120, 0.032) 0px,
    rgba(83, 100, 120, 0.032) 1px,
    transparent 1px,
    transparent 4px
  );
  content: "";
  inset: 0;
  pointer-events: none;
  position: fixed;
  z-index: -2;
}

/* Mechanical layer: lathe-facing turning marks anchored off two corners. */
body::after {
  background-image:
    repeating-radial-gradient(
      circle at 100% 0%,
      rgba(13, 55, 102, 0.05) 0px,
      rgba(13, 55, 102, 0.05) 1px,
      transparent 1px,
      transparent 14px
    ),
    repeating-radial-gradient(
      circle at 0% 100%,
      rgba(13, 55, 102, 0.04) 0px,
      rgba(13, 55, 102, 0.04) 1px,
      transparent 1px,
      transparent 18px
    );
  background-position: 0 0, 0 0;
  background-repeat: no-repeat, no-repeat;
  background-size: 70vw 70vh, 55vw 55vh;
  content: "";
  inset: 0;
  pointer-events: none;
  position: fixed;
  z-index: -3;
}
```

Both layers are sized in `vw`/`vh`, so they scale at every viewport and cannot cause horizontal overflow (background painting never expands the box).

- [ ] **Step 2: Simplify the page base**

In `:root`, replace the `background` declaration with a flatter institutional base:

```css
  background:
    linear-gradient(180deg, #fbfdff 0%, var(--bg) 55%, #f6fafd 100%);
```

- [ ] **Step 3: Verify**

Run: `npm run build` — expected clean.

Confirm by reading the resulting CSS that no layer exceeds 0.05 alpha, that both pseudo-elements remain `position: fixed` with negative `z-index`, and that no `background-size` uses a fixed pixel value that could clip oddly on ultra-wide screens.

- [ ] **Step 4: Commit**

```bash
git add src/styles.css
git commit -m "style: replace background with materials grain and machining arcs"
```

---

### Task 5: Mobile hamburger navigation

**Depends on:** Task 4.

**Files:**
- Create: `src/components/SiteNav.tsx`
- Modify: `src/App.tsx` (use the new component in `Layout`)
- Modify: `src/styles.css` (nav + hamburger rules)

**Interfaces:**
- Produces: `<SiteNav />` — renders the `<nav>` plus the hamburger toggle, owning its own open state.

- [ ] **Step 1: Create the component**

Create `src/components/SiteNav.tsx`:

```tsx
import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { siteContent } from "../content/siteContent";

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const location = useLocation();

  // Close on navigation.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) {
        return;
      }

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
      );

      if (!focusable.length) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        className="nav-toggle"
        ref={toggleRef}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="primary-navigation"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
      >
        {open ? <X aria-hidden="true" size={22} /> : <Menu aria-hidden="true" size={22} />}
      </button>
      <nav
        aria-label="Primary navigation"
        className={open ? "open" : undefined}
        id="primary-navigation"
        ref={panelRef}
      >
        {siteContent.navigation.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => (isActive ? "active" : undefined)}
            end={item.path === "/"}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
```

- [ ] **Step 2: Use it in `Layout`**

In `src/App.tsx`, add `import { SiteNav } from "./components/SiteNav";`, then replace the entire inline `<nav aria-label="Primary navigation"> ... </nav>` block inside `.header-inner` with `<SiteNav />`. Remove `NavLink` from the lucide/router imports only if it becomes unused — it is still used elsewhere in `App.tsx`, so keep it.

- [ ] **Step 3: Style the hamburger**

Add to `src/styles.css`:

```css
.nav-toggle {
  align-items: center;
  background: transparent;
  border: 1px solid var(--line);
  border-radius: 4px;
  color: var(--navy);
  cursor: pointer;
  display: none;
  height: 44px;
  justify-content: center;
  width: 44px;
}

@media (max-width: 900px) {
  .header-inner {
    align-items: center;
    display: flex;
  }

  .nav-toggle {
    display: inline-flex;
  }

  nav {
    background: rgba(246, 251, 255, 0.98);
    border-bottom: 1px solid var(--line);
    display: none;
    flex-direction: column;
    left: 0;
    padding: 0.5rem clamp(1rem, 4vw, 2.5rem) 1rem;
    position: absolute;
    right: 0;
    top: 100%;
  }

  nav.open {
    display: flex;
  }

  nav a {
    width: 100%;
  }
}
```

Also add `position: relative;` to the `.site-header` rule so the absolutely-positioned panel anchors to the header rather than the page.

- [ ] **Step 4: Remove the old wrap-based mobile nav rules**

In the `@media (max-width: 980px)` block, delete the `.header-inner { align-items: start; display: grid; }` rule and the `nav { justify-content: flex-start; }` rule — the 900px block now owns mobile nav layout.

- [ ] **Step 5: Verify**

Run: `npm run test` and `npm run build` — both expected clean.

Confirm by code review: `aria-expanded` reflects state, `aria-controls` matches the nav `id`, Escape closes and restores focus to the toggle, Tab cycles within the panel, and navigation closes the panel via the `location.pathname` effect.

- [ ] **Step 6: Commit**

```bash
git add src/components/SiteNav.tsx src/App.tsx src/styles.css
git commit -m "feat: add accessible mobile hamburger navigation"
```

---

### Task 6: About section layout

**Depends on:** Task 5.

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: Replace the About section styles**

Remove the old `.about-section .glass-panel p` rules from Task 7 of the previous plan and add:

```css
.about-section {
  align-items: start;
  display: grid;
  gap: clamp(1.25rem, 3vw, 2.5rem);
  grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.85fr);
  padding-top: clamp(2rem, 5vw, 3.5rem);
}

.about-copy h1 {
  margin-bottom: 0;
}

.about-copy p {
  margin-bottom: 0;
  margin-top: 1rem;
}

@media (max-width: 980px) {
  .about-section {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 2: Make the carousel sticky alongside the long About text**

The About copy is two long brochure paragraphs; the carousel is much shorter. Add:

```css
@media (min-width: 981px) {
  .about-section .hero-carousel {
    position: sticky;
    top: 96px;
  }
}
```

- [ ] **Step 3: Verify**

Run: `npm run build` — expected clean.

Confirm the two-column grid collapses to one column at 980px and that `minmax(320px, ...)` only applies above that breakpoint, so no forced width at 375px.

- [ ] **Step 4: Commit**

```bash
git add src/styles.css
git commit -m "style: lay out about section with carousel column"
```

---

### Task 7: Contact banner rebuild

**Depends on:** Task 6.

**Files:**
- Modify: `src/App.tsx` (`ContactBanner` internals)
- Modify: `src/styles.css`

- [ ] **Step 1: Finalize the banner markup**

Replace the `ContactBanner` stub in `src/App.tsx` with:

```tsx
function ContactBanner() {
  return (
    <section className="contact-banner">
      <div className="contact-banner-inner">
        <div className="contact-banner-logos">
          {siteContent.partnerLogos.map((logo) => (
            <img key={logo.src} src={logo.src} alt={logo.alt} />
          ))}
        </div>
        <div className="contact-banner-grid">
          <address>
            <strong>{siteContent.centreName}</strong>
            <span>{siteContent.contact.address}</span>
          </address>
          <div className="contact-banner-links">
            <a href={`mailto:${siteContent.contact.email}`}>{siteContent.contact.email}</a>
            <a href={siteContent.contact.website} rel="noreferrer" target="_blank">
              {siteContent.contact.website}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Style it as a full-bleed navy band**

```css
.contact-banner {
  background: var(--navy);
  border-top: 1px solid rgba(255, 255, 255, 0.14);
  margin-top: clamp(2rem, 5vw, 4rem);
  padding: clamp(2rem, 5vw, 3.5rem) clamp(1rem, 6vw, 5rem);
  width: 100%;
}

.contact-banner-inner {
  margin: 0 auto;
  max-width: 1180px;
}

.contact-banner-logos {
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.22);
  border-top: 1px solid rgba(255, 255, 255, 0.22);
  display: flex;
  flex-wrap: wrap;
  gap: clamp(1.5rem, 5vw, 4rem);
  justify-content: space-between;
  padding: 1.25rem 0;
}

.contact-banner-logos img {
  background: #fff;
  border-radius: 3px;
  height: 58px;
  object-fit: contain;
  padding: 0.4rem 0.6rem;
  width: auto;
}

.contact-banner-grid {
  display: grid;
  gap: clamp(1.25rem, 4vw, 3rem);
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  padding-top: 1.75rem;
}

.contact-banner-grid address {
  display: grid;
  font-style: normal;
  gap: 0.5rem;
}

.contact-banner-grid strong {
  color: #fff;
  font-size: 1.05rem;
  font-weight: 850;
  line-height: 1.4;
}

.contact-banner-grid address span {
  background: none;
  border: 0;
  color: rgba(255, 255, 255, 0.8);
  display: block;
  line-height: 1.8;
  padding: 0;
}

.contact-banner-links {
  display: grid;
  gap: 0.5rem;
}

.contact-banner-links a {
  color: rgba(255, 255, 255, 0.86);
  line-height: 1.8;
  min-height: 44px;
  align-items: center;
  display: flex;
}

.contact-banner-links a:hover {
  color: #fff;
  text-decoration: underline;
}

@media (max-width: 780px) {
  .contact-banner-grid {
    grid-template-columns: 1fr;
  }

  .contact-banner-logos {
    gap: 1.5rem;
    justify-content: flex-start;
  }

  .contact-banner-logos img {
    height: 44px;
  }
}
```

The logos get a white plate because both source PNGs have light backgrounds and would otherwise disappear against the navy band.

The generic `address a, address span` rule earlier in the stylesheet applies white card styling — the overrides above neutralize it inside the banner. Confirm the cascade order places `.contact-banner-grid address span` after the generic `address` rules; if not, move the banner block below them.

- [ ] **Step 3: Verify**

Run: `npm run test` and `npm run build` — both expected clean.

Confirm: banner is full-bleed (not constrained by `.section-shell`), logo row has rules above and below, both columns are left-aligned, and text contrast on navy is legible.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/styles.css
git commit -m "feat: rebuild contact banner as full-bleed institutional band"
```

---

### Task 8: Update project documentation

**Files:**
- Modify: `CLAUDE.md`
- Modify: `README.md`

- [ ] **Step 1: Update `CLAUDE.md`**

In the "Route Map" section, delete the `/about` line and update the `/` line to: `` `/` — Home: About section with image carousel, director message, contact banner. ``

In "Code Style & Quality Guidelines" → "Styling", replace the frosted-glass bullet with:

```markdown
    *   Toned-down glass surfaces: `backdrop-filter: blur(10px)`, 8-10px radii, near-opaque white fills. The register is professional/institutional, not modern-startup — avoid large radii, pill buttons, and heavy shadows.
    *   Background is a fixed two-layer materials/mechanical system (brushed-steel grain + machining arcs) on `body::before`/`body::after`, kept at or below 6% opacity.
```

Add a bullet under Accessibility:

```markdown
    *   Mobile navigation uses an accessible hamburger (`aria-expanded`, `aria-controls`, Escape to close, focus trap, closes on route change). Never hide nav links without a visible control.
```

- [ ] **Step 2: Update `README.md`**

In the Directory Structure block, add `│   ├── components/            # SiteNav (hamburger) and HeroCarousel` under `src/`, and add `│   ├── lib/                   # Pure helpers (carousel index math)`.

In "Visual Identity & Styling Guidelines", replace the "Glassmorphism Motifs" bullet with:

```markdown
*   **Surface Treatment:** Toned-down frosted surfaces (`backdrop-filter: blur(10px)`, 8-10px radii, near-opaque fills) for a professional institutional feel rather than a modern-startup one.
*   **Background:** A fixed two-layer engineering system — brushed-steel micro-grain plus large machining/turning arcs — held at or below 6% opacity so it never competes with content.
```

Remove the `/about` route from any route listing present in the file.

- [ ] **Step 3: Verify**

Read both files back and confirm no remaining references to `/about` as a live page, and no remaining instruction to use `blur(12px) saturate(180%)` or large pill radii.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md README.md
git commit -m "docs: document the professional institutional design system"
```

---

### Task 9: Regression and responsive QA

**Depends on:** Tasks 1–8.

**Files:** none (verification only, plus small fixes if needed).

- [ ] **Step 1: Full test suite**

Run: `npm run test`
Expected: all suites pass, including the updated six-path route test and the removed-content assertions.

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: clean TypeScript compile and Vite build, no unused imports, no missing asset warnings.

- [ ] **Step 3: Dead-code sweep**

Run: `grep -rn "home-hero\|capability\|leadership\|AboutPage\|LeadershipBlock\|heroTitle\|heroSummary" src/`
Expected: zero hits. Any remaining hit is dead code to delete.

- [ ] **Step 4: Responsive walkthrough**

Run `npm run preview` and check 375, 414, 768, 900, 1024, 1440, 1920, and 2560 px. At each width verify: no horizontal scrollbar; nav usable (hamburger below 900px, inline links above); About text and carousel stack correctly; director placeholder frame sane; contact banner columns stack at 780px and logos stay legible; every inner page (`/facilities`, `/research`, `/industry`, `/gallery`, `/contact`) still renders correctly with the new shared styling.

- [ ] **Step 5: Accessibility check**

Keyboard-only: skip-link works; hamburger opens with Enter/Space, traps focus, closes on Escape with focus returning to the toggle, and closes on navigating; carousel dots and arrow keys work; contact banner links reachable; visible focus rings throughout. Confirm `/about` redirects to `/` rather than 404ing.

- [ ] **Step 6: Commit any fixes**

```bash
git add -A
git commit -m "fix: responsive and accessibility polish after institutional revision"
```

Skip if no fixes were needed.
