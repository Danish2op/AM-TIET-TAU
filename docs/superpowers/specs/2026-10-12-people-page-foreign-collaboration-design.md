# People Page Core Members Heading & Foreign Collaboration Section — Design Spec

Date: 2026-10-12  
Status: Approved by user  

---

## 1. Goal

Update the `/people` page of the **Centre of Excellence in Advanced Manufacturing (TIET-TAU)** website:
1. Give the first section (currently 6 core members with featured cards) the heading **"Core Members"**.
2. Split off the 8 international research collaborators into a dedicated section titled **"Foreign Collaboration"**.
3. Push to `main` and deploy to production on Vercel using the authenticated `danish2op` account.

---

## 2. Section Structure

1. **Panel 1 — Core Members (`id: "core"`):**
   * Heading: `"Core Members"`
   * `isFeatured: true`
   * 6 members: Prof. Noam Eliaz, Prof. Bhaskar Chandra Mohanty, Dr. Vineet Srivastava, Dr. Malkeet Singh, Mr. Dileep Kumar, Mr. Jagjit Singh.

2. **Panel 2 — Affiliated Researchers (`id: "affiliated"`):**
   * Heading: `"Affiliated Researchers"`
   * 16 members (PIs, Co-PIs, national external collaborators).

3. **Panel 3 — Foreign Collaboration (`id: "foreign-collaboration"`):**
   * Heading: `"Foreign Collaboration"`
   * 8 members:
     1. Ankit Thakur (Postdoctoral Research Fellow | Tel Aviv University, Israel)
     2. Maxim Sokol (Associate Professor | Tel Aviv University, Israel)
     3. Saurav Goel (Professor of Manufacturing | London South Bank University, UK)
     4. Francesco Travascio (Associate Professor | University of Miami, USA)
     5. Monsuru Ramoni (Assistant Professor, Industrial, Manufacturing & Systems Engineering | University of Texas Rio Grande Valley, USA)
     6. Yi Huang (Associate Professor, Manufacturing and Materials Engineering | Bournemouth University, UK)
     7. Colin Hall (Industry Professor | Adelaide University, Australia)
     8. Tanmoy Mukhopadhyay (Faculty, Programmable Matter Lab | University of Southampton, UK)

4. **Panel 4 — Postdocs and PhD Scholars (`id: "postdocs-phd"`):**
   * Heading: `"Postdocs and PhD Scholars"`
   * Placeholder cohort cards.

5. **Panel 5 — Undergraduate and Masters Students (`id: "students"`):**
   * Heading: `"Undergraduate and Masters Students"`
   * Placeholder cohort cards.

---

## 3. Data Model Updates (`src/content/siteContent.ts`)

* Add `title: "Core Members"` to the `core` entry in `peopleSections`.
* Extract the 8 international members from `affiliated` and place them into `foreign-collaboration` with `title: "Foreign Collaboration"`.
* Total member count remains 30 (`siteContent.people.length === 30`).

---

## 4. Testing & Verification

* Update `src/content/siteContent.test.ts` to assert:
  * `siteContent.peopleSections` length is 5.
  * Panel 1 title is `"Core Members"`.
  * Panel 2 title is `"Affiliated Researchers"` and has 16 members.
  * Panel 3 title is `"Foreign Collaboration"` and has 8 members.
* Run `npm test` and ensure all tests pass.
* Run `npm run build` to verify TypeScript compilation and bundle generation.
