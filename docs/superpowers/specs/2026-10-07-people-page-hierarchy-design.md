# People Page Hierarchy & Multi-Panel Roster — Design Spec

Date: 2026-10-07  
Status: Approved by user, ready for implementation planning  

---

## 1. Goal

Restructure the `/people` page of the **Centre of Excellence in Advanced Manufacturing (TIET-TAU)** website from a single flat grid into four distinct vertical panels reflecting institutional roles, senior hierarchy, and upcoming research cohorts.

### Panel Breakdown

1. **Panel 1 — Core Leadership & Technical Staff (No Section Heading):**
   * Prominent, larger cards highlighting the core centre personnel.
   * Exactly 6 members in specified order:
     1. **Prof. Noam Eliaz** (Founding Director & Chair Professor, CoE-AM | Tel Aviv University)
     2. **Prof. Bhaskar Chandra Mohanty** (Faculty, DPMS | Thapar Institute of Engineering & Technology)
     3. **Dr. Vineet Srivastava** (Associate Professor & Joint Director, CoE-AM | Thapar Institute of Engineering & Technology)
     4. **Dr. Malkeet Singh** (Assistant Professor / Scientist (PI) | Thapar Institute of Engineering & Technology)
     5. **Mr. Dileep Kumar** (3D Printer Technician)
     6. **Mr. Jagjit Singh** (Wire EDM Technician)
2. **Panel 2 — Affiliated Researchers (Heading: "Affiliated Researchers"):**
   * Retains the standard compact grid for all remaining faculty, principal investigators, co-investigators, and international collaborators currently listed on the website.
3. **Panel 3 — Postdocs and PhD Scholars (Heading: "Postdocs and PhD Scholars"):**
   * Structured placeholder panel featuring 3 elegant ghost / silhouette skeleton cards for upcoming appointments.
4. **Panel 4 — Undergraduate and Masters Students (Heading: "Undergraduate and Masters Students"):**
   * Structured placeholder panel featuring 3 ghost / silhouette skeleton cards for future student researchers.

---

## 2. Image Assets Pipeline

Process the two user-provided high-resolution staff photos:
* Source: `C:\Users\danis\.gemini\antigravity-ide\brain\c5be081a-c806-4d91-bedd-d1366c9dc046\.user_uploaded\media_1791351826162.jpg` (Dileep Kumar)
* Source: `C:\Users\danis\.gemini\antigravity-ide\brain\c5be081a-c806-4d91-bedd-d1366c9dc046\.user_uploaded\media_1791351830824.jpg` (Jagjit Singh)
* Destination WebP assets:
  * `public/assets/people/dileep-kumar.webp` (480×480 square, center-cropped, WebP format)
  * `public/assets/people/jagjit-singh.webp` (480×480 square, center-cropped, WebP format)

---

## 3. Data Model (`src/content/siteContent.ts`)

### Types
```typescript
export type TeamMember = {
  name: string;
  role: string;
  affiliation?: string;
  photo: string;
  photoAlt: string;
  linkedin?: string;
};

export type PeopleSectionPlaceholder = {
  count: number;
  badgeText: string;
  subtext: string;
};

export type PeopleSection = {
  id: string;
  title?: string;
  isFeatured?: boolean;
  members: TeamMember[];
  placeholder?: PeopleSectionPlaceholder;
};
```

### Data Arrays
* `siteContent.peopleSections: PeopleSection[]`:
  * `core`: 6 members, `isFeatured: true`, no `title`.
  * `affiliated`: 24 members, `title: "Affiliated Researchers"`.
  * `postdocs-phd`: 0 members, `title: "Postdocs and PhD Scholars"`, `placeholder` with count 3.
  * `students`: 0 members, `title: "Undergraduate and Masters Students"`, `placeholder` with count 3.
* Maintain `siteContent.people` as a flattened getter or combined array for backwards compatibility with any seed snapshot and existing tests.

---

## 4. UI & Layout Implementation

### Component Changes (`src/App.tsx`)
* Replace single `.people-grid` section in `PeoplePage` with a loop over `siteContent.peopleSections`.
* Render `.people-section-header` only when `section.title` is defined.
* Render member cards using `.person-card--featured` when `section.isFeatured` is true.
* In both the card and the modal dialog:
  * Omit the affiliation element if `member.affiliation` is undefined.
  * Omit the LinkedIn button if `member.linkedin` is undefined or empty.
* Render placeholder cards with `.person-card--skeleton` when `section.placeholder` is present.

### CSS Rules (`src/styles.css`)
* `.people-sections-container`: Vertical flow with proper section spacing.
* `.people-section-header`: Clean institutional heading with hairline underline rule.
* `.people-grid--featured`: Responsive 3-column grid (`minmax(280px, 1fr)`).
* `.person-card--featured`:
  * Photo size `132px × 132px` (compared to standard `108px`).
  * Name in `var(--font-serif)` at `1.25rem`.
  * Role in `var(--accent)` at `0.82rem`.
  * Generous padding: `2.5rem 1.5rem 1.75rem`.
* `.person-card--skeleton`:
  * Frosted silhouette circle avatar with subtle ambient shimmer animation.
  * Non-interactive (no pointer cursor, no hover translateY).
  * Institutional badge chip and quiet explanatory note.

---

## 5. Accessibility (a11y) & Visual Integrity

* All images provide explicit descriptive `alt` tags.
* Skeleton elements have `aria-hidden="true"` and the section provides an accessible announcement.
* Focus states and keyboard traps in `person-modal` remain intact.
* Escape dismisses the modal.

---

## 6. Testing & Quality Verification

* `src/content/siteContent.test.ts`:
  * Validates `peopleSections` has 4 panels.
  * Validates Panel 1 has no title, is featured, and contains the 6 members in exact order.
  * Validates Panel 2 contains the remaining members.
  * Validates Panels 3 and 4 have their placeholder configuration.
  * Validates all member photos point to existing asset paths.
* `npm test`: All test suites pass.
* `npm run build`: Zero TypeScript errors, clean production bundle.
