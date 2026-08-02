# Centre of Excellence in Advanced Manufacturing (TIET-TAU)

This repository contains the source code for the website of the **Centre of Excellence in Advanced Manufacturing (CoE-AM)**, a collaborative initiative between the **Thapar Institute of Engineering and Technology (TIET)**, Patiala, India, and **Tel Aviv University (TAU)**, Israel.

The website is a modern, responsive, multipage Single Page Application (SPA) built with React, TypeScript, Vite, and Vanilla CSS, featuring a professional institutional design system with toned-down frosted surfaces.

---

## 🎯 Project Aim & Website Purpose

The primary goal of this website is to showcase the state-of-the-art facilities, applied research thrusts, industry offerings, and academic-industrial collaboration routes of the TIET-TAU Centre of Excellence.

### Key Content Objectives
*   **Highlight Unique Capabilities:** Showcase India's first **InssTek Directed Energy Deposition (DED) MX-Fab3 5-axis system** and high-precision CNC Wire EDM.
*   **Establish Research and Industry Context:** Document specific research thrusts and industry collaboration pathways (prototyping, training, consultancy) using factual, brochure-backed information.
*   **Provide Visual Evidence:** Display high-quality, optimized photos of real machinery, process setups, and fabricated components directly from the Patiala facility.
*   **Facilitate Collaboration:** Provide direct pathways for researchers, industry partners, defense, healthcare, and innovators to connect via a central email address: `coeam@thapar.edu`.

---

## 🛠️ Technology Stack

*   **Framework:** React 18.3.1
*   **Routing:** React Router v7 (Single Page Application configuration)
*   **Build Tool:** Vite 5.4.21
*   **Language:** TypeScript 5.9.2
*   **Icons:** Lucide React 0.468.0
*   **Styling:** Vanilla CSS (pure CSS custom properties, no styling frameworks)
*   **Testing:** Vitest 2.1.9 (for unit and content contract validation)
*   **Asset Processing:** Python 3 + Pillow (PIL) for image optimization

---

## 📂 Directory Structure

```text
AM-TIETTAU/
├── .git/                      # Git repository configurations
├── .vercel/                   # Vercel deployment link configuration
├── dist/                      # Production build output (git ignored)
├── docs/                      # Project planning and specification documents
│   └── superpowers/           # Agentic specification & history files
│       ├── plans/             # Step-by-step implementation plans
│       └── specs/             # Core design specifications & feedback revisions
├── node_modules/              # Dependency files (git ignored)
├── public/                    # Static assets
│   ├── assets/                # Optimized WebP assets (e.g., machinery photos)
│   └── favicon.svg            # Site icon
├── resources and photos/      # Original, uncompressed high-res images (git ignored)
├── scripts/                   # Auxiliary automation scripts
│   └── prepare-assets.py      # Python script to compress and optimize images
├── src/                       # Frontend source files
│   ├── components/            # SiteNav (hamburger) and HeroCarousel
│   ├── content/               # Factual content files and test suites
│   │   ├── siteContent.ts     # Central source of truth for text copy
│   │   └── siteContent.test.ts # Vitest assertions for brochure claims & routing
│   ├── lib/                   # Pure helpers (carousel index math)
│   ├── App.tsx                # Main SPA components, layout, and pages
│   ├── main.tsx               # Client entry point (renders App with BrowserRouter)
│   └── styles.css             # Unified styling system with custom variables
├── tsconfig.json              # TypeScript compilation configuration
├── vercel.json                # Vercel configuration for SPA URL rewrites
└── vite.config.ts             # Vite configuration with Vitest setup
```

---

## 🚀 Deployment & Branching

### 1. Git Repository
*   **Origin Remote:** `https://github.com/Danish2op/AM-TIET-TAU.git`
*   **Deployment Branch:** `main` (all production changes should be merged into the `main` branch)

### 2. Hosting & Infrastructure
*   **Hosting Provider:** **Vercel**
*   **Project Name:** `am-tiet-tau`
*   **Deployment Method:** Deployed manually using the Vercel CLI (under account/team `danish2op`).
*   **Vercel Project IDs:**
    *   `projectId`: `prj_mB1dS8kumCvfTVd3FPHt1qH9gnC6`
    *   `orgId`: `team_Yp7vOAHGZZrNcZywCGUDxcpW`

### 3. SPA Rewrite Configuration
Since the project uses React Router for client-side navigation, Vercel is configured with rewrites in `vercel.json` to ensure direct page refreshes (e.g., accessing `/facilities` directly) resolve to the root index:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 🖥️ Developer Commands

Below are the primary commands for running, building, testing, and deploying the application:

### Installing Dependencies
```bash
npm install
```

### Running Locally (Development Mode)
Starts the Vite dev server with hot module replacement:
```bash
npm run dev
```

### Running Tests
Launches Vitest to execute the unit and content contract validation tests:
```bash
npm run test
```

### Building for Production
Compiles TypeScript assets and bundles the project using Vite:
```bash
npm run build
```

### Previewing the Production Build
Locally boots up a static preview server using the compiled assets in `/dist`:
```bash
npm run preview
```

### Optimizing Images (Asset Script)
If new high-resolution images are added to `/resources and photos/`, you can use the Python script to downscale, auto-rotate, and convert them to optimized WebP format:
```bash
python scripts/prepare-assets.py
```
*(Requires `Pillow` library: `pip install pillow`)*

### Deploying to Production (Vercel CLI)
Make sure you are logged in to the correct Vercel account, then run:
```bash
vercel deploy --prod --yes --logs
```

---

## 🎨 Visual Identity & Styling Guidelines

Developers and agents working on the codebase should adhere to the following visual rules to maintain design consistency:

*   **Color Palette:** Built on deep navy, steel blue, technical blue, white, cool gray, and a subtle TIET red accent.
*   **Typography:** Modern, clean sans-serif styles using standard browser fonts with fallback options (preferring system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif).
*   **Surface Treatment:** Toned-down frosted surfaces (`backdrop-filter: blur(10px)`, 8-10px radii, near-opaque fills) for a professional institutional feel rather than a modern-startup one.
*   **Background:** A fixed two-layer engineering system — brushed-steel micro-grain plus large machining/turning arcs — held at or below 6% opacity so it never competes with content.
*   **Contrast & Accessibility:**
    *   Maintain high text contrast ratios (light text over dark navy glass elements).
    *   Use correct HTML5 semantic tags (`header`, `main`, `footer`, `section`, `article`, `address`).
    *   Keep the keyboard navigation skip-link intact (`.skip-link`).
*   **No Placeholders or AI-slop:**
    *   Never use generic blue-glow AI visuals, fake dashboards, decorative orbs, or stock photos.
    *   Use actual facility pictures stored in `/public/assets` which are prepared using `scripts/prepare-assets.py`.
