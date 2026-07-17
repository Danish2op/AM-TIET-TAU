# AM TIET TAU Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a first-draft Vercel website for the TIET-TAU Centre of Excellence in Advanced Manufacturing.

**Architecture:** Use a Vite React single-page site with structured content data, optimized local assets, and static deployment through Vercel. Keep the homepage evidence-led: real facility photos, technical claims, compact capability sections, and direct collaboration/contact paths.

**Tech Stack:** Vite, React, TypeScript, CSS, Vitest, Vercel CLI.

## Global Constraints

- Use exact brochure wording: "Centre of Excellence in Advanced Manufacturing".
- Use brochure-backed claims where available.
- Primary color direction is blue and related palettes.
- Avoid AI-slop patterns: fake dashboards, glowing orbs, generic futuristic graphics, stock imagery, decorative carousels, and vague filler copy.
- Use local resource photos thoughtfully and optimize them for the web.
- Deploy and manage Vercel from CLI only.

---

### Task 1: Project Scaffold And Content Contract

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `src/content/siteContent.ts`
- Create: `src/content/siteContent.test.ts`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`
- Create: `vite.config.ts`
- Create: `tsconfig.json`

**Steps:**
- [ ] Create a Vite React TypeScript scaffold.
- [ ] Write failing Vitest tests that assert the centre name, DED claim, Wire EDM tolerance, and primary contact email.
- [ ] Run `npm test -- --run` and confirm the tests fail because content is not implemented.
- [ ] Implement `siteContent.ts` and simple app rendering.
- [ ] Run `npm test -- --run` and confirm tests pass.

### Task 2: Asset Optimization

**Files:**
- Create: `public/assets/`
- Create: `scripts/prepare-assets.py`

**Steps:**
- [ ] Convert selected local photos to compressed WebP/JPEG assets.
- [ ] Correct orientation for sideways demo photos if used.
- [ ] Keep asset names semantic: `ded-system.webp`, `wire-edm.webp`, `ded-process.webp`, `printed-component.webp`, `sample-coupons.webp`.
- [ ] Verify generated assets exist and are under reasonable web size.

### Task 3: Homepage Implementation

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Modify: `src/content/siteContent.ts`

**Steps:**
- [ ] Implement hero, capability strip, about, infrastructure, research, industry offerings, leadership, and contact.
- [ ] Use real images in meaningful sections.
- [ ] Use accessible headings, alt text, focus states, and responsive layout.
- [ ] Avoid card-in-card layouts and heavy decorative effects.

### Task 4: Build, Local QA, GitHub, And Vercel

**Files:**
- Modify as needed after build or QA.

**Steps:**
- [ ] Run `npm run build`.
- [ ] Run responsive/static checks.
- [ ] Commit changes and push to `https://github.com/Danish2op/AM-TIET-TAU.git`.
- [ ] Deploy with Vercel CLI under account `danish2op`.
- [ ] Inspect Vercel deployment/logs from CLI and report the production URL.

