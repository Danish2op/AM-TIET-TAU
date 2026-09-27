# Admin Portal Plan 2 — API

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A self-contained Node API in `server/` that stores the four content areas in SQLite, authenticates admins with password + authenticator code, validates and publishes every change to `content.json`, processes uploaded images safely, and keeps an audit log — all proven by tests that attempt each attack.

**Architecture:** Fastify HTTP layer over small, framework-free modules (database, content, media, auth, audit, backup), each taking the SQLite handle and a clock so tests run against a real database and real image processing with controllable time. Every content change runs inside one SQLite transaction that also rewrites `content.json` atomically; if the file write fails the transaction rolls back. The `content.json` format, validator and seed come from Plan 1's `src/content/` modules, imported directly.

**Tech Stack:** Node 22, TypeScript, Fastify 5, @fastify/cookie 11, @fastify/multipart 10, better-sqlite3 13, sharp 0.35, @node-rs/argon2 2, otpauth 9, qrcode 1.5, zod 3, tar 7, Vitest 2, tsx, esbuild.

Spec: `docs/superpowers/specs/2026-09-27-admin-portal-design.md`. Depends on Plan 1 (`src/content/snapshot.ts`, `src/content/seedSnapshot.ts`). Plan 3 builds the admin screens on these endpoints; Plan 4 packages this server into containers.

## Global Constraints

- Admins: one access level. Login is email + password + 6-digit authenticator code (or a single-use recovery code) in one request; a failure always answers `Invalid email, password or code.`.
- Passwords: Argon2id; at least 12 and at most 256 characters; rejected when in the bundled common-password list or containing the email's local part (4+ characters).
- Lockout: 5 failed attempts lock the account for 15 minutes. Per-IP limit: 20 failures per 15 minutes on login and setup endpoints, answered with HTTP 429.
- Sessions: `HttpOnly`, `SameSite=Strict`, `Secure` when the public origin is https (cookie name `__Host-am_session`, else `am_session`); 60-minute idle timeout; 12-hour absolute limit. Every non-GET admin request needs the `x-csrf-token` header matching the session; any `Origin` header must equal the public origin.
- Setup links are `${PUBLIC_ORIGIN}/admin/setup#${token}`, valid 24 hours, single use. No email is ever sent.
- Content limits (verbatim from the spec): project title 1–300, description ≤5,000, ≤10 links (label 1–100, http/https only); industry heading 1–100, 1–12 bullets (text 1–300, label ≤60); person name/designation/institution 1–150, LinkedIn empty or https on `linkedin.com`/`*.linkedin.com`; gallery title 1–60, description 1–400.
- Images: JPEG, PNG or WebP only, detected by decoding, ≤10 MB, ≤40 megapixels; re-encoded to WebP with all metadata removed; people 480×480 centre crop, gallery longest side ≤1,600 px; random file names.
- Deleted items are restorable for 30 days; audit entries kept for 1 year; unreferenced uploads removed after 24 hours.
- All SQL uses bound parameters. No HTML is ever produced from content.
- Every `/api` response carries `Cache-Control: no-store`.
- TDD: write each test, watch it fail for the stated reason, then implement.
- Before every commit, from `server/`: `npm run typecheck` and `npm test` both pass. From the repo root: `npm run test` still passes.
- Commit messages end with:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_013NpmP1eAM4BAerjk59oFjZ
  ```

## Data directory

```
DATA_DIR/
  database.sqlite      SQLite (WAL mode)
  media/               uploaded images, <uuid>.webp
  content.json         published snapshot served to the public site
```

## File Map

| File | Responsibility |
|---|---|
| `server/package.json`, `tsconfig.json`, `vitest.config.ts`, `build.mjs` | Package, type checking, tests, production bundle |
| `server/src/clock.ts` | `Clock` type |
| `server/src/config.ts` | Environment → `Config`; `dataPaths()` |
| `server/src/db/database.ts` | Open SQLite, pragmas, schema migrations |
| `server/src/audit/auditLog.ts` | Record, list, purge audit entries |
| `server/src/content/schemas.ts` | Areas, per-area input validation, derived alt text, friendly messages |
| `server/src/content/items.ts` | Item storage: create, update, hide, reorder, soft delete, restore, purge |
| `server/src/content/publish.ts` | Snapshot from DB, atomic `content.json` write, transactional publish, seeding |
| `server/src/media/images.ts` | Upload decoding, re-encoding, orphan sweep |
| `server/src/auth/crypto.ts` | Random tokens, SHA-256 |
| `server/src/auth/passwords.ts` + `common-passwords.json` | Argon2id, password policy |
| `server/src/auth/totp.ts` | Authenticator secrets, URIs, replay-safe verification |
| `server/src/auth/recoveryCodes.ts` | Generate, store hashed, consume |
| `server/src/auth/admins.ts` | Admin accounts, setup links, setup flow, reset |
| `server/src/auth/sessions.ts` | Session create/read/destroy/expiry |
| `server/src/auth/login.ts` | Login decision, lockout |
| `server/src/http/failureLimiter.ts` | Per-IP failure limiter |
| `server/src/http/httpError.ts` | `HttpError` (status + user-facing message) |
| `server/src/http/app.ts` | Fastify setup, auth guard, CSRF/Origin checks, error mapping |
| `server/src/http/authRoutes.ts`, `setupRoutes.ts`, `itemRoutes.ts`, `adminRoutes.ts` | Endpoints |
| `server/src/backup/backup.ts` | Consistent backup archive |
| `server/src/cliCommands.ts`, `cli.ts` | `create-admin`, `reset-admin`, `publish` |
| `server/src/server.ts` | Startup, seeding, maintenance schedule, listen |
| `server/test/helpers.ts` | Temp data dirs, test clock, authenticator codes, signed-in app |

## Endpoints

| Method and path | Auth | Purpose |
|---|---|---|
| `GET /api/health` | — | `{ ok: true }` |
| `POST /api/auth/login` | — | `{ email, password, code }` → cookie + `{ email, csrfToken, usedRecoveryCode }` |
| `GET /api/auth/me` | session | `{ email, csrfToken }` |
| `POST /api/auth/logout`, `/api/auth/logout-all` | session | End this / every session |
| `GET /api/setup/:token` | — | `{ email }` or 410 |
| `POST /api/setup/:token/begin` | — | `{ password }` → `{ otpauthUri, qrDataUrl, secret }` |
| `POST /api/setup/:token/complete` | — | `{ code }` → `{ recoveryCodes }` |
| `GET /api/items/:area` | session | `{ items }` (live items, including hidden) |
| `POST /api/items/:area` | session | `{ data }` → 201 `{ item }` |
| `PUT /api/items/:area/order` | session | `{ ids }` |
| `PUT /api/items/:area/:id` | session | `{ data, version }` → `{ item }`; 409 on version mismatch |
| `PUT /api/items/:area/:id/hidden` | session | `{ hidden }` → `{ item }` |
| `DELETE /api/items/:area/:id` | session | Soft delete → `{ item }` |
| `POST /api/items/:area/:id/restore` | session | → `{ item }` |
| `GET /api/deleted` | session | `{ items }` deleted within 30 days |
| `POST /api/uploads/:kind` | session | multipart `file`, kind `person` or `gallery` → `{ path }` |
| `GET /api/admins` | session | `{ admins }` |
| `POST /api/admins/:id/reset` | session | → `{ setupLink }`; not allowed on yourself |
| `GET /api/audit?before=&limit=` | session | `{ entries }` newest first |
| `GET /api/backup` | session | `.tar.gz` download |

`:area` is one of `projects`, `industryCards`, `people`, `gallery`.

---

### Task 1: Server package and database

**Files:**
- Create: `server/package.json`, `server/tsconfig.json`, `server/vitest.config.ts`, `server/.gitignore`, `server/src/clock.ts`, `server/src/db/database.ts`
- Modify: `vite.config.ts` (root)
- Test: `server/src/db/database.test.ts`

**Interfaces:**
- Produces: `type Clock = () => number` (epoch milliseconds); `type Db = Database.Database`; `openDatabase(file: string): Db`; `migrate(db: Db): void`. Tables: `admins`, `setup_tokens`, `recovery_codes`, `sessions`, `items`, `audit_log`.

- [ ] **Step 1: Create the package**

Create `server/package.json`:
```json
{
  "name": "am-tiet-api",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22" },
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "build": "node build.mjs",
    "cli": "tsx src/cli.ts"
  }
}
```

Run from `server/`:
```bash
npm install fastify@^5.12.5 @fastify/cookie@^11.1.2 @fastify/multipart@^10.1.2 better-sqlite3@^13.0.3 sharp@^0.35.5 @node-rs/argon2@^2.2.1 otpauth@^9.5.2 qrcode@^1.5.4 zod@^3.25.76 tar@^7.5.22
npm install --save-dev typescript@^5.9.2 vitest@^2.1.9 tsx@^4.23.15 esbuild@^0.28.2 @types/node@^22 @types/better-sqlite3 @types/qrcode
```

Create `server/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "types": ["node"],
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": [
    "src",
    "test",
    "../src/content/snapshot.ts",
    "../src/content/seedSnapshot.ts",
    "../src/content/siteContent.ts"
  ]
}
```

Create `server/vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    // Argon2 hashing is deliberately slow.
    testTimeout: 20_000
  }
});
```

Create `server/.gitignore`:
```
node_modules/
dist/
data/
data-*/
```

Create `server/src/clock.ts`:
```ts
/** Current time in epoch milliseconds. Injected everywhere so tests can move time. */
export type Clock = () => number;
```

In the root `vite.config.ts`, add inside the `test` block so the root test run skips the server package:
```ts
    exclude: ["**/node_modules/**", "**/dist/**", "server/**"],
```

- [ ] **Step 2: Write the failing test**

Create `server/src/db/database.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { migrate, openDatabase } from "./database";

describe("database", () => {
  it("creates every table", () => {
    const db = openDatabase(":memory:");
    const tables = (db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as { name: string }[])
      .map((row) => row.name)
      .sort();
    expect(tables).toEqual(["admins", "audit_log", "items", "recovery_codes", "sessions", "setup_tokens"]);
  });

  it("records the schema version and can migrate again without harm", () => {
    const db = openDatabase(":memory:");
    expect(db.pragma("user_version", { simple: true })).toBe(1);
    migrate(db);
    expect(db.pragma("user_version", { simple: true })).toBe(1);
  });

  it("enforces foreign keys and the area list", () => {
    const db = openDatabase(":memory:");
    expect(() =>
      db.prepare("INSERT INTO sessions (token_hash, admin_id, csrf_token, created_at, last_seen_at) VALUES ('t', 99, 'c', 0, 0)").run()
    ).toThrow(/FOREIGN KEY/);
    expect(() =>
      db
        .prepare("INSERT INTO items (id, area, position, data, created_at, updated_at) VALUES ('x', 'evil', 0, '{}', 0, 0)")
        .run()
    ).toThrow(/CHECK/);
  });
});
```

- [ ] **Step 3: Run it and watch it fail**

Run (from `server/`): `npx vitest run src/db/database.test.ts`
Expected: FAIL — `Failed to resolve import "./database"`.

- [ ] **Step 4: Implement**

Create `server/src/db/database.ts`:
```ts
import Database from "better-sqlite3";

export type Db = Database.Database;

// Append new migrations; never edit a released one.
const MIGRATIONS: readonly string[] = [
  `
  CREATE TABLE admins (
    id INTEGER PRIMARY KEY,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT,
    totp_secret TEXT,
    totp_last_step INTEGER,
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until INTEGER,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE setup_tokens (
    token_hash TEXT PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL,
    pending_password_hash TEXT,
    pending_totp_secret TEXT,
    used_at INTEGER
  );
  CREATE TABLE recovery_codes (
    id INTEGER PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    code_hash TEXT NOT NULL,
    used_at INTEGER
  );
  CREATE TABLE sessions (
    token_hash TEXT PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    csrf_token TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    last_seen_at INTEGER NOT NULL
  );
  CREATE TABLE items (
    id TEXT PRIMARY KEY,
    area TEXT NOT NULL CHECK (area IN ('projects', 'industryCards', 'people', 'gallery')),
    position INTEGER NOT NULL,
    hidden INTEGER NOT NULL DEFAULT 0 CHECK (hidden IN (0, 1)),
    data TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE INDEX items_by_area ON items (area, deleted_at, position);
  CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY,
    at INTEGER NOT NULL,
    admin_email TEXT,
    action TEXT NOT NULL,
    detail TEXT NOT NULL DEFAULT '',
    ip TEXT
  );
  CREATE INDEX audit_by_time ON audit_log (at);
  `
];

export function migrate(db: Db): void {
  const current = db.pragma("user_version", { simple: true }) as number;
  for (let version = current; version < MIGRATIONS.length; version++) {
    db.transaction(() => {
      db.exec(MIGRATIONS[version]);
      db.pragma(`user_version = ${version + 1}`);
    })();
  }
}

export function openDatabase(file: string): Db {
  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  migrate(db);
  return db;
}
```

- [ ] **Step 5: Verify and commit**

Run (from `server/`): `npm test && npm run typecheck`
Expected: 3 tests pass; typecheck exits 0.
Run (from the root): `npm run test`
Expected: passes, and no `server/` test file appears in the output.

```bash
git add server/package.json server/package-lock.json server/tsconfig.json server/vitest.config.ts server/.gitignore server/src/clock.ts server/src/db vite.config.ts
git commit -m "feat(api): server package and SQLite schema"
```

---

### Task 2: Audit log

**Files:**
- Create: `server/src/audit/auditLog.ts`
- Test: `server/src/audit/auditLog.test.ts`

**Interfaces:**
- Consumes: `Db`, `openDatabase` (Task 1).
- Produces:
  ```ts
  export type AuditAction =
    | "login" | "login_failed" | "logout" | "logout_all" | "recovery_code_used"
    | "admin_created" | "admin_reset" | "setup_completed"
    | "item_created" | "item_updated" | "item_hidden" | "item_shown" | "item_reordered"
    | "item_deleted" | "item_restored" | "backup_downloaded";
  export type AuditEntry = { id: number; at: number; adminEmail: string | null; action: AuditAction; detail: string; ip: string | null };
  export function recordAudit(db: Db, entry: { at: number; adminEmail: string | null; action: AuditAction; detail?: string; ip?: string | null }): void;
  export function listAudit(db: Db, options?: { before?: number; limit?: number }): AuditEntry[];
  export function purgeAudit(db: Db, now: number): number;
  export const AUDIT_RETENTION_MS: number; // 365 days
  ```

- [ ] **Step 1: Write the failing test**

Create `server/src/audit/auditLog.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { openDatabase } from "../db/database";
import { AUDIT_RETENTION_MS, listAudit, purgeAudit, recordAudit } from "./auditLog";

describe("audit log", () => {
  it("lists entries newest first and pages with a cursor", () => {
    const db = openDatabase(":memory:");
    for (let n = 1; n <= 5; n++) {
      recordAudit(db, { at: n, adminEmail: "a@thapar.edu", action: "item_updated", detail: `edit ${n}` });
    }
    const first = listAudit(db, { limit: 2 });
    expect(first.map((entry) => entry.detail)).toEqual(["edit 5", "edit 4"]);
    const next = listAudit(db, { before: first[1].id, limit: 2 });
    expect(next.map((entry) => entry.detail)).toEqual(["edit 3", "edit 2"]);
  });

  it("stores the IP address and defaults the detail to empty", () => {
    const db = openDatabase(":memory:");
    recordAudit(db, { at: 1, adminEmail: null, action: "login_failed", ip: "203.0.113.9" });
    expect(listAudit(db)[0]).toMatchObject({ adminEmail: null, action: "login_failed", detail: "", ip: "203.0.113.9" });
  });

  it("caps a page at 500 entries", () => {
    const db = openDatabase(":memory:");
    const insert = db.transaction(() => {
      for (let n = 0; n < 600; n++) recordAudit(db, { at: n, adminEmail: null, action: "login" });
    });
    insert();
    expect(listAudit(db, { limit: 10_000 })).toHaveLength(500);
  });

  it("purges entries older than one year", () => {
    const db = openDatabase(":memory:");
    const now = AUDIT_RETENTION_MS + 1_000;
    recordAudit(db, { at: 999, adminEmail: null, action: "login" });
    recordAudit(db, { at: now, adminEmail: null, action: "logout" });
    expect(purgeAudit(db, now)).toBe(1);
    expect(listAudit(db).map((entry) => entry.action)).toEqual(["logout"]);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/audit/auditLog.test.ts`
Expected: FAIL — `Failed to resolve import "./auditLog"`.

- [ ] **Step 3: Implement**

Create `server/src/audit/auditLog.ts`:
```ts
import type { Db } from "../db/database";

export type AuditAction =
  | "login"
  | "login_failed"
  | "logout"
  | "logout_all"
  | "recovery_code_used"
  | "admin_created"
  | "admin_reset"
  | "setup_completed"
  | "item_created"
  | "item_updated"
  | "item_hidden"
  | "item_shown"
  | "item_reordered"
  | "item_deleted"
  | "item_restored"
  | "backup_downloaded";

export type AuditEntry = {
  id: number;
  at: number;
  adminEmail: string | null;
  action: AuditAction;
  detail: string;
  ip: string | null;
};

export const AUDIT_RETENTION_MS = 365 * 24 * 60 * 60 * 1000;
const MAX_PAGE = 500;

export function recordAudit(
  db: Db,
  entry: { at: number; adminEmail: string | null; action: AuditAction; detail?: string; ip?: string | null }
): void {
  db.prepare("INSERT INTO audit_log (at, admin_email, action, detail, ip) VALUES (?, ?, ?, ?, ?)").run(
    entry.at,
    entry.adminEmail,
    entry.action,
    (entry.detail ?? "").slice(0, 500),
    entry.ip ?? null
  );
}

export function listAudit(db: Db, { before, limit = 100 }: { before?: number; limit?: number } = {}): AuditEntry[] {
  const pageSize = Math.min(Math.max(Math.trunc(limit), 1), MAX_PAGE);
  return db
    .prepare(
      `SELECT id, at, admin_email AS adminEmail, action, detail, ip
       FROM audit_log
       WHERE (? IS NULL OR id < ?)
       ORDER BY id DESC
       LIMIT ?`
    )
    .all(before ?? null, before ?? null, pageSize) as AuditEntry[];
}

export function purgeAudit(db: Db, now: number): number {
  return db.prepare("DELETE FROM audit_log WHERE at < ?").run(now - AUDIT_RETENTION_MS).changes;
}
```

- [ ] **Step 4: Verify and commit**

Run: `npm test && npm run typecheck`
Expected: all pass.
```bash
git add server/src/audit
git commit -m "feat(api): audit log"
```

---

### Task 3: Content validation

**Files:**
- Create: `server/src/content/schemas.ts`
- Test: `server/src/content/schemas.test.ts`

**Interfaces:**
- Consumes: `isSafeLinkUrl`, `isLinkedInUrl`, `isLocalImagePath` from `../../../src/content/snapshot` (Plan 1).
- Produces:
  ```ts
  export const AREAS: readonly ["projects", "industryCards", "people", "gallery"];
  export type Area = (typeof AREAS)[number];
  export function isArea(value: string): value is Area;
  export function toStoredData(area: Area, input: unknown, previous?: Record<string, unknown>): Record<string, unknown>; // throws ZodError
  export function friendlyValidationMessage(error: ZodError): string;
  export function itemLabel(area: Area, data: Record<string, unknown>): string; // for audit details
  ```

- [ ] **Step 1: Write the failing tests**

Create `server/src/content/schemas.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { friendlyValidationMessage, isArea, itemLabel, toStoredData } from "./schemas";

function messageOf(run: () => unknown): string {
  try {
    run();
  } catch (error) {
    if (error instanceof ZodError) return friendlyValidationMessage(error);
    throw error;
  }
  throw new Error("expected a validation error");
}

describe("areas", () => {
  it("recognises exactly the four areas", () => {
    expect(["projects", "industryCards", "people", "gallery"].every(isArea)).toBe(true);
    expect(isArea("admins")).toBe(false);
    expect(isArea("../etc")).toBe(false);
  });
});

describe("projects", () => {
  it("accepts a title alone and defaults the rest", () => {
    expect(toStoredData("projects", { title: "  DED composites  " })).toEqual({
      title: "DED composites",
      description: "",
      links: []
    });
  });

  it("normalises Windows line endings in descriptions", () => {
    expect(toStoredData("projects", { title: "T", description: "One\r\n\r\nTwo" }).description).toBe("One\n\nTwo");
  });

  it.each([
    [{ title: "" }, "Title is required"],
    [{ title: "x".repeat(301) }, "Title must be at most 300 characters"],
    [{ title: "T", description: "x".repeat(5001) }, "Description must be at most 5000 characters"],
    [{ title: "T", links: [{ label: "Bad", url: "javascript:alert(1)" }] }, "Link must start with https:// or http://"],
    [{ title: "T", links: Array.from({ length: 11 }, () => ({ label: "L", url: "https://a.org" })) }, "At most 10 links"],
    [{ title: "T", extra: "field" }, "Unrecognized key(s) in object: 'extra'"]
  ])("rejects %j", (input, message) => {
    expect(messageOf(() => toStoredData("projects", input))).toBe(message);
  });
});

describe("industry cards", () => {
  it("keeps a label only when one is given", () => {
    expect(
      toStoredData("industryCards", {
        heading: "Value to Industry",
        bullets: [{ text: "Repair", label: "Cost" }, { text: "Plain", label: "  " }]
      })
    ).toEqual({ heading: "Value to Industry", bullets: [{ text: "Repair", label: "Cost" }, { text: "Plain" }] });
  });

  it.each([
    [{ heading: "H", bullets: [] }, "Add at least one bullet"],
    [{ heading: "H", bullets: Array.from({ length: 13 }, () => ({ text: "t" })) }, "At most 12 bullets"],
    [{ heading: "H", bullets: [{ text: "t", label: "x".repeat(61) }] }, "Bullet label must be at most 60 characters"]
  ])("rejects %j", (input, message) => {
    expect(messageOf(() => toStoredData("industryCards", input))).toBe(message);
  });
});

describe("people", () => {
  const person = {
    name: "Jane Doe",
    designation: "Professor",
    institution: "TIET",
    photo: "/media/0b7c4f8e-8a8e-4a4e-9d57-1f2a3b4c5d6e.webp",
    linkedin: "https://in.linkedin.com/in/jane"
  };

  it("generates alt text for a new person", () => {
    expect(toStoredData("people", person).photoAlt).toBe("Photo of Jane Doe");
  });

  it("keeps existing alt text while the name is unchanged, regenerates it on rename", () => {
    const previous = { ...person, photoAlt: "Jane Doe, Dean of Research" };
    expect(toStoredData("people", person, previous).photoAlt).toBe("Jane Doe, Dean of Research");
    expect(toStoredData("people", { ...person, name: "Jane Smith" }, previous).photoAlt).toBe("Photo of Jane Smith");
  });

  it("accepts an empty LinkedIn link", () => {
    expect(toStoredData("people", { ...person, linkedin: "" }).linkedin).toBe("");
  });

  it.each([
    [{ linkedin: "https://linkedin.com.evil.example/in/x" }, "LinkedIn link must be an https://linkedin.com address"],
    [{ linkedin: "http://www.linkedin.com/in/x" }, "LinkedIn link must be an https://linkedin.com address"],
    [{ photo: "https://tracker.example/p.png" }, "Photo is not a valid uploaded image"],
    [{ photo: "/media/../../etc/passwd" }, "Photo is not a valid uploaded image"],
    [{ institution: "" }, "Institution is required"]
  ])("rejects %j", (change, message) => {
    expect(messageOf(() => toStoredData("people", { ...person, ...change }))).toBe(message);
  });
});

describe("gallery", () => {
  const photo = {
    image: "/media/0b7c4f8e-8a8e-4a4e-9d57-1f2a3b4c5d6e.webp",
    title: "DED system",
    description: "The DED system."
  };

  it("uses the description as alt text for a new photo and defaults the carousel flag off", () => {
    expect(toStoredData("gallery", photo)).toEqual({ ...photo, inHomeCarousel: false, alt: "The DED system." });
  });

  it("keeps existing alt text while the description is unchanged", () => {
    const previous = { ...photo, inHomeCarousel: true, alt: "Exterior of the DED machine" };
    expect(toStoredData("gallery", photo, previous).alt).toBe("Exterior of the DED machine");
    expect(toStoredData("gallery", { ...photo, description: "New words." }, previous).alt).toBe("New words.");
  });

  it("rejects a title over 60 characters", () => {
    expect(messageOf(() => toStoredData("gallery", { ...photo, title: "x".repeat(61) }))).toBe(
      "Title must be at most 60 characters"
    );
  });
});

describe("itemLabel", () => {
  it("names an item by its main field, trimmed to 80 characters", () => {
    expect(itemLabel("people", { name: "Jane Doe" })).toBe("Jane Doe");
    expect(itemLabel("industryCards", { heading: "Value" })).toBe("Value");
    expect(itemLabel("projects", { title: "x".repeat(100) })).toHaveLength(80);
  });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx vitest run src/content/schemas.test.ts`
Expected: FAIL — `Failed to resolve import "./schemas"`.

- [ ] **Step 3: Implement**

Create `server/src/content/schemas.ts`:
```ts
import { ZodError, z } from "zod";
import { isLinkedInUrl, isLocalImagePath, isSafeLinkUrl } from "../../../src/content/snapshot";

export const AREAS = ["projects", "industryCards", "people", "gallery"] as const;
export type Area = (typeof AREAS)[number];

export function isArea(value: string): value is Area {
  return (AREAS as readonly string[]).includes(value);
}

function field(label: string, max: number) {
  return z
    .string({ required_error: `${label} is required`, invalid_type_error: `${label} must be text` })
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be at most ${max} characters`);
}

function imagePath(label: string) {
  return z
    .string({ required_error: `${label} is required`, invalid_type_error: `${label} is not a valid uploaded image` })
    .refine(isLocalImagePath, `${label} is not a valid uploaded image`);
}

const projectInput = z
  .object({
    title: field("Title", 300),
    description: z
      .string({ invalid_type_error: "Description must be text" })
      .max(5000, "Description must be at most 5000 characters")
      .default("")
      .transform((value) => value.replace(/\r\n?/g, "\n").trim()),
    links: z
      .array(
        z
          .object({
            label: field("Link label", 100),
            url: z.string().trim().refine(isSafeLinkUrl, "Link must start with https:// or http://")
          })
          .strict()
      )
      .max(10, "At most 10 links")
      .default([])
  })
  .strict();

const industryCardInput = z
  .object({
    heading: field("Heading", 100),
    bullets: z
      .array(
        z
          .object({
            text: field("Bullet text", 300),
            label: z.string().trim().max(60, "Bullet label must be at most 60 characters").optional()
          })
          .strict()
      )
      .min(1, "Add at least one bullet")
      .max(12, "At most 12 bullets")
  })
  .strict();

const personInput = z
  .object({
    name: field("Name", 150),
    designation: field("Designation", 150),
    institution: field("Institution", 150),
    photo: imagePath("Photo"),
    linkedin: z
      .string()
      .trim()
      .max(300, "LinkedIn link must be at most 300 characters")
      .refine((value) => value === "" || isLinkedInUrl(value), "LinkedIn link must be an https://linkedin.com address")
      .default("")
  })
  .strict();

const galleryInput = z
  .object({
    image: imagePath("Photo"),
    title: field("Title", 60),
    description: field("Description", 400),
    inHomeCarousel: z.boolean().default(false)
  })
  .strict();

const INPUT_SCHEMAS = {
  projects: projectInput,
  industryCards: industryCardInput,
  people: personInput,
  gallery: galleryInput
};

/** Validates editor input and adds the fields editors never type: screen-reader alt text. */
export function toStoredData(
  area: Area,
  input: unknown,
  previous?: Record<string, unknown>
): Record<string, unknown> {
  const data = INPUT_SCHEMAS[area].parse(input) as Record<string, unknown>;

  if (area === "industryCards") {
    data.bullets = (data.bullets as { text: string; label?: string }[]).map(({ text, label }) =>
      label ? { text, label } : { text }
    );
  }
  if (area === "people") {
    const keep = previous?.name === data.name && typeof previous?.photoAlt === "string";
    data.photoAlt = keep ? previous!.photoAlt : `Photo of ${data.name}`;
  }
  if (area === "gallery") {
    const keep = previous?.description === data.description && typeof previous?.alt === "string";
    data.alt = keep ? previous!.alt : data.description;
  }
  return data;
}

export function friendlyValidationMessage(error: ZodError): string {
  return error.issues[0]?.message ?? "Some fields are not valid.";
}

const LABEL_FIELD: Record<Area, string> = {
  projects: "title",
  industryCards: "heading",
  people: "name",
  gallery: "title"
};

export function itemLabel(area: Area, data: Record<string, unknown>): string {
  return String(data[LABEL_FIELD[area]] ?? "").slice(0, 80);
}
```

- [ ] **Step 4: Verify and commit**

Run: `npm test && npm run typecheck`
Expected: all pass.
```bash
git add server/src/content/schemas.ts server/src/content/schemas.test.ts
git commit -m "feat(api): validate content for the four areas"
```

---

### Task 4: Item storage

**Files:**
- Create: `server/src/content/items.ts`
- Test: `server/src/content/items.test.ts`

**Interfaces:**
- Consumes: `Db` (Task 1), `Area` (Task 3).
- Produces:
  ```ts
  export type Item = { id: string; area: Area; position: number; hidden: boolean; data: Record<string, unknown>; version: number; deletedAt: number | null; updatedAt: number };
  export class ConflictError extends Error {}
  export class NotFoundError extends Error {}
  export const RESTORE_WINDOW_MS: number; // 30 days
  export function listItems(db: Db, area: Area): Item[];            // live, by position
  export function listDeleted(db: Db): Item[];                       // deleted, newest first
  export function getItem(db: Db, area: Area, id: string): Item | null;
  export function createItem(db: Db, area: Area, data: Record<string, unknown>, now: number, id?: string): Item;
  export function updateItem(db: Db, area: Area, id: string, data: Record<string, unknown>, expectedVersion: number, now: number): Item;
  export function setHidden(db: Db, area: Area, id: string, hidden: boolean, now: number): Item;
  export function reorderItems(db: Db, area: Area, ids: string[], now: number): void;
  export function softDeleteItem(db: Db, area: Area, id: string, now: number): Item;
  export function restoreItem(db: Db, area: Area, id: string, now: number): Item;
  export function purgeDeleted(db: Db, now: number): number;
  export function countItems(db: Db): number;
  export function referencedImagePaths(db: Db): Set<string>;  // every photo/image path, deleted items included
  ```
- `version` changes only when `data` changes. Hiding, reordering, deleting and restoring never cause a conflict for someone editing the item.

- [ ] **Step 1: Write the failing tests**

Create `server/src/content/items.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { openDatabase } from "../db/database";
import {
  ConflictError,
  NotFoundError,
  RESTORE_WINDOW_MS,
  countItems,
  createItem,
  getItem,
  listDeleted,
  listItems,
  purgeDeleted,
  referencedImagePaths,
  reorderItems,
  restoreItem,
  setHidden,
  softDeleteItem,
  updateItem
} from "./items";

const titles = (db: ReturnType<typeof openDatabase>) => listItems(db, "projects").map((item) => item.data.title);

describe("items", () => {
  it("creates items at the end of their area with version 1", () => {
    const db = openDatabase(":memory:");
    createItem(db, "projects", { title: "A" }, 1);
    const b = createItem(db, "projects", { title: "B" }, 2);
    createItem(db, "gallery", { title: "G" }, 3);
    expect(titles(db)).toEqual(["A", "B"]);
    expect(b).toMatchObject({ area: "projects", position: 1, hidden: false, version: 1, deletedAt: null });
  });

  it("updates data and bumps the version", () => {
    const db = openDatabase(":memory:");
    const a = createItem(db, "projects", { title: "A" }, 1);
    const updated = updateItem(db, "projects", a.id, { title: "A2" }, 1, 5);
    expect(updated).toMatchObject({ version: 2, updatedAt: 5, data: { title: "A2" } });
  });

  it("refuses an update based on an old version", () => {
    const db = openDatabase(":memory:");
    const a = createItem(db, "projects", { title: "A" }, 1);
    updateItem(db, "projects", a.id, { title: "first editor" }, 1, 2);
    expect(() => updateItem(db, "projects", a.id, { title: "second editor" }, 1, 3)).toThrow(ConflictError);
    expect(getItem(db, "projects", a.id)?.data.title).toBe("first editor");
  });

  it("does not find an item through the wrong area", () => {
    const db = openDatabase(":memory:");
    const a = createItem(db, "projects", { title: "A" }, 1);
    expect(getItem(db, "gallery", a.id)).toBeNull();
    expect(() => updateItem(db, "gallery", a.id, {}, 1, 2)).toThrow(NotFoundError);
  });

  it("hides and shows without changing the version", () => {
    const db = openDatabase(":memory:");
    const a = createItem(db, "projects", { title: "A" }, 1);
    expect(setHidden(db, "projects", a.id, true, 2)).toMatchObject({ hidden: true, version: 1 });
    expect(setHidden(db, "projects", a.id, false, 3).hidden).toBe(false);
  });

  it("reorders when given exactly the live ids", () => {
    const db = openDatabase(":memory:");
    const [a, b, c] = ["A", "B", "C"].map((title, n) => createItem(db, "projects", { title }, n));
    reorderItems(db, "projects", [c.id, a.id, b.id], 9);
    expect(titles(db)).toEqual(["C", "A", "B"]);
    expect(getItem(db, "projects", c.id)?.version).toBe(1);
  });

  it.each([
    ["a missing id", (ids: string[]) => ids.slice(1)],
    ["a duplicate id", (ids: string[]) => [ids[0], ids[0], ids[1]]],
    ["an unknown id", (ids: string[]) => [...ids.slice(1), "nope"]]
  ])("refuses a reorder with %s", (_label, mangle) => {
    const db = openDatabase(":memory:");
    const ids = ["A", "B", "C"].map((title, n) => createItem(db, "projects", { title }, n).id);
    expect(() => reorderItems(db, "projects", mangle(ids), 9)).toThrow(ConflictError);
    expect(titles(db)).toEqual(["A", "B", "C"]);
  });

  it("soft-deletes, lists and restores to the end", () => {
    const db = openDatabase(":memory:");
    const a = createItem(db, "projects", { title: "A" }, 1);
    createItem(db, "projects", { title: "B" }, 2);
    softDeleteItem(db, "projects", a.id, 10);
    expect(titles(db)).toEqual(["B"]);
    expect(listDeleted(db).map((item) => item.id)).toEqual([a.id]);
    expect(() => softDeleteItem(db, "projects", a.id, 11)).toThrow(NotFoundError);
    restoreItem(db, "projects", a.id, 12);
    expect(titles(db)).toEqual(["B", "A"]);
    expect(() => restoreItem(db, "projects", a.id, 13)).toThrow(NotFoundError);
  });

  it("purges only items deleted more than 30 days ago", () => {
    const db = openDatabase(":memory:");
    const old = createItem(db, "projects", { title: "old" }, 0);
    const recent = createItem(db, "projects", { title: "recent" }, 0);
    softDeleteItem(db, "projects", old.id, 0);
    softDeleteItem(db, "projects", recent.id, RESTORE_WINDOW_MS);
    expect(purgeDeleted(db, RESTORE_WINDOW_MS + 1)).toBe(1);
    expect(listDeleted(db).map((item) => item.id)).toEqual([recent.id]);
    expect(countItems(db)).toBe(1);
  });

  it("collects every referenced image path, deleted items included", () => {
    const db = openDatabase(":memory:");
    createItem(db, "people", { photo: "/media/a.webp" }, 1);
    const gone = createItem(db, "gallery", { image: "/media/b.webp" }, 1);
    softDeleteItem(db, "gallery", gone.id, 2);
    createItem(db, "projects", { title: "no image" }, 1);
    expect(referencedImagePaths(db)).toEqual(new Set(["/media/a.webp", "/media/b.webp"]));
  });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx vitest run src/content/items.test.ts`
Expected: FAIL — `Failed to resolve import "./items"`.

- [ ] **Step 3: Implement**

Create `server/src/content/items.ts`:
```ts
import { randomUUID } from "node:crypto";
import type { Db } from "../db/database";
import type { Area } from "./schemas";

export type Item = {
  id: string;
  area: Area;
  position: number;
  hidden: boolean;
  data: Record<string, unknown>;
  version: number;
  deletedAt: number | null;
  updatedAt: number;
};

export class ConflictError extends Error {
  constructor(message = "This was changed by someone else — reload to see their version.") {
    super(message);
  }
}

export class NotFoundError extends Error {
  constructor() {
    super("That item no longer exists.");
  }
}

export const RESTORE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

type Row = {
  id: string;
  area: Area;
  position: number;
  hidden: number;
  data: string;
  version: number;
  deleted_at: number | null;
  updated_at: number;
};

const COLUMNS = "id, area, position, hidden, data, version, deleted_at, updated_at";

function toItem(row: Row): Item {
  return {
    id: row.id,
    area: row.area,
    position: row.position,
    hidden: row.hidden === 1,
    data: JSON.parse(row.data) as Record<string, unknown>,
    version: row.version,
    deletedAt: row.deleted_at,
    updatedAt: row.updated_at
  };
}

export function listItems(db: Db, area: Area): Item[] {
  const rows = db
    .prepare(`SELECT ${COLUMNS} FROM items WHERE area = ? AND deleted_at IS NULL ORDER BY position, created_at`)
    .all(area) as Row[];
  return rows.map(toItem);
}

export function listDeleted(db: Db): Item[] {
  const rows = db
    .prepare(`SELECT ${COLUMNS} FROM items WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC`)
    .all() as Row[];
  return rows.map(toItem);
}

export function getItem(db: Db, area: Area, id: string): Item | null {
  const row = db.prepare(`SELECT ${COLUMNS} FROM items WHERE id = ? AND area = ?`).get(id, area) as Row | undefined;
  return row ? toItem(row) : null;
}

function nextPosition(db: Db, area: Area): number {
  const row = db
    .prepare("SELECT COALESCE(MAX(position), -1) + 1 AS next FROM items WHERE area = ? AND deleted_at IS NULL")
    .get(area) as { next: number };
  return row.next;
}

function requireLive(db: Db, area: Area, id: string): Item {
  const item = getItem(db, area, id);
  if (!item || item.deletedAt !== null) throw new NotFoundError();
  return item;
}

export function createItem(
  db: Db,
  area: Area,
  data: Record<string, unknown>,
  now: number,
  id: string = randomUUID()
): Item {
  db.prepare(
    "INSERT INTO items (id, area, position, hidden, data, version, created_at, updated_at) VALUES (?, ?, ?, 0, ?, 1, ?, ?)"
  ).run(id, area, nextPosition(db, area), JSON.stringify(data), now, now);
  return getItem(db, area, id)!;
}

export function updateItem(
  db: Db,
  area: Area,
  id: string,
  data: Record<string, unknown>,
  expectedVersion: number,
  now: number
): Item {
  const item = requireLive(db, area, id);
  if (item.version !== expectedVersion) throw new ConflictError();
  db.prepare("UPDATE items SET data = ?, version = version + 1, updated_at = ? WHERE id = ?").run(
    JSON.stringify(data),
    now,
    id
  );
  return getItem(db, area, id)!;
}

export function setHidden(db: Db, area: Area, id: string, hidden: boolean, now: number): Item {
  requireLive(db, area, id);
  db.prepare("UPDATE items SET hidden = ?, updated_at = ? WHERE id = ?").run(hidden ? 1 : 0, now, id);
  return getItem(db, area, id)!;
}

export function reorderItems(db: Db, area: Area, ids: string[], now: number): void {
  const current = listItems(db, area).map((item) => item.id);
  const matches =
    ids.length === current.length && new Set(ids).size === ids.length && ids.every((id) => current.includes(id));
  if (!matches) throw new ConflictError("The list changed while you were reordering — reload and try again.");
  const move = db.prepare("UPDATE items SET position = ?, updated_at = ? WHERE id = ?");
  ids.forEach((id, index) => move.run(index, now, id));
}

export function softDeleteItem(db: Db, area: Area, id: string, now: number): Item {
  requireLive(db, area, id);
  db.prepare("UPDATE items SET deleted_at = ?, updated_at = ? WHERE id = ?").run(now, now, id);
  return getItem(db, area, id)!;
}

export function restoreItem(db: Db, area: Area, id: string, now: number): Item {
  const item = getItem(db, area, id);
  if (!item || item.deletedAt === null) throw new NotFoundError();
  db.prepare("UPDATE items SET deleted_at = NULL, position = ?, updated_at = ? WHERE id = ?").run(
    nextPosition(db, area),
    now,
    id
  );
  return getItem(db, area, id)!;
}

export function purgeDeleted(db: Db, now: number): number {
  return db
    .prepare("DELETE FROM items WHERE deleted_at IS NOT NULL AND deleted_at < ?")
    .run(now - RESTORE_WINDOW_MS).changes;
}

export function countItems(db: Db): number {
  return (db.prepare("SELECT COUNT(*) AS n FROM items").get() as { n: number }).n;
}

export function referencedImagePaths(db: Db): Set<string> {
  const rows = db
    .prepare(
      "SELECT json_extract(data, '$.photo') AS photo, json_extract(data, '$.image') AS image FROM items WHERE area IN ('people', 'gallery')"
    )
    .all() as { photo: string | null; image: string | null }[];
  const paths = new Set<string>();
  for (const row of rows) {
    if (row.photo) paths.add(row.photo);
    if (row.image) paths.add(row.image);
  }
  return paths;
}
```

- [ ] **Step 4: Verify and commit**

Run: `npm test && npm run typecheck`
Expected: all pass.
```bash
git add server/src/content/items.ts server/src/content/items.test.ts
git commit -m "feat(api): item storage with versions, soft delete and ordering"
```

---

### Task 5: Publishing and seeding

**Files:**
- Create: `server/src/content/publish.ts`
- Test: `server/src/content/publish.test.ts`

**Interfaces:**
- Consumes: items functions (Task 4), `AREAS` (Task 3), `buildSeedSnapshot`, `serializeSnapshot` (Plan 1 `src/content/seedSnapshot.ts`), `SiteSnapshot`, `parseSnapshot` (Plan 1 `src/content/snapshot.ts`).
- Produces:
  ```ts
  export class PublishError extends Error {} // message "Not published — try again."
  export type PublishContext = { db: Db; dataDir: string };
  export function buildSnapshot(db: Db): SiteSnapshot;
  export function writeSnapshotFile(dataDir: string, snapshot: SiteSnapshot): void;
  export function publishChange<T>(ctx: PublishContext, change: () => T, write?: typeof writeSnapshotFile): T;
  export function republish(ctx: PublishContext): void;
  export function seedIfEmpty(db: Db, now: number): boolean;
  ```

- [ ] **Step 1: Write the failing tests**

Create `server/src/content/publish.test.ts`:
```ts
import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildSeedSnapshot } from "../../../src/content/seedSnapshot";
import { parseSnapshot } from "../../../src/content/snapshot";
import { openDatabase } from "../db/database";
import { createItem, listItems, setHidden, softDeleteItem } from "./items";
import { PublishError, buildSnapshot, publishChange, republish, seedIfEmpty } from "./publish";

function setup() {
  const dataDir = mkdtempSync(join(tmpdir(), "am-tiet-publish-"));
  const db = openDatabase(":memory:");
  return { db, dataDir, ctx: { db, dataDir } };
}

const readSnapshot = (dataDir: string) => JSON.parse(readFileSync(join(dataDir, "content.json"), "utf8"));

describe("publishing", () => {
  it("seeds an empty database with today's site content, once", () => {
    const { db } = setup();
    expect(seedIfEmpty(db, 1)).toBe(true);
    expect(buildSnapshot(db)).toEqual(buildSeedSnapshot());
    expect(seedIfEmpty(db, 2)).toBe(false);
    expect(listItems(db, "people")).toHaveLength(28);
  });

  it("builds a snapshot the public validator accepts unchanged", () => {
    const { db } = setup();
    seedIfEmpty(db, 1);
    const snapshot = buildSnapshot(db);
    expect(parseSnapshot(JSON.parse(JSON.stringify(snapshot)))).toEqual(snapshot);
  });

  it("leaves hidden and deleted items out, in list order", () => {
    const { db } = setup();
    const a = createItem(db, "projects", { title: "A", description: "", links: [] }, 1);
    const b = createItem(db, "projects", { title: "B", description: "", links: [] }, 1);
    createItem(db, "projects", { title: "C", description: "", links: [] }, 1);
    setHidden(db, "projects", a.id, true, 2);
    softDeleteItem(db, "projects", b.id, 2);
    expect(buildSnapshot(db).projects.map((project) => project.title)).toEqual(["C"]);
  });

  it("writes content.json as part of a change", () => {
    const { db, dataDir, ctx } = setup();
    publishChange(ctx, () => createItem(db, "projects", { title: "New", description: "", links: [] }, 1));
    expect(readSnapshot(dataDir).projects.map((project: { title: string }) => project.title)).toEqual(["New"]);
    expect(readdirSync(dataDir)).toEqual(["content.json"]);
  });

  it("rolls the change back when content.json cannot be written", () => {
    const { db, ctx } = setup();
    const failingWrite = () => {
      throw new Error("disk full");
    };
    expect(() =>
      publishChange(ctx, () => createItem(db, "projects", { title: "Lost", description: "", links: [] }, 1), failingWrite)
    ).toThrow(PublishError);
    expect(listItems(db, "projects")).toEqual([]);
  });

  it("rebuilds content.json from the database on demand", () => {
    const { db, dataDir, ctx } = setup();
    seedIfEmpty(db, 1);
    republish(ctx);
    expect(readSnapshot(dataDir).gallery).toHaveLength(6);
  });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx vitest run src/content/publish.test.ts`
Expected: FAIL — `Failed to resolve import "./publish"`.

- [ ] **Step 3: Implement**

Create `server/src/content/publish.ts`:
```ts
import { renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildSeedSnapshot, serializeSnapshot } from "../../../src/content/seedSnapshot";
import type { GalleryPhoto, IndustryCard, Person, Project, SiteSnapshot } from "../../../src/content/snapshot";
import type { Db } from "../db/database";
import { countItems, createItem, listItems } from "./items";
import { AREAS, type Area } from "./schemas";

export class PublishError extends Error {
  constructor() {
    super("Not published — try again.");
  }
}

export type PublishContext = { db: Db; dataDir: string };

function visible(db: Db, area: Area): Record<string, unknown>[] {
  return listItems(db, area)
    .filter((item) => !item.hidden)
    .map((item) => ({ id: item.id, ...item.data }));
}

export function buildSnapshot(db: Db): SiteSnapshot {
  return {
    version: 1,
    projects: visible(db, "projects") as Project[],
    industryCards: visible(db, "industryCards") as IndustryCard[],
    people: visible(db, "people") as Person[],
    gallery: visible(db, "gallery") as GalleryPhoto[]
  };
}

/** Write to a temporary file, then rename: a reader never sees half a file. */
export function writeSnapshotFile(dataDir: string, snapshot: SiteSnapshot): void {
  const target = join(dataDir, "content.json");
  const temporary = `${target}.${process.pid}.tmp`;
  writeFileSync(temporary, serializeSnapshot(snapshot));
  renameSync(temporary, target);
}

/** Runs a change and republishes in one transaction; a failed write undoes the change. */
export function publishChange<T>(ctx: PublishContext, change: () => T, write = writeSnapshotFile): T {
  return ctx.db.transaction(() => {
    const result = change();
    try {
      write(ctx.dataDir, buildSnapshot(ctx.db));
    } catch {
      throw new PublishError();
    }
    return result;
  })();
}

export function republish(ctx: PublishContext): void {
  writeSnapshotFile(ctx.dataDir, buildSnapshot(ctx.db));
}

export function seedIfEmpty(db: Db, now: number): boolean {
  if (countItems(db) > 0) return false;
  const seed = buildSeedSnapshot();
  db.transaction(() => {
    for (const area of AREAS) {
      for (const { id, ...data } of seed[area] as { id: string }[]) {
        createItem(db, area, data, now, id);
      }
    }
  })();
  return true;
}
```

- [ ] **Step 4: Verify and commit**

Run: `npm test && npm run typecheck`
Expected: all pass.
```bash
git add server/src/content/publish.ts server/src/content/publish.test.ts
git commit -m "feat(api): publish content.json atomically inside each change"
```

---

### Task 6: Image uploads

**Files:**
- Create: `server/src/media/images.ts`
- Test: `server/src/media/images.test.ts`

**Interfaces:**
- Consumes: `referencedImagePaths` (Task 4), `Db` (Task 1).
- Produces:
  ```ts
  export class ImageRejectedError extends Error {}
  export type ImageKind = "person" | "gallery";
  export const MAX_UPLOAD_BYTES: number;   // 10 MB
  export const MAX_INPUT_PIXELS: number;   // 40 megapixels
  export const ORPHAN_GRACE_MS: number;    // 24 hours
  export function processUpload(input: Buffer, kind: ImageKind, mediaDir: string): Promise<string>; // "/media/<uuid>.webp"
  export function sweepOrphanMedia(db: Db, mediaDir: string, now: number): number;
  ```

- [ ] **Step 1: Write the failing tests**

Create `server/src/media/images.test.ts`:
```ts
import { existsSync, mkdtempSync, readdirSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { openDatabase } from "../db/database";
import { createItem } from "../content/items";
import { ImageRejectedError, ORPHAN_GRACE_MS, processUpload, sweepOrphanMedia } from "./images";

const mediaDir = () => mkdtempSync(join(tmpdir(), "am-tiet-media-"));

function solid(width: number, height: number) {
  return sharp({ create: { width, height, channels: 3, background: { r: 30, g: 90, b: 160 } } });
}

describe("processUpload", () => {
  it.each([
    ["JPEG", () => solid(2000, 1500).jpeg().toBuffer()],
    ["PNG", () => solid(2000, 1500).png().toBuffer()],
    ["WebP", () => solid(2000, 1500).webp().toBuffer()]
  ])("re-encodes a %s gallery photo to WebP within 1600 px", async (_format, make) => {
    const dir = mediaDir();
    const path = await processUpload(await make(), "gallery", dir);
    expect(path).toMatch(/^\/media\/[0-9a-f-]{36}\.webp$/);
    const meta = await sharp(join(dir, path.slice("/media/".length))).metadata();
    expect(meta).toMatchObject({ format: "webp", width: 1600, height: 1200 });
  });

  it("does not enlarge a small gallery photo", async () => {
    const dir = mediaDir();
    const path = await processUpload(await solid(800, 600).jpeg().toBuffer(), "gallery", dir);
    expect(await sharp(join(dir, path.slice(7))).metadata()).toMatchObject({ width: 800, height: 600 });
  });

  it("crops a person photo to a 480 px square", async () => {
    const dir = mediaDir();
    const path = await processUpload(await solid(1200, 1600).jpeg().toBuffer(), "person", dir);
    expect(await sharp(join(dir, path.slice(7))).metadata()).toMatchObject({ width: 480, height: 480 });
  });

  it("removes all metadata, including location", async () => {
    const dir = mediaDir();
    const input = await solid(400, 300)
      .withExif({ IFD0: { Copyright: "secret-owner", Artist: "hidden-name" } })
      .jpeg()
      .toBuffer();
    expect((await sharp(input).metadata()).exif).toBeDefined();
    const path = await processUpload(input, "gallery", dir);
    const meta = await sharp(join(dir, path.slice(7))).metadata();
    expect(meta.exif).toBeUndefined();
    expect(meta.icc).toBeUndefined();
  });

  it.each([
    ["an SVG", Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')],
    ["a text file", Buffer.from("just some text pretending to be a photo")],
    ["an HTML file", Buffer.from("<!doctype html><script>alert(1)</script>")],
    ["an empty file", Buffer.alloc(0)]
  ])("rejects %s and writes nothing", async (_label, input) => {
    const dir = mediaDir();
    await expect(processUpload(input, "gallery", dir)).rejects.toBeInstanceOf(ImageRejectedError);
    expect(readdirSync(dir)).toEqual([]);
  });

  it("rejects a GIF", async () => {
    const dir = mediaDir();
    await expect(processUpload(await solid(10, 10).gif().toBuffer(), "gallery", dir)).rejects.toBeInstanceOf(
      ImageRejectedError
    );
  });

  it("rejects an image with more than 40 megapixels before decoding it", async () => {
    const dir = mediaDir();
    const huge = await solid(8000, 6000).png({ compressionLevel: 9 }).toBuffer();
    await expect(processUpload(huge, "gallery", dir)).rejects.toBeInstanceOf(ImageRejectedError);
    expect(readdirSync(dir)).toEqual([]);
  });
});

describe("sweepOrphanMedia", () => {
  it("removes unreferenced files older than 24 hours and keeps everything else", () => {
    const dir = mediaDir();
    const db = openDatabase(":memory:");
    const now = Date.now();
    const old = (now - ORPHAN_GRACE_MS - 60_000) / 1000;
    for (const name of ["used.webp", "deleted-item.webp", "orphan.webp", "fresh.webp"]) {
      writeFileSync(join(dir, name), "x");
    }
    for (const name of ["used.webp", "deleted-item.webp", "orphan.webp"]) utimesSync(join(dir, name), old, old);
    createItem(db, "people", { photo: "/media/used.webp" }, now);
    const gone = createItem(db, "gallery", { image: "/media/deleted-item.webp" }, now);
    db.prepare("UPDATE items SET deleted_at = ? WHERE id = ?").run(now, gone.id);

    expect(sweepOrphanMedia(db, dir, now)).toBe(1);
    expect(existsSync(join(dir, "orphan.webp"))).toBe(false);
    expect(readdirSync(dir).sort()).toEqual(["deleted-item.webp", "fresh.webp", "used.webp"]);
  });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx vitest run src/media/images.test.ts`
Expected: FAIL — `Failed to resolve import "./images"`.

- [ ] **Step 3: Implement**

Create `server/src/media/images.ts`:
```ts
import { randomUUID } from "node:crypto";
import { readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import type { Db } from "../db/database";
import { referencedImagePaths } from "../content/items";

export class ImageRejectedError extends Error {
  constructor(message = "Photo must be a JPG, PNG or WebP image under 10 MB.") {
    super(message);
  }
}

export type ImageKind = "person" | "gallery";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_INPUT_PIXELS = 40_000_000;
export const ORPHAN_GRACE_MS = 24 * 60 * 60 * 1000;
const ACCEPTED_FORMATS = new Set(["jpeg", "png", "webp"]);

/**
 * Decodes the upload, refuses anything that is not a real JPEG/PNG/WebP, and
 * writes a freshly encoded WebP. Nothing from the original file survives:
 * metadata is dropped and the pixels are re-encoded.
 */
export async function processUpload(input: Buffer, kind: ImageKind, mediaDir: string): Promise<string> {
  if (input.length === 0 || input.length > MAX_UPLOAD_BYTES) throw new ImageRejectedError();

  let output: Buffer;
  try {
    const meta = await sharp(input).metadata();
    if (!meta.format || !ACCEPTED_FORMATS.has(meta.format)) throw new ImageRejectedError();
    if (!meta.width || !meta.height || meta.width * meta.height > MAX_INPUT_PIXELS) {
      throw new ImageRejectedError("Photo is too large. Use an image under 40 megapixels.");
    }

    const image = sharp(input, { limitInputPixels: MAX_INPUT_PIXELS }).rotate();
    const resized =
      kind === "person"
        ? image.resize(480, 480, { fit: "cover", position: "centre" })
        : image.resize(1600, 1600, { fit: "inside", withoutEnlargement: true });
    output = await resized.webp({ quality: 82 }).toBuffer();
  } catch (error) {
    if (error instanceof ImageRejectedError) throw error;
    throw new ImageRejectedError();
  }

  const name = `${randomUUID()}.webp`;
  writeFileSync(join(mediaDir, name), output, { flag: "wx" });
  return `/media/${name}`;
}

/** Deletes uploads no item refers to (deleted items included) once they are a day old. */
export function sweepOrphanMedia(db: Db, mediaDir: string, now: number): number {
  const referenced = referencedImagePaths(db);
  let removed = 0;
  for (const name of readdirSync(mediaDir)) {
    const full = join(mediaDir, name);
    if (referenced.has(`/media/${name}`)) continue;
    if (now - statSync(full).mtimeMs < ORPHAN_GRACE_MS) continue;
    rmSync(full, { force: true });
    removed += 1;
  }
  return removed;
}
```

- [ ] **Step 4: Verify and commit**

Run: `npm test && npm run typecheck`
Expected: all pass. If the "more than 40 megapixels" test is slow (building an 8000×6000 PNG), that is expected; it must still pass under the 20-second timeout.
```bash
git add server/src/media
git commit -m "feat(api): decode, re-encode and strip uploaded images"
```

---

### Task 7: Passwords, authenticator codes, recovery codes

**Files:**
- Create: `server/src/auth/crypto.ts`, `server/src/auth/passwords.ts`, `server/src/auth/common-passwords.json`, `server/src/auth/totp.ts`, `server/src/auth/recoveryCodes.ts`
- Test: `server/src/auth/passwords.test.ts`, `server/src/auth/totp.test.ts`, `server/src/auth/recoveryCodes.test.ts`

**Interfaces:**
- Consumes: `Db` (Task 1).
- Produces:
  ```ts
  // crypto.ts
  export function randomToken(): string;          // 32 random bytes, base64url
  export function sha256(value: string): string;  // hex
  // passwords.ts
  export function passwordProblem(password: string, email: string): string | null;
  export function hashPassword(password: string): Promise<string>;
  export function verifyPassword(stored: string, password: string): Promise<boolean>;
  export function dummyHash(): Promise<string>;
  // totp.ts
  export function newTotpSecret(): string;                       // base32
  export function totpUri(secret: string, email: string): string;
  export function checkTotp(secret: string, code: string, now: number, lastStep: number | null): number | null; // matched step
  // recoveryCodes.ts
  export function generateRecoveryCodes(count?: number): string[]; // "xxxx-xxxx-xxxx"
  export function replaceRecoveryCodes(db: Db, adminId: number): string[];
  export function consumeRecoveryCode(db: Db, adminId: number, code: string, now: number): boolean;
  ```

- [ ] **Step 1: Bundle the common-password list**

Run from `server/`:
```bash
curl -fsSL https://raw.githubusercontent.com/danielmiessler/SecLists/master/Passwords/Common-Credentials/100k-most-used-passwords-NCSC.txt \
  | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const l=[...new Set(s.split(/\r?\n/).map(x=>x.toLowerCase()).filter(x=>x.length>=12))].sort();require('fs').writeFileSync('src/auth/common-passwords.json',JSON.stringify(l)+'\n');console.log(l.length)})"
```
Expected: prints a number around 1,270. Only passwords of 12+ characters are kept, because shorter ones are rejected anyway. (The file comes from the UK NCSC's list of the 100,000 most-used breached passwords.)

- [ ] **Step 2: Write the failing tests**

Create `server/src/auth/passwords.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import common from "./common-passwords.json";
import { dummyHash, hashPassword, passwordProblem, verifyPassword } from "./passwords";

describe("password policy", () => {
  it("accepts a long, uncommon password", () => {
    expect(passwordProblem("correct horse battery staple 42", "admin@thapar.edu")).toBeNull();
  });

  it.each([
    ["too short", "short-pass1", "Password must be at least 12 characters."],
    ["too long", "x".repeat(257), "Password must be at most 256 characters."],
    ["containing the email name", "priya.sharma-2026!!", "Password must not contain your email name."]
  ])("rejects a password %s", (_label, password, message) => {
    expect(passwordProblem(password, "priya.sharma@thapar.edu")).toBe(message);
  });

  it("rejects a password from the common-password list, in any letter case", () => {
    const sample = (common as string[])[0];
    expect(passwordProblem(sample.toUpperCase(), "admin@thapar.edu")).toBe("This password is too common. Choose another.");
  });
});

describe("password hashing", () => {
  it("hashes with Argon2id and verifies", async () => {
    const stored = await hashPassword("correct horse battery staple 42");
    expect(stored.startsWith("$argon2id$")).toBe(true);
    expect(await verifyPassword(stored, "correct horse battery staple 42")).toBe(true);
    expect(await verifyPassword(stored, "correct horse battery staple 43")).toBe(false);
  });

  it("treats a malformed stored hash as a mismatch rather than crashing", async () => {
    expect(await verifyPassword("not-a-hash", "anything")).toBe(false);
  });

  it("provides a reusable dummy hash for equal-time failures", async () => {
    expect(await dummyHash()).toBe(await dummyHash());
  });
});
```

Create `server/src/auth/totp.test.ts`:
```ts
import { Secret, TOTP } from "otpauth";
import { describe, expect, it } from "vitest";
import { checkTotp, newTotpSecret, totpUri } from "./totp";

const at = Date.UTC(2026, 8, 27, 10, 0, 0);
const codeAt = (secret: string, time: number) => new TOTP({ secret: Secret.fromBase32(secret) }).generate({ timestamp: time });

describe("authenticator codes", () => {
  it("creates a 160-bit base32 secret and an otpauth URI naming the centre and the email", () => {
    const secret = newTotpSecret();
    expect(secret).toMatch(/^[A-Z2-7]{32}$/);
    const uri = totpUri(secret, "admin@thapar.edu");
    expect(uri).toMatch(/^otpauth:\/\/totp\//);
    expect(decodeURIComponent(uri)).toContain("CoE-AM Admin:admin@thapar.edu");
  });

  it("accepts the current code and one 30-second step either side", () => {
    const secret = newTotpSecret();
    const step = Math.floor(at / 30_000);
    expect(checkTotp(secret, codeAt(secret, at), at, null)).toBe(step);
    expect(checkTotp(secret, codeAt(secret, at - 30_000), at, null)).toBe(step - 1);
    expect(checkTotp(secret, codeAt(secret, at + 30_000), at, null)).toBe(step + 1);
    expect(checkTotp(secret, codeAt(secret, at - 90_000), at, null)).toBeNull();
  });

  it("refuses a code that was already used", () => {
    const secret = newTotpSecret();
    const step = Math.floor(at / 30_000);
    expect(checkTotp(secret, codeAt(secret, at), at, step)).toBeNull();
    expect(checkTotp(secret, codeAt(secret, at - 30_000), at, step)).toBeNull();
  });

  it("refuses anything that is not six digits", () => {
    const secret = newTotpSecret();
    expect(checkTotp(secret, "12345", at, null)).toBeNull();
    expect(checkTotp(secret, "abcdef", at, null)).toBeNull();
  });
});
```

Create `server/src/auth/recoveryCodes.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { openDatabase } from "../db/database";
import { consumeRecoveryCode, generateRecoveryCodes, replaceRecoveryCodes } from "./recoveryCodes";

function withAdmin() {
  const db = openDatabase(":memory:");
  db.prepare("INSERT INTO admins (id, email, created_at) VALUES (1, 'a@thapar.edu', 0)").run();
  return db;
}

describe("recovery codes", () => {
  it("generates ten distinct codes in xxxx-xxxx-xxxx form without look-alike characters", () => {
    const codes = generateRecoveryCodes();
    expect(codes).toHaveLength(10);
    expect(new Set(codes).size).toBe(10);
    for (const code of codes) expect(code).toMatch(/^[a-hjkmnp-z2-9]{4}-[a-hjkmnp-z2-9]{4}-[a-hjkmnp-z2-9]{4}$/);
  });

  it("stores only hashes", () => {
    const db = withAdmin();
    const codes = replaceRecoveryCodes(db, 1);
    const stored = (db.prepare("SELECT code_hash FROM recovery_codes").all() as { code_hash: string }[]).map(
      (row) => row.code_hash
    );
    expect(stored).toHaveLength(10);
    expect(stored.some((hash) => codes.includes(hash))).toBe(false);
  });

  it("accepts each code once, ignoring case, spaces and dashes", () => {
    const db = withAdmin();
    const [code] = replaceRecoveryCodes(db, 1);
    const typed = ` ${code.toUpperCase().replace(/-/g, " ")} `;
    expect(consumeRecoveryCode(db, 1, typed, 5)).toBe(true);
    expect(consumeRecoveryCode(db, 1, code, 6)).toBe(false);
  });

  it("invalidates old codes when new ones are issued", () => {
    const db = withAdmin();
    const [old] = replaceRecoveryCodes(db, 1);
    replaceRecoveryCodes(db, 1);
    expect(consumeRecoveryCode(db, 1, old, 5)).toBe(false);
  });
});
```

- [ ] **Step 3: Run them and watch them fail**

Run: `npx vitest run src/auth`
Expected: FAIL — `Failed to resolve import "./passwords"` (and `./totp`, `./recoveryCodes`).

- [ ] **Step 4: Implement**

Create `server/src/auth/crypto.ts`:
```ts
import { createHash, randomBytes } from "node:crypto";

export function randomToken(): string {
  return randomBytes(32).toString("base64url");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
```

Create `server/src/auth/passwords.ts`:
```ts
import { hash, verify } from "@node-rs/argon2";
import common from "./common-passwords.json";

const COMMON = new Set(common as string[]);
const MIN_LENGTH = 12;
const MAX_LENGTH = 256;

export function passwordProblem(password: string, email: string): string | null {
  if (password.length < MIN_LENGTH) return `Password must be at least ${MIN_LENGTH} characters.`;
  if (password.length > MAX_LENGTH) return `Password must be at most ${MAX_LENGTH} characters.`;
  const lowered = password.toLowerCase();
  if (COMMON.has(lowered)) return "This password is too common. Choose another.";
  const emailName = email.split("@")[0]?.toLowerCase() ?? "";
  if (emailName.length >= 4 && lowered.includes(emailName)) return "Password must not contain your email name.";
  return null;
}

// @node-rs/argon2 defaults to Argon2id with the OWASP-recommended cost
// (19 MiB memory, 2 iterations, 1 lane); the test pins the algorithm.
export function hashPassword(password: string): Promise<string> {
  return hash(password);
}

export async function verifyPassword(stored: string, password: string): Promise<boolean> {
  try {
    return await verify(stored, password);
  } catch {
    return false;
  }
}

let dummy: Promise<string> | null = null;

/** Verified against when the email is unknown, so failures take the same time either way. */
export function dummyHash(): Promise<string> {
  dummy ??= hash("equal-time-dummy-password");
  return dummy;
}
```

Create `server/src/auth/totp.ts`:
```ts
import { Secret, TOTP } from "otpauth";

const PERIOD_MS = 30_000;

function totp(secret: string, email = "") {
  return new TOTP({
    issuer: "CoE-AM Admin",
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secret)
  });
}

export function newTotpSecret(): string {
  return new Secret({ size: 20 }).base32;
}

export function totpUri(secret: string, email: string): string {
  return totp(secret, email).toString();
}

/**
 * Returns the time step the code belongs to, or null. A step at or before
 * `lastStep` was already used, so a code seen once can never be replayed.
 */
export function checkTotp(secret: string, code: string, now: number, lastStep: number | null): number | null {
  if (!/^\d{6}$/.test(code)) return null;
  const delta = totp(secret).validate({ token: code, timestamp: now, window: 1 });
  if (delta === null) return null;
  const step = Math.floor(now / PERIOD_MS) + delta;
  return lastStep !== null && step <= lastStep ? null : step;
}
```

Create `server/src/auth/recoveryCodes.ts`:
```ts
import { randomInt } from "node:crypto";
import type { Db } from "../db/database";
import { sha256 } from "./crypto";

// No 0/o, 1/i/l: codes are typed from paper.
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

function group(): string {
  return Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
}

export function generateRecoveryCodes(count = 10): string[] {
  const codes = new Set<string>();
  while (codes.size < count) codes.add(`${group()}-${group()}-${group()}`);
  return [...codes];
}

function normalize(code: string): string {
  return code.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function replaceRecoveryCodes(db: Db, adminId: number): string[] {
  const codes = generateRecoveryCodes();
  db.prepare("DELETE FROM recovery_codes WHERE admin_id = ?").run(adminId);
  const insert = db.prepare("INSERT INTO recovery_codes (admin_id, code_hash) VALUES (?, ?)");
  for (const code of codes) insert.run(adminId, sha256(normalize(code)));
  return codes;
}

export function consumeRecoveryCode(db: Db, adminId: number, code: string, now: number): boolean {
  const result = db
    .prepare("UPDATE recovery_codes SET used_at = ? WHERE admin_id = ? AND code_hash = ? AND used_at IS NULL")
    .run(now, adminId, sha256(normalize(code)));
  return result.changes === 1;
}
```

- [ ] **Step 5: Verify and commit**

Run: `npm test && npm run typecheck`
Expected: all pass.
```bash
git add server/src/auth
git commit -m "feat(api): Argon2id passwords, authenticator codes and recovery codes"
```

---

### Task 8: Admin accounts and setup links

**Files:**
- Create: `server/src/auth/admins.ts`, `server/test/helpers.ts`
- Test: `server/src/auth/admins.test.ts`

**Interfaces:**
- Consumes: Task 7 modules; `Db`.
- Produces:
  ```ts
  export class SetupError extends Error {}
  export const INVALID_LINK: string;
  export const SETUP_TTL_MS: number; // 24 hours
  export type Admin = { id: number; email: string; active: boolean; createdAt: number };
  export type AdminRow = { id: number; email: string; password_hash: string | null; totp_secret: string | null; totp_last_step: number | null; failed_attempts: number; locked_until: number | null };
  export function normalizeEmail(email: string): string;
  export function setupLink(publicOrigin: string, token: string): string;
  export function createAdmin(db: Db, email: string, now: number): { admin: Admin; setupToken: string };
  export function issueSetupToken(db: Db, adminId: number, now: number): string;
  export function resetAdmin(db: Db, adminId: number, now: number): string;
  export function listAdmins(db: Db): Admin[];
  export function getAdmin(db: Db, id: number): Admin | null;
  export function findAdminRow(db: Db, email: string): AdminRow | null;
  export function inspectSetupToken(db: Db, token: string, now: number): { email: string } | null;
  export function beginSetup(db: Db, token: string, password: string, now: number): Promise<{ secret: string; uri: string }>;
  export function completeSetup(db: Db, token: string, code: string, now: number): { adminId: number; email: string; recoveryCodes: string[] };
  // test/helpers.ts
  export const PASSWORD: string;
  export const ORIGIN: string; // "https://am-tiet.test"
  export function tempDataDir(): string;
  export function testClock(start?: number): { now: Clock; advance(ms: number): void };
  export function codeFor(secret: string, at: number): string;
  export function activeAdmin(db: Db, email: string, at: number, password?: string): Promise<{ id: number; secret: string; recoveryCodes: string[] }>;
  ```

- [ ] **Step 1: Write the shared test helpers**

Create `server/test/helpers.ts`:
```ts
import { mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Secret, TOTP } from "otpauth";
import type { Clock } from "../src/clock";
import type { Db } from "../src/db/database";
import { beginSetup, completeSetup, createAdmin } from "../src/auth/admins";

export const PASSWORD = "correct horse battery staple 42";
export const ORIGIN = "https://am-tiet.test";

export function tempDataDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "am-tiet-test-"));
  mkdirSync(join(dir, "media"));
  return dir;
}

export function testClock(start = Date.UTC(2026, 8, 27, 10, 0, 0)) {
  let current = start;
  const now: Clock = () => current;
  return {
    now,
    advance(ms: number) {
      current += ms;
    }
  };
}

export function codeFor(secret: string, at: number): string {
  return new TOTP({ secret: Secret.fromBase32(secret) }).generate({ timestamp: at });
}

/** Creates an admin and completes setup at time `at`, as a real admin would. */
export async function activeAdmin(db: Db, email: string, at: number, password = PASSWORD) {
  const { admin, setupToken } = createAdmin(db, email, at);
  const { secret } = await beginSetup(db, setupToken, password, at);
  const { recoveryCodes } = completeSetup(db, setupToken, codeFor(secret, at), at);
  return { id: admin.id, secret, recoveryCodes };
}
```

- [ ] **Step 2: Write the failing tests**

Create `server/src/auth/admins.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { PASSWORD, codeFor } from "../../test/helpers";
import { openDatabase } from "../db/database";
import {
  INVALID_LINK,
  SETUP_TTL_MS,
  SetupError,
  beginSetup,
  completeSetup,
  createAdmin,
  findAdminRow,
  inspectSetupToken,
  listAdmins,
  resetAdmin,
  setupLink
} from "./admins";

const T = Date.UTC(2026, 8, 27, 10);

describe("admin accounts", () => {
  it("creates an inactive admin with a normalised email and a setup token", () => {
    const db = openDatabase(":memory:");
    const { admin, setupToken } = createAdmin(db, "  Priya@Thapar.EDU ", T);
    expect(admin).toMatchObject({ email: "priya@thapar.edu", active: false });
    expect(setupToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(inspectSetupToken(db, setupToken, T)).toEqual({ email: "priya@thapar.edu" });
  });

  it("stores only a hash of the setup token", () => {
    const db = openDatabase(":memory:");
    const { setupToken } = createAdmin(db, "a@thapar.edu", T);
    const row = db.prepare("SELECT token_hash FROM setup_tokens").get() as { token_hash: string };
    expect(row.token_hash).not.toBe(setupToken);
  });

  it.each([
    ["an invalid email", "not-an-email", "That is not a valid email address."],
    ["a duplicate, in any case", "A@THAPAR.edu", "An admin with that email already exists."]
  ])("refuses %s", (_label, email, message) => {
    const db = openDatabase(":memory:");
    createAdmin(db, "a@thapar.edu", T);
    expect(() => createAdmin(db, email, T)).toThrow(message);
  });

  it("builds setup links with the token in the fragment, never sent to the server in logs", () => {
    expect(setupLink("https://am-tiet.thapar.edu", "abc")).toBe("https://am-tiet.thapar.edu/admin/setup#abc");
  });
});

describe("setup flow", () => {
  it("activates the admin with a password, an authenticator and ten recovery codes", async () => {
    const db = openDatabase(":memory:");
    const { admin, setupToken } = createAdmin(db, "a@thapar.edu", T);
    const { secret, uri } = await beginSetup(db, setupToken, PASSWORD, T);
    expect(uri).toContain(secret);
    const result = completeSetup(db, setupToken, codeFor(secret, T), T);
    expect(result).toMatchObject({ adminId: admin.id, email: "a@thapar.edu" });
    expect(result.recoveryCodes).toHaveLength(10);
    expect(listAdmins(db)[0].active).toBe(true);
    expect(findAdminRow(db, "a@thapar.edu")?.totp_last_step).toBe(Math.floor(T / 30_000));
  });

  it("rejects a weak password before issuing an authenticator", async () => {
    const db = openDatabase(":memory:");
    const { setupToken } = createAdmin(db, "a@thapar.edu", T);
    await expect(beginSetup(db, setupToken, "short", T)).rejects.toThrow("Password must be at least 12 characters.");
  });

  it("rejects a wrong authenticator code and keeps the link usable", async () => {
    const db = openDatabase(":memory:");
    const { setupToken } = createAdmin(db, "a@thapar.edu", T);
    const { secret } = await beginSetup(db, setupToken, PASSWORD, T);
    expect(() => completeSetup(db, setupToken, "000000", T)).toThrow(SetupError);
    expect(completeSetup(db, setupToken, codeFor(secret, T), T).recoveryCodes).toHaveLength(10);
  });

  it("refuses a link that was used, expired or never begun", async () => {
    const db = openDatabase(":memory:");
    const { setupToken } = createAdmin(db, "a@thapar.edu", T);
    expect(() => completeSetup(db, setupToken, "123456", T)).toThrow(INVALID_LINK);
    const { secret } = await beginSetup(db, setupToken, PASSWORD, T);
    completeSetup(db, setupToken, codeFor(secret, T), T);
    expect(inspectSetupToken(db, setupToken, T)).toBeNull();
    await expect(beginSetup(db, setupToken, PASSWORD, T)).rejects.toThrow(INVALID_LINK);

    const other = createAdmin(db, "b@thapar.edu", T).setupToken;
    expect(inspectSetupToken(db, other, T + SETUP_TTL_MS)).toBeNull();
    expect(inspectSetupToken(db, "made-up-token", T)).toBeNull();
  });
});

describe("resetAdmin", () => {
  it("clears the login, recovery codes and sessions, and issues a new link", async () => {
    const db = openDatabase(":memory:");
    const { admin, setupToken } = createAdmin(db, "a@thapar.edu", T);
    const { secret } = await beginSetup(db, setupToken, PASSWORD, T);
    completeSetup(db, setupToken, codeFor(secret, T), T);
    db.prepare("INSERT INTO sessions (token_hash, admin_id, csrf_token, created_at, last_seen_at) VALUES ('s', ?, 'c', ?, ?)").run(
      admin.id,
      T,
      T
    );

    const fresh = resetAdmin(db, admin.id, T);

    expect(listAdmins(db)[0].active).toBe(false);
    expect(db.prepare("SELECT COUNT(*) AS n FROM recovery_codes").get()).toEqual({ n: 0 });
    expect(db.prepare("SELECT COUNT(*) AS n FROM sessions").get()).toEqual({ n: 0 });
    expect(inspectSetupToken(db, fresh, T)).toEqual({ email: "a@thapar.edu" });
  });
});
```

- [ ] **Step 3: Run them and watch them fail**

Run: `npx vitest run src/auth/admins.test.ts`
Expected: FAIL — `Failed to resolve import "./admins"`.

- [ ] **Step 4: Implement**

Create `server/src/auth/admins.ts`:
```ts
import type { Db } from "../db/database";
import { randomToken, sha256 } from "./crypto";
import { hashPassword, passwordProblem } from "./passwords";
import { replaceRecoveryCodes } from "./recoveryCodes";
import { checkTotp, newTotpSecret, totpUri } from "./totp";

export class SetupError extends Error {}

export const INVALID_LINK = "This setup link has expired or was already used. Ask the other admin for a new one.";
export const SETUP_TTL_MS = 24 * 60 * 60 * 1000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type Admin = { id: number; email: string; active: boolean; createdAt: number };

export type AdminRow = {
  id: number;
  email: string;
  password_hash: string | null;
  totp_secret: string | null;
  totp_last_step: number | null;
  failed_attempts: number;
  locked_until: number | null;
};

type TokenRow = {
  admin_id: number;
  email: string;
  expires_at: number;
  used_at: number | null;
  pending_password_hash: string | null;
  pending_totp_secret: string | null;
};

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function setupLink(publicOrigin: string, token: string): string {
  // The fragment never reaches the server, so the token stays out of access logs.
  return `${publicOrigin}/admin/setup#${token}`;
}

export function getAdmin(db: Db, id: number): Admin | null {
  const row = db
    .prepare(
      "SELECT id, email, created_at AS createdAt, (password_hash IS NOT NULL AND totp_secret IS NOT NULL) AS active FROM admins WHERE id = ?"
    )
    .get(id) as { id: number; email: string; createdAt: number; active: number } | undefined;
  return row ? { ...row, active: row.active === 1 } : null;
}

export function listAdmins(db: Db): Admin[] {
  const rows = db
    .prepare(
      "SELECT id, email, created_at AS createdAt, (password_hash IS NOT NULL AND totp_secret IS NOT NULL) AS active FROM admins ORDER BY id"
    )
    .all() as { id: number; email: string; createdAt: number; active: number }[];
  return rows.map((row) => ({ ...row, active: row.active === 1 }));
}

export function findAdminRow(db: Db, email: string): AdminRow | null {
  const row = db
    .prepare(
      "SELECT id, email, password_hash, totp_secret, totp_last_step, failed_attempts, locked_until FROM admins WHERE email = ?"
    )
    .get(normalizeEmail(email)) as AdminRow | undefined;
  return row ?? null;
}

export function issueSetupToken(db: Db, adminId: number, now: number): string {
  db.prepare("DELETE FROM setup_tokens WHERE admin_id = ?").run(adminId);
  const token = randomToken();
  db.prepare("INSERT INTO setup_tokens (token_hash, admin_id, expires_at) VALUES (?, ?, ?)").run(
    sha256(token),
    adminId,
    now + SETUP_TTL_MS
  );
  return token;
}

export function createAdmin(db: Db, email: string, now: number): { admin: Admin; setupToken: string } {
  const normalized = normalizeEmail(email);
  if (!EMAIL.test(normalized) || normalized.length > 254) throw new SetupError("That is not a valid email address.");
  if (findAdminRow(db, normalized)) throw new SetupError("An admin with that email already exists.");
  return db.transaction(() => {
    const { lastInsertRowid } = db
      .prepare("INSERT INTO admins (email, created_at) VALUES (?, ?)")
      .run(normalized, now);
    const id = Number(lastInsertRowid);
    return { admin: getAdmin(db, id)!, setupToken: issueSetupToken(db, id, now) };
  })();
}

export function resetAdmin(db: Db, adminId: number, now: number): string {
  return db.transaction(() => {
    if (!getAdmin(db, adminId)) throw new SetupError("No such admin.");
    db.prepare(
      "UPDATE admins SET password_hash = NULL, totp_secret = NULL, totp_last_step = NULL, failed_attempts = 0, locked_until = NULL WHERE id = ?"
    ).run(adminId);
    db.prepare("DELETE FROM recovery_codes WHERE admin_id = ?").run(adminId);
    db.prepare("DELETE FROM sessions WHERE admin_id = ?").run(adminId);
    return issueSetupToken(db, adminId, now);
  })();
}

function liveToken(db: Db, token: string, now: number): TokenRow | null {
  const row = db
    .prepare(
      `SELECT t.admin_id, a.email, t.expires_at, t.used_at, t.pending_password_hash, t.pending_totp_secret
       FROM setup_tokens t JOIN admins a ON a.id = t.admin_id
       WHERE t.token_hash = ?`
    )
    .get(sha256(token)) as TokenRow | undefined;
  if (!row || row.used_at !== null || row.expires_at <= now) return null;
  return row;
}

export function inspectSetupToken(db: Db, token: string, now: number): { email: string } | null {
  const row = liveToken(db, token, now);
  return row ? { email: row.email } : null;
}

export async function beginSetup(
  db: Db,
  token: string,
  password: string,
  now: number
): Promise<{ secret: string; uri: string }> {
  const row = liveToken(db, token, now);
  if (!row) throw new SetupError(INVALID_LINK);
  const problem = passwordProblem(password, row.email);
  if (problem) throw new SetupError(problem);
  const secret = newTotpSecret();
  const passwordHash = await hashPassword(password);
  db.prepare(
    "UPDATE setup_tokens SET pending_password_hash = ?, pending_totp_secret = ? WHERE token_hash = ?"
  ).run(passwordHash, secret, sha256(token));
  return { secret, uri: totpUri(secret, row.email) };
}

export function completeSetup(
  db: Db,
  token: string,
  code: string,
  now: number
): { adminId: number; email: string; recoveryCodes: string[] } {
  return db.transaction(() => {
    const row = liveToken(db, token, now);
    if (!row || !row.pending_password_hash || !row.pending_totp_secret) throw new SetupError(INVALID_LINK);
    const step = checkTotp(row.pending_totp_secret, code.trim(), now, null);
    if (step === null) {
      throw new SetupError("That code is not correct. Check the time on your phone and try again.");
    }
    db.prepare(
      "UPDATE admins SET password_hash = ?, totp_secret = ?, totp_last_step = ?, failed_attempts = 0, locked_until = NULL WHERE id = ?"
    ).run(row.pending_password_hash, row.pending_totp_secret, step, row.admin_id);
    db.prepare("UPDATE setup_tokens SET used_at = ? WHERE token_hash = ?").run(now, sha256(token));
    return { adminId: row.admin_id, email: row.email, recoveryCodes: replaceRecoveryCodes(db, row.admin_id) };
  })();
}
```

- [ ] **Step 5: Verify and commit**

Run: `npm test && npm run typecheck`
Expected: all pass.
```bash
git add server/src/auth/admins.ts server/src/auth/admins.test.ts server/test/helpers.ts
git commit -m "feat(api): admin accounts with one-time setup links"
```

---

### Task 9: Login, lockout and sessions

**Files:**
- Create: `server/src/auth/sessions.ts`, `server/src/auth/login.ts`
- Test: `server/src/auth/sessions.test.ts`, `server/src/auth/login.test.ts`

**Interfaces:**
- Consumes: Tasks 7–8.
- Produces:
  ```ts
  // sessions.ts
  export const IDLE_MS: number;      // 60 minutes
  export const ABSOLUTE_MS: number;  // 12 hours
  export type SessionInfo = { adminId: number; email: string; csrfToken: string };
  export function createSession(db: Db, adminId: number, now: number): { token: string; csrfToken: string };
  export function readSession(db: Db, token: string, now: number): SessionInfo | null;
  export function destroySession(db: Db, token: string): void;
  export function destroyAllSessions(db: Db, adminId: number): void;
  export function purgeExpiredSessions(db: Db, now: number): number;
  // login.ts
  export const LOGIN_FAILED: string; // "Invalid email, password or code."
  export const LOCK_THRESHOLD: number; // 5
  export const LOCK_MS: number;        // 15 minutes
  export type LoginResult =
    | { ok: true; adminId: number; email: string; usedRecoveryCode: boolean }
    | { ok: false; reason: "unknown" | "locked" | "password" | "code" };
  export function login(db: Db, input: { email: string; password: string; code: string }, now: number): Promise<LoginResult>;
  ```

- [ ] **Step 1: Write the failing tests**

Create `server/src/auth/sessions.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { openDatabase } from "../db/database";
import {
  ABSOLUTE_MS,
  IDLE_MS,
  createSession,
  destroyAllSessions,
  destroySession,
  purgeExpiredSessions,
  readSession
} from "./sessions";

function withAdmin() {
  const db = openDatabase(":memory:");
  db.prepare("INSERT INTO admins (id, email, created_at) VALUES (1, 'a@thapar.edu', 0)").run();
  return db;
}

describe("sessions", () => {
  it("reads back a new session with its CSRF token, storing only a hash of the session token", () => {
    const db = withAdmin();
    const { token, csrfToken } = createSession(db, 1, 0);
    expect(readSession(db, token, 1)).toEqual({ adminId: 1, email: "a@thapar.edu", csrfToken });
    expect(db.prepare("SELECT token_hash FROM sessions").get()).not.toEqual({ token_hash: token });
    expect(readSession(db, "guessed", 1)).toBeNull();
  });

  it("expires after 60 idle minutes, and activity keeps it alive", () => {
    const db = withAdmin();
    const { token } = createSession(db, 1, 0);
    expect(readSession(db, token, IDLE_MS - 1)).not.toBeNull();
    expect(readSession(db, token, 2 * IDLE_MS - 2)).not.toBeNull();
    expect(readSession(db, token, 3 * IDLE_MS)).toBeNull();
  });

  it("expires 12 hours after sign-in even when active", () => {
    const db = withAdmin();
    const { token } = createSession(db, 1, 0);
    for (let t = IDLE_MS / 2; t < ABSOLUTE_MS; t += IDLE_MS / 2) expect(readSession(db, token, t)).not.toBeNull();
    expect(readSession(db, token, ABSOLUTE_MS + 1)).toBeNull();
  });

  it("ends one session or all of an admin's sessions", () => {
    const db = withAdmin();
    const a = createSession(db, 1, 0);
    const b = createSession(db, 1, 0);
    destroySession(db, a.token);
    expect(readSession(db, a.token, 1)).toBeNull();
    expect(readSession(db, b.token, 1)).not.toBeNull();
    destroyAllSessions(db, 1);
    expect(readSession(db, b.token, 1)).toBeNull();
  });

  it("purges expired sessions", () => {
    const db = withAdmin();
    createSession(db, 1, 0);
    createSession(db, 1, ABSOLUTE_MS);
    expect(purgeExpiredSessions(db, ABSOLUTE_MS + IDLE_MS / 2)).toBe(1);
  });
});
```

Create `server/src/auth/login.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { PASSWORD, activeAdmin, codeFor } from "../../test/helpers";
import { openDatabase } from "../db/database";
import { createAdmin } from "./admins";
import { LOCK_MS, LOCK_THRESHOLD, login } from "./login";

const T = Date.UTC(2026, 8, 27, 10);
const STEP = 30_000;

async function ready() {
  const db = openDatabase(":memory:");
  const admin = await activeAdmin(db, "a@thapar.edu", T);
  return { db, admin };
}

describe("login", () => {
  it("succeeds with email, password and a fresh authenticator code", async () => {
    const { db, admin } = await ready();
    const at = T + STEP;
    expect(await login(db, { email: "A@thapar.edu ", password: PASSWORD, code: codeFor(admin.secret, at) }, at)).toEqual({
      ok: true,
      adminId: admin.id,
      email: "a@thapar.edu",
      usedRecoveryCode: false
    });
  });

  it("refuses a replayed authenticator code", async () => {
    const { db, admin } = await ready();
    const at = T + STEP;
    const code = codeFor(admin.secret, at);
    expect((await login(db, { email: "a@thapar.edu", password: PASSWORD, code }, at)).ok).toBe(true);
    expect(await login(db, { email: "a@thapar.edu", password: PASSWORD, code }, at + 1_000)).toEqual({
      ok: false,
      reason: "code"
    });
  });

  it("accepts a recovery code once", async () => {
    const { db, admin } = await ready();
    const input = { email: "a@thapar.edu", password: PASSWORD, code: admin.recoveryCodes[0] };
    expect(await login(db, input, T + STEP)).toMatchObject({ ok: true, usedRecoveryCode: true });
    expect(await login(db, input, T + 2 * STEP)).toEqual({ ok: false, reason: "code" });
  });

  it.each([
    ["an unknown email", { email: "x@thapar.edu" }, "unknown"],
    ["a wrong password", { password: "wrong password here" }, "password"],
    ["a wrong code", { code: "000000" }, "code"]
  ])("fails with %s", async (_label, change, reason) => {
    const { db, admin } = await ready();
    const at = T + STEP;
    const input = { email: "a@thapar.edu", password: PASSWORD, code: codeFor(admin.secret, at), ...change };
    expect(await login(db, input, at)).toEqual({ ok: false, reason });
  });

  it("fails for an admin who has not finished setup", async () => {
    const db = openDatabase(":memory:");
    createAdmin(db, "new@thapar.edu", T);
    expect(await login(db, { email: "new@thapar.edu", password: PASSWORD, code: "123456" }, T)).toEqual({
      ok: false,
      reason: "unknown"
    });
  });

  it("locks the account for 15 minutes after 5 failures, even for the right credentials", async () => {
    const { db, admin } = await ready();
    let at = T + STEP;
    for (let n = 0; n < LOCK_THRESHOLD; n++) {
      await login(db, { email: "a@thapar.edu", password: "wrong password here", code: "000000" }, at);
    }
    at += STEP;
    expect(await login(db, { email: "a@thapar.edu", password: PASSWORD, code: codeFor(admin.secret, at) }, at)).toEqual({
      ok: false,
      reason: "locked"
    });
    at = T + STEP + LOCK_MS + STEP;
    expect((await login(db, { email: "a@thapar.edu", password: PASSWORD, code: codeFor(admin.secret, at) }, at)).ok).toBe(
      true
    );
  });

  it("resets the failure count after a successful login", async () => {
    const { db, admin } = await ready();
    let at = T + STEP;
    for (let n = 0; n < LOCK_THRESHOLD - 1; n++) {
      await login(db, { email: "a@thapar.edu", password: "wrong password here", code: "000000" }, at);
    }
    at += STEP;
    await login(db, { email: "a@thapar.edu", password: PASSWORD, code: codeFor(admin.secret, at) }, at);
    at += STEP;
    await login(db, { email: "a@thapar.edu", password: "wrong password here", code: "000000" }, at);
    at += STEP;
    expect((await login(db, { email: "a@thapar.edu", password: PASSWORD, code: codeFor(admin.secret, at) }, at)).ok).toBe(
      true
    );
  });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx vitest run src/auth/sessions.test.ts src/auth/login.test.ts`
Expected: FAIL — `Failed to resolve import "./sessions"` and `"./login"`.

- [ ] **Step 3: Implement**

Create `server/src/auth/sessions.ts`:
```ts
import type { Db } from "../db/database";
import { randomToken, sha256 } from "./crypto";

export const IDLE_MS = 60 * 60 * 1000;
export const ABSOLUTE_MS = 12 * 60 * 60 * 1000;

export type SessionInfo = { adminId: number; email: string; csrfToken: string };

export function createSession(db: Db, adminId: number, now: number): { token: string; csrfToken: string } {
  const token = randomToken();
  const csrfToken = randomToken();
  db.prepare(
    "INSERT INTO sessions (token_hash, admin_id, csrf_token, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?)"
  ).run(sha256(token), adminId, csrfToken, now, now);
  return { token, csrfToken };
}

export function readSession(db: Db, token: string, now: number): SessionInfo | null {
  const tokenHash = sha256(token);
  const row = db
    .prepare(
      `SELECT s.admin_id AS adminId, a.email, s.csrf_token AS csrfToken, s.created_at AS createdAt, s.last_seen_at AS lastSeenAt
       FROM sessions s JOIN admins a ON a.id = s.admin_id
       WHERE s.token_hash = ?`
    )
    .get(tokenHash) as (SessionInfo & { createdAt: number; lastSeenAt: number }) | undefined;
  if (!row) return null;
  if (now - row.lastSeenAt >= IDLE_MS || now - row.createdAt >= ABSOLUTE_MS) {
    db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash);
    return null;
  }
  db.prepare("UPDATE sessions SET last_seen_at = ? WHERE token_hash = ?").run(now, tokenHash);
  return { adminId: row.adminId, email: row.email, csrfToken: row.csrfToken };
}

export function destroySession(db: Db, token: string): void {
  db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(sha256(token));
}

export function destroyAllSessions(db: Db, adminId: number): void {
  db.prepare("DELETE FROM sessions WHERE admin_id = ?").run(adminId);
}

export function purgeExpiredSessions(db: Db, now: number): number {
  return db
    .prepare("DELETE FROM sessions WHERE last_seen_at <= ? OR created_at <= ?")
    .run(now - IDLE_MS, now - ABSOLUTE_MS).changes;
}
```

Create `server/src/auth/login.ts`:
```ts
import type { Db } from "../db/database";
import { findAdminRow } from "./admins";
import { dummyHash, verifyPassword } from "./passwords";
import { consumeRecoveryCode } from "./recoveryCodes";
import { checkTotp } from "./totp";

export const LOGIN_FAILED = "Invalid email, password or code.";
export const LOCK_THRESHOLD = 5;
export const LOCK_MS = 15 * 60 * 1000;

export type LoginResult =
  | { ok: true; adminId: number; email: string; usedRecoveryCode: boolean }
  | { ok: false; reason: "unknown" | "locked" | "password" | "code" };

function recordFailure(db: Db, adminId: number, now: number): void {
  const { failed_attempts } = db
    .prepare("UPDATE admins SET failed_attempts = failed_attempts + 1 WHERE id = ? RETURNING failed_attempts")
    .get(adminId) as { failed_attempts: number };
  if (failed_attempts >= LOCK_THRESHOLD) {
    db.prepare("UPDATE admins SET failed_attempts = 0, locked_until = ? WHERE id = ?").run(now + LOCK_MS, adminId);
  }
}

/**
 * Checks all three factors. The password is always verified (against a dummy
 * hash for unknown emails) so every failure takes the same time, and the
 * caller only ever shows LOGIN_FAILED; `reason` exists for the audit log.
 */
export async function login(
  db: Db,
  input: { email: string; password: string; code: string },
  now: number
): Promise<LoginResult> {
  const admin = findAdminRow(db, input.email);
  if (!admin || !admin.password_hash || !admin.totp_secret) {
    await verifyPassword(await dummyHash(), input.password);
    return { ok: false, reason: "unknown" };
  }

  const passwordOk = await verifyPassword(admin.password_hash, input.password);
  if (admin.locked_until !== null && admin.locked_until > now) return { ok: false, reason: "locked" };
  if (!passwordOk) {
    recordFailure(db, admin.id, now);
    return { ok: false, reason: "password" };
  }

  const code = input.code.trim();
  let usedRecoveryCode = false;
  if (/^\d{6}$/.test(code)) {
    const step = checkTotp(admin.totp_secret, code, now, admin.totp_last_step);
    if (step === null) {
      recordFailure(db, admin.id, now);
      return { ok: false, reason: "code" };
    }
    db.prepare("UPDATE admins SET totp_last_step = ? WHERE id = ?").run(step, admin.id);
  } else if (consumeRecoveryCode(db, admin.id, code, now)) {
    usedRecoveryCode = true;
  } else {
    recordFailure(db, admin.id, now);
    return { ok: false, reason: "code" };
  }

  db.prepare("UPDATE admins SET failed_attempts = 0, locked_until = NULL WHERE id = ?").run(admin.id);
  return { ok: true, adminId: admin.id, email: admin.email, usedRecoveryCode };
}
```

- [ ] **Step 4: Verify and commit**

Run: `npm test && npm run typecheck`
Expected: all pass.
```bash
git add server/src/auth/sessions.ts server/src/auth/sessions.test.ts server/src/auth/login.ts server/src/auth/login.test.ts
git commit -m "feat(api): login with lockout, replay protection and expiring sessions"
```

---

### Task 10: HTTP foundation, login and setup endpoints

**Files:**
- Create: `server/src/config.ts`, `server/src/http/failureLimiter.ts`, `server/src/http/httpError.ts`, `server/src/http/app.ts`, `server/src/http/authRoutes.ts`, `server/src/http/setupRoutes.ts`
- Modify: `server/test/helpers.ts`
- Test: `server/src/config.test.ts`, `server/src/http/failureLimiter.test.ts`, `server/src/http/auth.test.ts`

**Interfaces:**
- Consumes: Tasks 1–9.
- Produces:
  ```ts
  // config.ts
  export type Config = { dataDir: string; publicOrigin: string; port: number; host: string; secureCookies: boolean; trustProxy: number };
  export function loadConfig(env?: NodeJS.ProcessEnv): Config;
  export function dataPaths(dataDir: string): { database: string; media: string; content: string };
  // failureLimiter.ts
  export class FailureLimiter { constructor(limit: number, windowMs: number); isBlocked(key: string, now: number): boolean; recordFailure(key: string, now: number): void }
  // httpError.ts
  export class HttpError extends Error { constructor(statusCode: number, message: string) }
  // app.ts
  export type AppDeps = { db: Db; dataDir: string; clock: Clock; config: Pick<Config, "publicOrigin" | "secureCookies" | "trustProxy">; logger?: boolean };
  export type RouteContext = AppDeps & {
    mediaDir: string;
    cookieName: string;
    cookieOptions: { path: string; httpOnly: boolean; secure: boolean; sameSite: "strict" };
    requireAdmin: (request: FastifyRequest) => Promise<void>;
    checkOrigin: (request: FastifyRequest) => void;
  };
  export function buildApp(deps: AppDeps): Promise<FastifyInstance>;
  // request.admin after requireAdmin: SessionInfo & { token: string }
  // test/helpers.ts additions
  export function testApp(): Promise<{ app: FastifyInstance; db: Db; dataDir: string; clock: ReturnType<typeof testClock>; signIn(email?: string): Promise<SignedIn> }>;
  export type SignedIn = { adminId: number; secret: string; recoveryCodes: string[]; headers: Record<string, string> };
  ```

- [ ] **Step 1: Write the failing unit tests**

Create `server/src/config.test.ts`:
```ts
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { dataPaths, loadConfig } from "./config";

describe("config", () => {
  it("reads the public origin and derives secure cookies from https", () => {
    expect(loadConfig({ PUBLIC_ORIGIN: "https://am-tiet.thapar.edu/", DATA_DIR: "/data" })).toEqual({
      dataDir: "/data",
      publicOrigin: "https://am-tiet.thapar.edu",
      port: 8787,
      host: "0.0.0.0",
      secureCookies: true,
      trustProxy: 1
    });
    expect(loadConfig({ PUBLIC_ORIGIN: "http://localhost:5173" }).secureCookies).toBe(false);
  });

  it.each([
    [{}, /PUBLIC_ORIGIN is required/],
    [{ PUBLIC_ORIGIN: "ftp://x.org" }, /must be an origin/],
    [{ PUBLIC_ORIGIN: "https://x.org/path" }, /must be an origin/]
  ])("refuses a bad environment %j", (env, message) => {
    expect(() => loadConfig(env)).toThrow(message);
  });

  it("lays out the data directory", () => {
    expect(dataPaths("/data")).toEqual({
      database: join("/data", "database.sqlite"),
      media: join("/data", "media"),
      content: join("/data", "content.json")
    });
  });
});
```

Create `server/src/http/failureLimiter.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { FailureLimiter } from "./failureLimiter";

describe("FailureLimiter", () => {
  it("blocks a key after the limit within the window, then forgets old failures", () => {
    const limiter = new FailureLimiter(3, 1_000);
    for (let t = 0; t < 3; t++) limiter.recordFailure("1.2.3.4", t);
    expect(limiter.isBlocked("1.2.3.4", 10)).toBe(true);
    expect(limiter.isBlocked("5.6.7.8", 10)).toBe(false);
    expect(limiter.isBlocked("1.2.3.4", 1_003)).toBe(false);
  });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx vitest run src/config.test.ts src/http/failureLimiter.test.ts`
Expected: FAIL — unresolved imports.

- [ ] **Step 3: Implement config and the limiter**

Create `server/src/config.ts`:
```ts
import { join } from "node:path";

export type Config = {
  dataDir: string;
  publicOrigin: string;
  port: number;
  host: string;
  secureCookies: boolean;
  /** Number of reverse proxies in front of the API (Caddy = 1). */
  trustProxy: number;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const raw = env.PUBLIC_ORIGIN;
  if (!raw) throw new Error("PUBLIC_ORIGIN is required, e.g. https://am-tiet.thapar.edu");
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("PUBLIC_ORIGIN must be an origin like https://am-tiet.thapar.edu");
  }
  if (!["http:", "https:"].includes(url.protocol) || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("PUBLIC_ORIGIN must be an origin like https://am-tiet.thapar.edu");
  }
  return {
    dataDir: env.DATA_DIR ?? "./data",
    publicOrigin: url.origin,
    port: Number(env.PORT ?? 8787),
    host: env.HOST ?? "0.0.0.0",
    secureCookies: url.protocol === "https:",
    trustProxy: Number(env.TRUST_PROXY ?? 1)
  };
}

export function dataPaths(dataDir: string) {
  return {
    database: join(dataDir, "database.sqlite"),
    media: join(dataDir, "media"),
    content: join(dataDir, "content.json")
  };
}
```

Create `server/src/http/failureLimiter.ts`:
```ts
/** Counts recent failures per key (an IP address) in memory. */
export class FailureLimiter {
  private readonly failures = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number
  ) {}

  private recent(key: string, now: number): number[] {
    const list = (this.failures.get(key) ?? []).filter((at) => now - at < this.windowMs);
    if (list.length) this.failures.set(key, list);
    else this.failures.delete(key);
    return list;
  }

  isBlocked(key: string, now: number): boolean {
    return this.recent(key, now).length >= this.limit;
  }

  recordFailure(key: string, now: number): void {
    if (this.failures.size > 10_000) {
      for (const stale of [...this.failures.keys()]) this.recent(stale, now);
    }
    this.failures.set(key, [...this.recent(key, now), now]);
  }
}
```

- [ ] **Step 4: Run the unit tests and watch them pass**

Run: `npx vitest run src/config.test.ts src/http/failureLimiter.test.ts`
Expected: PASS.

- [ ] **Step 5: Extend the test helpers with a signed-in app**

Append to `server/test/helpers.ts`:
```ts
import type { FastifyInstance } from "fastify";
import { openDatabase } from "../src/db/database";
import { buildApp } from "../src/http/app";

export type SignedIn = { adminId: number; secret: string; recoveryCodes: string[]; headers: Record<string, string> };

export async function testApp() {
  const dataDir = tempDataDir();
  const db = openDatabase(join(dataDir, "database.sqlite"));
  const clock = testClock();
  const app: FastifyInstance = await buildApp({
    db,
    dataDir,
    clock: clock.now,
    config: { publicOrigin: ORIGIN, secureCookies: true, trustProxy: 0 }
  });

  async function signIn(email = "admin@thapar.edu"): Promise<SignedIn> {
    const admin = await activeAdmin(db, email, clock.now());
    clock.advance(30_000);
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      headers: { origin: ORIGIN },
      payload: { email, password: PASSWORD, code: codeFor(admin.secret, clock.now()) }
    });
    if (response.statusCode !== 200) throw new Error(`sign-in failed: ${response.body}`);
    const cookie = response.cookies[0];
    return {
      adminId: admin.id,
      secret: admin.secret,
      recoveryCodes: admin.recoveryCodes,
      headers: {
        cookie: `${cookie.name}=${cookie.value}`,
        "x-csrf-token": response.json().csrfToken,
        origin: ORIGIN
      }
    };
  }

  return { app, db, dataDir, clock, signIn };
}
```
Move the new `import` lines to the top of the file with the others.

- [ ] **Step 6: Write the failing HTTP tests**

Create `server/src/http/auth.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { ORIGIN, PASSWORD, activeAdmin, codeFor, testApp } from "../../test/helpers";
import { listAudit } from "../audit/auditLog";
import { createAdmin } from "../auth/admins";
import { IDLE_MS } from "../auth/sessions";

describe("health", () => {
  it("answers without a session and is never cached", async () => {
    const { app } = await testApp();
    const response = await app.inject({ method: "GET", url: "/api/health" });
    expect(response.json()).toEqual({ ok: true });
    expect(response.headers["cache-control"]).toBe("no-store");
  });
});

describe("login endpoint", () => {
  it("sets a secure, HttpOnly, SameSite=Strict __Host- cookie and returns the CSRF token", async () => {
    const { app, signIn } = await testApp();
    const session = await signIn();
    const me = await app.inject({ method: "GET", url: "/api/auth/me", headers: session.headers });
    expect(me.json()).toEqual({ email: "admin@thapar.edu", csrfToken: session.headers["x-csrf-token"] });
    expect(session.headers.cookie.startsWith("__Host-am_session=")).toBe(true);
  });

  it("marks the cookie with every protective attribute", async () => {
    const { app, db, clock } = await testApp();
    const admin = await activeAdmin(db, "a@thapar.edu", clock.now());
    clock.advance(30_000);
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      headers: { origin: ORIGIN },
      payload: { email: "a@thapar.edu", password: PASSWORD, code: codeFor(admin.secret, clock.now()) }
    });
    const header = String(response.headers["set-cookie"]);
    expect(header).toMatch(/HttpOnly/);
    expect(header).toMatch(/Secure/);
    expect(header).toMatch(/SameSite=Strict/);
    expect(header).toMatch(/Path=\//);
    expect(header).not.toMatch(/Domain=/);
  });

  it("answers every failure with the same message and records it", async () => {
    const { app, db } = await testApp();
    createAdmin(db, "pending@thapar.edu", 0);
    for (const payload of [
      { email: "nobody@thapar.edu", password: PASSWORD, code: "123456" },
      { email: "pending@thapar.edu", password: PASSWORD, code: "123456" }
    ]) {
      const response = await app.inject({ method: "POST", url: "/api/auth/login", headers: { origin: ORIGIN }, payload });
      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({ error: "Invalid email, password or code." });
    }
    expect(listAudit(db).filter((entry) => entry.action === "login_failed")).toHaveLength(2);
  });

  it("blocks an IP after 20 failures in 15 minutes", async () => {
    const { app } = await testApp();
    const attempt = () =>
      app.inject({
        method: "POST",
        url: "/api/auth/login",
        headers: { origin: ORIGIN },
        payload: { email: "x@thapar.edu", password: "wrong password here", code: "000000" }
      });
    for (let n = 0; n < 20; n++) expect((await attempt()).statusCode).toBe(401);
    expect((await attempt()).statusCode).toBe(429);
  });

  it("refuses a login posted from another site", async () => {
    const { app } = await testApp();
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      headers: { origin: "https://evil.example" },
      payload: { email: "a@thapar.edu", password: PASSWORD, code: "123456" }
    });
    expect(response.statusCode).toBe(403);
  });

  it("rejects unexpected login fields", async () => {
    const { app } = await testApp();
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      headers: { origin: ORIGIN },
      payload: { email: "a@thapar.edu", password: PASSWORD, code: "123456", admin: true }
    });
    expect(response.statusCode).toBe(400);
  });
});

describe("session guard", () => {
  it("refuses requests with no session, a forged session or an expired session", async () => {
    const { app, clock, signIn } = await testApp();
    expect((await app.inject({ method: "GET", url: "/api/auth/me" })).statusCode).toBe(401);
    expect(
      (await app.inject({ method: "GET", url: "/api/auth/me", headers: { cookie: "__Host-am_session=forged" } })).statusCode
    ).toBe(401);
    const session = await signIn();
    clock.advance(IDLE_MS);
    expect((await app.inject({ method: "GET", url: "/api/auth/me", headers: session.headers })).statusCode).toBe(401);
  });

  it("refuses a state change without the CSRF token or from another origin", async () => {
    const { app, signIn } = await testApp();
    const session = await signIn();
    const withoutToken = { ...session.headers };
    delete withoutToken["x-csrf-token"];
    expect((await app.inject({ method: "POST", url: "/api/auth/logout", headers: withoutToken })).statusCode).toBe(403);
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/api/auth/logout",
          headers: { ...session.headers, "x-csrf-token": "wrong" }
        })
      ).statusCode
    ).toBe(403);
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/api/auth/logout",
          headers: { ...session.headers, origin: "https://evil.example" }
        })
      ).statusCode
    ).toBe(403);
  });

  it("signs out this session, or every session", async () => {
    const { app, signIn, clock } = await testApp();
    const first = await signIn();
    const logout = await app.inject({ method: "POST", url: "/api/auth/logout", headers: first.headers });
    expect(logout.statusCode).toBe(200);
    expect((await app.inject({ method: "GET", url: "/api/auth/me", headers: first.headers })).statusCode).toBe(401);

    const second = await signIn("b@thapar.edu");
    clock.advance(30_000);
    const again = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      headers: { origin: ORIGIN },
      payload: { email: "b@thapar.edu", password: PASSWORD, code: codeFor(second.secret, clock.now()) }
    });
    const otherDevice = { ...second.headers, cookie: `__Host-am_session=${again.cookies[0].value}` };
    await app.inject({ method: "POST", url: "/api/auth/logout-all", headers: second.headers });
    expect((await app.inject({ method: "GET", url: "/api/auth/me", headers: otherDevice })).statusCode).toBe(401);
  });
});

describe("setup endpoints", () => {
  it("walks an admin through password, authenticator and recovery codes", async () => {
    const { app, db, clock } = await testApp();
    const { setupToken } = createAdmin(db, "new@thapar.edu", clock.now());

    const inspect = await app.inject({ method: "GET", url: `/api/setup/${setupToken}` });
    expect(inspect.json()).toEqual({ email: "new@thapar.edu" });

    const begin = await app.inject({
      method: "POST",
      url: `/api/setup/${setupToken}/begin`,
      headers: { origin: ORIGIN },
      payload: { password: PASSWORD }
    });
    const { secret, otpauthUri, qrDataUrl } = begin.json();
    expect(otpauthUri).toMatch(/^otpauth:\/\/totp\//);
    expect(qrDataUrl).toMatch(/^data:image\/png;base64,/);

    const complete = await app.inject({
      method: "POST",
      url: `/api/setup/${setupToken}/complete`,
      headers: { origin: ORIGIN },
      payload: { code: codeFor(secret, clock.now()) }
    });
    expect(complete.json().recoveryCodes).toHaveLength(10);
    expect((await app.inject({ method: "GET", url: `/api/setup/${setupToken}` })).statusCode).toBe(410);
  });

  it("explains a weak password", async () => {
    const { app, db, clock } = await testApp();
    const { setupToken } = createAdmin(db, "new@thapar.edu", clock.now());
    const response = await app.inject({
      method: "POST",
      url: `/api/setup/${setupToken}/begin`,
      headers: { origin: ORIGIN },
      payload: { password: "short" }
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: "Password must be at least 12 characters." });
  });

  it("answers 410 for an unknown link", async () => {
    const { app } = await testApp();
    const response = await app.inject({ method: "GET", url: "/api/setup/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" });
    expect(response.statusCode).toBe(410);
  });
});

describe("unknown routes", () => {
  it("answers 404 with a plain message", async () => {
    const { app } = await testApp();
    const response = await app.inject({ method: "GET", url: "/api/nothing-here" });
    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: "Not found." });
  });
});
```

- [ ] **Step 7: Run them and watch them fail**

Run: `npx vitest run src/http/auth.test.ts`
Expected: FAIL — `Failed to resolve import "../src/http/app"`.

- [ ] **Step 8: Implement the app and the two route files**

Create `server/src/http/httpError.ts` (its own module, so route files never import `app.ts` at runtime and there is no import cycle):
```ts
export class HttpError extends Error {
  constructor(
    readonly statusCode: number,
    message: string
  ) {
    super(message);
  }
}
```

Create `server/src/http/app.ts`:
```ts
import cookie from "@fastify/cookie";
import multipart from "@fastify/multipart";
import Fastify, { type FastifyInstance, type FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { SetupError } from "../auth/admins";
import { readSession, type SessionInfo } from "../auth/sessions";
import type { Clock } from "../clock";
import type { Config } from "../config";
import { dataPaths } from "../config";
import { ConflictError, NotFoundError } from "../content/items";
import { PublishError } from "../content/publish";
import { friendlyValidationMessage } from "../content/schemas";
import type { Db } from "../db/database";
import { ImageRejectedError, MAX_UPLOAD_BYTES } from "../media/images";
import { registerAuthRoutes } from "./authRoutes";
import { HttpError } from "./httpError";
import { registerSetupRoutes } from "./setupRoutes";

declare module "fastify" {
  interface FastifyRequest {
    admin?: SessionInfo & { token: string };
  }
}

export type AppDeps = {
  db: Db;
  dataDir: string;
  clock: Clock;
  config: Pick<Config, "publicOrigin" | "secureCookies" | "trustProxy">;
  logger?: boolean;
};

export type RouteContext = AppDeps & {
  mediaDir: string;
  cookieName: string;
  cookieOptions: { path: string; httpOnly: boolean; secure: boolean; sameSite: "strict" };
  requireAdmin: (request: FastifyRequest) => Promise<void>;
  checkOrigin: (request: FastifyRequest) => void;
};

export async function buildApp(deps: AppDeps): Promise<FastifyInstance> {
  const app = Fastify({ logger: deps.logger ?? false, trustProxy: deps.config.trustProxy, bodyLimit: 256 * 1024 });
  await app.register(cookie);
  await app.register(multipart, { limits: { fileSize: MAX_UPLOAD_BYTES, files: 1, parts: 2, fields: 0 } });

  app.addHook("onSend", async (_request, reply) => {
    reply.header("Cache-Control", "no-store");
  });

  const cookieName = deps.config.secureCookies ? "__Host-am_session" : "am_session";

  const checkOrigin = (request: FastifyRequest) => {
    const origin = request.headers.origin;
    if (origin !== undefined && origin !== deps.config.publicOrigin) throw new HttpError(403, "Request refused.");
  };

  const requireAdmin = async (request: FastifyRequest) => {
    const token = request.cookies[cookieName];
    const session = token ? readSession(deps.db, token, deps.clock()) : null;
    if (!token || !session) throw new HttpError(401, "Please sign in.");
    if (request.method !== "GET" && request.method !== "HEAD") {
      if (request.headers["x-csrf-token"] !== session.csrfToken) {
        throw new HttpError(403, "Your session expired. Reload the page.");
      }
      checkOrigin(request);
    }
    request.admin = { ...session, token };
  };

  const ctx: RouteContext = {
    ...deps,
    mediaDir: dataPaths(deps.dataDir).media,
    cookieName,
    cookieOptions: { path: "/", httpOnly: true, secure: deps.config.secureCookies, sameSite: "strict" },
    requireAdmin,
    checkOrigin
  };

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof HttpError) return reply.status(error.statusCode).send({ error: error.message });
    if (error instanceof ZodError) return reply.status(400).send({ error: friendlyValidationMessage(error) });
    if (error instanceof ConflictError) return reply.status(409).send({ error: error.message });
    if (error instanceof NotFoundError) return reply.status(404).send({ error: error.message });
    if (error instanceof ImageRejectedError || error instanceof SetupError) {
      return reply.status(400).send({ error: error.message });
    }
    if (error instanceof PublishError) return reply.status(503).send({ error: error.message });
    const { statusCode, code } = error as { statusCode?: number; code?: string };
    if (code === "FST_REQ_FILE_TOO_LARGE") return reply.status(413).send({ error: "Photo must be under 10 MB." });
    if (statusCode && statusCode >= 400 && statusCode < 500) {
      return reply.status(statusCode).send({ error: "The request could not be processed." });
    }
    request.log.error(error);
    return reply.status(500).send({ error: "Something went wrong. Please try again." });
  });

  app.setNotFoundHandler((_request, reply) => reply.status(404).send({ error: "Not found." }));

  app.get("/api/health", async () => ({ ok: true }));
  registerAuthRoutes(app, ctx);
  registerSetupRoutes(app, ctx);

  return app;
}
```

Create `server/src/http/authRoutes.ts`:
```ts
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { recordAudit } from "../audit/auditLog";
import { normalizeEmail } from "../auth/admins";
import { LOGIN_FAILED, login } from "../auth/login";
import { createSession, destroyAllSessions, destroySession } from "../auth/sessions";
import type { RouteContext } from "./app";
import { HttpError } from "./httpError";
import { FailureLimiter } from "./failureLimiter";

const loginBody = z
  .object({ email: z.string().max(320), password: z.string().max(1024), code: z.string().max(64) })
  .strict();

export function registerAuthRoutes(app: FastifyInstance, ctx: RouteContext): void {
  const limiter = new FailureLimiter(20, 15 * 60 * 1000);

  app.post("/api/auth/login", async (request, reply) => {
    ctx.checkOrigin(request);
    const now = ctx.clock();
    if (limiter.isBlocked(request.ip, now)) {
      throw new HttpError(429, "Too many attempts. Wait 15 minutes and try again.");
    }
    const body = loginBody.parse(request.body);
    const result = await login(ctx.db, body, now);
    if (!result.ok) {
      limiter.recordFailure(request.ip, now);
      recordAudit(ctx.db, {
        at: now,
        adminEmail: null,
        action: "login_failed",
        detail: `${normalizeEmail(body.email)} (${result.reason})`,
        ip: request.ip
      });
      throw new HttpError(401, LOGIN_FAILED);
    }
    const session = createSession(ctx.db, result.adminId, now);
    recordAudit(ctx.db, {
      at: now,
      adminEmail: result.email,
      action: result.usedRecoveryCode ? "recovery_code_used" : "login",
      ip: request.ip
    });
    reply.setCookie(ctx.cookieName, session.token, ctx.cookieOptions);
    return { email: result.email, csrfToken: session.csrfToken, usedRecoveryCode: result.usedRecoveryCode };
  });

  app.get("/api/auth/me", { preHandler: ctx.requireAdmin }, async (request) => ({
    email: request.admin!.email,
    csrfToken: request.admin!.csrfToken
  }));

  app.post("/api/auth/logout", { preHandler: ctx.requireAdmin }, async (request, reply) => {
    destroySession(ctx.db, request.admin!.token);
    recordAudit(ctx.db, { at: ctx.clock(), adminEmail: request.admin!.email, action: "logout", ip: request.ip });
    reply.clearCookie(ctx.cookieName, ctx.cookieOptions);
    return { ok: true };
  });

  app.post("/api/auth/logout-all", { preHandler: ctx.requireAdmin }, async (request, reply) => {
    destroyAllSessions(ctx.db, request.admin!.adminId);
    recordAudit(ctx.db, { at: ctx.clock(), adminEmail: request.admin!.email, action: "logout_all", ip: request.ip });
    reply.clearCookie(ctx.cookieName, ctx.cookieOptions);
    return { ok: true };
  });
}
```

Create `server/src/http/setupRoutes.ts`:
```ts
import type { FastifyInstance, FastifyRequest } from "fastify";
import QRCode from "qrcode";
import { z } from "zod";
import { recordAudit } from "../audit/auditLog";
import { INVALID_LINK, SetupError, beginSetup, completeSetup, inspectSetupToken } from "../auth/admins";
import type { RouteContext } from "./app";
import { HttpError } from "./httpError";
import { FailureLimiter } from "./failureLimiter";

const params = z.object({ token: z.string().min(1).max(128) });
const beginBody = z.object({ password: z.string().max(1024) }).strict();
const completeBody = z.object({ code: z.string().max(16) }).strict();

export function registerSetupRoutes(app: FastifyInstance, ctx: RouteContext): void {
  const limiter = new FailureLimiter(20, 15 * 60 * 1000);

  const guard = (request: FastifyRequest) => {
    if (limiter.isBlocked(request.ip, ctx.clock())) {
      throw new HttpError(429, "Too many attempts. Wait 15 minutes and try again.");
    }
  };

  async function counted<T>(request: FastifyRequest, work: () => Promise<T> | T): Promise<T> {
    try {
      return await work();
    } catch (error) {
      if (error instanceof SetupError || error instanceof HttpError) limiter.recordFailure(request.ip, ctx.clock());
      throw error;
    }
  }

  app.get("/api/setup/:token", async (request) => {
    guard(request);
    const { token } = params.parse(request.params);
    return counted(request, () => {
      const found = inspectSetupToken(ctx.db, token, ctx.clock());
      if (!found) throw new HttpError(410, INVALID_LINK);
      return found;
    });
  });

  app.post("/api/setup/:token/begin", async (request) => {
    ctx.checkOrigin(request);
    guard(request);
    const { token } = params.parse(request.params);
    const { password } = beginBody.parse(request.body);
    return counted(request, async () => {
      const { secret, uri } = await beginSetup(ctx.db, token, password, ctx.clock());
      return { secret, otpauthUri: uri, qrDataUrl: await QRCode.toDataURL(uri, { margin: 1, width: 240 }) };
    });
  });

  app.post("/api/setup/:token/complete", async (request) => {
    ctx.checkOrigin(request);
    guard(request);
    const { token } = params.parse(request.params);
    const { code } = completeBody.parse(request.body);
    return counted(request, () => {
      const now = ctx.clock();
      const result = completeSetup(ctx.db, token, code, now);
      recordAudit(ctx.db, { at: now, adminEmail: result.email, action: "setup_completed", ip: request.ip });
      return { recoveryCodes: result.recoveryCodes };
    });
  });
}
```

- [ ] **Step 9: Run the tests and watch them pass**

Run: `npm test && npm run typecheck`
Expected: all pass.

- [ ] **Step 10: Commit**

```bash
git add server/src/config.ts server/src/config.test.ts server/src/http server/test/helpers.ts
git commit -m "feat(api): HTTP layer with session guard, CSRF and origin checks, login and setup endpoints"
```

---

### Task 11: Content and upload endpoints

**Files:**
- Create: `server/src/http/itemRoutes.ts`
- Modify: `server/src/http/app.ts` (register the routes)
- Test: `server/src/http/items.test.ts`

**Interfaces:**
- Consumes: Tasks 3–6, 10.
- Produces: the item, deleted-list and upload endpoints in the Endpoints table. Every change calls `publishChange` and records an audit entry whose detail is `"<area>: <itemLabel>"`.

- [ ] **Step 1: Write the failing tests**

Create `server/src/http/items.test.ts`:
```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { testApp } from "../../test/helpers";
import { listAudit } from "../audit/auditLog";

const readPublished = (dataDir: string) => JSON.parse(readFileSync(join(dataDir, "content.json"), "utf8"));

function multipart(filename: string, contentType: string, content: Buffer) {
  const boundary = "----amtiettest";
  const payload = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`
    ),
    content,
    Buffer.from(`\r\n--${boundary}--\r\n`)
  ]);
  return { payload, headers: { "content-type": `multipart/form-data; boundary=${boundary}` } };
}

async function setup() {
  const env = await testApp();
  const session = await env.signIn();
  const call = (method: "GET" | "POST" | "PUT" | "DELETE", url: string, payload?: unknown) =>
    env.app.inject({ method, url, headers: session.headers, payload: payload as object });
  return { ...env, session, call };
}

describe("content endpoints", () => {
  it("creates a project, publishes it and records who did it", async () => {
    const { call, dataDir, db } = await setup();
    const response = await call("POST", "/api/items/projects", { data: { title: "New project" } });
    expect(response.statusCode).toBe(201);
    expect(response.json().item).toMatchObject({ area: "projects", version: 1, data: { title: "New project" } });
    expect(readPublished(dataDir).projects.map((p: { title: string }) => p.title)).toEqual(["New project"]);
    expect(listAudit(db)[0]).toMatchObject({
      action: "item_created",
      adminEmail: "admin@thapar.edu",
      detail: "projects: New project"
    });
  });

  it("lists live items including hidden ones, but publishes only visible ones", async () => {
    const { call, dataDir } = await setup();
    const { item } = (await call("POST", "/api/items/projects", { data: { title: "Secret" } })).json();
    await call("PUT", `/api/items/projects/${item.id}/hidden`, { hidden: true });
    expect((await call("GET", "/api/items/projects")).json().items).toHaveLength(1);
    expect(readPublished(dataDir).projects).toEqual([]);
  });

  it("updates with the current version and refuses a stale one with 409", async () => {
    const { call } = await setup();
    const { item } = (await call("POST", "/api/items/projects", { data: { title: "A" } })).json();
    const first = await call("PUT", `/api/items/projects/${item.id}`, { data: { title: "B" }, version: 1 });
    expect(first.json().item.version).toBe(2);
    const stale = await call("PUT", `/api/items/projects/${item.id}`, { data: { title: "C" }, version: 1 });
    expect(stale.statusCode).toBe(409);
    expect(stale.json().error).toBe("This was changed by someone else — reload to see their version.");
  });

  it("reorders, deletes, lists deleted and restores", async () => {
    const { call } = await setup();
    const ids: string[] = [];
    for (const title of ["A", "B", "C"]) ids.push((await call("POST", "/api/items/projects", { data: { title } })).json().item.id);
    await call("PUT", "/api/items/projects/order", { ids: [ids[2], ids[0], ids[1]] });
    const order = (await call("GET", "/api/items/projects")).json().items.map((i: { data: { title: string } }) => i.data.title);
    expect(order).toEqual(["C", "A", "B"]);

    expect((await call("DELETE", `/api/items/projects/${ids[0]}`)).statusCode).toBe(200);
    expect((await call("GET", "/api/deleted")).json().items.map((i: { id: string }) => i.id)).toEqual([ids[0]]);
    await call("POST", `/api/items/projects/${ids[0]}/restore`);
    expect((await call("GET", "/api/items/projects")).json().items).toHaveLength(3);
  });

  it("answers 404 for an unknown area or item, including attempts to escape the area list", async () => {
    const { call } = await setup();
    for (const url of ["/api/items/admins", "/api/items/..%2F..%2Fetc", "/api/items/projects/does-not-exist/restore"]) {
      const method = url.endsWith("restore") ? "POST" : "GET";
      expect((await call(method, url)).statusCode).toBe(404);
    }
    const injected = encodeURIComponent("x' OR '1'='1");
    expect((await call("PUT", `/api/items/projects/${injected}`, { data: { title: "T" }, version: 1 })).statusCode).toBe(404);
  });

  it("refuses unsafe content with a clear message", async () => {
    const { call } = await setup();
    const bad = await call("POST", "/api/items/projects", {
      data: { title: "T", links: [{ label: "x", url: "javascript:alert(1)" }] }
    });
    expect(bad.statusCode).toBe(400);
    expect(bad.json()).toEqual({ error: "Link must start with https:// or http://" });
  });

  it("stores script-like text as plain text, unchanged", async () => {
    const { call, dataDir } = await setup();
    await call("POST", "/api/items/projects", { data: { title: "T", description: "<script>alert(1)</script>" } });
    expect(readPublished(dataDir).projects[0].description).toBe("<script>alert(1)</script>");
  });

  it("requires a signed-in admin for every content endpoint", async () => {
    const { app } = await setup();
    for (const [method, url] of [
      ["GET", "/api/items/projects"],
      ["POST", "/api/items/projects"],
      ["GET", "/api/deleted"],
      ["POST", "/api/uploads/gallery"]
    ] as const) {
      expect((await app.inject({ method, url })).statusCode).toBe(401);
    }
  });
});

describe("upload endpoint", () => {
  it("processes a real photo and returns its media path", async () => {
    const { app, session } = await setup();
    const photo = await sharp({ create: { width: 900, height: 700, channels: 3, background: "#336699" } }).jpeg().toBuffer();
    const { payload, headers } = multipart("photo.jpg", "image/jpeg", photo);
    const response = await app.inject({
      method: "POST",
      url: "/api/uploads/gallery",
      headers: { ...session.headers, ...headers },
      payload
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().path).toMatch(/^\/media\/[0-9a-f-]{36}\.webp$/);
  });

  it.each([
    ["an SVG named .jpg", "photo.jpg", "image/jpeg", Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>')],
    ["an HTML file", "page.html", "text/html", Buffer.from("<script>alert(1)</script>")]
  ])("rejects %s", async (_label, filename, type, content) => {
    const { app, session } = await setup();
    const { payload, headers } = multipart(filename, type, content);
    const response = await app.inject({
      method: "POST",
      url: "/api/uploads/person",
      headers: { ...session.headers, ...headers },
      payload
    });
    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe("Photo must be a JPG, PNG or WebP image under 10 MB.");
  });

  it("rejects a file over 10 MB with 413", async () => {
    const { app, session } = await setup();
    const { payload, headers } = multipart("big.jpg", "image/jpeg", Buffer.alloc(11 * 1024 * 1024, 1));
    const response = await app.inject({
      method: "POST",
      url: "/api/uploads/gallery",
      headers: { ...session.headers, ...headers },
      payload
    });
    expect(response.statusCode).toBe(413);
  });

  it("answers 404 for an unknown upload kind", async () => {
    const { app, session } = await setup();
    const { payload, headers } = multipart("a.jpg", "image/jpeg", Buffer.from("x"));
    const response = await app.inject({
      method: "POST",
      url: "/api/uploads/admins",
      headers: { ...session.headers, ...headers },
      payload
    });
    expect(response.statusCode).toBe(404);
  });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx vitest run src/http/items.test.ts`
Expected: FAIL — requests to `/api/items/projects` answer 404 because no item routes exist.

- [ ] **Step 3: Implement**

Create `server/src/http/itemRoutes.ts`:
```ts
import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { recordAudit, type AuditAction } from "../audit/auditLog";
import {
  NotFoundError,
  createItem,
  getItem,
  listDeleted,
  listItems,
  reorderItems,
  restoreItem,
  setHidden,
  softDeleteItem,
  updateItem
} from "../content/items";
import { publishChange } from "../content/publish";
import { isArea, itemLabel, toStoredData, type Area } from "../content/schemas";
import { processUpload } from "../media/images";
import type { RouteContext } from "./app";
import { HttpError } from "./httpError";

const areaParams = z.object({ area: z.string() });
const itemParams = z.object({ area: z.string(), id: z.string().min(1).max(100) });
const createBody = z.object({ data: z.unknown() }).strict();
const updateBody = z.object({ data: z.unknown(), version: z.number().int().positive() }).strict();
const hiddenBody = z.object({ hidden: z.boolean() }).strict();
const orderBody = z.object({ ids: z.array(z.string().max(100)).max(1000) }).strict();
const uploadParams = z.object({ kind: z.enum(["person", "gallery"]) });

function areaOf(params: unknown): Area {
  const { area } = areaParams.parse(params);
  if (!isArea(area)) throw new HttpError(404, "Not found.");
  return area;
}

function itemOf(params: unknown): { area: Area; id: string } {
  const parsed = itemParams.safeParse(params);
  if (!parsed.success || !isArea(parsed.data.area)) throw new HttpError(404, "Not found.");
  return { area: parsed.data.area, id: parsed.data.id };
}

export function registerItemRoutes(app: FastifyInstance, ctx: RouteContext): void {
  const guarded = { preHandler: ctx.requireAdmin };

  const audit = (request: FastifyRequest, action: AuditAction, area: Area, data: Record<string, unknown>) =>
    recordAudit(ctx.db, {
      at: ctx.clock(),
      adminEmail: request.admin!.email,
      action,
      detail: `${area}: ${itemLabel(area, data)}`,
      ip: request.ip
    });

  app.get("/api/items/:area", guarded, async (request) => ({ items: listItems(ctx.db, areaOf(request.params)) }));

  app.get("/api/deleted", guarded, async () => ({ items: listDeleted(ctx.db) }));

  app.post("/api/items/:area", guarded, async (request, reply) => {
    const area = areaOf(request.params);
    const data = toStoredData(area, createBody.parse(request.body).data);
    const item = publishChange(ctx, () => {
      const created = createItem(ctx.db, area, data, ctx.clock());
      audit(request, "item_created", area, data);
      return created;
    });
    reply.status(201);
    return { item };
  });

  app.put("/api/items/:area/order", guarded, async (request) => {
    const area = areaOf(request.params);
    const { ids } = orderBody.parse(request.body);
    publishChange(ctx, () => {
      reorderItems(ctx.db, area, ids, ctx.clock());
      recordAudit(ctx.db, {
        at: ctx.clock(),
        adminEmail: request.admin!.email,
        action: "item_reordered",
        detail: area,
        ip: request.ip
      });
    });
    return { ok: true };
  });

  app.put("/api/items/:area/:id", guarded, async (request) => {
    const { area, id } = itemOf(request.params);
    const body = updateBody.parse(request.body);
    const previous = getItem(ctx.db, area, id);
    if (!previous || previous.deletedAt !== null) throw new NotFoundError();
    const data = toStoredData(area, body.data, previous.data);
    const item = publishChange(ctx, () => {
      const updated = updateItem(ctx.db, area, id, data, body.version, ctx.clock());
      audit(request, "item_updated", area, data);
      return updated;
    });
    return { item };
  });

  app.put("/api/items/:area/:id/hidden", guarded, async (request) => {
    const { area, id } = itemOf(request.params);
    const { hidden } = hiddenBody.parse(request.body);
    const item = publishChange(ctx, () => {
      const changed = setHidden(ctx.db, area, id, hidden, ctx.clock());
      audit(request, hidden ? "item_hidden" : "item_shown", area, changed.data);
      return changed;
    });
    return { item };
  });

  app.delete("/api/items/:area/:id", guarded, async (request) => {
    const { area, id } = itemOf(request.params);
    const item = publishChange(ctx, () => {
      const deleted = softDeleteItem(ctx.db, area, id, ctx.clock());
      audit(request, "item_deleted", area, deleted.data);
      return deleted;
    });
    return { item };
  });

  app.post("/api/items/:area/:id/restore", guarded, async (request) => {
    const { area, id } = itemOf(request.params);
    const item = publishChange(ctx, () => {
      const restored = restoreItem(ctx.db, area, id, ctx.clock());
      audit(request, "item_restored", area, restored.data);
      return restored;
    });
    return { item };
  });

  app.post("/api/uploads/:kind", guarded, async (request) => {
    const parsed = uploadParams.safeParse(request.params);
    if (!parsed.success) throw new HttpError(404, "Not found.");
    const file = await request.file();
    if (!file) throw new HttpError(400, "Choose a photo to upload.");
    const buffer = await file.toBuffer();
    return { path: await processUpload(buffer, parsed.data.kind, ctx.mediaDir) };
  });
}
```

In `server/src/http/app.ts`, add `import { registerItemRoutes } from "./itemRoutes";` and, after `registerSetupRoutes(app, ctx);`, add `registerItemRoutes(app, ctx);`.

- [ ] **Step 4: Verify and commit**

Run: `npm test && npm run typecheck`
Expected: all pass. If the 404 test for `/api/uploads/admins` returns 400 instead, make sure the kind check runs before `request.file()` (it does in the code above).
```bash
git add server/src/http/itemRoutes.ts server/src/http/items.test.ts server/src/http/app.ts
git commit -m "feat(api): content and upload endpoints, publishing every change"
```

---

### Task 12: Admins, audit and backup endpoints

**Files:**
- Create: `server/src/backup/backup.ts`, `server/src/http/adminRoutes.ts`
- Modify: `server/src/http/app.ts`
- Test: `server/src/backup/backup.test.ts`, `server/src/http/admin.test.ts`

**Interfaces:**
- Consumes: Tasks 2, 8, 10.
- Produces: `createBackupArchive(db: Db, dataDir: string, outFile: string): Promise<void>` — a `.tar.gz` containing `database.sqlite` (a consistent copy), `media/` and `content.json`. Plan 4's `restore.sh` reads this format. Endpoints `GET /api/admins`, `POST /api/admins/:id/reset`, `GET /api/audit`, `GET /api/backup`.

- [ ] **Step 1: Write the failing tests**

Create `server/src/backup/backup.test.ts`:
```ts
import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { extract } from "tar";
import { describe, expect, it } from "vitest";
import { tempDataDir } from "../../test/helpers";
import { createItem } from "../content/items";
import { republish } from "../content/publish";
import { openDatabase } from "../db/database";
import { createBackupArchive } from "./backup";

describe("backup archive", () => {
  it("contains a consistent database copy, the media and the published snapshot", async () => {
    const dataDir = tempDataDir();
    const db = openDatabase(join(dataDir, "database.sqlite"));
    createItem(db, "projects", { title: "Kept", description: "", links: [] }, 1);
    republish({ db, dataDir });
    writeFileSync(join(dataDir, "media", "photo.webp"), "image-bytes");

    const outFile = join(mkdtempSync(join(tmpdir(), "am-tiet-out-")), "backup.tar.gz");
    await createBackupArchive(db, dataDir, outFile);

    const restored = mkdtempSync(join(tmpdir(), "am-tiet-restore-"));
    await extract({ file: outFile, cwd: restored });
    expect(existsSync(join(restored, "media", "photo.webp"))).toBe(true);
    expect(existsSync(join(restored, "content.json"))).toBe(true);
    const copy = new Database(join(restored, "database.sqlite"), { readonly: true });
    expect(copy.prepare("SELECT json_extract(data, '$.title') AS title FROM items").get()).toEqual({ title: "Kept" });
  });
});
```

Create `server/src/http/admin.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { testApp } from "../../test/helpers";

describe("admin endpoints", () => {
  it("lists admins without any secret fields", async () => {
    const { app, signIn } = await testApp();
    const session = await signIn();
    const { admins } = (await app.inject({ method: "GET", url: "/api/admins", headers: session.headers })).json();
    expect(admins).toEqual([{ id: session.adminId, email: "admin@thapar.edu", active: true, createdAt: expect.any(Number) }]);
  });

  it("lets one admin reset the other, ending their sessions and returning a setup link", async () => {
    const { app, signIn } = await testApp();
    const first = await signIn("a@thapar.edu");
    const second = await signIn("b@thapar.edu");
    const reset = await app.inject({ method: "POST", url: `/api/admins/${second.adminId}/reset`, headers: first.headers });
    expect(reset.json().setupLink).toMatch(/^https:\/\/am-tiet\.test\/admin\/setup#[A-Za-z0-9_-]{43}$/);
    expect((await app.inject({ method: "GET", url: "/api/auth/me", headers: second.headers })).statusCode).toBe(401);
  });

  it("refuses resetting yourself", async () => {
    const { app, signIn } = await testApp();
    const session = await signIn();
    const response = await app.inject({ method: "POST", url: `/api/admins/${session.adminId}/reset`, headers: session.headers });
    expect(response.statusCode).toBe(400);
  });

  it("pages through the audit log newest first", async () => {
    const { app, signIn } = await testApp();
    const session = await signIn();
    const { entries } = (await app.inject({ method: "GET", url: "/api/audit?limit=1", headers: session.headers })).json();
    expect(entries).toHaveLength(1);
    expect(entries[0].action).toBe("login");
  });

  it("downloads a backup as a gzip attachment and records it", async () => {
    const { app, signIn } = await testApp();
    const session = await signIn();
    const response = await app.inject({ method: "GET", url: "/api/backup", headers: session.headers });
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toBe("application/gzip");
    expect(response.headers["content-disposition"]).toMatch(/^attachment; filename="am-tiet-backup-\d{4}-\d{2}-\d{2}\.tar\.gz"$/);
    expect(response.rawPayload.subarray(0, 2)).toEqual(Buffer.from([0x1f, 0x8b]));
    const audit = (await app.inject({ method: "GET", url: "/api/audit", headers: session.headers })).json();
    expect(audit.entries[0].action).toBe("backup_downloaded");
  });

  it("requires a session for every admin endpoint", async () => {
    const { app } = await testApp();
    for (const [method, url] of [
      ["GET", "/api/admins"],
      ["POST", "/api/admins/1/reset"],
      ["GET", "/api/audit"],
      ["GET", "/api/backup"]
    ] as const) {
      expect((await app.inject({ method, url })).statusCode).toBe(401);
    }
  });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx vitest run src/backup src/http/admin.test.ts`
Expected: FAIL — `Failed to resolve import "./backup"`, and the admin endpoints answer 404.

- [ ] **Step 3: Implement**

Create `server/src/backup/backup.ts`:
```ts
import { copyFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { create } from "tar";
import { dataPaths } from "../config";
import type { Db } from "../db/database";

/** Archive layout: database.sqlite, media/, content.json (read by restore.sh). */
export async function createBackupArchive(db: Db, dataDir: string, outFile: string): Promise<void> {
  const paths = dataPaths(dataDir);
  const stage = mkdtempSync(join(tmpdir(), "am-tiet-backup-"));
  try {
    // SQLite's online backup copies a consistent snapshot even while the site is in use.
    await db.backup(join(stage, "database.sqlite"));
    mkdirSync(join(stage, "media"));
    if (existsSync(paths.media)) cpSync(paths.media, join(stage, "media"), { recursive: true });
    const entries = ["database.sqlite", "media"];
    if (existsSync(paths.content)) {
      copyFileSync(paths.content, join(stage, "content.json"));
      entries.push("content.json");
    }
    await create({ gzip: true, file: outFile, cwd: stage }, entries);
  } finally {
    rmSync(stage, { recursive: true, force: true });
  }
}
```

Create `server/src/http/adminRoutes.ts`:
```ts
import { createReadStream, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { listAudit, recordAudit } from "../audit/auditLog";
import { getAdmin, listAdmins, resetAdmin, setupLink } from "../auth/admins";
import { createBackupArchive } from "../backup/backup";
import type { RouteContext } from "./app";
import { HttpError } from "./httpError";

const idParams = z.object({ id: z.coerce.number().int().positive() });
const auditQuery = z.object({
  before: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(500).optional()
});

export function registerAdminRoutes(app: FastifyInstance, ctx: RouteContext): void {
  const guarded = { preHandler: ctx.requireAdmin };

  app.get("/api/admins", guarded, async () => ({ admins: listAdmins(ctx.db) }));

  app.post("/api/admins/:id/reset", guarded, async (request) => {
    const { id } = idParams.parse(request.params);
    if (id === request.admin!.adminId) {
      throw new HttpError(400, "You cannot reset your own login. Use a recovery code, or ask the other admin.");
    }
    const target = getAdmin(ctx.db, id);
    if (!target) throw new HttpError(404, "Not found.");
    const now = ctx.clock();
    const token = resetAdmin(ctx.db, id, now);
    recordAudit(ctx.db, {
      at: now,
      adminEmail: request.admin!.email,
      action: "admin_reset",
      detail: target.email,
      ip: request.ip
    });
    return { setupLink: setupLink(ctx.config.publicOrigin, token) };
  });

  app.get("/api/audit", guarded, async (request) => ({ entries: listAudit(ctx.db, auditQuery.parse(request.query)) }));

  app.get("/api/backup", guarded, async (request, reply) => {
    const folder = mkdtempSync(join(tmpdir(), "am-tiet-download-"));
    const file = join(folder, "backup.tar.gz");
    await createBackupArchive(ctx.db, ctx.dataDir, file);
    const now = ctx.clock();
    recordAudit(ctx.db, { at: now, adminEmail: request.admin!.email, action: "backup_downloaded", ip: request.ip });
    const date = new Date(now).toISOString().slice(0, 10);
    const stream = createReadStream(file);
    stream.on("close", () => rmSync(folder, { recursive: true, force: true }));
    return reply
      .header("Content-Type", "application/gzip")
      .header("Content-Disposition", `attachment; filename="am-tiet-backup-${date}.tar.gz"`)
      .send(stream);
  });
}
```

In `server/src/http/app.ts`, add `import { registerAdminRoutes } from "./adminRoutes";` and `registerAdminRoutes(app, ctx);` after `registerItemRoutes(app, ctx);`.

- [ ] **Step 4: Verify and commit**

Run: `npm test && npm run typecheck`
Expected: all pass.
```bash
git add server/src/backup server/src/http/adminRoutes.ts server/src/http/admin.test.ts server/src/http/app.ts
git commit -m "feat(api): admin reset, audit log and backup download endpoints"
```

---

### Task 13: Server commands, startup and production bundle

**Files:**
- Create: `server/src/cliCommands.ts`, `server/src/cli.ts`, `server/src/server.ts`, `server/build.mjs`
- Test: `server/src/cliCommands.test.ts`

**Interfaces:**
- Consumes: everything above.
- Produces:
  ```ts
  // cliCommands.ts
  export function runCli(args: string[], deps: { db: Db; dataDir: string; publicOrigin: string; now: number; print: (line: string) => void }): number; // exit code
  // server.ts
  export function runMaintenance(ctx: { db: Db; dataDir: string }, now: number): void;
  ```
  Commands used by Plan 4's scripts: `node dist/cli.js create-admin <email>`, `node dist/cli.js reset-admin <email>`, `node dist/cli.js publish`.

- [ ] **Step 1: Write the failing tests**

Create `server/src/cliCommands.test.ts`:
```ts
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { activeAdmin, tempDataDir } from "../test/helpers";
import { listAudit } from "./audit/auditLog";
import { inspectSetupToken, listAdmins } from "./auth/admins";
import { runCli } from "./cliCommands";
import { openDatabase } from "./db/database";

const T = Date.UTC(2026, 8, 27, 10);

function setup() {
  const dataDir = tempDataDir();
  const db = openDatabase(join(dataDir, "database.sqlite"));
  const lines: string[] = [];
  const run = (...args: string[]) =>
    runCli(args, { db, dataDir, publicOrigin: "https://am-tiet.thapar.edu", now: T, print: (line) => lines.push(line) });
  return { db, dataDir, lines, run };
}

describe("server commands", () => {
  it("creates an admin and prints a working setup link", () => {
    const { db, lines, run } = setup();
    expect(run("create-admin", "Priya@thapar.edu")).toBe(0);
    const link = lines.find((line) => line.startsWith("https://"))!;
    expect(link).toMatch(/^https:\/\/am-tiet\.thapar\.edu\/admin\/setup#/);
    expect(inspectSetupToken(db, link.split("#")[1], T)).toEqual({ email: "priya@thapar.edu" });
    expect(listAudit(db)[0]).toMatchObject({ action: "admin_created", detail: "priya@thapar.edu" });
  });

  it("resets an existing admin", async () => {
    const { db, lines, run } = setup();
    await activeAdmin(db, "a@thapar.edu", T);
    expect(run("reset-admin", "a@thapar.edu")).toBe(0);
    expect(listAdmins(db)[0].active).toBe(false);
    expect(lines.some((line) => line.includes("/admin/setup#"))).toBe(true);
  });

  it("explains mistakes in plain words and exits non-zero", () => {
    const { lines, run } = setup();
    expect(run("reset-admin", "nobody@thapar.edu")).toBe(1);
    expect(lines.at(-1)).toBe("No admin with the email nobody@thapar.edu.");
    expect(run("create-admin")).toBe(1);
    expect(run("launch-rockets")).toBe(1);
    expect(lines.at(-1)).toMatch(/^Usage:/);
  });

  it("republishes content.json from the database", () => {
    const { dataDir, run } = setup();
    expect(run("publish")).toBe(0);
    expect(existsSync(join(dataDir, "content.json"))).toBe(true);
  });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx vitest run src/cliCommands.test.ts`
Expected: FAIL — `Failed to resolve import "./cliCommands"`.

- [ ] **Step 3: Implement the commands**

Create `server/src/cliCommands.ts`:
```ts
import { recordAudit } from "./audit/auditLog";
import { SetupError, createAdmin, findAdminRow, resetAdmin, setupLink } from "./auth/admins";
import { republish } from "./content/publish";
import type { Db } from "./db/database";

const USAGE = "Usage: cli create-admin <email> | reset-admin <email> | publish";

export function runCli(
  args: string[],
  deps: { db: Db; dataDir: string; publicOrigin: string; now: number; print: (line: string) => void }
): number {
  const [command, email] = args;
  const { db, print, now } = deps;
  try {
    if (command === "create-admin" && email) {
      const { admin, setupToken } = createAdmin(db, email, now);
      recordAudit(db, { at: now, adminEmail: null, action: "admin_created", detail: admin.email });
      print(`Admin ${admin.email} created. Send them this setup link (valid for 24 hours):`);
      print(setupLink(deps.publicOrigin, setupToken));
      return 0;
    }
    if (command === "reset-admin" && email) {
      const admin = findAdminRow(db, email);
      if (!admin) {
        print(`No admin with the email ${email.trim().toLowerCase()}.`);
        return 1;
      }
      const token = resetAdmin(db, admin.id, now);
      recordAudit(db, { at: now, adminEmail: null, action: "admin_reset", detail: admin.email });
      print(`Login for ${admin.email} was reset. Send them this setup link (valid for 24 hours):`);
      print(setupLink(deps.publicOrigin, token));
      return 0;
    }
    if (command === "publish") {
      republish({ db, dataDir: deps.dataDir });
      print("content.json rebuilt from the database.");
      return 0;
    }
  } catch (error) {
    if (error instanceof SetupError) {
      print(error.message);
      return 1;
    }
    throw error;
  }
  print(USAGE);
  return 1;
}
```

Create `server/src/cli.ts`:
```ts
import { mkdirSync } from "node:fs";
import { runCli } from "./cliCommands";
import { dataPaths, loadConfig } from "./config";
import { seedIfEmpty } from "./content/publish";
import { openDatabase } from "./db/database";

const config = loadConfig();
const paths = dataPaths(config.dataDir);
mkdirSync(paths.media, { recursive: true });
const db = openDatabase(paths.database);
seedIfEmpty(db, Date.now());
const code = runCli(process.argv.slice(2), {
  db,
  dataDir: config.dataDir,
  publicOrigin: config.publicOrigin,
  now: Date.now(),
  print: (line) => console.log(line)
});
db.close();
process.exit(code);
```

Create `server/src/server.ts`:
```ts
import { mkdirSync } from "node:fs";
import { purgeAudit } from "./audit/auditLog";
import { purgeExpiredSessions } from "./auth/sessions";
import { dataPaths, loadConfig } from "./config";
import { purgeDeleted } from "./content/items";
import { republish, seedIfEmpty } from "./content/publish";
import { openDatabase, type Db } from "./db/database";
import { buildApp } from "./http/app";
import { sweepOrphanMedia } from "./media/images";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Daily housekeeping; also rebuilds content.json so a lost or damaged file heals itself. */
export function runMaintenance(ctx: { db: Db; dataDir: string }, now: number): void {
  purgeDeleted(ctx.db, now);
  purgeAudit(ctx.db, now);
  purgeExpiredSessions(ctx.db, now);
  sweepOrphanMedia(ctx.db, dataPaths(ctx.dataDir).media, now);
  republish(ctx);
}

async function start(): Promise<void> {
  const config = loadConfig();
  const paths = dataPaths(config.dataDir);
  mkdirSync(paths.media, { recursive: true });
  const db = openDatabase(paths.database);
  const ctx = { db, dataDir: config.dataDir };

  seedIfEmpty(db, Date.now());
  runMaintenance(ctx, Date.now());
  setInterval(() => runMaintenance(ctx, Date.now()), DAY_MS).unref();

  const app = await buildApp({ db, dataDir: config.dataDir, clock: Date.now, config, logger: true });
  await app.listen({ port: config.port, host: config.host });

  const stop = async () => {
    await app.close();
    db.close();
    process.exit(0);
  };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
}

if (process.argv[1] && /server\.(ts|js)$/.test(process.argv[1])) {
  start().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
```

Create `server/build.mjs`:
```js
import { build } from "esbuild";

// Our code (including the shared ../src/content modules) is bundled; npm
// packages stay external and are installed in the production image.
await build({
  entryPoints: ["src/server.ts", "src/cli.ts"],
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  outdir: "dist",
  packages: "external",
  sourcemap: true,
  logLevel: "info"
});
```

- [ ] **Step 4: Run the tests and watch them pass**

Run: `npm test && npm run typecheck`
Expected: all pass.

- [ ] **Step 5: Build and run the real server end to end**

Run from `server/`:
```bash
npm run build
```
Expected: `dist/server.js` and `dist/cli.js` are written.

Start it in the background with a throwaway data directory:
```bash
DATA_DIR=./data-smoke PUBLIC_ORIGIN=http://localhost:8787 PORT=8787 node dist/server.js
```
Then, in another shell:
```bash
curl -s http://localhost:8787/api/health
```
Expected: `{"ok":true}`
```bash
node -e "const s=require('./data-smoke/content.json');console.log(s.projects.length,s.industryCards.length,s.people.length,s.gallery.length)"
```
Expected: `9 4 28 6` (seeded and published on startup).
```bash
DATA_DIR=./data-smoke PUBLIC_ORIGIN=http://localhost:8787 node dist/cli.js create-admin smoke@thapar.edu
```
Expected: `Admin smoke@thapar.edu created. ...` followed by `http://localhost:8787/admin/setup#...`.
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8787/api/items/projects
```
Expected: `401`.

Stop the server and delete `server/data-smoke`.

- [ ] **Step 6: Commit**

```bash
git add server/src/cliCommands.ts server/src/cliCommands.test.ts server/src/cli.ts server/src/server.ts server/build.mjs
git commit -m "feat(api): server startup, maintenance, admin commands and production bundle"
```

---

### Task 14: Verify the whole plan

**Files:** none changed unless a check fails.

- [ ] **Step 1: Every test, both packages**

Run from `server/`: `npm test && npm run typecheck`
Run from the root: `npx tsc -b && npm run test`
Expected: every command exits 0.

- [ ] **Step 2: Spec checklist**

Confirm each line has a passing test (file in brackets):
- Login needs password + code; one generic failure message [`http/auth.test.ts`, `auth/login.test.ts`]
- Argon2id hashing [`auth/passwords.test.ts`]; weak and common passwords refused [`auth/passwords.test.ts`, `http/auth.test.ts`]
- Lockout after 5, for 15 minutes [`auth/login.test.ts`]; per-IP 429 [`http/auth.test.ts`]
- Code replay refused [`auth/totp.test.ts`, `auth/login.test.ts`]; recovery codes single-use [`auth/recoveryCodes.test.ts`, `auth/login.test.ts`]
- Session idle 60 min / absolute 12 h / sign out everywhere [`auth/sessions.test.ts`, `http/auth.test.ts`]
- Cookie attributes; CSRF token; foreign Origin refused [`http/auth.test.ts`]
- Setup link one-time, 24 h, token only hashed in the database [`auth/admins.test.ts`, `http/auth.test.ts`]
- Admin-to-admin reset, not self [`http/admin.test.ts`]
- Uploads: JPEG/PNG/WebP only, SVG/HTML/text/GIF refused, ≤10 MB, ≤40 MP, metadata stripped, sizes [`media/images.test.ts`, `http/items.test.ts`]
- Links http/https only; LinkedIn domain; image paths local only [`content/schemas.test.ts`]
- Script-like text stored as text [`http/items.test.ts`]
- Unknown areas and injection-shaped ids answer 404 [`http/items.test.ts`]
- Edit conflict 409 [`content/items.test.ts`, `http/items.test.ts`]
- Hidden items never published; deleted restorable 30 days [`content/publish.test.ts`, `content/items.test.ts`]
- Publish rolls back when `content.json` cannot be written [`content/publish.test.ts`]
- Audit log for every action, 1-year purge [`audit/auditLog.test.ts`, `http/*.test.ts`]
- Backup contains database, media, snapshot [`backup/backup.test.ts`, `http/admin.test.ts`]
- Seed equals today's site [`content/publish.test.ts`]

Any line without a passing test is a gap: add the test, watch it fail, fix, before calling the plan done.
