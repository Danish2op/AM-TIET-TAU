# People Page Hierarchy & Multi-Panel Roster Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the `/people` page into four distinct vertical panels (Core Team without heading featuring prominent cards, Affiliated Researchers with current cards, and Postdocs/PhD and Students with elegant ghost skeleton placeholders) and integrate the two new lab technicians with processed WebP photos.

**Architecture:** Extend `siteContent.ts` with `PeopleSection` and `PeopleSectionPlaceholder` types and a `peopleSections` data array while keeping `siteContent.people` backward-compatible. Refactor `PeoplePage` in `src/App.tsx` to render the multi-section layout and handle optional affiliation/LinkedIn attributes cleanly in both cards and modals. Add responsive CSS for featured cards, section dividers, and frosted skeleton placeholders in `src/styles.css`.

**Tech Stack:** React 18, TypeScript, CSS custom properties, Vitest, Python Pillow (for asset optimization).

## Global Constraints

- Institutional lab-tech visual hierarchy: 6–8px radii, `backdrop-filter: blur(10px)`, no pill buttons, no heavy shadows.
- Panel 1 has NO section heading; Panel 2 heading is "Affiliated Researchers"; Panel 3 is "Postdocs and PhD Scholars"; Panel 4 is "Undergraduate and Masters Students".
- Panel 1 has exactly 6 members in specified order:
  1. Prof. Noam Eliaz
  2. Prof. Bhaskar Chandra Mohanty
  3. Dr. Vineet Srivastava
  4. Dr. Malkeet Singh
  5. Mr. Dileep Kumar
  6. Mr. Jagjit Singh
- For Mr. Dileep Kumar and Mr. Jagjit Singh, do not display affiliation or LinkedIn button/placeholder.
- Maintain existing keyboard trap, focus states, and Escape-key dismiss on the modal.
- Skeletons are non-interactive (`aria-hidden="true"`, no pointer cursor).
- Before every commit: `npx tsc -b` and `npm test` must both pass.

---

### Task 1: Asset Pipeline — Process Technician Photos

**Files:**
- Create: `public/assets/people/dileep-kumar.webp`
- Create: `public/assets/people/jagjit-singh.webp`
- Input Source 1: `C:\Users\danis\.gemini\antigravity-ide\brain\c5be081a-c806-4d91-bedd-d1366c9dc046\.user_uploaded\media_1791351826162.jpg` (Dileep Kumar)
- Input Source 2: `C:\Users\danis\.gemini\antigravity-ide\brain\c5be081a-c806-4d91-bedd-d1366c9dc046\.user_uploaded\media_1791351830824.jpg` (Jagjit Singh)

**Interfaces:**
- Produces: Two 480×480 square WebP files in `public/assets/people/`.

- [ ] **Step 1: Run Python Pillow script to center-crop and convert photos to 480x480 WebP**

Run command in shell:
```powershell
python -c "from PIL import Image; import os; os.makedirs('public/assets/people', exist_ok=True); 
def crop_and_save(src, dest):
    im = Image.open(src)
    w, h = im.size
    min_dim = min(w, h)
    left = (w - min_dim) // 2
    top = (h - min_dim) // 2
    im_cropped = im.crop((left, top, left + min_dim, top + min_dim)).resize((480, 480), Image.Resampling.LANCZOS)
    im_cropped.save(dest, 'WEBP', quality=88)

crop_and_save(r'C:\Users\danis\.gemini\antigravity-ide\brain\c5be081a-c806-4d91-bedd-d1366c9dc046\.user_uploaded\media_1791351826162.jpg', 'public/assets/people/dileep-kumar.webp')
crop_and_save(r'C:\Users\danis\.gemini\antigravity-ide\brain\c5be081a-c806-4d91-bedd-d1366c9dc046\.user_uploaded\media_1791351830824.jpg', 'public/assets/people/jagjit-singh.webp')
print('Images processed successfully.')"
```

- [ ] **Step 2: Verify asset files exist and inspect dimensions**

Run command:
```powershell
python -c "from PIL import Image; print(Image.open('public/assets/people/dileep-kumar.webp').size); print(Image.open('public/assets/people/jagjit-singh.webp').size)"
```
Expected: `(480, 480)` for both.

- [ ] **Step 3: Commit assets**

```powershell
git add public/assets/people/dileep-kumar.webp public/assets/people/jagjit-singh.webp
git commit -m "assets: add optimized portraits for Dileep Kumar and Jagjit Singh"
```

---

### Task 2: Data Model & Test Contract (`src/content/siteContent.ts` and `src/content/siteContent.test.ts`)

**Files:**
- Modify: `src/content/siteContent.test.ts`
- Modify: `src/content/siteContent.ts`

**Interfaces:**
- Produces:
  - `TeamMember` type with optional `affiliation?: string` and optional `linkedin?: string`.
  - `PeopleSectionPlaceholder` and `PeopleSection` types.
  - `siteContent.peopleSections: PeopleSection[]`.
  - `siteContent.people: TeamMember[]` (maintains flat array of all 30 members).

- [ ] **Step 1: Add failing tests for `peopleSections` in `src/content/siteContent.test.ts`**

Update `src/content/siteContent.test.ts` under the people describe block:
```typescript
  it("structures people into four hierarchical panels", () => {
    expect(siteContent.peopleSections).toHaveLength(4);

    const [panel1, panel2, panel3, panel4] = siteContent.peopleSections;

    // Panel 1: Core Leadership & Technical Staff
    expect(panel1.id).toBe("core");
    expect(panel1.title).toBeUndefined();
    expect(panel1.isFeatured).toBe(true);
    expect(panel1.members).toHaveLength(6);
    expect(panel1.members[0].name).toBe("Prof. Noam Eliaz");
    expect(panel1.members[1].name).toBe("Prof. Bhaskar Chandra Mohanty");
    expect(panel1.members[2].name).toBe("Dr. Vineet Srivastava");
    expect(panel1.members[3].name).toBe("Dr. Malkeet Singh");
    expect(panel1.members[4].name).toBe("Mr. Dileep Kumar");
    expect(panel1.members[4].role).toBe("3D Printer Technician");
    expect(panel1.members[4].affiliation).toBeUndefined();
    expect(panel1.members[4].linkedin).toBeUndefined();
    expect(panel1.members[5].name).toBe("Mr. Jagjit Singh");
    expect(panel1.members[5].role).toBe("Wire EDM Technician");
    expect(panel1.members[5].affiliation).toBeUndefined();
    expect(panel1.members[5].linkedin).toBeUndefined();

    // Panel 2: Affiliated Researchers
    expect(panel2.id).toBe("affiliated");
    expect(panel2.title).toBe("Affiliated Researchers");
    expect(panel2.members.length).toBeGreaterThan(20);

    // Panel 3: Postdocs and PhD Scholars
    expect(panel3.id).toBe("postdocs-phd");
    expect(panel3.title).toBe("Postdocs and PhD Scholars");
    expect(panel3.members).toHaveLength(0);
    expect(panel3.placeholder).toBeDefined();
    expect(panel3.placeholder?.count).toBe(3);

    // Panel 4: Undergraduate and Masters Students
    expect(panel4.id).toBe("students");
    expect(panel4.title).toBe("Undergraduate and Masters Students");
    expect(panel4.members).toHaveLength(0);
    expect(panel4.placeholder).toBeDefined();
    expect(panel4.placeholder?.count).toBe(3);

    // Backward-compatibility: siteContent.people contains all 30 members
    expect(siteContent.people).toHaveLength(30);
  });
```

- [ ] **Step 2: Run test and verify it fails**

Run: `npm test`
Expected: FAIL because `peopleSections` is not defined on `siteContent`.

- [ ] **Step 3: Update `src/content/siteContent.ts` with types and `peopleSections`**

In `src/content/siteContent.ts`:
1. Update `TeamMember`:
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
2. Define the core members in `siteContent`:
- Prof. Noam Eliaz
- Prof. Bhaskar Chandra Mohanty (name: "Prof. Bhaskar Chandra Mohanty", role: "Faculty, DPMS", affiliation: "Thapar Institute of Engineering & Technology", photo: "/assets/people/bhaskar-mohanty.webp", photoAlt: "Prof. Bhaskar Chandra Mohanty, Faculty at Thapar Institute of Engineering & Technology", linkedin: "https://www.linkedin.com/in/bhaskar-mohanty/")
- Dr. Vineet Srivastava (name: "Dr. Vineet Srivastava", role: "Associate Professor & Joint Director, CoE-AM", affiliation: "Thapar Institute of Engineering & Technology", photo: "/assets/people/vineet-srivastava.webp", photoAlt: "Dr. Vineet Srivastava, Associate Professor and Joint Director of CoE-AM", linkedin: "https://www.linkedin.com/in/vineet-srivastava-68b9aa10a/")
- Dr. Malkeet Singh (name: "Dr. Malkeet Singh", role: "Assistant Professor / Scientist (PI)", affiliation: "Thapar Institute of Engineering & Technology", photo: "/assets/people/malkeet-singh.webp", photoAlt: "Dr. Malkeet Singh, Assistant Professor at Thapar Institute of Engineering & Technology", linkedin: "https://www.linkedin.com/in/malkeet-singh-0029b2137/")
- Mr. Dileep Kumar (name: "Mr. Dileep Kumar", role: "3D Printer Technician", photo: "/assets/people/dileep-kumar.webp", photoAlt: "Mr. Dileep Kumar, 3D Printer Technician")
- Mr. Jagjit Singh (name: "Mr. Jagjit Singh", role: "Wire EDM Technician", photo: "/assets/people/jagjit-singh.webp", photoAlt: "Mr. Jagjit Singh, Wire EDM Technician")

3. Define the remaining 24 members under `affiliatedMembers`.
4. Define `peopleSections`:
```typescript
peopleSections: [
  {
    id: "core",
    isFeatured: true,
    members: coreMembers
  },
  {
    id: "affiliated",
    title: "Affiliated Researchers",
    members: affiliatedMembers
  },
  {
    id: "postdocs-phd",
    title: "Postdocs and PhD Scholars",
    members: [],
    placeholder: {
      count: 3,
      badgeText: "Upcoming Cohort",
      subtext: "Postdoctoral and doctoral researcher profiles will be listed here upon appointment."
    }
  },
  {
    id: "students",
    title: "Undergraduate and Masters Students",
    members: [],
    placeholder: {
      count: 3,
      badgeText: "Upcoming Cohort",
      subtext: "Student researcher profiles will be listed here."
    }
  }
],
people: [...coreMembers, ...affiliatedMembers]
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```powershell
git add src/content/siteContent.ts src/content/siteContent.test.ts
git commit -m "feat(content): add peopleSections hierarchy and technician members"
```

---

### Task 3: Component Implementation (`src/App.tsx`)

**Files:**
- Modify: `src/App.tsx:453-593`

**Interfaces:**
- Consumes: `siteContent.peopleSections`, `PeopleSection`, `TeamMember`.
- Updates `PeoplePage` component to render sections, featured grid, skeleton cards, and modal with optional properties.

- [ ] **Step 1: Refactor `PeoplePage` in `src/App.tsx`**

Replace `PeoplePage` content:
```tsx
function PeoplePage() {
  const [selected, setSelected] = useState<TeamMember | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const openMember = (member: TeamMember) => {
    setSelected(member);
  };

  const closeMember = () => {
    setSelected(null);
  };

  useEffect(() => {
    if (!selected) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeMember();
        return;
      }

      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selected]);

  return (
    <>
      <PageHero title="People" />
      <div className="section-shell people-sections-container">
        {siteContent.peopleSections.map((section) => (
          <section
            key={section.id}
            className="people-section"
            aria-label={section.title || "Core Team"}
          >
            {section.title && (
              <div className="people-section-header">
                <h2 className="people-section-title">{section.title}</h2>
                <span className="people-section-rule" aria-hidden="true" />
              </div>
            )}

            {section.members.length > 0 && (
              <div
                className={
                  section.isFeatured
                    ? "people-grid people-grid--featured"
                    : "people-grid"
                }
              >
                {section.members.map((member) => (
                  <button
                    key={member.name}
                    className={`person-card ${
                      section.isFeatured ? "person-card--featured" : ""
                    } glass-panel`}
                    onClick={() => openMember(member)}
                    aria-haspopup="dialog"
                  >
                    <img
                      className="person-card-photo"
                      src={member.photo}
                      alt={member.photoAlt}
                    />
                    <h3 className="person-card-name">{member.name}</h3>
                    <p className="person-card-role">{member.role}</p>
                    {member.affiliation && (
                      <p className="person-card-affiliation">
                        {member.affiliation}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}

            {section.placeholder && (
              <div className="people-grid people-grid--placeholder">
                {Array.from({ length: section.placeholder.count }).map(
                  (_, idx) => (
                    <div
                      key={idx}
                      className="person-card person-card--skeleton glass-panel"
                      aria-hidden="true"
                    >
                      <div className="person-skeleton-avatar" />
                      <span className="person-skeleton-badge">
                        {section.placeholder?.badgeText}
                      </span>
                      <p className="person-skeleton-subtext">
                        {section.placeholder?.subtext}
                      </p>
                    </div>
                  )
                )}
              </div>
            )}
          </section>
        ))}
      </div>

      {selected && (
        <div
          className="person-modal"
          role="dialog"
          aria-modal="true"
          aria-label={`${selected.name} profile`}
          onClick={closeMember}
        >
          <div
            className="person-modal-card glass-panel"
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="person-modal-close"
              onClick={closeMember}
              aria-label="Close profile"
              ref={closeButtonRef}
            >
              <X aria-hidden="true" size={20} />
            </button>
            <img
              className="person-modal-photo"
              src={selected.photo}
              alt={selected.photoAlt}
            />
            <h2 className="person-modal-name">{selected.name}</h2>
            <p className="person-modal-role">{selected.role}</p>
            {selected.affiliation && (
              <p className="person-modal-affiliation">
                {selected.affiliation}
              </p>
            )}
            {selected.linkedin && selected.linkedin !== "#" && (
              <>
                <span className="rule" aria-hidden="true" />
                <a
                  className="person-modal-linkedin"
                  href={selected.linkedin}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Linkedin aria-hidden="true" size={16} />
                  LinkedIn Profile
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Typecheck and test**

Run: `npx tsc -b && npm test`
Expected: PASS with 0 errors.

- [ ] **Step 3: Commit**

```powershell
git add src/App.tsx
git commit -m "feat(people): render multi-panel roster with featured cards and skeletons"
```

---

### Task 4: Styling Hierarchy & Skeletons (`src/styles.css`)

**Files:**
- Modify: `src/styles.css:1638-1715`

**Interfaces:**
- Produces CSS rules for `.people-sections-container`, `.people-section`, `.people-section-header`, `.people-grid--featured`, `.person-card--featured`, and `.person-card--skeleton`.

- [ ] **Step 1: Add new People styles to `src/styles.css`**

Add the styling block:
```css
/* ── People Page Hierarchy & Multi-Panel ──────────────────────────────────── */

.people-sections-container {
  display: flex;
  flex-direction: column;
  gap: 3.5rem;
}

.people-section {
  display: flex;
  flex-direction: column;
}

.people-section-header {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  margin-bottom: 2rem;
}

.people-section-title {
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--navy);
  margin: 0;
  white-space: nowrap;
}

.people-section-rule {
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, rgba(14, 24, 58, 0.2), rgba(14, 24, 58, 0.04));
}

/* Featured Core Cards (Panel 1) */
.people-grid--featured {
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
}

@media (min-width: 960px) {
  .people-grid--featured {
    grid-template-columns: repeat(3, 1fr);
  }
}

.person-card--featured {
  padding: 2.5rem 1.5rem 1.85rem;
  border-top: 2px solid rgba(26, 86, 219, 0.4);
}

.person-card--featured .person-card-photo {
  width: 132px;
  height: 132px;
  border: 3.5px solid rgba(14, 24, 58, 0.12);
  margin-bottom: 1.25rem;
}

.person-card--featured .person-card-name {
  font-size: 1.25rem;
  margin-bottom: 0.35rem;
}

.person-card--featured .person-card-role {
  font-size: 0.82rem;
  letter-spacing: 0.07em;
  margin-bottom: 0.3rem;
}

/* Ghost / Skeleton Cards (Panels 3 & 4) */
.person-card--skeleton {
  cursor: default;
  opacity: 0.85;
  border: 1px dashed rgba(14, 24, 58, 0.18);
  background: rgba(255, 255, 255, 0.45);
}

.person-card--skeleton:hover,
.person-card--skeleton:focus-visible {
  transform: none;
  box-shadow: none;
}

.person-skeleton-avatar {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  margin-bottom: 1.1rem;
  background: radial-gradient(circle, rgba(14, 24, 58, 0.08) 0%, rgba(14, 24, 58, 0.03) 70%);
  border: 2px dashed rgba(14, 24, 58, 0.15);
  animation: pulse-soft 3s infinite ease-in-out;
}

@keyframes pulse-soft {
  0%, 100% {
    opacity: 0.6;
    transform: scale(0.98);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}

.person-skeleton-badge {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--accent);
  background: rgba(26, 86, 219, 0.08);
  border: 1px solid rgba(26, 86, 219, 0.2);
  border-radius: 4px;
  padding: 0.25rem 0.65rem;
  margin-bottom: 0.65rem;
}

.person-skeleton-subtext {
  font-size: 0.78rem;
  color: #777;
  margin: 0;
  line-height: 1.4;
  max-width: 220px;
}
```

- [ ] **Step 2: Build bundle and verify zero regressions**

Run: `npm run build && npm test`
Expected: Production build succeeds, all test suites pass.

- [ ] **Step 3: Commit**

```powershell
git add src/styles.css
git commit -m "style(people): add featured card sizing, section headers, and skeleton styling"
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
