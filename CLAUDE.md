# CLAUDE.md — Agent & Developer Guide

Quick-reference instructions for building, testing, and developing the **Centre of Excellence in Advanced Manufacturing (TIET-TAU)** website.

---

## 🛠️ Build & Development Commands

### Node Environment
*   **Install Dependencies:** `npm install`
*   **Run Development Server:** `npm run dev`
*   **Run Vitest Suite:** `npm run test`
*   **Build Production Bundle:** `npm run build`
*   **Preview Build Locally:** `npm run preview`

### Asset Pipeline
*   **Optimize and Prepare Assets:** `python scripts/prepare-assets.py`  
    *(Converts raw photos in `resources and photos/` to optimized `.webp` format in `public/assets/` using Python's PIL/Pillow).*

### Deployment (Vercel CLI)
*   **Production Deploy:** `vercel deploy --prod --yes --logs`

---

## 🏗️ Architecture & Core Components

This is a multipage client-routed Single Page Application (SPA) leveraging:
*   **React Router v7** for clean path routing (defined in `src/App.tsx`).
*   **`siteContent.ts`** as the single source of truth for text copy, specifications, names, and team details. Any brochure claim modification must be done here.
*   **`styles.css`** for all structural and aesthetic layout details.
*   **Vercel SPA Rewrites** enabled in `vercel.json` to avoid 404 errors on direct subpage route requests.

### Route Map
*   `/` — Home: About section with image carousel, director message, contact banner.
*   `/facilities` — Facilities: DED and CNC Wire EDM technical specs.
*   `/research` — Research: Applied research areas and material systems.
*   `/industry` — Industry: Development, training, prototyping, and consultancy offerings.
*   `/gallery` — Gallery: Clean image grid with responsive keyboard-accessible lightbox.
*   `/contact` — Contact: Primary mailbox and physical location details.

---

## 🎨 Code Style & Quality Guidelines

*   **TypeScript:** Enforce explicit type annotations where beneficial. Define matching TS interfaces/types (e.g., `InfrastructureItem`, `NavigationItem`) in `src/content/siteContent.ts` for clean structural integrity.
*   **React Routing:** Use `<NavLink>` from `react-router-dom` for application navigation. Set `end` parameter for the root `/` path to prevent active state collision.
*   **Styling:** Write clean, vanilla CSS using predefined CSS variables in `src/styles.css`. Maintain the lab-tech visual hierarchy:
    *   Toned-down glass surfaces: `backdrop-filter: blur(10px)`, 8-10px radii, near-opaque white fills. The register is professional/institutional, not modern-startup — avoid large radii, pill buttons, and heavy shadows.
    *   Background is a fixed two-layer materials/mechanical system (brushed-steel grain + machining arcs) on `body::before`/`body::after`, kept at or below 6% opacity.
    *   No ad-hoc utility styling frameworks (do not introduce TailwindCSS or bootstrap unless requested).
*   **Accessibility (a11y):**
    *   Every interactive component/link must have a readable focus state and outline.
    *   Maintain the primary skip-to-content anchor (`.skip-link`) pointing to `#main`.
    *   Always supply meaningful, descriptive `alt` tags to `<img>` components. Do not use generic names.
    *   Keep the gallery lightbox keyboard-trapped and dismissible with the `Escape` key.
    *   Mobile navigation uses an accessible hamburger (`aria-expanded`, `aria-controls`, Escape to close, focus trap, closes on route change). Never hide nav links without a visible control.
*   **Brochure Compliance:** Never edit or invent new research claims, leadership credentials, or email details without validating they conform to existing tests in `src/content/siteContent.test.ts`.
