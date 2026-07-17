# AM TIET TAU Multipage Glass Revision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the current one-page draft into a modern multipage website with restrained glassmorphism and smaller contextual image usage.

**Architecture:** Add React Router, a shared layout, route-specific page components, and content-driven page metadata. Use Vercel rewrites so direct route refreshes resolve to `index.html`.

**Tech Stack:** Vite, React, TypeScript, React Router, CSS, Vitest, Vercel CLI.

## Global Constraints

- Use exact brochure wording: "Centre of Excellence in Advanced Manufacturing".
- Use brochure-backed claims where available.
- Divide the site into pages: Home, About, Facilities, Research, Industry, Gallery, Contact.
- Use restrained glassmorphism and modern blue palettes.
- Keep images smaller, contextual, and interactive where useful.
- Avoid fake dashboards, neon sci-fi, decorative orbs, stock imagery, and AI-generated machinery.
- Deploy and manage Vercel from CLI only.

---

### Task 1: Route Content Contract

**Files:**
- Modify: `src/content/siteContent.test.ts`
- Modify: `src/content/siteContent.ts`

**Steps:**
- [ ] Add a failing test that expects route entries for `/`, `/about`, `/facilities`, `/research`, `/industry`, `/gallery`, and `/contact`.
- [ ] Run `npm test` and verify failure because route metadata is missing.
- [ ] Add route metadata, gallery image metadata, and page summaries.
- [ ] Run `npm test` and verify the content contract passes.

### Task 2: Routed UI

**Files:**
- Modify: `package.json`
- Modify: `src/main.tsx`
- Replace: `src/App.tsx`
- Add: `vercel.json`

**Steps:**
- [ ] Install `react-router-dom`.
- [ ] Wrap the app with `BrowserRouter`.
- [ ] Create shared header/nav/footer and route pages.
- [ ] Add Vercel rewrite from `/(.*)` to `/index.html`.
- [ ] Run tests and build.

### Task 3: Modern Glass Visual System

**Files:**
- Replace: `src/styles.css`

**Steps:**
- [ ] Replace old serif-heavy layout with modern sans typography.
- [ ] Add frosted nav, glass panels, compact image cards, route hero sections, and smaller gallery grid.
- [ ] Add hover/focus states and reduced-motion handling.
- [ ] Verify desktop and mobile screenshots.

### Task 4: Deploy

**Files:**
- No new source files expected.

**Steps:**
- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Run browser QA for local or production route refreshes.
- [ ] Commit, push, deploy with `vercel deploy --prod --yes --logs`.
- [ ] Inspect production deployment and verify live routes.

