# Facilities Complementary Infrastructure Carousel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a continuous moving 5-second carousel featuring the three new characterization equipment photos (XRD, VSM, RAMAN) to the "Complementary Infrastructure" card on the `/facilities` page, adopting the symmetrical header layout from the other two facility cards.

**Architecture:** Convert raw equipment photos to WebP assets in `public/assets/facilities/`. Add optional `carousel?: GalleryItem[]` to `InfrastructureItem` and configure `specRows` and `carousel` for Card 3 in `siteContent.ts`. Enhance `HeroCarousel` with a customizable `advanceMs` prop (defaulting to 4000ms, using 5000ms here). Update `FacilitiesPage` in `src/App.tsx` to conditionally render the carousel inside `.facility-card-thumb` alongside `item.link`. Apply CSS to ensure the carousel fills the thumbnail slot seamlessly in both desktop and mobile viewports.

**Tech Stack:** React 18, TypeScript, CSS custom properties, Vitest, Python Pillow.

## Global Constraints

- Institutional lab-tech visual hierarchy: 6–8px radii, `backdrop-filter: blur(10px)`, no pill buttons, no heavy shadows.
- Auto-advance interval for the facilities carousel is exactly 5 seconds (5000ms).
- Carousel slide tags:
  1. `X-Ray Diffractometer (XRD)`
  2. `Vibrating Sample Magnetometer (VSM)`
  3. `Raman and PL Spectrometer (RAMAN)`
- Respect `prefers-reduced-motion` to stop rotation.
- Before every commit: `npx tsc -b` and `npm test` must both pass.

---

### Task 1: Asset Pipeline — Process Equipment Images

**Files:**
- Create: `public/assets/facilities/xrd-diffractometer.webp`
- Create: `public/assets/facilities/vsm-magnetometer.webp`
- Create: `public/assets/facilities/raman-spectrometer.webp`
- Input Source 1: `C:\Users\danis\.gemini\antigravity-ide\brain\c5be081a-c806-4d91-bedd-d1366c9dc046\.user_uploaded\media_1791354529617.jpg` (XRD)
- Input Source 2: `C:\Users\danis\.gemini\antigravity-ide\brain\c5be081a-c806-4d91-bedd-d1366c9dc046\.user_uploaded\media_1791354559016.jpg` (VSM)
- Input Source 3: `C:\Users\danis\.gemini\antigravity-ide\brain\c5be081a-c806-4d91-bedd-d1366c9dc046\.user_uploaded\media_1791354587090.jpg` (RAMAN)

**Interfaces:**
- Produces: 3 optimized WebP images in `public/assets/facilities/`.

- [ ] **Step 1: Run Python script to crop watermark and convert to WebP**

```powershell
python -c "from PIL import Image; import os; os.makedirs('public/assets/facilities', exist_ok=True); 
def process_and_save(src, dest, crop_bottom_px=0):
    im = Image.open(src)
    w, h = im.size
    if crop_bottom_px > 0:
        im = im.crop((0, 0, w, h - crop_bottom_px))
    # Resize keeping aspect ratio so longest side is max 1200px
    im.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
    im.save(dest, 'WEBP', quality=88)

process_and_save(r'C:\Users\danis\.gemini\antigravity-ide\brain\c5be081a-c806-4d91-bedd-d1366c9dc046\.user_uploaded\media_1791354529617.jpg', 'public/assets/facilities/xrd-diffractometer.webp', crop_bottom_px=85)
process_and_save(r'C:\Users\danis\.gemini\antigravity-ide\brain\c5be081a-c806-4d91-bedd-d1366c9dc046\.user_uploaded\media_1791354559016.jpg', 'public/assets/facilities/vsm-magnetometer.webp')
process_and_save(r'C:\Users\danis\.gemini\antigravity-ide\brain\c5be081a-c806-4d91-bedd-d1366c9dc046\.user_uploaded\media_1791354587090.jpg', 'public/assets/facilities/raman-spectrometer.webp')
print('Equipment photos processed successfully.')"
```

- [ ] **Step 2: Verify asset files exist and inspect sizes**

```powershell
python -c "from PIL import Image; 
for f in ['xrd-diffractometer.webp', 'vsm-magnetometer.webp', 'raman-spectrometer.webp']:
    im = Image.open(f'public/assets/facilities/{f}')
    print(f, im.size, im.format)
"
```
Expected: All 3 files are valid WEBP format.

- [ ] **Step 3: Commit assets**

```powershell
git add public/assets/facilities/*.webp
git commit -m "assets: add optimized equipment photos for XRD, VSM, and RAMAN"
```

---

### Task 2: Data Model & Test Contract (`src/content/siteContent.ts` and `src/content/siteContent.test.ts`)

**Files:**
- Modify: `src/content/siteContent.test.ts`
- Modify: `src/content/siteContent.ts`

**Interfaces:**
- Produces: `InfrastructureItem.carousel?: GalleryItem[]`, `coreInfrastructure[2].specRows`, `coreInfrastructure[2].carousel`.

- [ ] **Step 1: Add failing test for Complementary Infrastructure carousel in `src/content/siteContent.test.ts`**

In `src/content/siteContent.test.ts`:
```typescript
  it("carries 3 carousel items for the complementary infrastructure card", () => {
    const complementaryCard = siteContent.coreInfrastructure[2];
    expect(complementaryCard.carousel).toBeDefined();
    expect(complementaryCard.carousel).toHaveLength(3);

    const tags = complementaryCard.carousel?.map((item) => item.tag);
    expect(tags).toContain("X-Ray Diffractometer (XRD)");
    expect(tags).toContain("Vibrating Sample Magnetometer (VSM)");
    expect(tags).toContain("Raman and PL Spectrometer (RAMAN)");

    expect(complementaryCard.carousel?.every((item) => item.src.endsWith(".webp"))).toBe(true);
    expect(complementaryCard.specRows).toBeDefined();
    expect(complementaryCard.specRows?.length).toBeGreaterThanOrEqual(3);
  });
```

- [ ] **Step 2: Run test and verify it fails**

Run: `npx vitest run src/content/siteContent.test.ts`
Expected: FAIL because `carousel` is not defined on `coreInfrastructure[2]`.

- [ ] **Step 3: Update `src/content/siteContent.ts`**

1. Extend `InfrastructureItem`:
```typescript
export type InfrastructureItem = {
  title: string;
  eyebrow: string;
  summary: string;
  image: string;
  alt: string;
  specs: string[];
  heading?: string;
  model?: string;
  specRows?: SpecRow[];
  specGroups?: SpecGroup[];
  link?: { label: string; href: string };
  carousel?: GalleryItem[];
};
```

2. Update `coreInfrastructure[2]`:
Add `specRows`:
```typescript
      specRows: [
        {
          label: "Phase & Structural",
          value: "X-Ray Diffractometer (XRD) & Raman Spectrometer"
        },
        {
          label: "Magnetic Analysis",
          value: "Vibrating Sample Magnetometer (VSM)"
        },
        {
          label: "Microscopy & Metrology",
          value: "SEM, TEM, EBSD, and CMM 3D scanning"
        }
      ] satisfies SpecRow[],
      carousel: [
        {
          src: "/assets/facilities/xrd-diffractometer.webp",
          alt: "X-Ray Diffractometer (XRD) system",
          caption: "High-resolution X-ray diffractometer for phase identification and crystal structure analysis.",
          tag: "X-Ray Diffractometer (XRD)"
        },
        {
          src: "/assets/facilities/vsm-magnetometer.webp",
          alt: "Vibrating Sample Magnetometer (VSM) setup",
          caption: "Precision vibrating sample magnetometer for magnetic property and hysteresis characterization.",
          tag: "Vibrating Sample Magnetometer (VSM)"
        },
        {
          src: "/assets/facilities/raman-spectrometer.webp",
          alt: "Raman and Photoluminescence Spectrometer (RAMAN)",
          caption: "High-resolution confocal Raman and PL spectrometer for structural and optical analysis.",
          tag: "Raman and PL Spectrometer (RAMAN)"
        }
      ] satisfies GalleryItem[],
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```powershell
git add src/content/siteContent.ts src/content/siteContent.test.ts
git commit -m "feat(content): add carousel data and specRows to Complementary Infrastructure"
```

---

### Task 3: HeroCarousel Parameter Enhancement (`src/components/HeroCarousel.tsx`)

**Files:**
- Modify: `src/components/HeroCarousel.tsx`

**Interfaces:**
- Consumes: `advanceMs?: number` prop (default `4000`).

- [ ] **Step 1: Update `HeroCarousel.tsx` with `advanceMs` parameter**

```typescript
export function HeroCarousel({
  items,
  advanceMs = 4000
}: {
  items: GalleryItem[];
  advanceMs?: number;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || prefersReducedMotion() || items.length <= 1) {
      return;
    }
    const id = window.setInterval(() => {
      setIndex((current) => nextIndex(current, items.length));
    }, advanceMs);
    return () => window.clearInterval(id);
  }, [paused, items.length, advanceMs]);
```

- [ ] **Step 2: Run tests and typecheck**

Run: `npx tsc -b; npm test`
Expected: PASS with 0 errors.

- [ ] **Step 3: Commit**

```powershell
git add src/components/HeroCarousel.tsx
git commit -m "feat(carousel): support configurable advanceMs prop in HeroCarousel"
```

---

### Task 4: UI & Styling Integration (`src/App.tsx` & `src/styles.css`)

**Files:**
- Modify: `src/App.tsx:197-230`
- Modify: `src/styles.css`

**Interfaces:**
- Renders `HeroCarousel` with `advanceMs={5000}` inside `facility-card-thumb` when `item.carousel` exists.
- Maintains `item.link` above the rule.

- [ ] **Step 1: Update `FacilitiesPage` card head in `src/App.tsx`**

```tsx
            {item.heading ? (
              <>
                <div className="facility-card-head">
                  <div className="facility-card-intro">
                    <p className="facility-card-heading">{item.heading}</p>
                    {item.model && <p className="facility-card-model">{item.model}</p>}
                    {item.link && (
                      <a className="facility-card-link" href={item.link.href} target="_blank" rel="noreferrer">
                        <ExternalLink aria-hidden="true" size={15} />
                        {item.link.label}
                      </a>
                    )}
                    <span className="rule" aria-hidden="true" />
                    {item.specRows && item.specRows.length > 0 && (
                      <ul className="facility-card-head-specs">
                        {item.specRows.map((row) => (
                          <li key={row.label}>
                            <strong>{row.label}:</strong> {row.value}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="facility-card-thumb">
                    {item.carousel ? (
                      <HeroCarousel items={item.carousel} advanceMs={5000} />
                    ) : (
                      <img src={item.image} alt={item.alt} loading="lazy" />
                    )}
                  </div>
                </div>
                <div className="facility-card-body">
...
```

- [ ] **Step 2: Update CSS in `src/styles.css`**

Ensure `.facility-card-thumb .hero-carousel` fills the thumbnail neatly:
```css
.facility-card-thumb .hero-carousel {
  border-radius: 8px;
  height: 100%;
  overflow: hidden;
  width: 100%;
}

.facility-card-thumb .hero-carousel-frame {
  height: 100%;
  width: 100%;
}

.facility-card-thumb .hero-carousel-slide img {
  height: 100%;
  object-fit: cover;
  width: 100%;
}
```

- [ ] **Step 3: Run tests and build**

Run: `npx tsc -b; npm test`
Expected: 26 passed tests, zero errors.

- [ ] **Step 4: Commit**

```powershell
git add src/App.tsx src/styles.css
git commit -m "feat(facilities): render 5s equipment carousel in Complementary Infrastructure card"
```

---

### Task 5: End-to-End Verification

**Files:**
- Verification only

- [ ] **Step 1: Run comprehensive tests**
```powershell
npm test
```
Expected: All tests pass.

- [ ] **Step 2: Run production build**
```powershell
npm run build
```
Expected: Clean production build.
