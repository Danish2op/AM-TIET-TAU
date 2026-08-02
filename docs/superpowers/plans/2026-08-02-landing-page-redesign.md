# Landing Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the landing page and shared site shell per client feedback — full-width merged nav, blueprint/mechanical background (sitewide), auto-rotating hero carousel, brochure-exact About section, placeholder Director message section, and a real-logo contact banner.

**Architecture:** Pure-logic carousel index math lives in a standalone module (`src/lib/carousel.ts`) so it's unit-testable under the existing node-environment Vitest setup without adding DOM-testing dependencies. All visual/layout work stays in `src/styles.css` (existing vanilla-CSS system, no new frameworks) and `src/App.tsx` (existing component file, no new component library). Content (About copy, director placeholder, logo metadata) lives in `src/content/siteContent.ts`, guarded by `siteContent.test.ts` assertions, matching the existing pattern.

**Tech Stack:** React 18 + TypeScript, Vite, Vitest (node environment, no jsdom/RTL — keep it that way), vanilla CSS, React Router v7, lucide-react icons.

## Global Constraints

- No new UI/styling frameworks (Tailwind, Bootstrap, etc.) — vanilla CSS only, per CLAUDE.md.
- No stock photos or generic AI-slop visuals (decorative orbs, fake dashboards) — per CLAUDE.md.
- Every `<img>` needs a meaningful, descriptive `alt` — per CLAUDE.md.
- Keep `.skip-link` → `#main` intact.
- Brochure-backed copy only — no invented research claims/leadership credentials. About section text must match `resources and photos/Advanced Manufacturing Centre brochure v4.pdf` page 2 wording exactly.
- `siteContent.test.ts` assertions must keep passing; extend, don't weaken.
- Respect `prefers-reduced-motion` for the carousel (existing stylesheet already has a global reduced-motion block — carousel JS must also check it for its timer).
- Fixed asset filenames (locked now so parallel tasks don't collide): `public/assets/tiet-logo.svg`, `public/assets/tau-logo.svg`.
- Test UI changes in the real browser (`npm run dev`) at minimum widths 375px, 768px, 1024px, 1440px, 1920px — not just by reading CSS.

---

## Execution Note (parallelization)

Tasks 1–3 touch disjoint files (`public/assets/*`, `src/content/siteContent.ts`, `src/lib/carousel.ts`) and have no interdependencies beyond the filenames already locked above — **dispatch these three in parallel.**

Tasks 4–10 all touch `src/App.tsx` and/or `src/styles.css`, which every one of them shares — **run these sequentially**, one subagent at a time, to avoid clobbering each other's edits. Each depends on the previous task's markup/classes being in place.

---

### Task 1: Fetch real institutional logos

**Files:**
- Create: `public/assets/tiet-logo.svg`
- Create: `public/assets/tau-logo.svg`

**Interfaces:**
- Produces: two static files at fixed paths `/assets/tiet-logo.svg` and `/assets/tau-logo.svg`, referenced by Task 2's `partnerLogos` content and Task 9's contact banner markup.

- [ ] **Step 1: Fetch TIET's official logo**

Use WebFetch against Thapar Institute of Engineering & Technology's official site (`thapar.edu`) to locate their official logo asset (the red "ti" mark + "THAPAR INSTITUTE OF ENGINEERING & TECHNOLOGY" wordmark, matching the brochure's page 1/page 5 mark). Download it and save as `public/assets/tiet-logo.svg` (or convert to SVG/optimized PNG if only a raster is available — keep whichever format preserves quality best, adjust the file extension accordingly and update Task 2/9 references to match).

- [ ] **Step 2: Fetch Tel Aviv University's official logo**

Use WebFetch against Tel Aviv University's official site (`tau.ac.il`) to locate their official logo asset. Download and save as `public/assets/tau-logo.svg` (same format-fallback note as Step 1).

- [ ] **Step 3: Verify both files**

Run: `ls -la "D:/AM-TIETTAU/public/assets/" | grep logo`
Expected: both `tiet-logo.*` and `tau-logo.*` present, non-zero file size.

Open each file to confirm it renders as a real logo mark (not a broken/empty download).

- [ ] **Step 4: Commit**

```bash
git add public/assets/tiet-logo.svg public/assets/tau-logo.svg
git commit -m "assets: add TIET and Tel Aviv University institutional logos"
```

(If formats differ from `.svg`, `git add` the actual filenames used.)

---

### Task 2: Add About, Director, and partner-logo content

**Files:**
- Modify: `src/content/siteContent.ts`
- Modify: `src/content/siteContent.test.ts`

**Interfaces:**
- Produces: `siteContent.aboutCentre: string[]`, `siteContent.directorMessage: { heading: string; paragraphs: string[] }`, `siteContent.partnerLogos: { name: string; src: string; alt: string }[]` — consumed by Task 7 (About section), Task 8 (Director section), Task 9 (contact banner).

- [ ] **Step 1: Write the failing tests**

Add to `src/content/siteContent.test.ts`:

```ts
  it("uses brochure-exact About the Centre copy", () => {
    expect(siteContent.aboutCentre).toHaveLength(2);
    expect(siteContent.aboutCentre[0]).toContain(
      "The Centre of Excellence in Advanced Manufacturing (CoE-AM) is a dedicated platform established to promote innovation"
    );
    expect(siteContent.aboutCentre[0]).toContain("Prof. Noam Eliaz");
    expect(siteContent.aboutCentre[1]).toContain(
      "Beyond research, CoE-AM is committed to creating a highly capable and industry-ready workforce"
    );
  });

  it("marks the director message as placeholder content", () => {
    expect(siteContent.directorMessage.heading).toBe("Message from Director, CoE-AM");
    expect(siteContent.directorMessage.paragraphs.length).toBeGreaterThan(0);
    expect(siteContent.directorMessage.paragraphs[0]).toContain("Lorem ipsum");
  });

  it("lists both partner institution logos", () => {
    expect(siteContent.partnerLogos).toHaveLength(2);
    expect(siteContent.partnerLogos.map((logo) => logo.name)).toEqual([
      "Thapar Institute of Engineering and Technology",
      "Tel Aviv University"
    ]);
    expect(siteContent.partnerLogos.every((logo) => logo.src.startsWith("/assets/"))).toBe(true);
    expect(siteContent.partnerLogos.every((logo) => logo.alt.length > 10)).toBe(true);
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test`
Expected: FAIL — `aboutCentre`, `directorMessage`, `partnerLogos` are `undefined`.

- [ ] **Step 3: Add the content to `siteContent.ts`**

Add these types near the top (alongside the existing `type` exports):

```ts
export type PartnerLogo = {
  name: string;
  src: string;
  alt: string;
};
```

Add these fields inside the `siteContent` object (after `contact`, before `navigation` — or any position, object key order doesn't matter to the tests):

```ts
  aboutCentre: [
    "The Centre of Excellence in Advanced Manufacturing (CoE-AM) is a dedicated platform established to promote innovation, high-impact research, and technology-driven transformation in modern manufacturing domains. The Centre is a collaborative initiative between Thapar Institute of Engineering and Technology (TIET), Patiala, and Tel Aviv University (TAU), Israel. It is led by the founding Director and Chair Professor, Prof. Noam Eliaz. It serves as a multidisciplinary ecosystem where cutting-edge infrastructure and expert researchers converge to provide specialised support to academia, industry, defense organizations, healthcare institutions, etc. In particular, the Centre aims to facilitate end-to-end technology development from conceptual design and simulation to prototyping, testing, refinement, and final validation. Its research thrust areas include additive manufacturing process optimization, development of high-performance materials, including metals and alloys, ceramics, composites, functionally graded materials (FGMs), multi-material systems, and polymers, for advanced applications; novel innovations in welding, casting, and forming techniques; surface engineering; advanced machining strategies; hybrid manufacturing approaches; and deployment of Industry 4.0 tools for real-time monitoring and intelligent decision-making. Through such initiatives, the Centre seeks to drive improvements in manufacturing efficiency, product reliability, and sustainability.",
    "Beyond research, CoE-AM is committed to creating a highly capable and industry-ready workforce and bridging the skills gap by offering specialized training, certifications, and hands-on workshops for students and professionals. It also serves as a vital incubator for entrepreneurs, providing the prototyping tools and expert consultancy necessary to transform ideas into market-ready products. The Centre encourages innovation-driven entrepreneurship by collaborative projects, and consultancy services, thereby strengthening the industry-academia-innovation chain. Ultimately, the CoE-AM is envisioned as a powerful catalyst for economic and technological growth, fostering a highly skilled workforce and a robust innovation ecosystem that strengthens global industrial competitiveness."
  ],
  directorMessage: {
    heading: "Message from Director, CoE-AM",
    // Placeholder copy — replace with the Director's actual message before launch.
    paragraphs: [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
      "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
    ]
  },
  partnerLogos: [
    {
      name: "Thapar Institute of Engineering and Technology",
      src: "/assets/tiet-logo.svg",
      alt: "Thapar Institute of Engineering and Technology official logo"
    },
    {
      name: "Tel Aviv University",
      src: "/assets/tau-logo.svg",
      alt: "Tel Aviv University official logo"
    }
  ] satisfies PartnerLogo[],
```

Note: if Task 1 saved the logos with a different extension (e.g. `.png`), update the two `src` values above to match the real filenames.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test`
Expected: PASS, all suites green.

- [ ] **Step 5: Commit**

```bash
git add src/content/siteContent.ts src/content/siteContent.test.ts
git commit -m "feat: add About, Director message, and partner logo content"
```

---

### Task 3: Carousel index logic (pure, unit-tested)

**Files:**
- Create: `src/lib/carousel.ts`
- Create: `src/lib/carousel.test.ts`

**Interfaces:**
- Produces: `nextIndex(current: number, length: number): number`, `prevIndex(current: number, length: number): number` — consumed by Task 6's `HeroCarousel` component.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/carousel.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { nextIndex, prevIndex } from "./carousel";

describe("carousel index math", () => {
  it("advances to the next index", () => {
    expect(nextIndex(0, 6)).toBe(1);
    expect(nextIndex(4, 6)).toBe(5);
  });

  it("wraps to zero after the last index", () => {
    expect(nextIndex(5, 6)).toBe(0);
  });

  it("goes back to the previous index", () => {
    expect(prevIndex(3, 6)).toBe(2);
  });

  it("wraps to the last index when going back from zero", () => {
    expect(prevIndex(0, 6)).toBe(5);
  });

  it("handles a single-item carousel without dividing by zero", () => {
    expect(nextIndex(0, 1)).toBe(0);
    expect(prevIndex(0, 1)).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test`
Expected: FAIL — cannot find module `./carousel`.

- [ ] **Step 3: Implement the minimal logic**

Create `src/lib/carousel.ts`:

```ts
export function nextIndex(current: number, length: number): number {
  if (length <= 1) {
    return 0;
  }
  return (current + 1) % length;
}

export function prevIndex(current: number, length: number): number {
  if (length <= 1) {
    return 0;
  }
  return (current - 1 + length) % length;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test`
Expected: PASS, 5/5 in this file.

- [ ] **Step 5: Commit**

```bash
git add src/lib/carousel.ts src/lib/carousel.test.ts
git commit -m "feat: add pure carousel index math with tests"
```

---

### Task 4: Sitewide blueprint background system

**Depends on:** nothing (styles.css only), but run after Tasks 1–3 land since it's the first of the sequential `styles.css`/`App.tsx` tasks.

**Files:**
- Modify: `src/styles.css:1-58` (the `:root`, `body::before`, `body::after` rules)

**Interfaces:**
- Produces: no new classes — visual change only via existing `body::before`/`body::after` pseudo-elements, so no other task's markup needs to change for this one.

- [ ] **Step 1: Replace the background rules**

In `src/styles.css`, replace the existing `body::before` and `body::after` blocks (lines ~39-58) with:

```css
body::before {
  background-image:
    linear-gradient(rgba(19, 74, 125, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(19, 74, 125, 0.06) 1px, transparent 1px),
    radial-gradient(circle, rgba(19, 74, 125, 0.14) 1px, transparent 1.4px);
  background-size: 42px 42px, 42px 42px, 42px 42px;
  content: "";
  inset: 0;
  pointer-events: none;
  position: fixed;
  z-index: -2;
}

body::after {
  background:
    linear-gradient(120deg, rgba(25, 118, 210, 0.14), rgba(143, 208, 255, 0.08), rgba(8, 33, 61, 0.1)),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='260' height='60'%3E%3Cline x1='10' y1='30' x2='250' y2='30' stroke='%23134a7d' stroke-width='1' stroke-opacity='0.35'/%3E%3Cline x1='10' y1='20' x2='10' y2='40' stroke='%23134a7d' stroke-width='1' stroke-opacity='0.35'/%3E%3Cline x1='250' y1='20' x2='250' y2='40' stroke='%23134a7d' stroke-width='1' stroke-opacity='0.35'/%3E%3C/svg%3E") no-repeat,
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cline x1='40' y1='0' x2='40' y2='80' stroke='%23134a7d' stroke-opacity='0.3' stroke-width='1'/%3E%3Cline x1='0' y1='40' x2='80' y2='40' stroke='%23134a7d' stroke-opacity='0.3' stroke-width='1'/%3E%3Ccircle cx='40' cy='40' r='3' fill='none' stroke='%23134a7d' stroke-opacity='0.3'/%3E%3C/svg%3E") no-repeat,
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'%3E%3Ccircle cx='80' cy='80' r='60' fill='none' stroke='%23134a7d' stroke-opacity='0.22' stroke-width='1'/%3E%3Ccircle cx='80' cy='80' r='40' fill='none' stroke='%23134a7d' stroke-opacity='0.22' stroke-width='1'/%3E%3Ccircle cx='80' cy='80' r='20' fill='none' stroke='%23134a7d' stroke-opacity='0.22' stroke-width='1'/%3E%3C/svg%3E") no-repeat;
  background-position: 0 0, top 12vh right 4vw, bottom 8vh left 3vw, bottom -40px right -40px;
  background-size: auto, 260px 60px, 80px 80px, 160px 160px;
  content: "";
  inset: 0;
  pointer-events: none;
  position: fixed;
  z-index: -3;
}

@media (max-width: 980px) {
  body::after {
    background-position: 0 0, top 8vh right -20px, bottom 6vh left -20px, bottom -60px right -60px;
  }
}
```

- [ ] **Step 2: Verify in browser**

Run: `npm run dev`

Open the site at 375px, 768px, 1024px, 1440px, and 1920px widths. Confirm: motifs sit near page edges (never overlapping headings/body text), grid reads as subtle texture not noise, no motif clipping/overflow causes horizontal scroll at any width.

- [ ] **Step 3: Commit**

```bash
git add src/styles.css
git commit -m "style: replace dot-grid with blueprint-line background system"
```

---

### Task 5: Full-width merged nav bar

**Depends on:** Task 4 (sequential, same files).

**Files:**
- Modify: `src/App.tsx:22-48` (the `Layout` function's `<header>`)
- Modify: `src/styles.css:94-169` (`.site-header`, `.brand`, `nav` rules) and the `@media (max-width: 980px)` / `@media (max-width: 640px)` blocks referencing `.site-header`

**Interfaces:**
- Produces: `.header-inner` wrapper class inside `.site-header`, used only here — no other task depends on this markup.

- [ ] **Step 1: Update the header markup**

In `src/App.tsx`, wrap the brand + nav in an inner container:

```tsx
      <header className="site-header">
        <div className="header-inner">
          <NavLink className="brand" to="/" aria-label="TIET-TAU home">
            <span className="brand-mark">ti</span>
            <span>
              <strong>{siteContent.eyebrow}</strong>
              <small>{siteContent.centreName}</small>
            </span>
          </NavLink>
          <nav aria-label="Primary navigation">
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
        </div>
      </header>
```

- [ ] **Step 2: Update the header styles**

In `src/styles.css`, replace the `.site-header` rule with:

```css
.site-header {
  backdrop-filter: blur(18px);
  background: rgba(246, 251, 255, 0.86);
  border-bottom: 1px solid var(--line);
  box-shadow: 0 12px 34px rgba(8, 33, 61, 0.06);
  left: 0;
  position: sticky;
  right: 0;
  top: 0;
  width: 100%;
  z-index: 20;
}

.header-inner {
  align-items: center;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  margin: 0 auto;
  max-width: 1360px;
  min-height: 72px;
  padding: 0.7rem clamp(1rem, 4vw, 2.5rem);
  width: 100%;
}
```

Remove the old `border-radius`, `margin`, `width: calc(...)` declarations that were on `.site-header` (now superseded).

Update the two responsive blocks that reference `.site-header`:

In the `@media (max-width: 980px)` block, change:

```css
  .site-header,
  .home-hero,
  .split-layout,
  .research-layout,
  .contact-page,
  .facility-card {
    grid-template-columns: 1fr;
  }

  .site-header {
    align-items: start;
    display: grid;
    position: relative;
  }
```

to:

```css
  .home-hero,
  .split-layout,
  .research-layout,
  .contact-page,
  .facility-card {
    grid-template-columns: 1fr;
  }

  .header-inner {
    align-items: start;
    display: grid;
  }
```

In the `@media (max-width: 640px)` block, remove this rule (no longer needed — the header is already full-width and unrounded by default now):

```css
  .site-header {
    border-radius: 0;
    left: 0;
    right: 0;
    top: 0;
    width: 100%;
  }
```

- [ ] **Step 3: Verify in browser**

Run: `npm run dev`. Confirm the bar spans full viewport width with no side gaps at 375px/768px/1024px/1440px/1920px, stays pinned on scroll (sticky), nav wraps sanely under 980px (brand/nav stack), and no `.skip-link` regression (tab from page load still reveals it).

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/styles.css
git commit -m "style: replace floating nav pill with full-width sticky bar"
```

---

### Task 6: Hero carousel component

**Depends on:** Task 3 (`src/lib/carousel.ts`), Task 5 (sequential file ownership).

**Files:**
- Create: `src/components/HeroCarousel.tsx`
- Modify: `src/App.tsx` (import + swap the `image-stack` markup in `HomePage`)
- Modify: `src/styles.css` (replace `.image-stack`/`.stack-card` rules)

**Interfaces:**
- Consumes: `nextIndex`, `prevIndex` from `src/lib/carousel.ts`; `GalleryItem[]` from `siteContent.gallery`.
- Produces: `<HeroCarousel items={GalleryItem[]} />` component, used only in `HomePage`.

- [ ] **Step 1: Create the component**

Create `src/components/HeroCarousel.tsx`:

```tsx
import { useEffect, useRef, useState } from "react";
import { GalleryItem } from "../content/siteContent";
import { nextIndex, prevIndex } from "../lib/carousel";

const ADVANCE_MS = 4000;

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function HeroCarousel({ items }: { items: GalleryItem[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || prefersReducedMotion() || items.length <= 1) {
      return;
    }
    const id = window.setInterval(() => {
      setIndex((current) => nextIndex(current, items.length));
    }, ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [paused, items.length]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowRight") {
      setIndex((current) => nextIndex(current, items.length));
    } else if (event.key === "ArrowLeft") {
      setIndex((current) => prevIndex(current, items.length));
    }
  };

  return (
    <div
      className="hero-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={handleKeyDown}
      role="group"
      aria-label="Facility image carousel"
      tabIndex={0}
    >
      <div className="hero-carousel-frame">
        {items.map((item, itemIndex) => (
          <figure
            className={`hero-carousel-slide${itemIndex === index ? " active" : ""}`}
            key={item.src}
            aria-hidden={itemIndex === index ? undefined : true}
          >
            <img src={item.src} alt={item.alt} loading={itemIndex === 0 ? "eager" : "lazy"} />
            <figcaption>{item.tag}</figcaption>
          </figure>
        ))}
      </div>
      <div className="hero-carousel-dots" role="tablist" aria-label="Choose carousel slide">
        {items.map((item, itemIndex) => (
          <button
            key={item.src}
            role="tab"
            aria-selected={itemIndex === index}
            aria-label={`Show slide ${itemIndex + 1}: ${item.tag}`}
            className={itemIndex === index ? "active" : undefined}
            onClick={() => setIndex(itemIndex)}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire it into the homepage**

In `src/App.tsx`, add the import at the top:

```tsx
import { HeroCarousel } from "./components/HeroCarousel";
```

Replace the `<NavLink className="image-stack" ...>` block inside `HomePage`'s `home-hero` section with:

```tsx
        <HeroCarousel items={siteContent.gallery} />
```

- [ ] **Step 3: Replace the image-stack styles**

In `src/styles.css`, remove the `.image-stack`, `.stack-card`, `.stack-1`, `.stack-2`, `.stack-3` rules and their mobile-breakpoint overrides, replacing with:

```css
.hero-carousel {
  border-radius: 24px;
  min-height: 460px;
  outline-offset: 6px;
  position: relative;
}

.hero-carousel-frame {
  background: rgba(255, 255, 255, 0.58);
  border: 1px solid var(--line);
  border-radius: 24px;
  box-shadow: var(--shadow);
  height: 100%;
  min-height: 460px;
  overflow: hidden;
  position: relative;
}

.hero-carousel-slide {
  height: 100%;
  inset: 0;
  margin: 0;
  opacity: 0;
  position: absolute;
  transition: opacity 480ms ease;
  width: 100%;
}

.hero-carousel-slide.active {
  opacity: 1;
}

.hero-carousel-slide img {
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.hero-carousel-slide figcaption {
  background: linear-gradient(0deg, rgba(7, 24, 44, 0.72), transparent);
  bottom: 0;
  color: #fff;
  font-size: 0.85rem;
  font-weight: 850;
  left: 0;
  padding: 2.2rem 1.2rem 1rem;
  position: absolute;
  right: 0;
}

.hero-carousel-dots {
  bottom: 1rem;
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  left: 0;
  position: absolute;
  right: 0;
}

.hero-carousel-dots button {
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 999px;
  cursor: pointer;
  height: 10px;
  padding: 0;
  width: 10px;
}

.hero-carousel-dots button.active {
  background: #fff;
}

@media (max-width: 980px) {
  .hero-carousel,
  .hero-carousel-frame {
    min-height: 360px;
  }
}

@media (max-width: 640px) {
  .hero-carousel,
  .hero-carousel-frame {
    min-height: 280px;
  }
}
```

- [ ] **Step 4: Verify**

Run: `npm run test` (existing suite must still pass — no logic in this task touches tested content, but confirm no regressions).

Run: `npm run dev`. Confirm: carousel auto-advances every ~4s, pauses on hover and on keyboard focus, dots are clickable and jump correctly, arrow keys change slide when carousel has focus, and with OS-level "reduce motion" enabled the auto-advance stops (dots/arrows still work). Check 375px/768px/1024px/1440px/1920px — frame keeps aspect without overflow, figcaption text stays legible.

- [ ] **Step 5: Commit**

```bash
git add src/components/HeroCarousel.tsx src/App.tsx src/styles.css
git commit -m "feat: replace hero image stack with auto-rotating carousel"
```

---

### Task 7: About section on the landing page

**Depends on:** Task 2 (`siteContent.aboutCentre`), Task 6 (sequential file ownership).

**Files:**
- Modify: `src/App.tsx` (`HomePage`, insert new section after the hero)
- Modify: `src/styles.css` (add `.about-section` rules)

**Interfaces:**
- Consumes: `siteContent.aboutCentre: string[]`.

- [ ] **Step 1: Add the section markup**

In `src/App.tsx`, inside `HomePage`, insert this section directly after the closing `</section>` of `home-hero` and before the `Capability map` section:

```tsx
      <section className="section-shell about-section">
        <div className="glass-panel">
          <p className="eyebrow">About the centre</p>
          <h2>A TIET-TAU platform for research, prototyping, and workforce development.</h2>
          {siteContent.aboutCentre.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </section>
```

- [ ] **Step 2: Add styles**

In `src/styles.css`, add:

```css
.about-section .glass-panel p {
  line-height: 1.7;
  margin-top: 1rem;
}

.about-section .glass-panel p:first-of-type {
  margin-top: 1.25rem;
}
```

- [ ] **Step 3: Verify**

Run: `npm run test`.
Run: `npm run dev`. Confirm the About section reads full-width within the existing `.section-shell` max-width, paragraphs wrap cleanly at 375px through 1920px, no overflow.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/styles.css
git commit -m "feat: add brochure-exact About section to landing page"
```

---

### Task 8: Director message section

**Depends on:** Task 2 (`siteContent.directorMessage`), Task 7 (sequential file ownership).

**Files:**
- Modify: `src/App.tsx` (`HomePage`, insert new section after Capability map)
- Modify: `src/styles.css` (add `.director-section` rules)

**Interfaces:**
- Consumes: `siteContent.directorMessage: { heading: string; paragraphs: string[] }`.

- [ ] **Step 1: Add the section markup**

In `src/App.tsx`, inside `HomePage`, insert this section directly after the `route-grid`/`Capability map` section closes (i.e., as the last section before `HomePage`'s closing fragment):

```tsx
      <section className="section-shell director-section">
        <div className="glass-panel director-copy">
          <p className="eyebrow">Leadership</p>
          <h2>{siteContent.directorMessage.heading}</h2>
          {siteContent.directorMessage.paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
        <div className="director-photo" role="img" aria-label="Director photo placeholder — to be replaced before launch">
          <Users aria-hidden="true" size={48} />
        </div>
      </section>
```

(`Users` is already imported from `lucide-react` at the top of `App.tsx`.)

- [ ] **Step 2: Add styles**

In `src/styles.css`, add:

```css
.director-section {
  align-items: start;
  display: grid;
  gap: 1.25rem;
  grid-template-columns: minmax(0, 1fr) minmax(240px, 0.55fr);
}

.director-copy p {
  line-height: 1.7;
  margin-top: 1rem;
}

.director-photo {
  aspect-ratio: 3 / 4;
  align-items: center;
  background: rgba(255, 255, 255, 0.5);
  border: 1px dashed var(--line);
  border-radius: 22px;
  color: var(--muted);
  display: flex;
  justify-content: center;
}

@media (max-width: 980px) {
  .director-section {
    grid-template-columns: 1fr;
  }

  .director-photo {
    aspect-ratio: 16 / 9;
    max-height: 260px;
  }
}
```

- [ ] **Step 3: Verify**

Run: `npm run test`.
Run: `npm run dev`. Confirm the section stacks to a single column under 980px with the placeholder frame capped at a sane height, and text/placeholder align top at wider widths through 1920px.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/styles.css
git commit -m "feat: add Director message placeholder section to landing page"
```

---

### Task 9: Contact banner with real institutional logos

**Depends on:** Task 1 (logo files), Task 2 (`siteContent.partnerLogos`), Task 8 (sequential file ownership). Also removes the old `route-grid` section from `HomePage`.

**Files:**
- Modify: `src/App.tsx` (`HomePage` — remove old `route-grid` section, add new contact banner as final section)
- Modify: `src/styles.css` (add `.contact-banner-landing` rules; may remove now-unused `.route-grid`/`.route-card` rules if nothing else references them — check first)

**Interfaces:**
- Consumes: `siteContent.partnerLogos`, `siteContent.contact`.

- [ ] **Step 1: Check whether `.route-grid`/`.route-card` are used elsewhere**

Run: `grep -rn "route-grid\|route-card" src/`
If the only usages are in the `HomePage` section being removed, plan to delete those CSS rules in Step 3. If used elsewhere, leave the CSS in place.

- [ ] **Step 2: Replace the old route-grid section with the contact banner**

In `src/App.tsx`, remove this block from `HomePage`:

```tsx
      <section className="section-shell route-grid">
        {siteContent.navigation.slice(1).map((item) => (
          <NavLink className="route-card glass-card" key={item.path} to={item.path}>
            <span>{item.label}</span>
            <p>{item.summary}</p>
            <ChevronRight aria-hidden="true" size={18} />
          </NavLink>
        ))}
      </section>
```

Replace it with (as the final section in `HomePage`, after the director section):

```tsx
      <section className="section-shell contact-banner-landing glass-panel">
        <div className="contact-banner-info">
          <p className="eyebrow">Get in touch</p>
          <h2>Bring a material, process, or component problem to CoE-AM.</h2>
          <address>
            <a href={`mailto:${siteContent.contact.email}`}>
              <Mail aria-hidden="true" size={18} />
              {siteContent.contact.email}
            </a>
            <span>
              <MapPin aria-hidden="true" size={18} />
              {siteContent.contact.address}
            </span>
          </address>
          <NavLink className="button primary" to="/contact">
            Contact the centre <ArrowRight aria-hidden="true" size={18} />
          </NavLink>
        </div>
        <div className="contact-banner-logos">
          {siteContent.partnerLogos.map((logo) => (
            <img key={logo.src} src={logo.src} alt={logo.alt} />
          ))}
        </div>
      </section>
```

- [ ] **Step 3: Add styles (and remove unused ones if Step 1 found no other usages)**

In `src/styles.css`, add:

```css
.contact-banner-landing {
  align-items: center;
  display: grid;
  gap: clamp(1.5rem, 4vw, 3rem);
  grid-template-columns: minmax(0, 1fr) minmax(220px, 0.5fr);
}

.contact-banner-info address {
  gap: 0.75rem;
  margin: 1.25rem 0;
}

.contact-banner-logos {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  justify-content: center;
}

.contact-banner-logos img {
  height: 64px;
  object-fit: contain;
  width: auto;
}

@media (max-width: 980px) {
  .contact-banner-landing {
    grid-template-columns: 1fr;
  }

  .contact-banner-logos {
    justify-content: flex-start;
  }
}

@media (max-width: 640px) {
  .contact-banner-logos {
    gap: 1.25rem;
  }

  .contact-banner-logos img {
    height: 48px;
  }
}
```

If Step 1 found `.route-grid`/`.route-card` unused elsewhere, delete those two rules and their `repeat(3, minmax(0, 1fr))` mobile-breakpoint reference (check the `@media (max-width: 980px)` block's `.capability-grid, .route-grid, .offering-grid, .gallery-grid` selector list — remove `.route-grid` from that list, keep the rest).

- [ ] **Step 4: Verify**

Run: `npm run test`.
Run: `npm run dev`. Confirm both logos render (real marks, not broken images), banner stacks to one column under 980px, logos stay readable/don't stretch oddly at 375px through 1920px, mailto/tel links still work, CTA button still routes to `/contact`.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/styles.css
git commit -m "feat: replace landing route grid with contact banner and institutional logos"
```

---

### Task 10: Full regression pass and responsive QA

**Depends on:** Tasks 1–9 complete.

**Files:** none (verification only).

- [ ] **Step 1: Run the full test suite**

Run: `npm run test`
Expected: all tests pass, including the new `siteContent.test.ts` and `src/lib/carousel.test.ts` assertions.

- [ ] **Step 2: Run the production build**

Run: `npm run build`
Expected: TypeScript compiles clean, Vite build succeeds, no console errors/warnings about missing assets.

- [ ] **Step 3: Full responsive walkthrough**

Run: `npm run preview`. In a real browser, resize/check at 375px (small phone), 414px (large phone), 768px (tablet portrait), 1024px (tablet landscape / small laptop), 1440px (laptop/desktop), 1920px (wide desktop), and 2560px (ultra-wide) — not just the two existing breakpoints. For each: confirm nav bar (readable/tappable, no overlap), hero carousel (no overflow, dots tappable), About section (readable line length, no orphaned single-word lines), Director section (stacks correctly below 980px), Contact banner (logos never overlap text, never distort), footer, and every inner page (`/about`, `/facilities`, `/research`, `/industry`, `/gallery`, `/contact`) for the shared nav/background regressions. Fix any issues found directly (small CSS tweaks) before proceeding.

- [ ] **Step 4: Accessibility spot-check**

Tab through the homepage keyboard-only: skip-link works, nav focus rings visible, carousel is reachable and arrow-keys/dots work via keyboard, contact banner CTA and mailto link are reachable. Confirm no focus traps outside the (unrelated) gallery lightbox.

- [ ] **Step 5: Final commit (if fixes were made in Step 3/4)**

```bash
git add -A
git commit -m "fix: responsive and accessibility polish after landing page redesign"
```

(Skip this step if no fixes were needed.)
