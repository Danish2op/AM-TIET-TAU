# Facilities Complementary Infrastructure Carousel — Design Spec

Date: 2026-10-07  
Status: Approved by user, ready for implementation planning  

---

## 1. Goal

Integrate a continuous moving 5-second carousel featuring three characterization systems into the "Complementary Infrastructure" card on the `/facilities` page of the **Centre of Excellence in Advanced Manufacturing (TIET-TAU)** website:
1. **X-Ray Diffractometer (XRD)**
2. **Vibrating Sample Magnetometer (VSM)**
3. **Raman and PL Spectrometer (RAMAN)**

The card header will mirror the symmetrical two-column layout of the DED and Wire EDM cards (intro and specs on the left, media thumbnail on the right), with full responsive behavior.

---

## 2. Image Asset Processing

Process the three user-provided high-resolution equipment photos:
* Source 1: `C:\Users\danis\.gemini\antigravity-ide\brain\c5be081a-c806-4d91-bedd-d1366c9dc046\.user_uploaded\media_1791354529617.jpg` (SmartLab XRD)
  * Crop bottom ~8% (85px) to remove the "Samsung Triple camera / Galaxy M30" watermark cleanly without clipping machine components.
  * Destination: `public/assets/facilities/xrd-diffractometer.webp` (WebP, quality 88).
* Source 2: `C:\Users\danis\.gemini\antigravity-ide\brain\c5be081a-c806-4d91-bedd-d1366c9dc046\.user_uploaded\media_1791354559016.jpg` (Lake Shore VSM)
  * Destination: `public/assets/facilities/vsm-magnetometer.webp` (WebP, quality 88).
* Source 3: `C:\Users\danis\.gemini\antigravity-ide\brain\c5be081a-c806-4d91-bedd-d1366c9dc046\.user_uploaded\media_1791354587090.jpg` (HORIBA Raman & PL)
  * Destination: `public/assets/facilities/raman-spectrometer.webp` (WebP, quality 88).

---

## 3. Data Model Changes (`src/content/siteContent.ts`)

### Types
Extend `InfrastructureItem`:
```typescript
export type InfrastructureItem = {
  // Existing properties...
  carousel?: GalleryItem[];
};
```

### Content Configuration
Add `specRows` and `carousel` to the third item ("Complementary Infrastructure") in `siteContent.coreInfrastructure`:
* **`specRows`**:
  * Label: `"Phase & Structural"`, Value: `"X-Ray Diffractometer (XRD) & Raman Spectrometer"`
  * Label: `"Magnetic Analysis"`, Value: `"Vibrating Sample Magnetometer (VSM)"`
  * Label: `"Microscopy & Metrology"`, Value: `"SEM, TEM, EBSD, and CMM 3D scanning"`
* **`carousel`**:
  * Slide 1:
    * `src: "/assets/facilities/xrd-diffractometer.webp"`
    * `alt: "X-Ray Diffractometer (XRD) system"`
    * `caption: "High-resolution X-ray diffractometer for phase identification and crystal structure analysis."`
    * `tag: "X-Ray Diffractometer (XRD)"`
  * Slide 2:
    * `src: "/assets/facilities/vsm-magnetometer.webp"`
    * `alt: "Vibrating Sample Magnetometer (VSM) setup"`
    * `caption: "Precision vibrating sample magnetometer for magnetic property and hysteresis characterization."`
    * `tag: "Vibrating Sample Magnetometer (VSM)"`
  * Slide 3:
    * `src: "/assets/facilities/raman-spectrometer.webp"`
    * `alt: "Raman and Photoluminescence Spectrometer (RAMAN)"`
    * `caption: "High-resolution confocal Raman and PL spectrometer for structural and optical analysis."`
    * `tag: "Raman and PL Spectrometer (RAMAN)"`

---

## 4. UI Component Architecture

### 1. `HeroCarousel` Component (`src/components/HeroCarousel.tsx`)
Support an optional `advanceMs` prop:
```typescript
export function HeroCarousel({ 
  items, 
  advanceMs = 4000 
}: { 
  items: GalleryItem[]; 
  advanceMs?: number; 
})
```
Default remains 4000ms for home page usage; passes 5000ms for the 5-second facility rotation.

### 2. Facilities Card Header (`src/App.tsx`)
In `FacilitiesPage`, unify the card head layout:
* Renders `item.heading`, `item.model`, and optional `item.link` on the left.
* Renders `item.specRows` below the hairline rule.
* In the right thumbnail slot (`.facility-card-thumb`), conditionally renders `HeroCarousel` if `item.carousel` exists; otherwise renders a static `<img>`.

---

## 5. Styling & Responsiveness (`src/styles.css`)

* Ensure `.facility-card-thumb .hero-carousel` fills the thumbnail frame:
  * `width: 100%`, `height: 100%`, `border-radius: 8px`, `overflow: hidden`.
* Slide images use `object-fit: cover`.
* Responsive rules: on tablet/mobile screens, `.facility-card-thumb` collapses from `340px` to a full-width responsive banner, maintaining aspect ratio.
* Respect `prefers-reduced-motion` to stop auto-rotation for users with motion sensitivity.

---

## 6. Testing & Quality Verification

* `src/content/siteContent.test.ts`:
  * Verifies `coreInfrastructure[2].carousel` has 3 slides with non-empty tags and WebP image paths.
* `npm test`: All test suites pass.
* `npm run build`: Zero TypeScript compilation errors, clean production bundle.
