# Admin Portal Plan 1 — Public Site Reads `content.json`

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The four editable areas (projects, industry cards, people, gallery) render from a runtime `/content.json` file instead of compiled-in code, with the project popup, hidden-item exclusion, live updates and failure handling from the spec — while the site looks identical to today.

**Architecture:** A pure validator (`parseSnapshot`) defines and enforces the `content.json` format. A seed builder turns today's `siteContent.ts` values into that format and a build step writes `public/content.json`. A framework-free `ContentStore` fetches, validates, change-detects and can hold updates; a thin React provider exposes it to pages and drives re-checks on navigation, focus and a 60-second timer.

**Tech Stack:** React 18, React Router 7, TypeScript, Vite 5, Vitest 2, jsdom + Testing Library (added here), vite-node (already installed with Vitest).

Spec: `docs/superpowers/specs/2026-09-27-admin-portal-design.md`. This is plan 1 of 4 (2: API, 3: admin screens, 4: deployment).

## Global Constraints

- The front-end design is locked: no visual change except the project popup, the "View details" affordance on projects that have details, and the "Content is temporarily unavailable" message.
- `content.json` never contains hidden items; the producer (seed now, API in plan 2) omits them. The public site does not filter a `hidden` field.
- Links in project popups accept only `http:` and `https:` URLs. LinkedIn accepts only `https:` on `linkedin.com` or a host ending in `.linkedin.com`. Image paths must be same-origin, under `/assets/` or `/media/`.
- Text from `content.json` is always rendered as React text, never with `dangerouslySetInnerHTML`.
- Empty LinkedIn shows the existing grey "LinkedIn — coming soon" chip.
- Every Industry card uses the existing divided list (`facility-spec-group-list facility-spec-group-list--divided`).
- TDD: write each test, watch it fail for the stated reason, then implement.
- Before every commit: `npx tsc -b` and `npm run test` both pass.
- Commit messages end with:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_013NpmP1eAM4BAerjk59oFjZ
  ```

## File Map

| File | Responsibility |
|---|---|
| `src/content/snapshot.ts` (new) | `content.json` types, `parseSnapshot`, URL/path safety checks, `hasProjectDetails`, `splitParagraphs` |
| `src/content/seedSnapshot.ts` (new) | `buildSeedSnapshot()` from `siteContent`, `serializeSnapshot()` |
| `scripts/write-content-json.ts` (new) | Writes `public/content.json` from the seed |
| `src/content/contentStore.ts` (new) | `ContentStore`, `fetchContentText`, `startContentPolling` |
| `src/content/ContentProvider.tsx` (new) | React context, `useContentState`, `useHoldContentUpdates`, `ContentUnavailable` |
| `src/lib/useModalDialog.ts` (new) | Shared open/close, focus trap, Escape handling for popups |
| `src/components/FallbackImage.tsx` (new) | `<img>` that swaps to a placeholder when its file fails to load |
| `src/components/ProjectDialog.tsx` (new) | Project popup |
| `src/test/setupDom.ts` (new) | jsdom stubs (`matchMedia`) |
| `src/App.test.tsx` (new) | Page-level tests against a fake content store |
| `public/assets/image-placeholder.svg` (new) | Neutral placeholder for gallery images |
| `src/App.tsx` | Pages read from the store |
| `src/main.tsx` | Mounts the provider |
| `src/components/HeroCarousel.tsx` | Takes generic slides |
| `src/lib/useScrollReveal.ts` | Re-scans when content changes |
| `src/content/siteContent.ts` | Dead content removed |
| `src/styles.css` | Popup, affordance and message styles; dead `.person-modal-note` rules removed |
| `vite.config.ts`, `package.json`, `.gitignore` | Test environment, seed script, generated file ignored |

---

### Task 1: Remove dead content

**Files:**
- Modify: `src/content/siteContent.ts`
- Modify: `src/App.tsx:567-571`
- Modify: `src/styles.css` (rules `.person-modal-note` and `.person-modal-note p`)
- Test: `src/content/siteContent.test.ts`

**Interfaces:**
- Produces: `siteContent` without `researchAreas`, `industryOfferings`, `aboutCentre.focusHeading`, `aboutCentre.focusAreas`; `TeamMember` without `note`.

- [ ] **Step 1: Replace the tests that pin the dead content with one that forbids it**

In `src/content/siteContent.test.ts`:

Delete the whole test `it("keeps research and industry pages substantive", ...)` (lines 141-146).

In `it("lists the real CoE-AM roster with no fabricated quotes", ...)` delete these three lines:
```ts
    // Quotes attributed to real, named people must come from the person
    // themselves, not be invented on their behalf.
    expect(siteContent.people.every((person) => !("note" in person && person.note))).toBe(true);
```

Replace the test `it("describes the centre and its four research focus areas", ...)` with:
```ts
  it("describes the centre", () => {
    expect(siteContent.aboutCentre.intro).toHaveLength(2);
    expect(siteContent.aboutCentre.intro[0]).toContain("flagship joint initiative");
    expect(siteContent.aboutCentre.intro[0]).toContain("Noam Eliaz");
    expect(siteContent.aboutCentre.closing).toContain("talent engine and startup incubator");
  });

  it("carries no content that no page displays", () => {
    expect("researchAreas" in siteContent).toBe(false);
    expect("industryOfferings" in siteContent).toBe(false);
    expect("focusAreas" in siteContent.aboutCentre).toBe(false);
    expect("focusHeading" in siteContent.aboutCentre).toBe(false);
  });
```

- [ ] **Step 2: Run the test and watch it fail**

Run: `npx vitest run src/content/siteContent.test.ts`
Expected: FAIL in "carries no content that no page displays" — `expected true to be false`.

- [ ] **Step 3: Delete the dead content**

In `src/content/siteContent.ts`:
1. Delete the type blocks `export type ResearchArea = {...};`, `export type IndustryOffering = {...};` and `export type FocusArea = {...};`.
2. In `TeamMember`, delete the `note?: string;` line and the two comment lines above it.
3. In `aboutCentre`, delete `focusHeading: "Core Research Focus Areas",` and the entire `focusAreas: [ ... ] satisfies FocusArea[],` block, leaving `intro` followed by `closing`.
4. Delete the entire `researchAreas: [ ... ] satisfies ResearchArea[],` block.
5. Delete the entire `industryOfferings: [ ... ] satisfies IndustryOffering[],` block.

In `src/App.tsx`, delete:
```tsx
            {selected.note && (
              <blockquote className="person-modal-note">
                <p>"{selected.note}"</p>
              </blockquote>
            )}
```

In `src/styles.css`, delete the `.person-modal-note { ... }` and `.person-modal-note p { ... }` rules.

- [ ] **Step 4: Verify**

Run: `npx tsc -b && npm run test`
Expected: tsc exits 0; all tests pass.
Run: `grep -rn "focusAreas\|researchAreas\|industryOfferings\|person-modal-note\|\.note\b" src`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add src/content/siteContent.ts src/content/siteContent.test.ts src/App.tsx src/styles.css
git commit -m "refactor: remove content no page displays"
```

---

### Task 2: The `content.json` format and its validator

**Files:**
- Create: `src/content/snapshot.ts`
- Test: `src/content/snapshot.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type ProjectLink = { label: string; url: string };
  export type Project = { id: string; title: string; description: string; links: ProjectLink[] };
  export type IndustryBullet = { text: string; label?: string };
  export type IndustryCard = { id: string; heading: string; bullets: IndustryBullet[] };
  export type Person = { id: string; name: string; designation: string; institution: string; photo: string; photoAlt: string; linkedin: string };
  export type GalleryPhoto = { id: string; image: string; alt: string; title: string; description: string; inHomeCarousel: boolean };
  export type SiteSnapshot = { version: 1; projects: Project[]; industryCards: IndustryCard[]; people: Person[]; gallery: GalleryPhoto[] };
  export const PERSON_PLACEHOLDER = "/assets/person-placeholder.svg";
  export const IMAGE_PLACEHOLDER = "/assets/image-placeholder.svg";
  export function parseSnapshot(raw: unknown): SiteSnapshot; // throws on a malformed file, drops malformed items
  export function isSafeLinkUrl(url: string): boolean;
  export function isLinkedInUrl(url: string): boolean;
  export function isLocalImagePath(path: string): boolean;
  export function hasProjectDetails(project: Project): boolean;
  export function splitParagraphs(text: string): string[];
  ```

- [ ] **Step 1: Write the failing tests**

Create `src/content/snapshot.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import {
  PERSON_PLACEHOLDER,
  SiteSnapshot,
  hasProjectDetails,
  isLinkedInUrl,
  isLocalImagePath,
  isSafeLinkUrl,
  parseSnapshot,
  splitParagraphs
} from "./snapshot";

function valid(): SiteSnapshot {
  return {
    version: 1,
    projects: [
      {
        id: "p1",
        title: "DED of MAX-phase composites",
        description: "First paragraph.\n\nSecond paragraph.",
        links: [{ label: "Paper", url: "https://doi.org/10.1000/1" }]
      }
    ],
    industryCards: [
      {
        id: "i1",
        heading: "Value to Industry",
        bullets: [{ text: "Repair instead of replacement", label: "Cost Reduction" }, { text: "Near-net shape" }]
      }
    ],
    people: [
      {
        id: "u1",
        name: "Jane Doe",
        designation: "Professor",
        institution: "TIET",
        photo: "/media/people/jane.webp",
        photoAlt: "Photo of Jane Doe",
        linkedin: "https://www.linkedin.com/in/jane"
      }
    ],
    gallery: [
      {
        id: "g1",
        image: "/assets/ded-system.webp",
        alt: "DED system exterior",
        title: "DED system",
        description: "The DED system used for metal AM.",
        inHomeCarousel: true
      }
    ]
  };
}

describe("parseSnapshot", () => {
  it("accepts a valid snapshot unchanged", () => {
    expect(parseSnapshot(valid())).toEqual(valid());
  });

  it.each([
    ["null", null],
    ["an array", []],
    ["a wrong version", { ...valid(), version: 2 }],
    ["a missing list", { ...valid(), people: undefined }]
  ])("rejects %s", (_label, raw) => {
    expect(() => parseSnapshot(raw)).toThrow();
  });

  it("drops a link whose URL is not http or https", () => {
    const raw = valid();
    raw.projects[0].links = [
      { label: "Bad", url: "javascript:alert(1)" },
      { label: "Data", url: "data:text/html,hi" },
      { label: "Good", url: "https://example.org" }
    ];
    expect(parseSnapshot(raw).projects[0].links).toEqual([{ label: "Good", url: "https://example.org" }]);
  });

  it("keeps at most ten links", () => {
    const raw = valid();
    raw.projects[0].links = Array.from({ length: 12 }, (_, n) => ({ label: `L${n}`, url: `https://e.org/${n}` }));
    expect(parseSnapshot(raw).projects[0].links).toHaveLength(10);
  });

  it("drops a project with an empty title", () => {
    const raw = valid();
    raw.projects.push({ id: "p2", title: "   ", description: "", links: [] });
    expect(parseSnapshot(raw).projects.map((p) => p.id)).toEqual(["p1"]);
  });

  it("blanks a LinkedIn link that is not on linkedin.com over https", () => {
    const raw = valid();
    raw.people[0].linkedin = "https://linkedin.com.evil.example/in/jane";
    expect(parseSnapshot(raw).people[0].linkedin).toBe("");
  });

  it("replaces a person photo that is not a local image path with the placeholder", () => {
    const raw = valid();
    raw.people[0].photo = "https://tracker.example/p.png";
    expect(parseSnapshot(raw).people[0].photo).toBe(PERSON_PLACEHOLDER);
  });

  it("fills a missing person alt text from the name", () => {
    const raw = valid() as unknown as { people: Record<string, unknown>[] };
    delete raw.people[0].photoAlt;
    expect(parseSnapshot(raw).people[0].photoAlt).toBe("Photo of Jane Doe");
  });

  it("drops a gallery photo whose image is not a local image path", () => {
    const raw = valid();
    raw.gallery[0].image = "/assets/../../etc/passwd";
    expect(parseSnapshot(raw).gallery).toEqual([]);
  });

  it("drops an industry card left with no valid bullets", () => {
    const raw = valid();
    raw.industryCards[0].bullets = [{ text: "" }];
    expect(parseSnapshot(raw).industryCards).toEqual([]);
  });
});

describe("URL and path checks", () => {
  it("accepts only http and https links", () => {
    expect(isSafeLinkUrl("https://a.org")).toBe(true);
    expect(isSafeLinkUrl("http://a.org")).toBe(true);
    expect(isSafeLinkUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeLinkUrl("not a url")).toBe(false);
  });

  it("accepts LinkedIn only over https on linkedin.com or a subdomain", () => {
    expect(isLinkedInUrl("https://www.linkedin.com/in/x")).toBe(true);
    expect(isLinkedInUrl("https://in.linkedin.com/in/x")).toBe(true);
    expect(isLinkedInUrl("https://linkedin.com/in/x")).toBe(true);
    expect(isLinkedInUrl("http://www.linkedin.com/in/x")).toBe(false);
    expect(isLinkedInUrl("https://evil-linkedin.com/in/x")).toBe(false);
    expect(isLinkedInUrl("#")).toBe(false);
  });

  it("accepts only same-origin image paths under /assets or /media", () => {
    expect(isLocalImagePath("/assets/people/a.webp")).toBe(true);
    expect(isLocalImagePath("/media/7f3a.webp")).toBe(true);
    expect(isLocalImagePath("//evil.example/a.webp")).toBe(false);
    expect(isLocalImagePath("/assets/../secret")).toBe(false);
    expect(isLocalImagePath("/other/a.webp")).toBe(false);
  });
});

describe("project helpers", () => {
  it("treats a project as having details when it has a description or a link", () => {
    const base = valid().projects[0];
    expect(hasProjectDetails({ ...base, description: "", links: [] })).toBe(false);
    expect(hasProjectDetails({ ...base, description: "  \n ", links: [] })).toBe(false);
    expect(hasProjectDetails({ ...base, description: "Text", links: [] })).toBe(true);
    expect(hasProjectDetails({ ...base, description: "", links: [{ label: "L", url: "https://a.org" }] })).toBe(true);
  });

  it("splits a description into paragraphs on blank lines", () => {
    expect(splitParagraphs("One\nstill one\n\n\nTwo\n")).toEqual(["One\nstill one", "Two"]);
    expect(splitParagraphs("   ")).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the tests and watch them fail**

Run: `npx vitest run src/content/snapshot.test.ts`
Expected: FAIL — `Failed to resolve import "./snapshot"`.

- [ ] **Step 3: Implement**

Create `src/content/snapshot.ts`:
```ts
export type ProjectLink = { label: string; url: string };
export type Project = { id: string; title: string; description: string; links: ProjectLink[] };
export type IndustryBullet = { text: string; label?: string };
export type IndustryCard = { id: string; heading: string; bullets: IndustryBullet[] };
export type Person = {
  id: string;
  name: string;
  designation: string;
  institution: string;
  photo: string;
  photoAlt: string;
  linkedin: string;
};
export type GalleryPhoto = {
  id: string;
  image: string;
  alt: string;
  title: string;
  description: string;
  inHomeCarousel: boolean;
};
export type SiteSnapshot = {
  version: 1;
  projects: Project[];
  industryCards: IndustryCard[];
  people: Person[];
  gallery: GalleryPhoto[];
};

export const PERSON_PLACEHOLDER = "/assets/person-placeholder.svg";
export const IMAGE_PLACEHOLDER = "/assets/image-placeholder.svg";
const MAX_LINKS = 10;

type Record_ = Record<string, unknown>;

function isRecord(value: unknown): value is Record_ {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function required(value: unknown): string | null {
  const result = text(value).trim();
  return result ? result : null;
}

function list<T>(value: unknown, name: string, parse: (item: unknown) => T | null): T[] {
  if (!Array.isArray(value)) throw new Error(`content.json: "${name}" must be a list`);
  return value.map(parse).filter((item): item is T => item !== null);
}

export function isSafeLinkUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}

export function isLinkedInUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === "https:" && (hostname === "linkedin.com" || hostname.endsWith(".linkedin.com"));
  } catch {
    return false;
  }
}

export function isLocalImagePath(path: string): boolean {
  return /^\/(assets|media)\/[A-Za-z0-9._\/-]+$/.test(path) && !path.split("/").includes("..");
}

export function hasProjectDetails(project: Project): boolean {
  return project.description.trim() !== "" || project.links.length > 0;
}

export function splitParagraphs(value: string): string[] {
  return value
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function parseLink(raw: unknown): ProjectLink | null {
  if (!isRecord(raw)) return null;
  const label = required(raw.label);
  const url = text(raw.url).trim();
  return label && isSafeLinkUrl(url) ? { label, url } : null;
}

function parseProject(raw: unknown): Project | null {
  if (!isRecord(raw)) return null;
  const id = required(raw.id);
  const title = required(raw.title);
  if (!id || !title) return null;
  const links = Array.isArray(raw.links) ? list(raw.links, "links", parseLink).slice(0, MAX_LINKS) : [];
  return { id, title, description: text(raw.description), links };
}

function parseBullet(raw: unknown): IndustryBullet | null {
  if (!isRecord(raw)) return null;
  const bulletText = required(raw.text);
  if (!bulletText) return null;
  const label = required(raw.label);
  return label ? { text: bulletText, label } : { text: bulletText };
}

function parseIndustryCard(raw: unknown): IndustryCard | null {
  if (!isRecord(raw)) return null;
  const id = required(raw.id);
  const heading = required(raw.heading);
  const bullets = Array.isArray(raw.bullets) ? list(raw.bullets, "bullets", parseBullet) : [];
  return id && heading && bullets.length ? { id, heading, bullets } : null;
}

function parsePerson(raw: unknown): Person | null {
  if (!isRecord(raw)) return null;
  const id = required(raw.id);
  const name = required(raw.name);
  if (!id || !name) return null;
  const photo = text(raw.photo);
  const linkedin = text(raw.linkedin).trim();
  return {
    id,
    name,
    designation: text(raw.designation),
    institution: text(raw.institution),
    photo: isLocalImagePath(photo) ? photo : PERSON_PLACEHOLDER,
    photoAlt: required(raw.photoAlt) ?? `Photo of ${name}`,
    linkedin: isLinkedInUrl(linkedin) ? linkedin : ""
  };
}

function parseGalleryPhoto(raw: unknown): GalleryPhoto | null {
  if (!isRecord(raw)) return null;
  const id = required(raw.id);
  const image = text(raw.image);
  const title = required(raw.title);
  const description = required(raw.description);
  if (!id || !title || !description || !isLocalImagePath(image)) return null;
  return {
    id,
    image,
    alt: required(raw.alt) ?? description,
    title,
    description,
    inHomeCarousel: raw.inHomeCarousel === true
  };
}

export function parseSnapshot(raw: unknown): SiteSnapshot {
  if (!isRecord(raw)) throw new Error("content.json: not an object");
  if (raw.version !== 1) throw new Error("content.json: unsupported version");
  return {
    version: 1,
    projects: list(raw.projects, "projects", parseProject),
    industryCards: list(raw.industryCards, "industryCards", parseIndustryCard),
    people: list(raw.people, "people", parsePerson),
    gallery: list(raw.gallery, "gallery", parseGalleryPhoto)
  };
}
```

- [ ] **Step 4: Run the tests and watch them pass**

Run: `npx vitest run src/content/snapshot.test.ts`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
npx tsc -b && npm run test
git add src/content/snapshot.ts src/content/snapshot.test.ts
git commit -m "feat: define and validate the content.json format"
```

---

### Task 3: Seed `content.json` from today's content

**Files:**
- Create: `src/content/seedSnapshot.ts`
- Create: `scripts/write-content-json.ts`
- Modify: `package.json` (scripts), `.gitignore`
- Test: `src/content/seedSnapshot.test.ts`

**Interfaces:**
- Consumes: `SiteSnapshot`, `parseSnapshot` (Task 2); `siteContent` (Task 1).
- Produces: `buildSeedSnapshot(): SiteSnapshot`, `serializeSnapshot(snapshot: SiteSnapshot): string`. Plan 2's API seeds its database from `buildSeedSnapshot()`.

- [ ] **Step 1: Write the failing tests**

Create `src/content/seedSnapshot.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { buildSeedSnapshot, serializeSnapshot } from "./seedSnapshot";
import { parseSnapshot } from "./snapshot";

describe("seed snapshot", () => {
  const seed = buildSeedSnapshot();

  it("carries every item the site shows today", () => {
    expect(seed.projects).toHaveLength(9);
    expect(seed.industryCards).toHaveLength(4);
    expect(seed.people).toHaveLength(28);
    expect(seed.gallery).toHaveLength(6);
  });

  it("passes its own validator without losing or changing anything", () => {
    expect(parseSnapshot(JSON.parse(serializeSnapshot(seed)))).toEqual(seed);
  });

  it("starts projects with no description and no links", () => {
    expect(seed.projects.every((p) => p.description === "" && p.links.length === 0)).toBe(true);
    expect(seed.projects[0].title).toContain("MAX-Phase Reinforced Metal Matrix Composites");
  });

  it("maps labeled industry items to labeled bullets", () => {
    const value = seed.industryCards.find((card) => card.heading === "Value to Industry");
    expect(value?.bullets[0]).toEqual({ label: "Cost Reduction", text: "Repair instead of replacement" });
    const first = seed.industryCards[0];
    expect(first.heading).toBe("Industry Offerings");
    expect(first.bullets[0]).toEqual({ text: "Process development & optimization" });
  });

  it("turns the '#' LinkedIn placeholder into an empty link", () => {
    expect(seed.people.filter((person) => person.linkedin === "")).toHaveLength(4);
    expect(seed.people.some((person) => person.linkedin === "#")).toBe(false);
  });

  it("keeps each person's current alt text and photo", () => {
    const eliaz = seed.people.find((person) => person.name === "Prof. Noam Eliaz");
    expect(eliaz?.photo).toBe("/assets/director.webp");
    expect(eliaz?.photoAlt).toBe("Prof. Noam Eliaz, Founding Director of CoE-AM");
  });

  it("puts every current gallery photo in the home carousel", () => {
    expect(seed.gallery.every((photo) => photo.inHomeCarousel)).toBe(true);
    expect(seed.gallery[0]).toMatchObject({ title: "DED system", image: "/assets/ded-system.webp" });
  });

  it("gives every item an id unique within its list", () => {
    for (const items of [seed.projects, seed.industryCards, seed.people, seed.gallery]) {
      expect(new Set(items.map((item) => item.id)).size).toBe(items.length);
    }
  });
});
```

- [ ] **Step 2: Run the tests and watch them fail**

Run: `npx vitest run src/content/seedSnapshot.test.ts`
Expected: FAIL — `Failed to resolve import "./seedSnapshot"`.

- [ ] **Step 3: Implement the seed builder**

Create `src/content/seedSnapshot.ts`:
```ts
import { siteContent } from "./siteContent";
import { SiteSnapshot } from "./snapshot";

const id = (prefix: string, index: number) => `${prefix}-${String(index + 1).padStart(2, "0")}`;

export function buildSeedSnapshot(): SiteSnapshot {
  return {
    version: 1,
    projects: siteContent.projects.map((title, index) => ({
      id: id("project", index),
      title,
      description: "",
      links: []
    })),
    industryCards: siteContent.offeringGroups.map((group, index) => ({
      id: id("industry", index),
      heading: group.heading,
      bullets: group.items.map((item) =>
        typeof item === "string" ? { text: item } : { label: item.label, text: item.description }
      )
    })),
    people: siteContent.people.map((person, index) => ({
      id: id("person", index),
      name: person.name,
      designation: person.role,
      institution: person.affiliation,
      photo: person.photo,
      photoAlt: person.photoAlt,
      linkedin: person.linkedin === "#" ? "" : person.linkedin
    })),
    gallery: siteContent.gallery.map((item, index) => ({
      id: id("gallery", index),
      image: item.src,
      alt: item.alt,
      title: item.tag,
      description: item.caption,
      inHomeCarousel: true
    }))
  };
}

export function serializeSnapshot(snapshot: SiteSnapshot): string {
  return `${JSON.stringify(snapshot, null, 2)}\n`;
}
```

- [ ] **Step 4: Run the tests and watch them pass**

Run: `npx vitest run src/content/seedSnapshot.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the generator and wire it into dev and build**

Create `scripts/write-content-json.ts`:
```ts
import { writeFileSync } from "node:fs";
import { buildSeedSnapshot, serializeSnapshot } from "../src/content/seedSnapshot";

writeFileSync("public/content.json", serializeSnapshot(buildSeedSnapshot()));
console.log("Wrote public/content.json");
```

In `package.json` `scripts`, add three entries (keep the existing ones):
```json
    "content:seed": "vite-node scripts/write-content-json.ts",
    "predev": "npm run content:seed",
    "prebuild": "npm run content:seed",
```

Append to `.gitignore`:
```
# Generated from src/content/siteContent.ts by scripts/write-content-json.ts
public/content.json
```

- [ ] **Step 6: Verify the generator**

Run: `npm run content:seed`
Expected: prints `Wrote public/content.json`.
Run: `node -e "const s=require('./public/content.json'); console.log(s.version, s.projects.length, s.industryCards.length, s.people.length, s.gallery.length)"`
Expected: `1 9 4 28 6`
Run: `git status --short public`
Expected: no output (the generated file is ignored).

- [ ] **Step 7: Commit**

```bash
npx tsc -b && npm run test
git add src/content/seedSnapshot.ts src/content/seedSnapshot.test.ts scripts/write-content-json.ts package.json .gitignore
git commit -m "feat: generate content.json from the current site content"
```

---

### Task 4: The content store

**Files:**
- Create: `src/content/contentStore.ts`
- Test: `src/content/contentStore.test.ts`

**Interfaces:**
- Consumes: `parseSnapshot`, `SiteSnapshot` (Task 2).
- Produces:
  ```ts
  export type ContentState =
    | { status: "loading" }
    | { status: "ready"; snapshot: SiteSnapshot }
    | { status: "error" };
  export class ContentStore {
    constructor(fetchText: () => Promise<string>);
    getState(): ContentState;            // arrow property, stable identity
    subscribe(listener: () => void): () => void; // arrow property, stable identity
    refresh(): Promise<void>;            // concurrent calls share one fetch
    hold(): () => void;                  // returns an idempotent release function
  }
  export function fetchContentText(): Promise<string>;
  export function startContentPolling(
    store: { refresh(): unknown },
    env?: { doc?: EventTarget & { visibilityState: string }; win?: EventTarget; intervalMs?: number }
  ): () => void;
  ```

- [ ] **Step 1: Write the failing tests**

Create `src/content/contentStore.test.ts`:
```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { ContentStore, startContentPolling } from "./contentStore";
import { SiteSnapshot } from "./snapshot";

function snapshot(names: string[]): SiteSnapshot {
  return {
    version: 1,
    projects: [],
    industryCards: [],
    people: names.map((name, index) => ({
      id: `u${index}`,
      name,
      designation: "Professor",
      institution: "TIET",
      photo: "/assets/people/a.webp",
      photoAlt: `Photo of ${name}`,
      linkedin: ""
    })),
    gallery: []
  };
}

function names(store: ContentStore): string[] {
  const state = store.getState();
  return state.status === "ready" ? state.snapshot.people.map((person) => person.name) : [];
}

describe("ContentStore", () => {
  it("starts loading and becomes ready with the parsed snapshot", async () => {
    const store = new ContentStore(async () => JSON.stringify(snapshot(["A"])));
    expect(store.getState()).toEqual({ status: "loading" });
    await store.refresh();
    expect(names(store)).toEqual(["A"]);
  });

  it("reports an error when the first load fails, then recovers", async () => {
    let fail = true;
    const store = new ContentStore(async () => {
      if (fail) throw new Error("offline");
      return JSON.stringify(snapshot(["A"]));
    });
    await store.refresh();
    expect(store.getState()).toEqual({ status: "error" });
    fail = false;
    await store.refresh();
    expect(names(store)).toEqual(["A"]);
  });

  it("reports an error when the first file is not valid JSON", async () => {
    const store = new ContentStore(async () => "<html>");
    await store.refresh();
    expect(store.getState()).toEqual({ status: "error" });
  });

  it("keeps the content it has when a later refresh fails", async () => {
    let body = JSON.stringify(snapshot(["A"]));
    const store = new ContentStore(async () => {
      if (body === "fail") throw new Error("offline");
      return body;
    });
    await store.refresh();
    body = "fail";
    await store.refresh();
    expect(names(store)).toEqual(["A"]);
  });

  it("does not notify listeners when the file has not changed", async () => {
    const store = new ContentStore(async () => JSON.stringify(snapshot(["A"])));
    await store.refresh();
    const listener = vi.fn();
    store.subscribe(listener);
    await store.refresh();
    expect(listener).not.toHaveBeenCalled();
  });

  it("applies changed content and notifies listeners", async () => {
    let body = JSON.stringify(snapshot(["A"]));
    const store = new ContentStore(async () => body);
    await store.refresh();
    const listener = vi.fn();
    store.subscribe(listener);
    body = JSON.stringify(snapshot(["A", "B"]));
    await store.refresh();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(names(store)).toEqual(["A", "B"]);
  });

  it("defers a change while held and applies it on release", async () => {
    let body = JSON.stringify(snapshot(["A"]));
    const store = new ContentStore(async () => body);
    await store.refresh();
    const release = store.hold();
    body = JSON.stringify(snapshot(["A", "B"]));
    await store.refresh();
    expect(names(store)).toEqual(["A"]);
    release();
    expect(names(store)).toEqual(["A", "B"]);
    release();
    expect(names(store)).toEqual(["A", "B"]);
  });

  it("waits for every hold to be released", async () => {
    let body = JSON.stringify(snapshot(["A"]));
    const store = new ContentStore(async () => body);
    await store.refresh();
    const first = store.hold();
    const second = store.hold();
    body = JSON.stringify(snapshot(["B"]));
    await store.refresh();
    first();
    expect(names(store)).toEqual(["A"]);
    second();
    expect(names(store)).toEqual(["B"]);
  });

  it("shares one fetch between overlapping refresh calls", async () => {
    const fetchText = vi.fn(async () => JSON.stringify(snapshot(["A"])));
    const store = new ContentStore(fetchText);
    await Promise.all([store.refresh(), store.refresh(), store.refresh()]);
    expect(fetchText).toHaveBeenCalledTimes(1);
  });
});

describe("startContentPolling", () => {
  afterEach(() => vi.useRealTimers());

  function env(visibilityState: "visible" | "hidden") {
    const doc = Object.assign(new EventTarget(), { visibilityState });
    const win = new EventTarget();
    return { doc, win };
  }

  it("refreshes every interval while the page is visible", () => {
    vi.useFakeTimers();
    const store = { refresh: vi.fn() };
    const stop = startContentPolling(store, { ...env("visible"), intervalMs: 60_000 });
    vi.advanceTimersByTime(120_000);
    expect(store.refresh).toHaveBeenCalledTimes(2);
    stop();
  });

  it("does not refresh on the interval while the page is hidden", () => {
    vi.useFakeTimers();
    const store = { refresh: vi.fn() };
    const stop = startContentPolling(store, { ...env("hidden"), intervalMs: 60_000 });
    vi.advanceTimersByTime(120_000);
    expect(store.refresh).not.toHaveBeenCalled();
    stop();
  });

  it("refreshes when the page becomes visible and when the window gains focus", () => {
    const store = { refresh: vi.fn() };
    const { doc, win } = env("hidden");
    const stop = startContentPolling(store, { doc, win });
    doc.visibilityState = "visible";
    doc.dispatchEvent(new Event("visibilitychange"));
    win.dispatchEvent(new Event("focus"));
    expect(store.refresh).toHaveBeenCalledTimes(2);
    stop();
  });

  it("stops everything when stopped", () => {
    vi.useFakeTimers();
    const store = { refresh: vi.fn() };
    const { doc, win } = env("visible");
    const stop = startContentPolling(store, { doc, win, intervalMs: 60_000 });
    stop();
    vi.advanceTimersByTime(120_000);
    win.dispatchEvent(new Event("focus"));
    doc.dispatchEvent(new Event("visibilitychange"));
    expect(store.refresh).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the tests and watch them fail**

Run: `npx vitest run src/content/contentStore.test.ts`
Expected: FAIL — `Failed to resolve import "./contentStore"`.

- [ ] **Step 3: Implement**

Create `src/content/contentStore.ts`:
```ts
import { SiteSnapshot, parseSnapshot } from "./snapshot";

export type ContentState =
  | { status: "loading" }
  | { status: "ready"; snapshot: SiteSnapshot }
  | { status: "error" };

type Parsed = { text: string; snapshot: SiteSnapshot };

export class ContentStore {
  private state: ContentState = { status: "loading" };
  private appliedText: string | null = null;
  private pending: Parsed | null = null;
  private holds = 0;
  private inFlight: Promise<void> | null = null;
  private readonly listeners = new Set<() => void>();

  constructor(private readonly fetchText: () => Promise<string>) {}

  getState = (): ContentState => this.state;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  refresh(): Promise<void> {
    if (!this.inFlight) {
      this.inFlight = this.load().finally(() => {
        this.inFlight = null;
      });
    }
    return this.inFlight;
  }

  hold(): () => void {
    this.holds += 1;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.holds -= 1;
      if (this.holds === 0 && this.pending) {
        const pending = this.pending;
        this.pending = null;
        this.apply(pending);
      }
    };
  }

  private async load(): Promise<void> {
    let parsed: Parsed;
    try {
      const text = await this.fetchText();
      if (text === this.appliedText) return;
      parsed = { text, snapshot: parseSnapshot(JSON.parse(text)) };
    } catch {
      if (this.state.status !== "ready") this.setState({ status: "error" });
      return;
    }
    if (this.holds > 0 && this.state.status === "ready") {
      this.pending = parsed;
      return;
    }
    this.apply(parsed);
  }

  private apply(parsed: Parsed): void {
    this.appliedText = parsed.text;
    this.setState({ status: "ready", snapshot: parsed.snapshot });
  }

  private setState(state: ContentState): void {
    this.state = state;
    this.listeners.forEach((listener) => listener());
  }
}

export async function fetchContentText(): Promise<string> {
  // "no-cache" makes the browser revalidate with the server's ETag, so an
  // unchanged file costs an empty 304 while a changed one arrives at once.
  const response = await fetch("/content.json", { cache: "no-cache" });
  if (!response.ok) throw new Error(`content.json: HTTP ${response.status}`);
  return response.text();
}

export function startContentPolling(
  store: { refresh(): unknown },
  {
    doc = document,
    win = window,
    intervalMs = 60_000
  }: { doc?: EventTarget & { visibilityState: string }; win?: EventTarget; intervalMs?: number } = {}
): () => void {
  const refreshIfVisible = () => {
    if (doc.visibilityState === "visible") void store.refresh();
  };
  const refresh = () => void store.refresh();
  const timer = setInterval(refreshIfVisible, intervalMs);
  doc.addEventListener("visibilitychange", refreshIfVisible);
  win.addEventListener("focus", refresh);
  return () => {
    clearInterval(timer);
    doc.removeEventListener("visibilitychange", refreshIfVisible);
    win.removeEventListener("focus", refresh);
  };
}
```

- [ ] **Step 4: Run the tests and watch them pass**

Run: `npx vitest run src/content/contentStore.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
npx tsc -b && npm run test
git add src/content/contentStore.ts src/content/contentStore.test.ts
git commit -m "feat: content store with change detection, holds and polling"
```

---

### Task 5: Pages render from the store

**Files:**
- Create: `src/content/ContentProvider.tsx`, `src/test/setupDom.ts`, `src/App.test.tsx`
- Modify: `src/App.tsx`, `src/main.tsx`, `src/components/HeroCarousel.tsx`, `src/lib/useScrollReveal.ts`, `src/styles.css`, `vite.config.ts`, `package.json`

**Interfaces:**
- Consumes: `ContentStore`, `ContentState`, `fetchContentText`, `startContentPolling` (Task 4); snapshot types (Task 2).
- Produces:
  ```tsx
  export function ContentProvider(props: { store: ContentStore; poll?: boolean; children: React.ReactNode }): JSX.Element;
  export function useContentState(): ContentState;
  export function useHoldContentUpdates(active: boolean): void;
  export function ContentUnavailable(): JSX.Element;
  // HeroCarousel
  export type CarouselSlide = { src: string; alt: string; tag: string };
  export function HeroCarousel(props: { items: CarouselSlide[] }): JSX.Element;
  // useScrollReveal
  export function useScrollReveal(refreshKey?: unknown): void;
  ```

- [ ] **Step 1: Add the DOM test environment**

Run: `npm install --save-dev jsdom@^25.0.1 @testing-library/react@^16.1.0 @testing-library/dom@^10.4.0`

Replace the `test` block in `vite.config.ts` with:
```ts
  test: {
    environment: "node",
    environmentMatchGlobs: [["src/**/*.test.tsx", "jsdom"]],
    globals: true,
    setupFiles: ["src/test/setupDom.ts"]
  }
```

Create `src/test/setupDom.ts`:
```ts
// jsdom has no matchMedia; the layout and reveal hooks query it on mount.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent: () => false
    }) as MediaQueryList;
}
```

- [ ] **Step 2: Write the failing page tests**

Create `src/App.test.tsx`:
```tsx
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import App from "./App";
import { ContentProvider } from "./content/ContentProvider";
import { ContentStore } from "./content/contentStore";
import { SiteSnapshot } from "./content/snapshot";

function fixture(): SiteSnapshot {
  return {
    version: 1,
    projects: [
      { id: "p1", title: "Plain project title", description: "", links: [] },
      {
        id: "p2",
        title: "Detailed project title",
        description: "First paragraph.\n\nSecond paragraph.",
        links: [{ label: "Project paper", url: "https://doi.org/10.1000/1" }]
      }
    ],
    industryCards: [
      { id: "i1", heading: "Value to Industry", bullets: [{ label: "Cost Reduction", text: "Repair instead" }] }
    ],
    people: [
      {
        id: "u1",
        name: "Jane Doe",
        designation: "Professor",
        institution: "TIET",
        photo: "/assets/people/jane.webp",
        photoAlt: "Photo of Jane Doe",
        linkedin: ""
      }
    ],
    gallery: [
      {
        id: "g1",
        image: "/assets/ded-system.webp",
        alt: "DED exterior",
        title: "DED system",
        description: "The DED system used for metal AM.",
        inHomeCarousel: true
      },
      {
        id: "g2",
        image: "/assets/wire-edm.webp",
        alt: "Wire EDM",
        title: "Wire EDM",
        description: "Wire EDM for precise contour cutting.",
        inHomeCarousel: false
      }
    ]
  };
}

async function renderAt(path: string, snapshot: SiteSnapshot | "fail" = fixture()) {
  let body = snapshot === "fail" ? "fail" : JSON.stringify(snapshot);
  const store = new ContentStore(async () => {
    if (body === "fail") throw new Error("offline");
    return body;
  });
  await store.refresh();
  render(
    <MemoryRouter initialEntries={[path]}>
      <ContentProvider store={store} poll={false}>
        <App />
      </ContentProvider>
    </MemoryRouter>
  );
  const publish = async (next: SiteSnapshot) => {
    body = JSON.stringify(next);
    await act(() => store.refresh());
  };
  return { store, publish };
}

describe("pages driven by content.json", () => {
  it("renders industry cards with labeled bullets", async () => {
    await renderAt("/industry");
    expect(screen.getByText("Value to Industry")).toBeTruthy();
    expect(screen.getByText("Cost Reduction:")).toBeTruthy();
  });

  it("renders people and shows the coming-soon chip for an empty LinkedIn", async () => {
    await renderAt("/people");
    fireEvent.click(screen.getByRole("button", { name: "View profile of Jane Doe" }));
    const dialog = screen.getByRole("dialog", { name: "Profile of Jane Doe" });
    expect(within(dialog).getByText("LinkedIn — coming soon")).toBeTruthy();
  });

  it("renders gallery titles and descriptions", async () => {
    await renderAt("/gallery");
    expect(screen.getByText("DED system")).toBeTruthy();
    expect(screen.getByText("Wire EDM for precise contour cutting.")).toBeTruthy();
  });

  it("shows only home-carousel photos on the home page", async () => {
    await renderAt("/");
    expect(screen.getByRole("tab", { name: "Show slide 1: DED system" })).toBeTruthy();
    expect(screen.queryByRole("tab", { name: /Wire EDM/ })).toBeNull();
  });

  it("shows the unavailable message when content.json cannot load", async () => {
    await renderAt("/people", "fail");
    expect(screen.getByText(/Content is temporarily unavailable/)).toBeTruthy();
  });

  it("reveals cards that arrive after the page has rendered", async () => {
    let resolve: (text: string) => void = () => {};
    const store = new ContentStore(() => new Promise<string>((done) => (resolve = done)));
    render(
      <MemoryRouter initialEntries={["/research"]}>
        <ContentProvider store={store} poll={false}>
          <App />
        </ContentProvider>
      </MemoryRouter>
    );
    await act(async () => resolve(JSON.stringify(fixture())));
    // Project cards start at opacity 0 via [data-reveal] until marked visible.
    const card = screen.getByText("Plain project title").closest("article");
    expect(card?.hasAttribute("data-reveal")).toBe(true);
    expect(card?.classList.contains("is-visible")).toBe(true);
  });

  it("shows a newly published person without a reload", async () => {
    const { publish } = await renderAt("/people");
    const next = fixture();
    next.people.push({ ...next.people[0], id: "u2", name: "New Person", photoAlt: "Photo of New Person" });
    await publish(next);
    expect(screen.getByText("New Person")).toBeTruthy();
  });

  it("waits until an open profile is closed before applying new content", async () => {
    const { publish } = await renderAt("/people");
    fireEvent.click(screen.getByRole("button", { name: "View profile of Jane Doe" }));
    const next = fixture();
    next.people.push({ ...next.people[0], id: "u2", name: "New Person", photoAlt: "Photo of New Person" });
    await publish(next);
    expect(screen.queryByText("New Person")).toBeNull();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByText("New Person")).toBeTruthy();
  });
});
```

- [ ] **Step 3: Run the tests and watch them fail**

Run: `npx vitest run src/App.test.tsx`
Expected: FAIL — `Failed to resolve import "./content/ContentProvider"`.

- [ ] **Step 4: Implement the provider**

Create `src/content/ContentProvider.tsx`:
```tsx
import { ReactNode, createContext, useContext, useEffect, useSyncExternalStore } from "react";
import { useLocation } from "react-router-dom";
import { ContentState, ContentStore, startContentPolling } from "./contentStore";

const ContentContext = createContext<ContentStore | null>(null);

function useStore(): ContentStore {
  const store = useContext(ContentContext);
  if (!store) throw new Error("ContentProvider is missing");
  return store;
}

export function ContentProvider({
  store,
  poll = true,
  children
}: {
  store: ContentStore;
  poll?: boolean;
  children: ReactNode;
}) {
  const { pathname } = useLocation();

  // Also covers the first load: the effect runs on mount.
  useEffect(() => {
    void store.refresh();
  }, [store, pathname]);

  useEffect(() => (poll ? startContentPolling(store) : undefined), [store, poll]);

  return <ContentContext.Provider value={store}>{children}</ContentContext.Provider>;
}

export function useContentState(): ContentState {
  const store = useStore();
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
}

export function useHoldContentUpdates(active: boolean): void {
  const store = useStore();
  useEffect(() => (active ? store.hold() : undefined), [store, active]);
}

export function ContentUnavailable() {
  return <p className="content-unavailable">Content is temporarily unavailable. Please try again shortly.</p>;
}
```

- [ ] **Step 5: Mount the provider**

Replace `src/main.tsx` with:
```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ContentProvider } from "./content/ContentProvider";
import { ContentStore, fetchContentText } from "./content/contentStore";
import "./styles.css";

const contentStore = new ContentStore(fetchContentText);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <ContentProvider store={contentStore}>
        <App />
      </ContentProvider>
    </BrowserRouter>
  </React.StrictMode>
);
```

- [ ] **Step 6: Make the reveal hook re-scan when content changes**

In `src/lib/useScrollReveal.ts`:
- Change the signature to `export function useScrollReveal(refreshKey?: unknown) {`.
- Change the query to `document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-visible)")`.
- Change the dependency list from `[location.pathname]` to `[location.pathname, refreshKey]`.
- Add to the doc comment: `Re-scans when refreshKey changes, so cards rendered after content.json arrives are revealed too.`

- [ ] **Step 7: Generalise the carousel**

In `src/components/HeroCarousel.tsx`:
- Delete `import { GalleryItem } from "../content/siteContent";`.
- Add `export type CarouselSlide = { src: string; alt: string; tag: string };`.
- Change the signature to `export function HeroCarousel({ items }: { items: CarouselSlide[] }) {`.

- [ ] **Step 8: Switch the pages to the store**

In `src/App.tsx`:

Replace the siteContent import line with:
```tsx
import { siteContent } from "./content/siteContent";
import { ContentUnavailable, useContentState, useHoldContentUpdates } from "./content/ContentProvider";
import { GalleryPhoto, Person } from "./content/snapshot";
```

In `Layout`, directly after `useScrollReveal();` change it to:
```tsx
  const content = useContentState();
  useScrollReveal(content);
```

In `HomePage`, add at the top of the function body:
```tsx
  const content = useContentState();
  const slides =
    content.status === "ready"
      ? content.snapshot.gallery
          .filter((photo) => photo.inHomeCarousel)
          .map((photo) => ({ src: photo.image, alt: photo.alt, tag: photo.title }))
      : [];
```
and replace
```tsx
          <div className="about-media">
            <HeroCarousel items={siteContent.gallery} />
          </div>
```
with
```tsx
          {slides.length > 0 && (
            <div className="about-media">
              <HeroCarousel items={slides} />
            </div>
          )}
```

Replace `ResearchPage` with (the popup arrives in Task 7; for now every card is a plain card):
```tsx
function ResearchPage() {
  const content = useContentState();
  return (
    <>
      <PageHero title="Research" />
      <section className="section-shell projects-section">
        <p className="projects-heading">Projects</p>
        <span className="rule" aria-hidden="true" />
        {content.status === "error" && <ContentUnavailable />}
        {content.status === "ready" && (
          <div className="projects-grid">
            {content.snapshot.projects.map((project, index) => (
              <article
                className="glass-card project-card"
                key={project.id}
                data-reveal=""
                data-reveal-delay={Math.min(index + 1, 5)}
              >
                <span className="project-card-index">{String(index + 1).padStart(2, "0")}</span>
                <p className="project-card-title">{project.title}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
```

Replace `IndustryPage` with:
```tsx
function IndustryPage() {
  const content = useContentState();
  return (
    <>
      <PageHero title="Industry" />
      <section className="section-shell offerings-section">
        <p className="projects-heading">Offerings &amp; Capabilities</p>
        <span className="rule" aria-hidden="true" />
        {content.status === "error" && <ContentUnavailable />}
        {content.status === "ready" && (
          <div className="offering-groups-grid">
            {content.snapshot.industryCards.map((card, index) => (
              <article
                className="glass-card offering-group-card"
                key={card.id}
                data-reveal=""
                data-reveal-delay={Math.min(index + 1, 5)}
              >
                <p className="facility-spec-group-heading">{card.heading}</p>
                <ul className="facility-spec-group-list facility-spec-group-list--divided">
                  {card.bullets.map((bullet, bulletIndex) => (
                    <li key={bulletIndex}>
                      {bullet.label ? (
                        <>
                          <strong>{bullet.label}:</strong> {bullet.text}
                        </>
                      ) : (
                        bullet.text
                      )}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
```

In `GalleryPage`:
- Change `useState<GalleryItem | null>` to `useState<GalleryPhoto | null>` and `openGalleryItem = (item: GalleryItem)` to `(item: GalleryPhoto)`.
- Add after the `useState`/`useRef` lines: `const content = useContentState();` and `useHoldContentUpdates(selected !== null);`.
- Replace the grid section with:
```tsx
      <section className="section-shell gallery-grid">
        {content.status === "error" && <ContentUnavailable />}
        {content.status === "ready" &&
          content.snapshot.gallery.map((item) => (
            <button className="gallery-tile glass-card" key={item.id} onClick={() => openGalleryItem(item)}>
              <img src={item.image} alt={item.alt} loading="lazy" />
              <span>{item.title}</span>
              <p>{item.description}</p>
              <Maximize2 aria-hidden="true" size={18} />
            </button>
          ))}
      </section>
```
- In the lightbox: `aria-label={selected.title}`, `<img src={selected.image} alt={selected.alt} />`, `<figcaption>{selected.description}</figcaption>`.

In `PeoplePage`:
- Change `useState<TeamMember | null>` to `useState<Person | null>` and `openMember = (member: TeamMember)` to `(member: Person)`.
- Add `const content = useContentState();` and `useHoldContentUpdates(selected !== null);` after the refs.
- Replace the grid section with:
```tsx
      <section className="section-shell people-grid">
        {content.status === "error" && <ContentUnavailable />}
        {content.status === "ready" &&
          content.snapshot.people.map((member) => (
            <button
              className="person-card glass-card"
              key={member.id}
              onClick={() => openMember(member)}
              aria-label={`View profile of ${member.name}`}
            >
              <img className="person-card-photo" src={member.photo} alt={member.photoAlt} loading="lazy" />
              <p className="person-card-name">{member.name}</p>
              <p className="person-card-role">{member.designation}</p>
              <p className="person-card-affiliation">{member.institution}</p>
            </button>
          ))}
      </section>
```
- In the modal: `{selected.designation}` instead of `{selected.role}`, `{selected.institution}` instead of `{selected.affiliation}`, and change the LinkedIn condition from `selected.linkedin !== "#"` to `selected.linkedin`.

Add to `src/styles.css` (after the `.project-card-title` rule):
```css
.content-unavailable {
  color: #666;
  font-size: 0.95rem;
  margin: 1.5rem 0 0;
}
```

- [ ] **Step 9: Run the tests and watch them pass**

Run: `npx vitest run src/App.test.tsx`
Expected: PASS (8 tests).
Run: `npx tsc -b && npm run test`
Expected: all pass. If `tsc` reports `GalleryItem` or `TeamMember` as unused imports anywhere, remove those imports; the types themselves stay in `siteContent.ts` because the seed builder uses them.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json vite.config.ts src/test/setupDom.ts src/App.test.tsx src/content/ContentProvider.tsx src/main.tsx src/App.tsx src/components/HeroCarousel.tsx src/lib/useScrollReveal.ts src/styles.css
git commit -m "feat: render projects, industry, people and gallery from content.json"
```

---

### Task 6: One shared popup hook

The gallery and people pages each carry an identical copy of the open/close, focus-trap and Escape logic, and Task 7 would add a third. Extract it first; behaviour must not change.

**Files:**
- Create: `src/lib/useModalDialog.ts`
- Modify: `src/App.tsx` (`GalleryPage`, `PeoplePage`)
- Test: `src/App.test.tsx`

**Interfaces:**
- Produces:
  ```ts
  export function useModalDialog<T>(): {
    selected: T | null;
    open: (item: T) => void;
    close: () => void;
    dialogRef: React.RefObject<HTMLDivElement>;
    closeButtonRef: React.RefObject<HTMLButtonElement>;
  };
  ```

- [ ] **Step 1: Pin the current popup behaviour with tests**

Append inside the `describe` in `src/App.test.tsx`:
```tsx
  it("closes the gallery lightbox with Escape and returns focus to the tile", async () => {
    await renderAt("/gallery");
    const tile = screen.getByText("DED system").closest("button") as HTMLButtonElement;
    tile.focus();
    fireEvent.click(tile);
    expect(screen.getByRole("dialog", { name: "DED system" })).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Close image preview" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(tile);
  });

  it("closes the profile when the backdrop is pressed", async () => {
    await renderAt("/people");
    fireEvent.click(screen.getByRole("button", { name: "View profile of Jane Doe" }));
    fireEvent.mouseDown(screen.getByRole("dialog"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
```

- [ ] **Step 2: Run them against the current code**

Run: `npx vitest run src/App.test.tsx`
Expected: PASS. These are characterisation tests: they must pass before and after the refactor. To confirm they can fail, temporarily delete the `if (event.key === "Escape") { ... }` block in `GalleryPage`, re-run and see the Escape test fail, then restore it.

- [ ] **Step 3: Extract the hook**

Create `src/lib/useModalDialog.ts`:
```ts
import { useCallback, useEffect, useRef, useState } from "react";

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * State and behaviour shared by every popup: focus moves to the close button
 * on open and back to the opener on close, Tab is trapped inside the dialog,
 * Escape closes it, and the page behind does not scroll.
 */
export function useModalDialog<T>() {
  const [selected, setSelected] = useState<T | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  const open = useCallback((item: T) => {
    lastFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSelected(item);
  }, []);

  const close = useCallback(() => setSelected(null), []);

  useEffect(() => {
    if (selected === null) {
      lastFocusedRef.current?.focus();
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!focusable.length) return;
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
  }, [selected, close]);

  return { selected, open, close, dialogRef, closeButtonRef };
}
```

In `GalleryPage`, replace the `useState`, the three `useRef`s, `openGalleryItem`, `closeGalleryItem` and the whole `useEffect` with:
```tsx
  const { selected, open: openGalleryItem, close: closeGalleryItem, dialogRef, closeButtonRef } =
    useModalDialog<GalleryPhoto>();
```
In `PeoplePage`, replace the same block with:
```tsx
  const { selected, open: openMember, close: closeMember, dialogRef, closeButtonRef } = useModalDialog<Person>();
```
Keep each page's `const content = useContentState();` and `useHoldContentUpdates(selected !== null);` lines. Add `import { useModalDialog } from "./lib/useModalDialog";` and drop `useEffect`, `useRef`, `useState` from the React import only if nothing else in `App.tsx` still uses them (`Layout` uses `useEffect`).

- [ ] **Step 4: Run the tests and watch them pass**

Run: `npx tsc -b && npm run test`
Expected: all pass, including the two tests from Step 1.

- [ ] **Step 5: Commit**

```bash
git add src/lib/useModalDialog.ts src/App.tsx src/App.test.tsx
git commit -m "refactor: share popup focus and keyboard handling in one hook"
```

---

### Task 7: Project popup

**Files:**
- Create: `src/components/ProjectDialog.tsx`
- Modify: `src/App.tsx` (`ResearchPage`), `src/styles.css`
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: `useModalDialog` (Task 6); `Project`, `hasProjectDetails`, `splitParagraphs` (Task 2); `useHoldContentUpdates` (Task 5).
- Produces: `export function ProjectDialog(props: { project: Project; onClose: () => void; dialogRef: React.RefObject<HTMLDivElement>; closeButtonRef: React.RefObject<HTMLButtonElement> }): JSX.Element`.

- [ ] **Step 1: Write the failing tests**

Append inside the `describe` in `src/App.test.tsx`:
```tsx
  it("leaves a project with no description and no links as a plain, non-clickable card", async () => {
    await renderAt("/research");
    expect(screen.getByText("Plain project title").closest("button")).toBeNull();
  });

  it("opens a project's description and links, and closes with Escape", async () => {
    await renderAt("/research");
    fireEvent.click(screen.getByRole("button", { name: /Detailed project title/ }));
    const dialog = screen.getByRole("dialog", { name: "Detailed project title" });
    expect(within(dialog).getByText("First paragraph.")).toBeTruthy();
    expect(within(dialog).getByText("Second paragraph.")).toBeTruthy();
    const link = within(dialog).getByRole("link", { name: /Project paper/ });
    expect(link.getAttribute("href")).toBe("https://doi.org/10.1000/1");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    expect(link.getAttribute("target")).toBe("_blank");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows project text as text, never as markup", async () => {
    const snapshot = fixture();
    snapshot.projects[1].description = '<img src=x onerror="alert(1)">';
    await renderAt("/research", snapshot);
    fireEvent.click(screen.getByRole("button", { name: /Detailed project title/ }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText('<img src=x onerror="alert(1)">')).toBeTruthy();
    expect(dialog.querySelector("img")).toBeNull();
  });
```

- [ ] **Step 2: Run the tests and watch them fail**

Run: `npx vitest run src/App.test.tsx`
Expected: FAIL — `Unable to find an accessible element with the role "button" and name /Detailed project title/`.

- [ ] **Step 3: Implement the popup**

Create `src/components/ProjectDialog.tsx`:
```tsx
import { RefObject } from "react";
import { ExternalLink, X } from "lucide-react";
import { Project, splitParagraphs } from "../content/snapshot";

export function ProjectDialog({
  project,
  onClose,
  dialogRef,
  closeButtonRef
}: {
  project: Project;
  onClose: () => void;
  dialogRef: RefObject<HTMLDivElement>;
  closeButtonRef: RefObject<HTMLButtonElement>;
}) {
  const paragraphs = splitParagraphs(project.description);
  return (
    <div
      className="person-modal"
      role="dialog"
      aria-modal="true"
      aria-label={project.title}
      ref={dialogRef}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="person-modal-inner project-modal-inner">
        <button
          className="person-modal-close"
          onClick={onClose}
          aria-label="Close project details"
          ref={closeButtonRef}
        >
          <X aria-hidden="true" size={20} />
        </button>
        <h2 className="project-modal-title">{project.title}</h2>
        <span className="rule" aria-hidden="true" />
        {paragraphs.length > 0 && (
          <div className="project-modal-description">
            {paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        )}
        {project.links.length > 0 && (
          <ul className="project-modal-links">
            {project.links.map((link, index) => (
              <li key={index}>
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink aria-hidden="true" size={15} />
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
```

Replace `ResearchPage` in `src/App.tsx` with:
```tsx
function ResearchPage() {
  const content = useContentState();
  const { selected, open, close, dialogRef, closeButtonRef } = useModalDialog<Project>();
  useHoldContentUpdates(selected !== null);

  return (
    <>
      <PageHero title="Research" />
      <section className="section-shell projects-section">
        <p className="projects-heading">Projects</p>
        <span className="rule" aria-hidden="true" />
        {content.status === "error" && <ContentUnavailable />}
        {content.status === "ready" && (
          <div className="projects-grid">
            {content.snapshot.projects.map((project, index) => {
              const delay = Math.min(index + 1, 5);
              const face = (
                <>
                  <span className="project-card-index">{String(index + 1).padStart(2, "0")}</span>
                  <p className="project-card-title">{project.title}</p>
                </>
              );
              return hasProjectDetails(project) ? (
                <button
                  type="button"
                  className="glass-card project-card"
                  key={project.id}
                  data-reveal=""
                  data-reveal-delay={delay}
                  onClick={() => open(project)}
                >
                  {face}
                  <span className="project-card-more">
                    View details <ChevronRight aria-hidden="true" size={14} />
                  </span>
                </button>
              ) : (
                <article className="glass-card project-card" key={project.id} data-reveal="" data-reveal-delay={delay}>
                  {face}
                </article>
              );
            })}
          </div>
        )}
      </section>
      {selected && (
        <ProjectDialog project={selected} onClose={close} dialogRef={dialogRef} closeButtonRef={closeButtonRef} />
      )}
    </>
  );
}
```
Update the imports in `src/App.tsx`: `import { GalleryPhoto, Person, Project, hasProjectDetails } from "./content/snapshot";` and `import { ProjectDialog } from "./components/ProjectDialog";`.

Add to `src/styles.css` after the `.content-unavailable` rule:
```css
button.project-card {
  color: inherit;
  cursor: pointer;
  font: inherit;
  text-align: left;
  width: 100%;
}

.project-card-more {
  align-items: center;
  color: var(--blue);
  display: inline-flex;
  font-size: 0.8rem;
  font-weight: 600;
  gap: 0.25rem;
  margin-top: auto;
}

.project-modal-inner {
  align-items: stretch;
  max-width: 640px;
  text-align: left;
}

.project-modal-title {
  color: var(--navy);
  font-family: var(--font-serif);
  font-size: 1.35rem;
  line-height: 1.35;
  margin: 0 2.25rem 0 0;
}

.project-modal-description p {
  color: #444;
  font-size: 0.92rem;
  line-height: 1.7;
  margin: 0 0 0.8rem;
  white-space: pre-line;
}

.project-modal-links {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  list-style: none;
  margin: 0.25rem 0 0;
  padding: 0;
}

.project-modal-links a {
  align-items: center;
  color: var(--blue);
  display: inline-flex;
  font-size: 0.88rem;
  font-weight: 600;
  gap: 0.4rem;
}

.project-modal-links a:focus-visible {
  outline: 2px solid var(--blue);
  outline-offset: 2px;
}
```

- [ ] **Step 4: Run the tests and watch them pass**

Run: `npx tsc -b && npm run test`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/ProjectDialog.tsx src/App.tsx src/App.test.tsx src/styles.css
git commit -m "feat: open a project's description and links in a popup"
```

---

### Task 8: Placeholder for images that fail to load

**Files:**
- Create: `src/components/FallbackImage.tsx`, `public/assets/image-placeholder.svg`
- Modify: `src/App.tsx` (people and gallery images), `src/components/HeroCarousel.tsx`
- Test: `src/components/FallbackImage.test.tsx`

**Interfaces:**
- Consumes: `PERSON_PLACEHOLDER`, `IMAGE_PLACEHOLDER` (Task 2).
- Produces: `export function FallbackImage(props: React.ImgHTMLAttributes<HTMLImageElement> & { src: string; fallbackSrc: string }): JSX.Element`.

- [ ] **Step 1: Write the failing test**

Create `src/components/FallbackImage.test.tsx`:
```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FallbackImage } from "./FallbackImage";

describe("FallbackImage", () => {
  it("shows the image, then the placeholder once the image fails", () => {
    render(<FallbackImage src="/media/missing.webp" fallbackSrc="/assets/image-placeholder.svg" alt="A photo" />);
    const img = screen.getByAltText("A photo");
    expect(img.getAttribute("src")).toBe("/media/missing.webp");
    fireEvent.error(img);
    expect(img.getAttribute("src")).toBe("/assets/image-placeholder.svg");
  });

  it("does not loop when the placeholder itself fails", () => {
    render(<FallbackImage src="/media/missing.webp" fallbackSrc="/assets/image-placeholder.svg" alt="A photo" />);
    const img = screen.getByAltText("A photo");
    fireEvent.error(img);
    fireEvent.error(img);
    expect(img.getAttribute("src")).toBe("/assets/image-placeholder.svg");
  });

  it("tries a new image again when the source changes", () => {
    const { rerender } = render(
      <FallbackImage src="/media/missing.webp" fallbackSrc="/assets/image-placeholder.svg" alt="A photo" />
    );
    fireEvent.error(screen.getByAltText("A photo"));
    rerender(<FallbackImage src="/media/new.webp" fallbackSrc="/assets/image-placeholder.svg" alt="A photo" />);
    expect(screen.getByAltText("A photo").getAttribute("src")).toBe("/media/new.webp");
  });
});
```

- [ ] **Step 2: Run the test and watch it fail**

Run: `npx vitest run src/components/FallbackImage.test.tsx`
Expected: FAIL — `Failed to resolve import "./FallbackImage"`.

- [ ] **Step 3: Implement**

Create `src/components/FallbackImage.tsx`:
```tsx
import { ImgHTMLAttributes, useState } from "react";

export function FallbackImage({
  src,
  fallbackSrc,
  ...rest
}: ImgHTMLAttributes<HTMLImageElement> & { src: string; fallbackSrc: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const shown = failedSrc === src ? fallbackSrc : src;
  return (
    <img
      {...rest}
      src={shown}
      onError={() => {
        if (shown !== fallbackSrc) setFailedSrc(src);
      }}
    />
  );
}
```

Create `public/assets/image-placeholder.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 320" role="img" aria-label="Image unavailable">
  <rect width="400" height="320" fill="#e4e8f0"/>
  <path d="M150 200l40-50 30 36 20-24 40 38H150z" fill="#b6c0d2"/>
  <circle cx="175" cy="130" r="14" fill="#b6c0d2"/>
</svg>
```

- [ ] **Step 4: Use it for every content image**

In `src/App.tsx` add `import { FallbackImage } from "./components/FallbackImage";` and extend the snapshot import with `IMAGE_PLACEHOLDER, PERSON_PLACEHOLDER`. Then replace:
- the gallery tile `<img src={item.image} alt={item.alt} loading="lazy" />` with `<FallbackImage src={item.image} fallbackSrc={IMAGE_PLACEHOLDER} alt={item.alt} loading="lazy" />`
- the lightbox `<img src={selected.image} alt={selected.alt} />` with `<FallbackImage src={selected.image} fallbackSrc={IMAGE_PLACEHOLDER} alt={selected.alt} />`
- the person card `<img className="person-card-photo" ... />` with `<FallbackImage className="person-card-photo" src={member.photo} fallbackSrc={PERSON_PLACEHOLDER} alt={member.photoAlt} loading="lazy" />`
- the modal `<img className="person-modal-photo" ... />` with `<FallbackImage className="person-modal-photo" src={selected.photo} fallbackSrc={PERSON_PLACEHOLDER} alt={selected.photoAlt} />`

In `src/components/HeroCarousel.tsx` add `import { FallbackImage } from "./FallbackImage";` and `import { IMAGE_PLACEHOLDER } from "../content/snapshot";`, and replace the slide `<img ... />` with:
```tsx
            <FallbackImage
              src={item.src}
              fallbackSrc={IMAGE_PLACEHOLDER}
              alt={item.alt}
              loading={itemIndex === 0 ? "eager" : "lazy"}
            />
```

- [ ] **Step 5: Run the tests and watch them pass**

Run: `npx tsc -b && npm run test`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/FallbackImage.tsx src/components/FallbackImage.test.tsx public/assets/image-placeholder.svg src/App.tsx src/components/HeroCarousel.tsx
git commit -m "feat: show a neutral placeholder when a content image fails to load"
```

---

### Task 9: Verify the whole plan

**Files:** none changed unless a check fails.

- [ ] **Step 1: Full test suite and type check**

Run: `npx tsc -b && npm run test`
Expected: exit 0, every test passing.

- [ ] **Step 2: Production build includes the content file**

Run: `npm run build`
Expected: `Wrote public/content.json`, then a successful Vite build.
Run: `node -e "const s=require('./dist/content.json'); console.log(s.projects.length, s.industryCards.length, s.people.length, s.gallery.length)"`
Expected: `9 4 28 6`

- [ ] **Step 3: Served over HTTP with revalidation**

Run in the background: `npm run preview -- --port 4173`
Run: `curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://localhost:4173/content.json`
Expected: `200 application/json`
Run: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4173/research`
Expected: `200` (SPA fallback)
Stop the preview server.

- [ ] **Step 4: Nothing left behind**

Run: `grep -rn "siteContent\.\(projects\|offeringGroups\|people\|gallery\)" src --include=*.tsx`
Expected: no output (pages no longer read these; only `seedSnapshot.ts` does).
Run: `grep -rn "dangerouslySetInnerHTML" src`
Expected: no output.

- [ ] **Step 5: Visual check by the owner**

Ask the owner to run `npm run dev`, open each page, and confirm it looks the same as before: Home carousel, Research (9 plain project cards, none clickable yet because none has a description), Industry (4 cards), People (28, popups, "coming soon" chip for the four without LinkedIn), Gallery (6, lightbox). Then temporarily add a description to one project in the running site's `public/content.json`, wait up to 60 seconds without reloading, and confirm the card gains "View details" and opens the popup. Regenerate the file afterwards with `npm run content:seed`.
