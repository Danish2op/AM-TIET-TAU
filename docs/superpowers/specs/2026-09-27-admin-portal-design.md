# Admin Portal and Self-Hosted Deployment — Design

Date: 2026-09-27
Status: Approved in brainstorming, pending written-spec review

## Goal

Turn the CoE-AM website from a fully static site into one whose four promised content areas are
edited from a secure admin portal, and deploy it on a virtual machine supplied by Thapar's tech
department at `am-tiet.thapar.edu`.

Promised to the client:

1. **Projects** — edit each card's cover text, the description shown when the card is tapped, and
   links inside it.
2. **Industry** — edit the cards and their content.
3. **People** — photo, name, designation, institution, LinkedIn link, and display order.
4. **Gallery** — add, edit and delete photos, with a title and description.

In each area the admin can edit, add and remove content.

The front-end design is locked. The only new public UI is the project description popup.

## Decisions

| Topic | Decision |
|---|---|
| Admins | One or two people, one access level, no roles |
| Publishing | Save is live immediately; every item has a Hidden switch |
| Undo | Deleted items are restorable for 30 days; nightly backups |
| Editable scope | Only the four promised areas; everything else stays in code |
| Project popup | Tapping a card opens a popup; a card with no description and no links is not clickable |
| Industry cards | Edited in the admin, no popup (display unchanged) |
| Server owner after handover | Thapar's tech department; the developer's role ends after a fixed warranty |
| Admin login | Email + password + mandatory authenticator-app code; no email-based reset |
| Admin reachability | From anywhere (no campus/VPN restriction) |
| Live updates | Public pages re-check for new content without a reload (see Public site) |
| Architecture | Small custom API + published static snapshot (below) |
| Pre-go-live verification | Automated install tests on fresh Ubuntu machines in GitHub Actions; no manual rehearsal |

**Security statement for the client:** no system is provably unhackable. This design closes every
common attack path, keeps the public site free of any server logic, and makes the admin login the
hardest part to reach. Each protection below has an automated test that attempts the attack.

## Step 0: Remove dead content (before any admin work)

None of the following is displayed anywhere. Delete it, trim the matching tests, and confirm the
site renders identically:

- `TeamMember.note`, the `<blockquote className="person-modal-note">` block in `src/App.tsx`, the two
  `.person-modal-note` rules in `src/styles.css`, and the `note` assertion in `siteContent.test.ts`.
- `siteContent.researchAreas` and the `ResearchArea` type.
- `siteContent.industryOfferings` and the `IndustryOffering` type.
- `siteContent.aboutCentre.focusAreas` and the `FocusArea` type.

## Architecture

```
Internet ──443──► Caddy (HTTPS, security headers, static files)
                   ├─ /               → public site (static React build)
                   ├─ /content.json   → published snapshot (static file)
                   ├─ /media/*        → uploaded images (static files)
                   ├─ /admin          → admin screens (static, same React project)
                   └─ /api/*          → Node API ──► SQLite database file
                                            └─ writes content.json and /media
```

- **Caddy** is the only component exposed to the internet. It terminates HTTPS (automatic
  certificates, or plain HTTP when Thapar terminates HTTPS in front of the VM), redirects HTTP to
  HTTPS, sets security headers, and serves every static file.
- **API**: Node + TypeScript on Fastify. Reachable only through Caddy and used only by the admin.
  Handles login, validation, image processing, publishing and the audit log.
- **Storage**: one SQLite database file plus a `media/` folder plus `content.json`, all on one data
  volume. Backing up that folder backs up everything.
- Public visitors only ever receive static files. No public request reaches the API or the
  database. The database has no network port.
- Everything runs as containers from one Docker Compose file.

### Public site changes

- The four dynamic areas (projects, industry cards, people, gallery) come from `/content.json`
  instead of `siteContent.ts`. Everything else stays in `siteContent.ts`.
- **Live updates:** the site re-fetches `content.json` when the visitor navigates, when the tab
  regains focus, and every 60 seconds while the tab is visible. Requests are conditional (ETag), so
  an unchanged file costs an empty 304 reply. Changed content is swapped in without a reload. While
  a project, person or gallery popup is open, the swap waits until it closes.
- **Project popup:** title, description (paragraphs), links. Reuses the keyboard-trapped,
  Escape-dismissible pattern of the existing people and gallery popups.
- **Admin code is loaded only on `/admin`**; public visitors never download it.

## Data model

Every item in every area has a **position** (drag to reorder) and a **Hidden** flag. Hidden items
are never written to `content.json`.

**Project**
- `title` — required, 1–300 characters. Shown on the card.
- `description` — optional plain text, up to 5,000 characters, paragraphs separated by blank lines.
- `links` — optional, up to 10, each `{ label: 1–100 chars, url: http(s) only }`.
- Card is clickable only when `description` or `links` is non-empty.

**Industry card**
- `heading` — required, 1–100 characters.
- `bullets` — 1–12, each `{ text: 1–300 chars, label?: 1–60 chars }`. If any bullet has a label, the
  card uses the existing label-and-description layout; otherwise the compact bullet list.

**Person**
- `photo` — uploaded image, centre-cropped to a square and saved as 480×480 WebP. The admin form
  previews the circular crop before saving.
- `name`, `designation`, `institution` — required, each 1–150 characters.
- `linkedin` — optional; when present must be an `https://` URL whose host is `linkedin.com` or
  ends in `.linkedin.com`. Empty means no LinkedIn button; the seed converts today's four `"#"`
  values to empty.
- Screen-reader alt text is generated as "Photo of {name}".

**Gallery photo**
- `image` — uploaded image, longest side scaled to at most 1,600 px, saved as WebP.
- `title` — required, 1–60 characters (today's `tag`).
- `description` — required, 1–400 characters (today's `caption`). Also used as the image's alt
  text.
- `inHomeCarousel` — boolean. The home page carousel shows only gallery photos with this on. The
  six current photos start with it on.

**Seed:** on first start, an empty database is filled from today's `siteContent.ts` values for the
four areas, so the live site is identical on day one. Existing content tests keep guarding that
seed data.

## Admin portal

### Setup and recovery

- `create-admin <email>` (run once per admin at go-live) prints a one-time setup link valid for
  24 hours. The admin sets a password, scans an authenticator QR code, confirms one code, and
  receives 10 single-use recovery codes.
- Password rules: at least 12 characters; rejected if found in a bundled list of commonly leaked
  passwords.
- **Admin-to-admin reset:** either admin can press "Reset login" on the other, which invalidates
  their password and authenticator and issues a new setup link. Logged in the audit log.
- **Last resort:** `reset-admin.sh <email>` on the server issues a new setup link.
- No email-based password reset exists.

### Login

- Email → password → 6-digit authenticator code (or a recovery code).
- Passwords stored as Argon2id hashes.
- Lockout: 5 failed attempts lock the account for 15 minutes; a separate per-IP rate limit applies
  across all accounts.
- Error messages never reveal which step failed or whether an email exists.
- Sessions: HTTPS-only, `HttpOnly`, `SameSite=Strict` cookies; CSRF token on every state-changing
  request; 60-minute idle timeout; 12-hour absolute limit; "Sign out everywhere" button.

### Editing screens

Four screens with one shared pattern:

- A list with drag-to-reorder, a Hidden switch, Edit and Delete per row.
- An edit form validated in the browser and re-validated on the server.
- Delete asks for confirmation and moves the item to **Recently deleted**, restorable for 30 days,
  then purged automatically.
- Saving an item that another admin changed since it was opened is refused with "This was changed
  by someone else — reload to see their version" (version number check).
- "View on site" link.

Plus:
- **Audit log** (read-only): logins, failed logins, resets, and every create/edit/delete/restore,
  with who and when. Retained for one year.
- **Download full backup** button (database + images + snapshot as one file).

## Security measures

Each item has a test that attempts the attack and asserts it is refused.

- Uploads: accept JPEG, PNG and WebP only, checked by decoding the file, not by its name; maximum
  10 MB; every image is decoded and re-encoded to a fresh WebP with metadata (including GPS)
  stripped; SVG and all other types rejected; files stored under random names.
- Text is rendered as text, never as HTML. Links accept only `http:` and `https:`.
- All SQL is parameterised.
- Security headers: strict Content-Security-Policy, HSTS, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy`, `frame-ancestors 'none'`.
- The API container runs as a non-root user with a read-only filesystem except the data volume.
- VM hardening by the install script: firewall allowing only 22, 80 and 443; SSH key-only login,
  root login disabled; automatic security updates.

## Error handling

- First load of `content.json` fails → the four dynamic sections show "Content is temporarily
  unavailable"; the rest of the site works. A failed background re-check keeps the content already
  shown.
- Missing image → neutral placeholder (people use the existing `person-placeholder.svg`).
- A save writes the database in one transaction, then writes `content.json` to a temporary file and
  renames it into place. If the snapshot write fails, the transaction is rolled back and the admin
  sees "Not published — try again".
- On startup the API regenerates `content.json` from the database.
- Admin errors are phrased for editors; internal details go only to the server log.
- A failed upload leaves no files behind.

## Deployment and operations

### What the tech department provides

An email template (written as part of this work) asks for:

1. Ubuntu 22.04 or 24.04 LTS VM: 2 vCPU, 4 GB RAM, 40 GB disk.
2. SSH access with `sudo` for the developer during setup and warranty.
3. Inbound ports 80 and 443 open from the internet.
4. Outbound internet access from the VM.
5. A DNS record pointing `am-tiet.thapar.edu` at the VM's public IP.
6. Whether Thapar has a central backup system that can copy one folder nightly.

### Releases

- Each release is one versioned bundle (`am-tiet-vX.Y.Z.tar.gz`) containing the Compose file, the
  scripts and pre-built container images. It is copied to the VM; nothing is built on the server.
- GitHub Actions builds the bundle and, on a fresh Ubuntu machine, runs `install.sh`, then checks:
  the public site loads, admin login with an authenticator code works, an edit appears on the
  public page, an upload is processed, the stack survives a restart, backup then restore works, an
  update works, and a deliberately broken update rolls back. Only releases that pass are used.

### Scripts on the server

| Script | Purpose |
|---|---|
| `install.sh` | Pre-flight checks (Ubuntu version, memory, disk, internet, DNS, ports) with plain-language failures; installs Docker; hardens the VM; asks for the domain, the first admin's email, and whether Thapar terminates HTTPS; starts everything |
| `status.sh` | Shows whether each part is running and the site responds |
| `restart.sh` | Restarts the stack |
| `update.sh <bundle>` | Backs up, switches version, checks health, rolls back automatically on failure |
| `backup.sh` / `restore.sh` | Manual backup; restore from a list of available backups |
| `create-admin.sh` / `reset-admin.sh` | Admin setup links |
| `set-domain.sh <domain>` | Switches from IP address to the domain later |

### Backups

Nightly at 02:00: database, media and snapshot in one compressed file. Keep 14 daily and 8 weekly;
older ones are deleted. A backup is also taken before every update. If Thapar has no central backup,
the runbook instructs admins to use "Download full backup" monthly.

### Monitoring

A free external uptime checker emails both admins if the site stops responding. Set up at go-live
under the centre's email.

### Documents delivered

- Email template for the tech department.
- Go-live guide for the developer (Windows → SSH → copy bundle → `install.sh` → checks).
- One-page runbook for the tech department (the scripts above, copy-paste, with expected output).
- Admin user guide.

### Contract note (not code)

State a fixed warranty period after go-live (e.g. 30 days of bug fixes), with support after that as
a separate paid agreement.

## Testing

- API unit tests: validation, image processing, lockout, authenticator codes, session expiry, edit
  conflicts, snapshot generation, soft delete and purge.
- Security tests for every item in Security measures.
- Front-end tests: pages render from `content.json`; hidden items never appear; a project with no
  description and no links is not clickable; live update swaps content without reload and waits
  while a popup is open; the home carousel shows only `inHomeCarousel` photos.
- Existing content tests continue to guard the seed data.
- Install tests per release on fresh Ubuntu machines (Releases above).

## Out of scope

- Editing anything outside the four areas.
- Roles, approval workflows, drafts.
- Email sending of any kind.
- Restricting the admin to the campus network (can be added later in Caddy without code changes).
