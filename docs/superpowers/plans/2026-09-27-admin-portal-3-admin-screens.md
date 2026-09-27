# Admin Portal Plan 3 — Admin Screens

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The `/admin` part of the React app: sign-in, first-time setup, the four editing screens (list, reorder, hide, edit, delete), recently deleted, audit log, admins and backup — loaded only when someone visits `/admin`, and working against the Plan 2 API.

**Architecture:** One lazily loaded `AdminApp` mounted at `/admin/*`, outside the public page layout. All server calls go through an `AdminApi` interface; the real implementation wraps `fetch` (CSRF header, session-expiry callback, readable errors) and tests use an in-memory fake with the same interface. The four content areas share one list screen and one edit panel, configured per area with its own form.

**Tech Stack:** React 18, React Router 7, TypeScript, Vite 5, Vitest + Testing Library (from Plan 1), @dnd-kit (drag to reorder), lucide-react (icons already used by the site).

Spec: `docs/superpowers/specs/2026-09-27-admin-portal-design.md`. Depends on Plan 1 (content format, test setup) and Plan 2 (API endpoints and their exact request/response shapes, listed in Plan 2's Endpoints table).

## Global Constraints

- Public visitors never download admin code: `AdminApp` is imported only through `React.lazy`, and its stylesheet is imported only by `AdminApp`.
- Every non-GET request sends the session's CSRF token in `x-csrf-token`; requests use `credentials: "same-origin"`. A 401 on any authenticated call returns the admin to the sign-in screen with "Your session ended. Please sign in again."
- Forms send only the fields the API accepts (the API rejects unknown fields): projects `{title, description, links}`; industry `{heading, bullets}`; people `{name, designation, institution, photo, linkedin}`; gallery `{image, title, description, inHomeCarousel}`. Derived fields (`photoAlt`, `alt`) are never sent.
- Client-side checks mirror the API limits (Plan 2 Global Constraints) for early feedback only; the API stays the authority and its message is shown verbatim.
- Error messages are shown in a `role="alert"` region; success notices in `role="status"`.
- Every control has a visible label and a visible focus outline. Icon-only buttons have an `aria-label`.
- Content is always rendered as React text, never as HTML.
- The admin look follows the site: CSS variables from `src/styles.css`, 6–8px radii, no pill buttons, no heavy shadows.
- TDD: write each test, watch it fail for the stated reason, then implement.
- Before every commit: `npx tsc -b` and `npm run test` pass at the root; `npm test` passes in `server/`.
- Commit messages end with:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_013NpmP1eAM4BAerjk59oFjZ
  ```

## Screens

| Path | Screen |
|---|---|
| `/admin/setup#<token>` | First-time setup: password → authenticator → recovery codes |
| `/admin` | Redirects to `/admin/projects` (sign-in shown first when signed out) |
| `/admin/projects`, `/admin/industry`, `/admin/people`, `/admin/gallery` | List + edit for each area |
| `/admin/deleted` | Recently deleted, with Restore |
| `/admin/audit` | Audit log |
| `/admin/admins` | Admins (reset the other admin's login) and full-backup download |

## File Map

| File | Responsibility |
|---|---|
| `src/App.tsx` | Top-level routes: `/admin/*` → lazy `AdminApp`, everything else → public `Layout` |
| `vite.config.ts` | Dev proxy for `/api`; dev middleware serving `server/dev-data/content.json` and `/media/*` |
| `server/package.json`, `server/dev.env` | Local API run against `server/dev-data` |
| `src/admin/types.ts` | Admin-side types |
| `src/admin/api.ts` | `AdminApi` interface, `ApiError`, `createHttpApi` |
| `src/admin/context.tsx` | `ApiProvider`/`useApi`, `AuthProvider`/`useAuth`, `RequireAuth`, `messageOf` |
| `src/admin/AdminApp.tsx` | Admin routes |
| `src/admin/LoginPage.tsx` | Sign-in form |
| `src/admin/SetupPage.tsx` | Setup flow |
| `src/admin/Shell.tsx` | Admin header, navigation, sign-out |
| `src/admin/fields.tsx` | `TextField`, `CheckboxField`, `RepeatableList` |
| `src/admin/PhotoField.tsx` | Upload with preview |
| `src/admin/forms.tsx` | The four area forms |
| `src/admin/areas.ts` | Per-area configuration: path, titles, labels, empty value, `toInput`, validation, form |
| `src/admin/reorder.ts` | Pure `moveId` |
| `src/admin/ItemList.tsx` | Sortable list with hide / edit / delete / move |
| `src/admin/EditPanel.tsx` | Edit form wrapper: save, conflicts, errors |
| `src/admin/AreaPage.tsx` | List ↔ edit for one area |
| `src/admin/DeletedPage.tsx`, `AuditPage.tsx`, `AdminsPage.tsx` | The three utility screens |
| `src/admin/admin.css` | Admin styles |
| `src/test/fakeAdminApi.ts` | In-memory `AdminApi` for tests |
| `src/test/renderAdmin.tsx` | Render helper for admin tests |

---

### Task 1: The `/admin` route, loaded on demand, and local development wiring

**Files:**
- Create: `src/admin/AdminApp.tsx` (placeholder, replaced in Task 3), `src/admin/admin.css`, `server/dev.env`
- Modify: `src/App.tsx`, `vite.config.ts`, `server/package.json`, `server/.gitignore`, `package.json`
- Test: `src/App.test.tsx`

**Interfaces:**
- Produces: `export default function AdminApp(props: { api?: AdminApi }): JSX.Element` (props used from Task 3). `App.tsx`'s default export becomes `App`, which routes `/admin/*` to `AdminApp` and everything else to the existing `Layout`.

- [ ] **Step 1: Write the failing tests**

Append inside the `describe` in `src/App.test.tsx`:
```tsx
  it("serves /admin without the public header or footer", async () => {
    await renderAt("/admin");
    expect(await screen.findByTestId("admin-root")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "TIET-TAU home" })).toBeNull();
    expect(document.querySelector(".site-footer")).toBeNull();
  });

  it("keeps the public site at every other path", async () => {
    await renderAt("/people");
    expect(screen.getByRole("link", { name: "TIET-TAU home" })).toBeTruthy();
    expect(screen.queryByTestId("admin-root")).toBeNull();
  });
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx vitest run src/App.test.tsx`
Expected: FAIL — `Unable to find an element by: [data-testid="admin-root"]`.

- [ ] **Step 3: Split the routes and add the placeholder**

Create `src/admin/AdminApp.tsx`:
```tsx
import "./admin.css";

export default function AdminApp() {
  return (
    <div className="admin-root" data-testid="admin-root">
      <p>Admin</p>
    </div>
  );
}
```

Create `src/admin/admin.css`:
```css
.admin-root {
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-body);
  min-height: 100vh;
}
```

In `src/App.tsx`:
- Change the React import to `import { Suspense, lazy, useEffect, useRef, useState } from "react";` (keep any names the file still uses).
- Add after the imports:
```tsx
const AdminApp = lazy(() => import("./admin/AdminApp"));
```
- Change `export default Layout;` to:
```tsx
export default function App() {
  return (
    <Routes>
      <Route
        path="/admin/*"
        element={
          <Suspense fallback={<p className="admin-loading">Loading…</p>}>
            <AdminApp />
          </Suspense>
        }
      />
      <Route path="*" element={<Layout />} />
    </Routes>
  );
}
```
The existing `<Routes>` inside `Layout` keeps working as descendant routes of the `*` route.

- [ ] **Step 4: Run the tests and watch them pass**

Run: `npx vitest run src/App.test.tsx`
Expected: PASS.

- [ ] **Step 5: Local development wiring**

Create `server/dev.env` (no secrets; used only on the developer's machine):
```
DATA_DIR=./dev-data
PUBLIC_ORIGIN=http://localhost:5173
PORT=8787
TRUST_PROXY=0
```

In `server/package.json` replace the `dev` and `cli` scripts with:
```json
    "dev": "tsx watch --env-file=dev.env src/server.ts",
    "cli": "tsx --env-file=dev.env src/cli.ts",
```

Append to `server/.gitignore`:
```
dev-data/
```

In the root `package.json` `scripts`, add:
```json
    "dev:api": "npm --prefix server run dev",
    "admin:create": "npm --prefix server run cli -- create-admin",
```

Replace the root `vite.config.ts` with (keep the `test` block exactly as Plans 1 and 2 left it):
```ts
import { createReadStream, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const DEV_DATA = fileURLToPath(new URL("./server/dev-data", import.meta.url));

// In development the API writes content.json and uploads into server/dev-data.
// This serves them at the same paths Caddy serves them in production, ahead of
// the seed copy in public/content.json.
function serveDevData(): Plugin {
  return {
    name: "serve-dev-data",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url ?? "").split("?")[0];
        let file: string | null = null;
        if (path === "/content.json") file = join(DEV_DATA, "content.json");
        else if (/^\/media\/[A-Za-z0-9._-]+\.webp$/.test(path)) file = join(DEV_DATA, "media", path.slice("/media/".length));
        if (!file || !existsSync(file)) return next();
        res.setHeader("Content-Type", file.endsWith(".json") ? "application/json" : "image/webp");
        res.setHeader("Cache-Control", "no-cache");
        createReadStream(file).pipe(res);
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), serveDevData()],
  server: {
    proxy: { "/api": "http://localhost:8787" }
  },
  test: {
    environment: "node",
    environmentMatchGlobs: [["src/**/*.test.tsx", "jsdom"]],
    globals: true,
    setupFiles: ["src/test/setupDom.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "server/**"]
  }
});
```

- [ ] **Step 6: Verify and commit**

Run: `npx tsc -b && npm run test && npm run build`
Expected: all pass; the build output lists a separate `AdminApp-*.js` chunk.
Run: `grep -l "admin-root" dist/assets/*.js`
Expected: exactly one file, and it is the `AdminApp-*.js` chunk (not `index-*.js`).

```bash
git add src/App.tsx src/App.test.tsx src/admin vite.config.ts package.json server/package.json server/dev.env server/.gitignore
git commit -m "feat(admin): lazy /admin route and local API wiring"
```

---

### Task 2: API client

**Files:**
- Create: `src/admin/types.ts`, `src/admin/api.ts`
- Test: `src/admin/api.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // types.ts
  export type Area = "projects" | "industryCards" | "people" | "gallery";
  export type UploadKind = "person" | "gallery";
  export type ProjectInput = { title: string; description: string; links: { label: string; url: string }[] };
  export type IndustryInput = { heading: string; bullets: { text: string; label?: string }[] };
  export type PersonInput = { name: string; designation: string; institution: string; photo: string; linkedin: string };
  export type GalleryInput = { image: string; title: string; description: string; inHomeCarousel: boolean };
  export type AdminItem = { id: string; area: Area; position: number; hidden: boolean; data: Record<string, unknown>; version: number; deletedAt: number | null; updatedAt: number };
  export type AdminAccount = { id: number; email: string; active: boolean; createdAt: number };
  export type AuditEntry = { id: number; at: number; adminEmail: string | null; action: string; detail: string; ip: string | null };
  // api.ts
  export class ApiError extends Error { readonly status: number }
  export interface AdminApi {
    onUnauthorized(handler: () => void): () => void;
    me(): Promise<{ email: string } | null>;
    login(input: { email: string; password: string; code: string }): Promise<{ email: string; usedRecoveryCode: boolean }>;
    logout(): Promise<void>;
    logoutAll(): Promise<void>;
    inspectSetup(token: string): Promise<{ email: string }>;
    beginSetup(token: string, password: string): Promise<{ qrDataUrl: string; secret: string }>;
    completeSetup(token: string, code: string): Promise<{ recoveryCodes: string[] }>;
    listItems(area: Area): Promise<AdminItem[]>;
    createItem(area: Area, data: object): Promise<AdminItem>;
    updateItem(area: Area, id: string, data: object, version: number): Promise<AdminItem>;
    setHidden(area: Area, id: string, hidden: boolean): Promise<AdminItem>;
    reorder(area: Area, ids: string[]): Promise<void>;
    deleteItem(area: Area, id: string): Promise<void>;
    restoreItem(area: Area, id: string): Promise<void>;
    listDeleted(): Promise<AdminItem[]>;
    upload(kind: UploadKind, file: File): Promise<string>;
    listAdmins(): Promise<AdminAccount[]>;
    resetAdmin(id: number): Promise<string>;
    listAudit(before?: number): Promise<AuditEntry[]>; // pages of 50
    readonly backupUrl: string;
  }
  export function createHttpApi(fetchImpl?: typeof fetch): AdminApi;
  ```

- [ ] **Step 1: Write the failing tests**

Create `src/admin/api.test.ts`:
```ts
import { describe, expect, it, vi } from "vitest";
import { ApiError, createHttpApi } from "./api";

type Call = { url: string; init: RequestInit };

function fakeFetch(responses: Array<{ status: number; body?: unknown }>) {
  const calls: Call[] = [];
  const impl = vi.fn(async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const next = responses.shift() ?? { status: 200, body: {} };
    return new Response(next.body === undefined ? "" : JSON.stringify(next.body), { status: next.status });
  });
  return { calls, impl: impl as unknown as typeof fetch };
}

const headersOf = (call: Call) => new Headers(call.init.headers);

describe("createHttpApi", () => {
  it("sends the CSRF token from sign-in on every change, and never on reads", async () => {
    const { calls, impl } = fakeFetch([
      { status: 200, body: { email: "a@thapar.edu", csrfToken: "csrf-1", usedRecoveryCode: false } },
      { status: 200, body: { items: [] } },
      { status: 201, body: { item: { id: "x" } } }
    ]);
    const api = createHttpApi(impl);
    await api.login({ email: "a@thapar.edu", password: "p", code: "123456" });
    await api.listItems("projects");
    await api.createItem("projects", { title: "T" });
    expect(headersOf(calls[1]).get("x-csrf-token")).toBeNull();
    expect(headersOf(calls[2]).get("x-csrf-token")).toBe("csrf-1");
    expect(calls[2].init.credentials).toBe("same-origin");
    expect(JSON.parse(String(calls[2].init.body))).toEqual({ data: { title: "T" } });
  });

  it("picks up the CSRF token from an existing session", async () => {
    const { calls, impl } = fakeFetch([{ status: 200, body: { email: "a@thapar.edu", csrfToken: "csrf-2" } }, { status: 200 }]);
    const api = createHttpApi(impl);
    expect(await api.me()).toEqual({ email: "a@thapar.edu" });
    await api.logout();
    expect(headersOf(calls[1]).get("x-csrf-token")).toBe("csrf-2");
  });

  it("returns null from me() when signed out, without calling the expiry handler", async () => {
    const { impl } = fakeFetch([{ status: 401, body: { error: "Please sign in." } }]);
    const api = createHttpApi(impl);
    const expired = vi.fn();
    api.onUnauthorized(expired);
    expect(await api.me()).toBeNull();
    expect(expired).not.toHaveBeenCalled();
  });

  it("calls the expiry handler when a signed-in call gets 401", async () => {
    const { impl } = fakeFetch([{ status: 401, body: { error: "Please sign in." } }]);
    const api = createHttpApi(impl);
    const expired = vi.fn();
    api.onUnauthorized(expired);
    await expect(api.listItems("people")).rejects.toBeInstanceOf(ApiError);
    expect(expired).toHaveBeenCalledTimes(1);
  });

  it("does not treat a failed sign-in as an expired session", async () => {
    const { impl } = fakeFetch([{ status: 401, body: { error: "Invalid email, password or code." } }]);
    const api = createHttpApi(impl);
    const expired = vi.fn();
    api.onUnauthorized(expired);
    await expect(api.login({ email: "a", password: "b", code: "c" })).rejects.toThrow("Invalid email, password or code.");
    expect(expired).not.toHaveBeenCalled();
  });

  it("surfaces the server's message and status, or a plain fallback", async () => {
    const { impl } = fakeFetch([
      { status: 409, body: { error: "This was changed by someone else — reload to see their version." } },
      { status: 500 }
    ]);
    const api = createHttpApi(impl);
    const conflict = await api.updateItem("projects", "x", {}, 1).catch((error) => error);
    expect(conflict).toMatchObject({ status: 409, message: "This was changed by someone else — reload to see their version." });
    await expect(api.listDeleted()).rejects.toThrow("Something went wrong. Please try again.");
  });

  it("uploads a file as multipart form data without forcing a content type", async () => {
    const { calls, impl } = fakeFetch([{ status: 200, body: { path: "/media/a.webp" } }]);
    const api = createHttpApi(impl);
    const path = await api.upload("person", new File(["x"], "me.jpg", { type: "image/jpeg" }));
    expect(path).toBe("/media/a.webp");
    expect(calls[0].url).toBe("/api/uploads/person");
    expect(calls[0].init.body).toBeInstanceOf(FormData);
    expect(headersOf(calls[0]).get("content-type")).toBeNull();
  });

  it("escapes ids and tokens in URLs", async () => {
    const { calls, impl } = fakeFetch([{ status: 200, body: { email: "e" } }, { status: 200 }]);
    const api = createHttpApi(impl);
    await api.inspectSetup("a/b#c");
    await api.deleteItem("projects", "x/../y");
    expect(calls[0].url).toBe("/api/setup/a%2Fb%23c");
    expect(calls[1].url).toBe("/api/items/projects/x%2F..%2Fy");
  });

  it("pages the audit log 50 at a time", async () => {
    const { calls, impl } = fakeFetch([{ status: 200, body: { entries: [] } }, { status: 200, body: { entries: [] } }]);
    const api = createHttpApi(impl);
    await api.listAudit();
    await api.listAudit(120);
    expect(calls.map((call) => call.url)).toEqual(["/api/audit?limit=50", "/api/audit?limit=50&before=120"]);
  });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx vitest run src/admin/api.test.ts`
Expected: FAIL — `Failed to resolve import "./api"`.

- [ ] **Step 3: Implement**

Create `src/admin/types.ts`:
```ts
export type Area = "projects" | "industryCards" | "people" | "gallery";
export type UploadKind = "person" | "gallery";

export type ProjectInput = { title: string; description: string; links: { label: string; url: string }[] };
export type IndustryInput = { heading: string; bullets: { text: string; label?: string }[] };
export type PersonInput = { name: string; designation: string; institution: string; photo: string; linkedin: string };
export type GalleryInput = { image: string; title: string; description: string; inHomeCarousel: boolean };

export type AdminItem = {
  id: string;
  area: Area;
  position: number;
  hidden: boolean;
  data: Record<string, unknown>;
  version: number;
  deletedAt: number | null;
  updatedAt: number;
};

export type AdminAccount = { id: number; email: string; active: boolean; createdAt: number };

export type AuditEntry = {
  id: number;
  at: number;
  adminEmail: string | null;
  action: string;
  detail: string;
  ip: string | null;
};
```

Create `src/admin/api.ts`:
```ts
import type { AdminAccount, AdminItem, Area, AuditEntry, UploadKind } from "./types";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
  }
}

export interface AdminApi {
  onUnauthorized(handler: () => void): () => void;
  me(): Promise<{ email: string } | null>;
  login(input: { email: string; password: string; code: string }): Promise<{ email: string; usedRecoveryCode: boolean }>;
  logout(): Promise<void>;
  logoutAll(): Promise<void>;
  inspectSetup(token: string): Promise<{ email: string }>;
  beginSetup(token: string, password: string): Promise<{ qrDataUrl: string; secret: string }>;
  completeSetup(token: string, code: string): Promise<{ recoveryCodes: string[] }>;
  listItems(area: Area): Promise<AdminItem[]>;
  createItem(area: Area, data: object): Promise<AdminItem>;
  updateItem(area: Area, id: string, data: object, version: number): Promise<AdminItem>;
  setHidden(area: Area, id: string, hidden: boolean): Promise<AdminItem>;
  reorder(area: Area, ids: string[]): Promise<void>;
  deleteItem(area: Area, id: string): Promise<void>;
  restoreItem(area: Area, id: string): Promise<void>;
  listDeleted(): Promise<AdminItem[]>;
  upload(kind: UploadKind, file: File): Promise<string>;
  listAdmins(): Promise<AdminAccount[]>;
  resetAdmin(id: number): Promise<string>;
  listAudit(before?: number): Promise<AuditEntry[]>;
  readonly backupUrl: string;
}

const FALLBACK = "Something went wrong. Please try again.";

export function createHttpApi(fetchImpl: typeof fetch = (...args) => fetch(...args)): AdminApi {
  let csrfToken = "";
  const expiryHandlers = new Set<() => void>();
  const enc = encodeURIComponent;

  async function request<T>(method: string, path: string, body?: unknown, signedIn = true): Promise<T> {
    const headers: Record<string, string> = {};
    let payload: BodyInit | undefined;
    if (body instanceof FormData) {
      payload = body;
    } else if (body !== undefined) {
      headers["content-type"] = "application/json";
      payload = JSON.stringify(body);
    }
    if (method !== "GET" && csrfToken) headers["x-csrf-token"] = csrfToken;

    let response: Response;
    try {
      response = await fetchImpl(path, { method, headers, body: payload, credentials: "same-origin" });
    } catch {
      throw new ApiError(0, "Could not reach the server. Check your connection and try again.");
    }

    const text = await response.text();
    let json: Record<string, unknown> = {};
    try {
      json = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
      json = {};
    }
    if (!response.ok) {
      if (response.status === 401 && signedIn) expiryHandlers.forEach((handler) => handler());
      throw new ApiError(response.status, typeof json.error === "string" ? json.error : FALLBACK);
    }
    return json as T;
  }

  return {
    backupUrl: "/api/backup",

    onUnauthorized(handler) {
      expiryHandlers.add(handler);
      return () => {
        expiryHandlers.delete(handler);
      };
    },

    async me() {
      try {
        const result = await request<{ email: string; csrfToken: string }>("GET", "/api/auth/me", undefined, false);
        csrfToken = result.csrfToken;
        return { email: result.email };
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },

    async login(input) {
      const result = await request<{ email: string; csrfToken: string; usedRecoveryCode: boolean }>(
        "POST",
        "/api/auth/login",
        input,
        false
      );
      csrfToken = result.csrfToken;
      return { email: result.email, usedRecoveryCode: result.usedRecoveryCode };
    },

    async logout() {
      await request("POST", "/api/auth/logout");
      csrfToken = "";
    },

    async logoutAll() {
      await request("POST", "/api/auth/logout-all");
      csrfToken = "";
    },

    inspectSetup: (token) => request("GET", `/api/setup/${enc(token)}`, undefined, false),
    beginSetup: (token, password) => request("POST", `/api/setup/${enc(token)}/begin`, { password }, false),
    completeSetup: (token, code) => request("POST", `/api/setup/${enc(token)}/complete`, { code }, false),

    listItems: async (area) => (await request<{ items: AdminItem[] }>("GET", `/api/items/${area}`)).items,
    createItem: async (area, data) => (await request<{ item: AdminItem }>("POST", `/api/items/${area}`, { data })).item,
    updateItem: async (area, id, data, version) =>
      (await request<{ item: AdminItem }>("PUT", `/api/items/${area}/${enc(id)}`, { data, version })).item,
    setHidden: async (area, id, hidden) =>
      (await request<{ item: AdminItem }>("PUT", `/api/items/${area}/${enc(id)}/hidden`, { hidden })).item,
    async reorder(area, ids) {
      await request("PUT", `/api/items/${area}/order`, { ids });
    },
    async deleteItem(area, id) {
      await request("DELETE", `/api/items/${area}/${enc(id)}`);
    },
    async restoreItem(area, id) {
      await request("POST", `/api/items/${area}/${enc(id)}/restore`);
    },
    listDeleted: async () => (await request<{ items: AdminItem[] }>("GET", "/api/deleted")).items,

    async upload(kind, file) {
      const form = new FormData();
      form.append("file", file);
      return (await request<{ path: string }>("POST", `/api/uploads/${kind}`, form)).path;
    },

    listAdmins: async () => (await request<{ admins: AdminAccount[] }>("GET", "/api/admins")).admins,
    resetAdmin: async (id) => (await request<{ setupLink: string }>("POST", `/api/admins/${id}/reset`)).setupLink,
    listAudit: async (before) =>
      (await request<{ entries: AuditEntry[] }>("GET", `/api/audit?limit=50${before ? `&before=${before}` : ""}`)).entries
  };
}
```

- [ ] **Step 4: Verify and commit**

Run: `npx vitest run src/admin/api.test.ts && npx tsc -b && npm run test`
Expected: all pass.
```bash
git add src/admin/types.ts src/admin/api.ts src/admin/api.test.ts
git commit -m "feat(admin): API client with CSRF header and session-expiry handling"
```

---

### Task 3: Sign-in, session handling and the admin shell

**Files:**
- Create: `src/admin/context.tsx`, `src/admin/LoginPage.tsx`, `src/admin/Shell.tsx`, `src/test/fakeAdminApi.ts`, `src/test/renderAdmin.tsx`
- Modify: `src/admin/AdminApp.tsx` (replace the placeholder), `src/admin/admin.css`
- Test: `src/admin/auth.test.tsx`

**Interfaces:**
- Consumes: `AdminApi`, `ApiError`, `createHttpApi` (Task 2).
- Produces:
  ```tsx
  export function ApiProvider(props: { api: AdminApi; children: ReactNode }): JSX.Element;
  export function useApi(): AdminApi;
  export type AuthState = { status: "checking" } | { status: "signedOut"; notice?: string } | { status: "signedIn"; email: string; usedRecoveryCode: boolean };
  export function AuthProvider(props: { children: ReactNode }): JSX.Element;
  export function useAuth(): { state: AuthState; signIn(input: { email: string; password: string; code: string }): Promise<void>; signOut(everywhere?: boolean): Promise<void> };
  export function RequireAuth(props: { children: ReactNode }): JSX.Element;
  export function messageOf(error: unknown): string;
  export default function AdminApp(props: { api?: AdminApi }): JSX.Element;
  // test helpers
  export class FakeAdminApi implements AdminApi { /* see code */ }
  export function renderAdmin(path: string, api?: FakeAdminApi): { api: FakeAdminApi };
  ```
  `AdminApp` routes (relative to `/admin`): `setup`; and inside a pathless layout guarded by sign-in: index → `projects`, `projects`, `industry`, `people`, `gallery`, `deleted`, `audit`, `admins`, `*` → `projects`. Until Tasks 5–8 land, each of those renders `<AreaPlaceholder />` with a heading naming the section.

- [ ] **Step 1: Write the in-memory fake API**

Create `src/test/fakeAdminApi.ts`:
```ts
import { ApiError, type AdminApi } from "../admin/api";
import type { AdminAccount, AdminItem, Area, AuditEntry, UploadKind } from "../admin/types";

export const FAKE_PASSWORD = "correct horse battery staple 42";
export const FAKE_CODE = "123456";
export const FAKE_RECOVERY_CODE = "abcd-efgh-jkmn";

/** In-memory stand-in for the Plan 2 API, with the same rules the admin screens depend on. */
export class FakeAdminApi implements AdminApi {
  readonly backupUrl = "/api/backup";
  email: string | null = "admin@thapar.edu";
  items: AdminItem[] = [];
  admins: AdminAccount[] = [
    { id: 1, email: "admin@thapar.edu", active: true, createdAt: 0 },
    { id: 2, email: "second@thapar.edu", active: true, createdAt: 0 }
  ];
  audit: AuditEntry[] = [];
  setupTokens = new Map<string, string>([["good-token", "new@thapar.edu"]]);
  nextError: ApiError | null = null;
  calls: { name: string; args: unknown[] }[] = [];
  private readonly expiry = new Set<() => void>();
  private seq = 0;

  onUnauthorized(handler: () => void) {
    this.expiry.add(handler);
    return () => {
      this.expiry.delete(handler);
    };
  }

  expireSession() {
    this.email = null;
  }

  seed(area: Area, data: Record<string, unknown>, extra: Partial<AdminItem> = {}): AdminItem {
    const item: AdminItem = {
      id: `${area}-${++this.seq}`,
      area,
      position: this.live(area).length,
      hidden: false,
      data,
      version: 1,
      deletedAt: null,
      updatedAt: 0,
      ...extra
    };
    this.items.push(item);
    return item;
  }

  live(area: Area): AdminItem[] {
    return this.items.filter((item) => item.area === area && item.deletedAt === null).sort((a, b) => a.position - b.position);
  }

  private guard(name: string, args: unknown[]) {
    this.calls.push({ name, args });
    if (this.nextError) {
      const error = this.nextError;
      this.nextError = null;
      throw error;
    }
    if (!this.email) {
      this.expiry.forEach((handler) => handler());
      throw new ApiError(401, "Please sign in.");
    }
  }

  private find(id: string): AdminItem {
    const item = this.items.find((candidate) => candidate.id === id);
    if (!item) throw new ApiError(404, "That item no longer exists.");
    return item;
  }

  async me() {
    this.calls.push({ name: "me", args: [] });
    return this.email ? { email: this.email } : null;
  }

  async login(input: { email: string; password: string; code: string }) {
    this.calls.push({ name: "login", args: [input] });
    const codeOk = input.code === FAKE_CODE || input.code === FAKE_RECOVERY_CODE;
    if (input.password !== FAKE_PASSWORD || !codeOk) throw new ApiError(401, "Invalid email, password or code.");
    this.email = input.email.trim().toLowerCase();
    return { email: this.email, usedRecoveryCode: input.code === FAKE_RECOVERY_CODE };
  }

  async logout() {
    this.guard("logout", []);
    this.email = null;
  }

  async logoutAll() {
    this.guard("logoutAll", []);
    this.email = null;
  }

  async inspectSetup(token: string) {
    this.calls.push({ name: "inspectSetup", args: [token] });
    const email = this.setupTokens.get(token);
    if (!email) {
      throw new ApiError(410, "This setup link has expired or was already used. Ask the other admin for a new one.");
    }
    return { email };
  }

  async beginSetup(token: string, password: string) {
    this.calls.push({ name: "beginSetup", args: [token, password] });
    if (password.length < 12) throw new ApiError(400, "Password must be at least 12 characters.");
    return { qrDataUrl: "data:image/png;base64,iVBORw0KGgo=", secret: "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP" };
  }

  async completeSetup(token: string, code: string) {
    this.calls.push({ name: "completeSetup", args: [token, code] });
    if (code !== FAKE_CODE) {
      throw new ApiError(400, "That code is not correct. Check the time on your phone and try again.");
    }
    this.setupTokens.delete(token);
    return { recoveryCodes: Array.from({ length: 10 }, (_, n) => `code-${String(n).padStart(4, "0")}-xxxx`) };
  }

  async listItems(area: Area) {
    this.guard("listItems", [area]);
    return this.live(area).map((item) => ({ ...item }));
  }

  async createItem(area: Area, data: object) {
    this.guard("createItem", [area, data]);
    return { ...this.seed(area, data as Record<string, unknown>) };
  }

  async updateItem(area: Area, id: string, data: object, version: number) {
    this.guard("updateItem", [area, id, data, version]);
    const item = this.find(id);
    if (item.version !== version) {
      throw new ApiError(409, "This was changed by someone else — reload to see their version.");
    }
    item.data = data as Record<string, unknown>;
    item.version += 1;
    return { ...item };
  }

  async setHidden(area: Area, id: string, hidden: boolean) {
    this.guard("setHidden", [area, id, hidden]);
    const item = this.find(id);
    item.hidden = hidden;
    return { ...item };
  }

  async reorder(area: Area, ids: string[]) {
    this.guard("reorder", [area, ids]);
    ids.forEach((id, index) => {
      this.find(id).position = index;
    });
  }

  async deleteItem(area: Area, id: string) {
    this.guard("deleteItem", [area, id]);
    this.find(id).deletedAt = Date.now();
  }

  async restoreItem(area: Area, id: string) {
    this.guard("restoreItem", [area, id]);
    const item = this.find(id);
    item.position = this.live(area).length;
    item.deletedAt = null;
  }

  async listDeleted() {
    this.guard("listDeleted", []);
    return this.items.filter((item) => item.deletedAt !== null).map((item) => ({ ...item }));
  }

  async upload(kind: UploadKind, file: File) {
    this.guard("upload", [kind, file.name]);
    return `/media/${kind}-${++this.seq}.webp`;
  }

  async listAdmins() {
    this.guard("listAdmins", []);
    return this.admins.map((admin) => ({ ...admin }));
  }

  async resetAdmin(id: number) {
    this.guard("resetAdmin", [id]);
    return `https://am-tiet.thapar.edu/admin/setup#reset-${id}`;
  }

  async listAudit(before?: number) {
    this.guard("listAudit", [before]);
    return [...this.audit]
      .sort((a, b) => b.id - a.id)
      .filter((entry) => before === undefined || entry.id < before)
      .slice(0, 50);
  }

  called(name: string) {
    return this.calls.filter((call) => call.name === name);
  }
}
```

Create `src/test/renderAdmin.tsx`:
```tsx
import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AdminApp from "../admin/AdminApp";
import { FakeAdminApi } from "./fakeAdminApi";

export function renderAdmin(path: string, api = new FakeAdminApi()) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/admin/*" element={<AdminApp api={api} />} />
        <Route path="*" element={<p>Public site</p>} />
      </Routes>
    </MemoryRouter>
  );
  return { api };
}
```

- [ ] **Step 2: Write the failing tests**

Create `src/admin/auth.test.tsx`:
```tsx
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FAKE_CODE, FAKE_PASSWORD, FAKE_RECOVERY_CODE, FakeAdminApi } from "../test/fakeAdminApi";
import { renderAdmin } from "../test/renderAdmin";

function signedOut() {
  const api = new FakeAdminApi();
  api.email = null;
  return api;
}

function fillSignIn(code = FAKE_CODE, password = FAKE_PASSWORD) {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "admin@thapar.edu" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: password } });
  fireEvent.change(screen.getByLabelText("Authenticator code"), { target: { value: code } });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
}

describe("sign-in", () => {
  it("asks a signed-out visitor to sign in", async () => {
    renderAdmin("/admin/projects", signedOut());
    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeTruthy();
    expect(screen.getByLabelText("Authenticator code").getAttribute("autocomplete")).toBe("one-time-code");
  });

  it("shows the server's message when sign-in fails, and clears the password", async () => {
    renderAdmin("/admin", signedOut());
    await screen.findByRole("heading", { name: "Sign in" });
    fillSignIn("000000");
    expect((await screen.findByRole("alert")).textContent).toBe("Invalid email, password or code.");
    expect((screen.getByLabelText("Password") as HTMLInputElement).value).toBe("");
  });

  it("opens the admin after a successful sign-in", async () => {
    renderAdmin("/admin", signedOut());
    await screen.findByRole("heading", { name: "Sign in" });
    fillSignIn();
    expect(await screen.findByRole("heading", { name: "Projects" })).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Admin sections" })).toBeTruthy();
    expect(screen.getByText("admin@thapar.edu")).toBeTruthy();
  });

  it("warns after signing in with a recovery code", async () => {
    renderAdmin("/admin", signedOut());
    await screen.findByRole("heading", { name: "Sign in" });
    fillSignIn(FAKE_RECOVERY_CODE);
    expect(await screen.findByText(/You signed in with a recovery code/)).toBeTruthy();
  });
});

describe("session", () => {
  it("returns to sign-in with a notice when the session ends mid-use", async () => {
    const { api } = renderAdmin("/admin/projects");
    await screen.findByRole("heading", { name: "Projects" });
    api.expireSession();
    await act(async () => {
      await api.listItems("projects").catch(() => undefined);
    });
    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeTruthy();
    expect(screen.getByText("Your session ended. Please sign in again.")).toBeTruthy();
  });

  it("signs out", async () => {
    const { api } = renderAdmin("/admin/projects");
    fireEvent.click(await screen.findByRole("button", { name: "Sign out" }));
    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeTruthy();
    expect(api.called("logout")).toHaveLength(1);
  });

  it("signs out everywhere after confirmation", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    const { api } = renderAdmin("/admin/projects");
    fireEvent.click(await screen.findByRole("button", { name: "Sign out everywhere" }));
    await waitFor(() => expect(api.called("logoutAll")).toHaveLength(1));
    expect(confirm).toHaveBeenCalled();
    confirm.mockRestore();
  });

  it("shows a link back to the public site", async () => {
    renderAdmin("/admin/projects");
    const link = await screen.findByRole("link", { name: /View site/ });
    expect(link.getAttribute("href")).toBe("/");
  });
});
```

- [ ] **Step 3: Run them and watch them fail**

Run: `npx vitest run src/admin/auth.test.tsx`
Expected: FAIL — the placeholder `AdminApp` renders no "Sign in" heading.

- [ ] **Step 4: Implement the context**

Create `src/admin/context.tsx`:
```tsx
import { type ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";
import { ApiError, type AdminApi } from "./api";
import { LoginPage } from "./LoginPage";

const ApiContext = createContext<AdminApi | null>(null);

export function ApiProvider({ api, children }: { api: AdminApi; children: ReactNode }) {
  return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>;
}

export function useApi(): AdminApi {
  const api = useContext(ApiContext);
  if (!api) throw new Error("ApiProvider is missing");
  return api;
}

export function messageOf(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
}

export type AuthState =
  | { status: "checking" }
  | { status: "signedOut"; notice?: string }
  | { status: "signedIn"; email: string; usedRecoveryCode: boolean };

type AuthValue = {
  state: AuthState;
  signIn(input: { email: string; password: string; code: string }): Promise<void>;
  signOut(everywhere?: boolean): Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const api = useApi();
  const [state, setState] = useState<AuthState>({ status: "checking" });

  useEffect(() => {
    let active = true;
    api
      .me()
      .then((me) => {
        if (active) setState(me ? { status: "signedIn", email: me.email, usedRecoveryCode: false } : { status: "signedOut" });
      })
      .catch(() => {
        if (active) setState({ status: "signedOut", notice: "Could not reach the server. Try again shortly." });
      });
    return () => {
      active = false;
    };
  }, [api]);

  useEffect(
    () => api.onUnauthorized(() => setState({ status: "signedOut", notice: "Your session ended. Please sign in again." })),
    [api]
  );

  const value = useMemo<AuthValue>(
    () => ({
      state,
      async signIn(input) {
        const result = await api.login(input);
        setState({ status: "signedIn", email: result.email, usedRecoveryCode: result.usedRecoveryCode });
      },
      async signOut(everywhere = false) {
        try {
          await (everywhere ? api.logoutAll() : api.logout());
        } finally {
          setState({ status: "signedOut" });
        }
      }
    }),
    [api, state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("AuthProvider is missing");
  return auth;
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { state } = useAuth();
  if (state.status === "checking") return <p className="admin-loading">Checking sign-in…</p>;
  if (state.status === "signedOut") return <LoginPage notice={state.notice} />;
  return <>{children}</>;
}
```

- [ ] **Step 5: Implement the sign-in page and the shell**

Create `src/admin/LoginPage.tsx`:
```tsx
import { type FormEvent, useState } from "react";
import { messageOf, useAuth } from "./context";

export function LoginPage({ notice }: { notice?: string }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn({ email, password, code });
    } catch (failure) {
      setError(messageOf(failure));
      setPassword("");
      setCode("");
      setBusy(false);
    }
  };

  return (
    <main className="admin-auth">
      <form className="admin-card admin-auth-card" onSubmit={submit}>
        <p className="admin-eyebrow">CoE-AM Admin</p>
        <h1>Sign in</h1>
        {notice && <p className="admin-notice">{notice}</p>}
        {error && (
          <p className="admin-error" role="alert">
            {error}
          </p>
        )}
        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <label htmlFor="login-code">Authenticator code</label>
        <input
          id="login-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          aria-describedby="login-code-hint"
          required
        />
        <p className="admin-hint" id="login-code-hint">
          The 6-digit code from your authenticator app, or one of your recovery codes.
        </p>
        <button className="admin-button admin-button--primary" type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
```

Create `src/admin/Shell.tsx`:
```tsx
import { ExternalLink } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "./context";

const SECTIONS = [
  { to: "projects", label: "Projects" },
  { to: "industry", label: "Industry" },
  { to: "people", label: "People" },
  { to: "gallery", label: "Gallery" },
  { to: "deleted", label: "Recently deleted" },
  { to: "audit", label: "Audit log" },
  { to: "admins", label: "Admins & backup" }
];

export function Shell() {
  const { state, signOut } = useAuth();
  const email = state.status === "signedIn" ? state.email : "";

  const signOutEverywhere = () => {
    if (window.confirm("Sign out on every device, including this one?")) void signOut(true);
  };

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <strong className="admin-brand">CoE-AM Admin</strong>
        <span className="admin-user">{email}</span>
        <a className="admin-link" href="/" target="_blank" rel="noopener noreferrer">
          View site <ExternalLink aria-hidden="true" size={14} />
        </a>
        <button className="admin-button" type="button" onClick={() => void signOut()}>
          Sign out
        </button>
        <button className="admin-button" type="button" onClick={signOutEverywhere}>
          Sign out everywhere
        </button>
      </header>
      <nav className="admin-nav" aria-label="Admin sections">
        {SECTIONS.map((section) => (
          <NavLink key={section.to} to={section.to} className="admin-nav-link">
            {section.label}
          </NavLink>
        ))}
      </nav>
      <main className="admin-main" id="admin-main">
        {state.status === "signedIn" && state.usedRecoveryCode && (
          <p className="admin-warning" role="status">
            You signed in with a recovery code. If you lost your phone, ask the other admin to reset your login so you can
            set up a new authenticator.
          </p>
        )}
        <Outlet />
      </main>
    </div>
  );
}
```

Replace `src/admin/AdminApp.tsx` with:
```tsx
import { useEffect, useMemo } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { createHttpApi, type AdminApi } from "./api";
import { ApiProvider, AuthProvider, RequireAuth } from "./context";
import { Shell } from "./Shell";
import "./admin.css";

function AreaPlaceholder({ title }: { title: string }) {
  return <h1>{title}</h1>;
}

export default function AdminApp({ api }: { api?: AdminApi }) {
  const client = useMemo(() => api ?? createHttpApi(), [api]);

  useEffect(() => {
    const previous = document.title;
    document.title = "CoE-AM Admin";
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <ApiProvider api={client}>
      <div className="admin-root" data-testid="admin-root">
        <Routes>
          <Route
            element={
              <AuthProvider>
                <RequireAuth>
                  <Shell />
                </RequireAuth>
              </AuthProvider>
            }
          >
            <Route index element={<Navigate to="projects" replace />} />
            <Route path="projects" element={<AreaPlaceholder title="Projects" />} />
            <Route path="industry" element={<AreaPlaceholder title="Industry" />} />
            <Route path="people" element={<AreaPlaceholder title="People" />} />
            <Route path="gallery" element={<AreaPlaceholder title="Gallery" />} />
            <Route path="deleted" element={<AreaPlaceholder title="Recently deleted" />} />
            <Route path="audit" element={<AreaPlaceholder title="Audit log" />} />
            <Route path="admins" element={<AreaPlaceholder title="Admins & backup" />} />
            <Route path="*" element={<Navigate to="projects" replace />} />
          </Route>
        </Routes>
      </div>
    </ApiProvider>
  );
}
```

Replace `src/admin/admin.css` with:
```css
.admin-root {
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 0.95rem;
  min-height: 100vh;
}

.admin-root h1 {
  color: var(--navy);
  font-family: var(--font-display);
  font-size: 1.4rem;
  margin: 0 0 1rem;
}

.admin-root label {
  color: var(--navy);
  display: block;
  font-weight: 600;
  margin: 0.9rem 0 0.3rem;
}

.admin-root input:not([type="checkbox"]):not([type="file"]),
.admin-root textarea {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 6px;
  box-sizing: border-box;
  color: var(--ink);
  font: inherit;
  padding: 0.55rem 0.7rem;
  width: 100%;
}

.admin-root textarea {
  resize: vertical;
}

.admin-root :focus-visible {
  outline: 2px solid var(--blue);
  outline-offset: 2px;
}

.admin-card {
  background: var(--glass-strong);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 1.5rem;
}

.admin-auth {
  display: grid;
  min-height: 100vh;
  padding: 1rem;
  place-items: center;
}

.admin-auth-card {
  max-width: 420px;
  width: 100%;
}

.admin-eyebrow {
  color: var(--blue);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  margin: 0 0 0.4rem;
  text-transform: uppercase;
}

.admin-hint {
  color: var(--muted);
  font-size: 0.82rem;
  margin: 0.3rem 0 0;
}

.admin-button {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 6px;
  color: var(--navy);
  cursor: pointer;
  font: inherit;
  font-weight: 600;
  padding: 0.5rem 0.9rem;
  text-decoration: none;
}

.admin-button:hover {
  border-color: var(--blue);
}

.admin-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.admin-button--primary {
  background: var(--navy);
  border-color: var(--navy);
  color: #fff;
  margin-top: 1.2rem;
}

.admin-button--danger {
  color: var(--red);
}

.admin-notice,
.admin-warning,
.admin-error {
  border-radius: 6px;
  margin: 0 0 1rem;
  padding: 0.65rem 0.8rem;
}

.admin-notice {
  background: #e7f3ec;
  border: 1px solid #9fcfb2;
}

.admin-warning {
  background: #fff6e0;
  border: 1px solid #e5c56d;
}

.admin-error {
  background: #fdecee;
  border: 1px solid #e79aa3;
  color: #7a1320;
}

.admin-loading {
  color: var(--muted);
  padding: 2rem;
}

.admin-shell {
  margin: 0 auto;
  max-width: 1100px;
  padding: 0 1rem 3rem;
}

.admin-header {
  align-items: center;
  border-bottom: 1px solid var(--line);
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 1rem 0;
}

.admin-brand {
  color: var(--navy);
  font-family: var(--font-display);
  margin-right: auto;
}

.admin-user {
  color: var(--muted);
}

.admin-link {
  align-items: center;
  color: var(--blue);
  display: inline-flex;
  gap: 0.3rem;
}

.admin-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  padding: 0.75rem 0;
}

.admin-nav-link {
  border-radius: 6px;
  color: var(--navy);
  padding: 0.45rem 0.75rem;
  text-decoration: none;
}

.admin-nav-link.active {
  background: var(--navy);
  color: #fff;
}

.admin-main {
  padding-top: 1rem;
}
```

- [ ] **Step 6: Run the tests and watch them pass**

Run: `npx vitest run src/admin/auth.test.tsx`
Expected: PASS.

- [ ] **Step 7: Verify and commit**

Run: `npx tsc -b && npm run test`
Expected: all pass (including Task 1's `/admin` tests, which now reach the sign-in screen because the real client cannot reach an API in tests).
```bash
git add src/admin src/test/fakeAdminApi.ts src/test/renderAdmin.tsx
git commit -m "feat(admin): sign-in, session expiry handling and admin shell"
```

---

### Task 4: First-time setup screen

**Files:**
- Create: `src/admin/SetupPage.tsx`
- Modify: `src/admin/AdminApp.tsx` (add the `setup` route), `src/admin/admin.css`
- Test: `src/admin/setup.test.tsx`

**Interfaces:**
- Consumes: `useApi`, `messageOf` (Task 3).
- Produces: `export function SetupPage(): JSX.Element` at `/admin/setup#<token>`. The token is read from the URL fragment once, kept in component state, and removed from the address bar.

- [ ] **Step 1: Write the failing tests**

Create `src/admin/setup.test.tsx`:
```tsx
import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FAKE_CODE, FAKE_PASSWORD, FakeAdminApi } from "../test/fakeAdminApi";
import { renderAdmin } from "../test/renderAdmin";

afterEach(() => vi.restoreAllMocks());

// Someone following a setup link is not signed in.
function signedOut() {
  const api = new FakeAdminApi();
  api.email = null;
  return api;
}

async function reachQrStep() {
  const result = renderAdmin("/admin/setup#good-token", signedOut());
  expect(await screen.findByText(/Setting up the admin account for new@thapar.edu/)).toBeTruthy();
  fireEvent.change(screen.getByLabelText("New password"), { target: { value: FAKE_PASSWORD } });
  fireEvent.change(screen.getByLabelText("Repeat the password"), { target: { value: FAKE_PASSWORD } });
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  await screen.findByRole("img", { name: /QR code/ });
  return result;
}

describe("setup", () => {
  it("explains an expired or used link", async () => {
    renderAdmin("/admin/setup#bad-token");
    expect((await screen.findByRole("alert")).textContent).toMatch(/expired or was already used/);
  });

  it("explains a link with no token", async () => {
    renderAdmin("/admin/setup");
    expect((await screen.findByRole("alert")).textContent).toMatch(/link is incomplete/);
  });

  it("refuses mismatched passwords before calling the server", async () => {
    const { api } = renderAdmin("/admin/setup#good-token");
    await screen.findByLabelText("New password");
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: FAKE_PASSWORD } });
    fireEvent.change(screen.getByLabelText("Repeat the password"), { target: { value: `${FAKE_PASSWORD}!` } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect((await screen.findByRole("alert")).textContent).toBe("The two passwords do not match.");
    expect(api.called("beginSetup")).toHaveLength(0);
  });

  it("shows the server's password rule", async () => {
    renderAdmin("/admin/setup#good-token");
    await screen.findByLabelText("New password");
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "short" } });
    fireEvent.change(screen.getByLabelText("Repeat the password"), { target: { value: "short" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Password must be at least 12 characters.");
  });

  it("shows the QR code and the key for manual entry, then rejects a wrong code", async () => {
    await reachQrStep();
    expect(screen.getByText("JBSW Y3DP EHPK 3PXP JBSW Y3DP EHPK 3PXP")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("6-digit code from the app"), { target: { value: "000000" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/code is not correct/);
  });

  it("shows ten recovery codes and only finishes once they are saved", async () => {
    const createObjectURL = vi.fn(() => "blob:codes");
    Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() });
    // jsdom cannot follow a download link; only the click itself matters here.
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    await reachQrStep();
    fireEvent.change(screen.getByLabelText("6-digit code from the app"), { target: { value: FAKE_CODE } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    const list = await screen.findByRole("list", { name: "Recovery codes" });
    expect(list.querySelectorAll("li")).toHaveLength(10);
    const finish = screen.getByRole("button", { name: "Go to sign-in" }) as HTMLButtonElement;
    expect(finish.disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Download as a text file" }));
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByLabelText("I have saved these codes somewhere safe"));
    expect(finish.disabled).toBe(false);
    fireEvent.click(finish);
    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx vitest run src/admin/setup.test.tsx`
Expected: FAIL — `/admin/setup` falls through to the sign-in screen; no "Setting up the admin account" text.

- [ ] **Step 3: Implement**

Create `src/admin/SetupPage.tsx`:
```tsx
import { type FormEvent, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { messageOf, useApi } from "./context";

type Step =
  | { name: "loading" }
  | { name: "invalid"; message: string }
  | { name: "password"; email: string }
  | { name: "scan"; email: string; qrDataUrl: string; secret: string }
  | { name: "codes"; codes: string[] };

function groupSecret(secret: string): string {
  return secret.match(/.{1,4}/g)?.join(" ") ?? secret;
}

export function SetupPage() {
  const api = useApi();
  const location = useLocation();
  const navigate = useNavigate();
  const [token] = useState(() => decodeURIComponent(location.hash.replace(/^#/, "")));
  const [step, setStep] = useState<Step>({ name: "loading" });
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [code, setCode] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Keep the one-time token out of the address bar and browser history.
    if (location.hash) navigate(location.pathname, { replace: true });
    if (!token) {
      setStep({ name: "invalid", message: "This setup link is incomplete. Copy the whole link and try again." });
      return;
    }
    api
      .inspectSetup(token)
      .then(({ email }) => setStep({ name: "password", email }))
      .catch((failure) => setStep({ name: "invalid", message: messageOf(failure) }));
    // Runs once for the token captured on first render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await work();
    } catch (failure) {
      setError(messageOf(failure));
    } finally {
      setBusy(false);
    }
  };

  const submitPassword = (event: FormEvent) => {
    event.preventDefault();
    if (step.name !== "password") return;
    if (password !== repeat) {
      setError("The two passwords do not match.");
      return;
    }
    void run(async () => {
      const { qrDataUrl, secret } = await api.beginSetup(token, password);
      setStep({ name: "scan", email: step.email, qrDataUrl, secret });
      setPassword("");
      setRepeat("");
    });
  };

  const submitCode = (event: FormEvent) => {
    event.preventDefault();
    void run(async () => {
      const { recoveryCodes } = await api.completeSetup(token, code.trim());
      setStep({ name: "codes", codes: recoveryCodes });
    });
  };

  const download = (codes: string[]) => {
    const text = `CoE-AM Admin recovery codes\nEach code works once, in place of the authenticator code.\n\n${codes.join("\n")}\n`;
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "coe-am-admin-recovery-codes.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="admin-auth">
      <div className="admin-card admin-auth-card">
        <p className="admin-eyebrow">CoE-AM Admin</p>
        <h1>Set up your admin account</h1>
        {error && (
          <p className="admin-error" role="alert">
            {error}
          </p>
        )}

        {step.name === "loading" && <p className="admin-loading">Checking the link…</p>}

        {step.name === "invalid" && (
          <p className="admin-error" role="alert">
            {step.message}
          </p>
        )}

        {step.name === "password" && (
          <form onSubmit={submitPassword}>
            <p>Setting up the admin account for {step.email}.</p>
            <label htmlFor="setup-password">New password</label>
            <input
              id="setup-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-describedby="setup-password-hint"
              required
            />
            <p className="admin-hint" id="setup-password-hint">
              At least 12 characters. A short sentence is easy to remember and hard to guess.
            </p>
            <label htmlFor="setup-repeat">Repeat the password</label>
            <input
              id="setup-repeat"
              type="password"
              autoComplete="new-password"
              value={repeat}
              onChange={(event) => setRepeat(event.target.value)}
              required
            />
            <button className="admin-button admin-button--primary" type="submit" disabled={busy}>
              Continue
            </button>
          </form>
        )}

        {step.name === "scan" && (
          <form onSubmit={submitCode}>
            <p>
              Open an authenticator app (Google Authenticator or Microsoft Authenticator), add an account, and scan this
              code.
            </p>
            <img className="admin-qr" src={step.qrDataUrl} alt="QR code to add the account to your authenticator app" />
            <p className="admin-hint">Cannot scan? Enter this key in the app instead:</p>
            <p className="admin-secret">{groupSecret(step.secret)}</p>
            <label htmlFor="setup-code">6-digit code from the app</label>
            <input
              id="setup-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              required
            />
            <button className="admin-button admin-button--primary" type="submit" disabled={busy}>
              Confirm
            </button>
          </form>
        )}

        {step.name === "codes" && (
          <div>
            <p>
              Your account is ready. These recovery codes let you sign in if you lose your phone. Each works once. Save them
              now: they will not be shown again.
            </p>
            <ul className="admin-codes" aria-label="Recovery codes">
              {step.codes.map((recoveryCode) => (
                <li key={recoveryCode}>{recoveryCode}</li>
              ))}
            </ul>
            <button className="admin-button" type="button" onClick={() => download(step.codes)}>
              Download as a text file
            </button>
            <label className="admin-check">
              <input type="checkbox" checked={saved} onChange={(event) => setSaved(event.target.checked)} />I have saved
              these codes somewhere safe
            </label>
            <button
              className="admin-button admin-button--primary"
              type="button"
              disabled={!saved}
              onClick={() => navigate("/admin", { replace: true })}
            >
              Go to sign-in
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
```

In `src/admin/AdminApp.tsx` add `import { SetupPage } from "./SetupPage";` and, as the first child of `<Routes>`, add:
```tsx
          <Route path="setup" element={<SetupPage />} />
```

Append to `src/admin/admin.css`:
```css
.admin-qr {
  display: block;
  height: 200px;
  margin: 0.75rem auto;
  width: 200px;
}

.admin-secret {
  font-family: var(--font-mono);
  font-size: 0.9rem;
  letter-spacing: 0.05em;
  margin: 0.3rem 0 0;
  word-break: break-word;
}

.admin-codes {
  columns: 2;
  font-family: var(--font-mono);
  margin: 1rem 0;
  padding-left: 1.2rem;
}

.admin-check {
  align-items: center;
  display: flex !important;
  font-weight: 400 !important;
  gap: 0.5rem;
}
```

- [ ] **Step 4: Verify and commit**

Run: `npx vitest run src/admin/setup.test.tsx && npx tsc -b && npm run test`
Expected: all pass.
```bash
git add src/admin/SetupPage.tsx src/admin/setup.test.tsx src/admin/AdminApp.tsx src/admin/admin.css
git commit -m "feat(admin): first-time setup with authenticator and recovery codes"
```

---

### Task 5: Area list — reorder, hide, delete

**Files:**
- Create: `src/admin/reorder.ts`, `src/admin/fields.tsx`, `src/admin/forms.tsx` (stubs of the four forms, filled in Tasks 6–7), `src/admin/areas.ts`, `src/admin/ItemList.tsx`, `src/admin/AreaPage.tsx`
- Modify: `src/admin/AdminApp.tsx`, `src/admin/admin.css`, `package.json`
- Test: `src/admin/reorder.test.ts`, `src/admin/list.test.tsx`

**Interfaces:**
- Consumes: `useApi`, `messageOf` (Task 3); types (Task 2).
- Produces:
  ```ts
  // reorder.ts
  export function moveId(ids: string[], from: number, to: number): string[];
  // areas.ts
  export type FormProps = { value: Record<string, unknown>; onChange(next: Record<string, unknown>): void };
  export type AreaConfig = {
    area: Area; path: string; title: string; singular: string;
    label(data: Record<string, unknown>): string;
    empty(): Record<string, unknown>;
    toInput(data: Record<string, unknown>): Record<string, unknown>;
    validate(value: Record<string, unknown>): string | null;
    Form: ComponentType<FormProps>;
  };
  export const AREA_CONFIGS: AreaConfig[]; // projects, industry, people, gallery, in that order
  export function areaConfig(area: Area): AreaConfig;
  // AreaPage.tsx
  export function AreaPage(props: { config: AreaConfig }): JSX.Element;
  ```
  `AreaPage` in this task shows the list only; the "Add" and "Edit" buttons open the edit panel added in Task 6.

- [ ] **Step 1: Add the drag-and-drop library**

Run from the root: `npm install @dnd-kit/core@^6.3.1 @dnd-kit/sortable@^10.0.0 @dnd-kit/utilities@^3.2.2`

- [ ] **Step 2: Write the failing tests**

Create `src/admin/reorder.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { moveId } from "./reorder";

describe("moveId", () => {
  it("moves an id to a new position", () => {
    expect(moveId(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"]);
    expect(moveId(["a", "b", "c", "d"], 3, 1)).toEqual(["a", "d", "b", "c"]);
  });

  it("returns the same order for an out-of-range or unchanged move", () => {
    expect(moveId(["a", "b"], 0, 0)).toEqual(["a", "b"]);
    expect(moveId(["a", "b"], -1, 1)).toEqual(["a", "b"]);
    expect(moveId(["a", "b"], 0, 5)).toEqual(["a", "b"]);
  });
});
```

Create `src/admin/list.test.tsx`:
```tsx
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "./api";
import { FakeAdminApi } from "../test/fakeAdminApi";
import { renderAdmin } from "../test/renderAdmin";

afterEach(() => vi.restoreAllMocks());

function withProjects(...titles: string[]) {
  const api = new FakeAdminApi();
  for (const title of titles) api.seed("projects", { title, description: "", links: [] });
  return api;
}

const rows = () => screen.getAllByRole("listitem").map((row) => within(row).getByTestId("item-label").textContent);

describe("area list", () => {
  it("lists items in order with their positions", async () => {
    renderAdmin("/admin/projects", withProjects("Alpha", "Beta", "Gamma"));
    await screen.findByText("Alpha");
    expect(rows()).toEqual(["Alpha", "Beta", "Gamma"]);
  });

  it("says so when an area is empty", async () => {
    renderAdmin("/admin/people");
    expect(await screen.findByText("Nothing here yet.")).toBeTruthy();
  });

  it("hides and shows an item", async () => {
    const api = withProjects("Alpha");
    renderAdmin("/admin/projects", api);
    const toggle = await screen.findByRole("button", { name: "Hide Alpha from the website" });
    fireEvent.click(toggle);
    expect(await screen.findByRole("button", { name: "Show Alpha on the website" })).toBeTruthy();
    expect(screen.getByText("Hidden")).toBeTruthy();
    expect(api.items[0].hidden).toBe(true);
  });

  it("moves an item down and saves the new order", async () => {
    const api = withProjects("Alpha", "Beta", "Gamma");
    renderAdmin("/admin/projects", api);
    fireEvent.click(await screen.findByRole("button", { name: "Move Alpha down" }));
    await waitFor(() => expect(rows()).toEqual(["Beta", "Alpha", "Gamma"]));
    expect(api.called("reorder")[0].args[1]).toEqual([api.items[1].id, api.items[0].id, api.items[2].id]);
  });

  it("disables moving the first item up and the last item down", async () => {
    renderAdmin("/admin/projects", withProjects("Alpha", "Beta"));
    expect(((await screen.findByRole("button", { name: "Move Alpha up" })) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Move Beta down" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("deletes an item after confirmation and says it can be restored", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const api = withProjects("Alpha", "Beta");
    renderAdmin("/admin/projects", api);
    fireEvent.click(await screen.findByRole("button", { name: "Delete Alpha" }));
    await waitFor(() => expect(rows()).toEqual(["Beta"]));
    expect(screen.getByRole("status").textContent).toMatch(/Recently deleted for 30 days/);
  });

  it("keeps the item when deletion is cancelled", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const api = withProjects("Alpha");
    renderAdmin("/admin/projects", api);
    fireEvent.click(await screen.findByRole("button", { name: "Delete Alpha" }));
    expect(api.called("deleteItem")).toHaveLength(0);
  });

  it("shows the server's message when an action fails, and reloads the list", async () => {
    const api = withProjects("Alpha");
    renderAdmin("/admin/projects", api);
    await screen.findByText("Alpha");
    api.nextError = new ApiError(503, "Not published — try again.");
    fireEvent.click(screen.getByRole("button", { name: "Hide Alpha from the website" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Not published — try again.");
  });

  it("offers a drag handle for each item", async () => {
    renderAdmin("/admin/projects", withProjects("Alpha"));
    expect(await screen.findByRole("button", { name: "Drag Alpha to reorder" })).toBeTruthy();
  });
});
```

- [ ] **Step 3: Run them and watch them fail**

Run: `npx vitest run src/admin/reorder.test.ts src/admin/list.test.tsx`
Expected: FAIL — `Failed to resolve import "./reorder"`; the list test finds no items (placeholder heading only).

- [ ] **Step 4: Implement the shared pieces**

Create `src/admin/reorder.ts`:
```ts
export function moveId(ids: string[], from: number, to: number): string[] {
  if (from === to || from < 0 || to < 0 || from >= ids.length || to >= ids.length) return [...ids];
  const next = [...ids];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
```

Create `src/admin/fields.tsx`:
```tsx
import { type ReactNode, useId } from "react";

export function TextField({
  label,
  value,
  onChange,
  maxLength,
  required = false,
  multiline = false,
  rows = 4,
  type = "text",
  hint
}: {
  label: string;
  value: string;
  onChange(value: string): void;
  maxLength?: number;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  type?: "text" | "url";
  hint?: string;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const common = {
    id,
    value,
    maxLength,
    required,
    "aria-describedby": hint ? hintId : undefined,
    onChange: (event: { target: { value: string } }) => onChange(event.target.value)
  };
  return (
    <div className={required ? "admin-field admin-field--required" : "admin-field"}>
      <label htmlFor={id}>{label}</label>
      {multiline ? <textarea rows={rows} {...common} /> : <input type={type} {...common} />}
      <div className="admin-field-meta">
        {hint && (
          <p className="admin-hint" id={hintId}>
            {hint}
          </p>
        )}
        {maxLength !== undefined && (
          <span className="admin-count" aria-hidden="true">
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}

export function CheckboxField({ label, checked, onChange }: { label: string; checked: boolean; onChange(value: boolean): void }) {
  const id = useId();
  return (
    <div className="admin-field admin-check">
      <input id={id} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <label htmlFor={id}>{label}</label>
    </div>
  );
}

export function RepeatableList<T>({
  legend,
  items,
  min = 0,
  max,
  addLabel,
  itemName,
  empty,
  onChange,
  render
}: {
  legend: string;
  items: T[];
  min?: number;
  max: number;
  addLabel: string;
  itemName: string;
  empty(): T;
  onChange(items: T[]): void;
  render(item: T, update: (next: T) => void, index: number): ReactNode;
}) {
  return (
    <fieldset className="admin-repeat">
      <legend>{legend}</legend>
      {items.map((item, index) => (
        <div className="admin-repeat-row" key={index}>
          {render(
            item,
            (next) => onChange(items.map((existing, position) => (position === index ? next : existing))),
            index
          )}
          <button
            className="admin-button admin-button--danger"
            type="button"
            onClick={() => onChange(items.filter((_, position) => position !== index))}
            disabled={items.length <= min}
          >
            Remove {itemName} {index + 1}
          </button>
        </div>
      ))}
      <button className="admin-button" type="button" onClick={() => onChange([...items, empty()])} disabled={items.length >= max}>
        {addLabel}
      </button>
      <p className="admin-hint">
        {items.length} of at most {max}.
      </p>
    </fieldset>
  );
}
```

Create `src/admin/forms.tsx` (temporary stubs; Tasks 6 and 7 replace each body):
```tsx
import type { FormProps } from "./areas";

export function ProjectForm(_props: FormProps) {
  return null;
}

export function IndustryForm(_props: FormProps) {
  return null;
}

export function PersonForm(_props: FormProps) {
  return null;
}

export function GalleryForm(_props: FormProps) {
  return null;
}
```

Create `src/admin/areas.ts`:
```ts
import type { ComponentType } from "react";
import { GalleryForm, IndustryForm, PersonForm, ProjectForm } from "./forms";
import type { Area } from "./types";

export type FormProps = { value: Record<string, unknown>; onChange(next: Record<string, unknown>): void };

export type AreaConfig = {
  area: Area;
  path: string;
  title: string;
  singular: string;
  label(data: Record<string, unknown>): string;
  empty(): Record<string, unknown>;
  toInput(data: Record<string, unknown>): Record<string, unknown>;
  validate(value: Record<string, unknown>): string | null;
  Form: ComponentType<FormProps>;
};

const text = (value: unknown) => (typeof value === "string" ? value : "");
const list = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

export const AREA_CONFIGS: AreaConfig[] = [
  {
    area: "projects",
    path: "projects",
    title: "Projects",
    singular: "project",
    label: (data) => text(data.title),
    empty: () => ({ title: "", description: "", links: [] }),
    toInput: (data) => ({
      title: text(data.title),
      description: text(data.description),
      links: list<{ label: unknown; url: unknown }>(data.links).map((link) => ({ label: text(link.label), url: text(link.url) }))
    }),
    validate: () => null,
    Form: ProjectForm
  },
  {
    area: "industryCards",
    path: "industry",
    title: "Industry",
    singular: "industry card",
    label: (data) => text(data.heading),
    empty: () => ({ heading: "", bullets: [{ text: "", label: "" }] }),
    toInput: (data) => ({
      heading: text(data.heading),
      bullets: list<{ text: unknown; label?: unknown }>(data.bullets).map((bullet) => ({
        text: text(bullet.text),
        label: text(bullet.label)
      }))
    }),
    validate: () => null,
    Form: IndustryForm
  },
  {
    area: "people",
    path: "people",
    title: "People",
    singular: "person",
    label: (data) => text(data.name),
    empty: () => ({ name: "", designation: "", institution: "", photo: "", linkedin: "" }),
    toInput: (data) => ({
      name: text(data.name),
      designation: text(data.designation),
      institution: text(data.institution),
      photo: text(data.photo),
      linkedin: text(data.linkedin)
    }),
    validate: (value) => (text(value.photo) ? null : "Upload a photo first."),
    Form: PersonForm
  },
  {
    area: "gallery",
    path: "gallery",
    title: "Gallery",
    singular: "photo",
    label: (data) => text(data.title),
    empty: () => ({ image: "", title: "", description: "", inHomeCarousel: false }),
    toInput: (data) => ({
      image: text(data.image),
      title: text(data.title),
      description: text(data.description),
      inHomeCarousel: data.inHomeCarousel === true
    }),
    validate: (value) => (text(value.image) ? null : "Upload a photo first."),
    Form: GalleryForm
  }
];

export function areaConfig(area: Area): AreaConfig {
  return AREA_CONFIGS.find((config) => config.area === area)!;
}
```

- [ ] **Step 5: Implement the list**

Create `src/admin/ItemList.tsx`:
```tsx
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical, Pencil, Trash2 } from "lucide-react";
import type { AreaConfig } from "./areas";
import type { AdminItem } from "./types";

type Actions = {
  onToggleHidden(item: AdminItem): void;
  onEdit(item: AdminItem): void;
  onDelete(item: AdminItem): void;
  onMove(from: number, to: number): void;
};

function Row({ item, index, count, config, actions }: { item: AdminItem; index: number; count: number; config: AreaConfig } & {
  actions: Actions;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const label = config.label(item.data) || "(untitled)";
  return (
    <li
      ref={setNodeRef}
      className={item.hidden ? "admin-row admin-row--hidden" : "admin-row"}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <button className="admin-icon" type="button" aria-label={`Drag ${label} to reorder`} {...attributes} {...listeners}>
        <GripVertical aria-hidden="true" size={18} />
      </button>
      <span className="admin-row-index">{String(index + 1).padStart(2, "0")}</span>
      <span className="admin-row-label" data-testid="item-label">
        {label}
      </span>
      {item.hidden && <span className="admin-badge">Hidden</span>}
      <span className="admin-row-actions">
        <button
          className="admin-icon"
          type="button"
          aria-label={`Move ${label} up`}
          disabled={index === 0}
          onClick={() => actions.onMove(index, index - 1)}
        >
          <ArrowUp aria-hidden="true" size={16} />
        </button>
        <button
          className="admin-icon"
          type="button"
          aria-label={`Move ${label} down`}
          disabled={index === count - 1}
          onClick={() => actions.onMove(index, index + 1)}
        >
          <ArrowDown aria-hidden="true" size={16} />
        </button>
        <button
          className="admin-icon"
          type="button"
          aria-label={item.hidden ? `Show ${label} on the website` : `Hide ${label} from the website`}
          onClick={() => actions.onToggleHidden(item)}
        >
          {item.hidden ? <Eye aria-hidden="true" size={16} /> : <EyeOff aria-hidden="true" size={16} />}
        </button>
        <button className="admin-icon" type="button" aria-label={`Edit ${label}`} onClick={() => actions.onEdit(item)}>
          <Pencil aria-hidden="true" size={16} />
        </button>
        <button
          className="admin-icon admin-button--danger"
          type="button"
          aria-label={`Delete ${label}`}
          onClick={() => actions.onDelete(item)}
        >
          <Trash2 aria-hidden="true" size={16} />
        </button>
      </span>
    </li>
  );
}

export function ItemList({ items, config, actions }: { items: AdminItem[]; config: AreaConfig; actions: Actions }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((item) => item.id === active.id);
    const to = items.findIndex((item) => item.id === over.id);
    actions.onMove(from, to);
  };

  if (!items.length) return <p className="admin-empty">Nothing here yet.</p>;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <ol className="admin-list" aria-label={`${config.title} in display order`}>
          {items.map((item, index) => (
            <Row key={item.id} item={item} index={index} count={items.length} config={config} actions={actions} />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  );
}
```

Create `src/admin/AreaPage.tsx`:
```tsx
import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { AreaConfig } from "./areas";
import { messageOf, useApi } from "./context";
import { ItemList } from "./ItemList";
import { moveId } from "./reorder";
import type { AdminItem } from "./types";

export function AreaPage({ config }: { config: AreaConfig }) {
  const api = useApi();
  const [items, setItems] = useState<AdminItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await api.listItems(config.area));
    } catch (failure) {
      setError(messageOf(failure));
    }
  }, [api, config.area]);

  useEffect(() => {
    setItems(null);
    setError(null);
    setNotice(null);
    void load();
  }, [load]);

  const act = async (work: () => Promise<unknown>, success?: string) => {
    setError(null);
    setNotice(null);
    try {
      await work();
      if (success) setNotice(success);
    } catch (failure) {
      setError(messageOf(failure));
    }
    await load();
  };

  const actions = {
    onToggleHidden: (item: AdminItem) => void act(() => api.setHidden(config.area, item.id, !item.hidden)),
    onEdit: (_item: AdminItem) => undefined,
    onDelete: (item: AdminItem) => {
      const label = config.label(item.data) || `this ${config.singular}`;
      if (!window.confirm(`Delete "${label}"? It disappears from the website now and can be restored for 30 days.`)) return;
      void act(
        () => api.deleteItem(config.area, item.id),
        `Deleted "${label}". You can restore it from Recently deleted for 30 days.`
      );
    },
    onMove: (from: number, to: number) => {
      if (!items) return;
      const ids = moveId(
        items.map((item) => item.id),
        from,
        to
      );
      setItems(ids.map((id) => items.find((item) => item.id === id)!));
      void act(() => api.reorder(config.area, ids));
    }
  };

  return (
    <section>
      <div className="admin-page-head">
        <h1>{config.title}</h1>
        <button className="admin-button" type="button">
          <Plus aria-hidden="true" size={16} /> Add {config.singular}
        </button>
      </div>
      {notice && (
        <p className="admin-notice" role="status">
          {notice}
        </p>
      )}
      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
      {items === null ? <p className="admin-loading">Loading…</p> : <ItemList items={items} config={config} actions={actions} />}
    </section>
  );
}
```

In `src/admin/AdminApp.tsx`, add `import { AreaPage } from "./AreaPage";` and `import { AREA_CONFIGS } from "./areas";`, and replace the four area placeholder routes (`projects`, `industry`, `people`, `gallery`) with:
```tsx
            {AREA_CONFIGS.map((config) => (
              <Route key={config.path} path={config.path} element={<AreaPage key={config.path} config={config} />} />
            ))}
```

Append to `src/admin/admin.css`:
```css
.admin-page-head {
  align-items: center;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
}

.admin-page-head .admin-button {
  align-items: center;
  display: inline-flex;
  gap: 0.35rem;
}

.admin-empty {
  color: var(--muted);
}

.admin-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.admin-row {
  align-items: center;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 8px;
  display: flex;
  gap: 0.6rem;
  margin-bottom: 0.45rem;
  padding: 0.5rem 0.6rem;
}

.admin-row--hidden {
  background: #f3f5f8;
}

.admin-row--hidden .admin-row-label {
  color: var(--muted);
}

.admin-row-index {
  color: var(--blue);
  font-family: var(--font-mono);
  font-size: 0.78rem;
}

.admin-row-label {
  flex: 1;
  min-width: 0;
}

.admin-row-actions {
  display: flex;
  gap: 0.2rem;
}

.admin-icon {
  align-items: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  color: var(--navy);
  cursor: pointer;
  display: inline-flex;
  height: 2rem;
  justify-content: center;
  width: 2rem;
}

.admin-icon:hover:not(:disabled) {
  border-color: var(--line);
}

.admin-icon:disabled {
  cursor: default;
  opacity: 0.3;
}

.admin-badge {
  background: #e9edf3;
  border-radius: 4px;
  color: var(--muted);
  font-size: 0.75rem;
  padding: 0.1rem 0.45rem;
}

.admin-field-meta {
  display: flex;
  gap: 1rem;
  justify-content: space-between;
}

.admin-count {
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  margin-top: 0.3rem;
  white-space: nowrap;
}

.admin-field--required > label::after {
  color: var(--red);
  content: " *";
}

.admin-repeat {
  border: 1px solid var(--line);
  border-radius: 8px;
  margin: 1rem 0 0;
  padding: 0.75rem 1rem 1rem;
}

.admin-repeat legend {
  color: var(--navy);
  font-weight: 600;
  padding: 0 0.3rem;
}

.admin-repeat-row {
  border-bottom: 1px dashed var(--line);
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
}
```

- [ ] **Step 6: Verify and commit**

Run: `npx vitest run src/admin && npx tsc -b && npm run test`
Expected: all pass.
```bash
git add package.json package-lock.json src/admin
git commit -m "feat(admin): area lists with drag and button reordering, hide and delete"
```

---

### Task 6: Edit panel, project and industry forms

**Files:**
- Create: `src/admin/EditPanel.tsx`
- Modify: `src/admin/forms.tsx` (`ProjectForm`, `IndustryForm`), `src/admin/AreaPage.tsx`, `src/admin/admin.css`
- Test: `src/admin/edit.test.tsx`

**Interfaces:**
- Consumes: `AreaConfig` (Task 5), `TextField`, `RepeatableList` (Task 5), `useApi`, `messageOf`, `ApiError`.
- Produces: `export function EditPanel(props: { config: AreaConfig; item: AdminItem | null; onDone(saved: boolean): void }): JSX.Element`. Saving a new item calls `createItem`; saving an existing one calls `updateItem` with the version it was opened at. A 409 shows the server message plus "Load their version", which replaces the form with the latest saved content.

- [ ] **Step 1: Write the failing tests**

Create `src/admin/edit.test.tsx`:
```tsx
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ApiError } from "./api";
import { FakeAdminApi } from "../test/fakeAdminApi";
import { renderAdmin } from "../test/renderAdmin";

const change = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe("projects editor", () => {
  it("adds a project and shows it in the list with a live notice", async () => {
    const { api } = renderAdmin("/admin/projects");
    fireEvent.click(await screen.findByRole("button", { name: "Add project" }));
    change("Title", "Laser DED of composites");
    change("Description", "First paragraph.\n\nSecond paragraph.");
    fireEvent.click(screen.getByRole("button", { name: "Add link" }));
    change("Link 1 label", "Paper");
    change("Link 1 address", "https://doi.org/10.1000/1");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Laser DED of composites")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe("Saved. It is live on the website.");
    expect(api.called("createItem")[0].args[1]).toEqual({
      title: "Laser DED of composites",
      description: "First paragraph.\n\nSecond paragraph.",
      links: [{ label: "Paper", url: "https://doi.org/10.1000/1" }]
    });
  });

  it("edits an existing project with the version it was opened at", async () => {
    const api = new FakeAdminApi();
    const item = api.seed("projects", { title: "Old title", description: "", links: [] });
    renderAdmin("/admin/projects", api);
    fireEvent.click(await screen.findByRole("button", { name: "Edit Old title" }));
    expect((screen.getByLabelText("Title") as HTMLInputElement).value).toBe("Old title");
    change("Title", "New title");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("New title")).toBeTruthy();
    expect(api.called("updateItem")[0].args).toEqual(["projects", item.id, { title: "New title", description: "", links: [] }, 1]);
  });

  it("shows a conflict and loads the other admin's version on request", async () => {
    const api = new FakeAdminApi();
    const item = api.seed("projects", { title: "Mine", description: "", links: [] });
    renderAdmin("/admin/projects", api);
    fireEvent.click(await screen.findByRole("button", { name: "Edit Mine" }));
    item.data = { title: "Theirs", description: "", links: [] };
    item.version = 2;
    change("Title", "My change");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toMatch(/changed by someone else/);
    fireEvent.click(within(alert).getByRole("button", { name: "Load their version" }));
    await waitFor(() => expect((screen.getByLabelText("Title") as HTMLInputElement).value).toBe("Theirs"));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByText("Theirs");
    expect(api.called("updateItem").at(-1)!.args[3]).toBe(2);
  });

  it("keeps the form open and shows the server's validation message", async () => {
    const api = new FakeAdminApi();
    renderAdmin("/admin/projects", api);
    fireEvent.click(await screen.findByRole("button", { name: "Add project" }));
    change("Title", "T");
    api.nextError = new ApiError(400, "Link must start with https:// or http://");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Link must start with https:// or http://");
    expect(screen.getByLabelText("Title")).toBeTruthy();
  });

  it("cancels without saving", async () => {
    const { api } = renderAdmin("/admin/projects");
    fireEvent.click(await screen.findByRole("button", { name: "Add project" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(await screen.findByRole("heading", { name: "Projects" })).toBeTruthy();
    expect(api.called("createItem")).toHaveLength(0);
  });

  it("allows at most ten links", async () => {
    renderAdmin("/admin/projects");
    fireEvent.click(await screen.findByRole("button", { name: "Add project" }));
    const add = screen.getByRole("button", { name: "Add link" }) as HTMLButtonElement;
    for (let n = 0; n < 10; n++) fireEvent.click(add);
    expect(add.disabled).toBe(true);
  });
});

describe("industry editor", () => {
  it("keeps at least one bullet and sends labels only when given", async () => {
    const { api } = renderAdmin("/admin/industry");
    fireEvent.click(await screen.findByRole("button", { name: "Add industry card" }));
    expect((screen.getByRole("button", { name: "Remove bullet 1" }) as HTMLButtonElement).disabled).toBe(true);
    change("Heading", "Value to Industry");
    change("Bullet 1 label (optional)", "Cost Reduction");
    change("Bullet 1 text", "Repair instead of replacement");
    fireEvent.click(screen.getByRole("button", { name: "Add bullet" }));
    change("Bullet 2 text", "Near-net shape");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByText("Value to Industry");
    expect(api.called("createItem")[0].args[1]).toEqual({
      heading: "Value to Industry",
      bullets: [
        { text: "Repair instead of replacement", label: "Cost Reduction" },
        { text: "Near-net shape", label: "" }
      ]
    });
  });

  it("allows at most twelve bullets", async () => {
    renderAdmin("/admin/industry");
    fireEvent.click(await screen.findByRole("button", { name: "Add industry card" }));
    const add = screen.getByRole("button", { name: "Add bullet" }) as HTMLButtonElement;
    for (let n = 0; n < 11; n++) fireEvent.click(add);
    expect(add.disabled).toBe(true);
  });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx vitest run src/admin/edit.test.tsx`
Expected: FAIL — clicking "Add project" does nothing; no "Title" field.

- [ ] **Step 3: Implement the edit panel and the two forms**

Create `src/admin/EditPanel.tsx`:
```tsx
import { type FormEvent, useState } from "react";
import { ApiError } from "./api";
import type { AreaConfig } from "./areas";
import { messageOf, useApi } from "./context";
import type { AdminItem } from "./types";

export function EditPanel({
  config,
  item,
  onDone
}: {
  config: AreaConfig;
  item: AdminItem | null;
  onDone(saved: boolean): void;
}) {
  const api = useApi();
  const [value, setValue] = useState<Record<string, unknown>>(() => (item ? config.toInput(item.data) : config.empty()));
  const [version, setVersion] = useState(item?.version ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const problem = config.validate(value);
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    setError(null);
    setConflict(false);
    try {
      if (item) await api.updateItem(config.area, item.id, value, version);
      else await api.createItem(config.area, value);
      onDone(true);
    } catch (failure) {
      setConflict(failure instanceof ApiError && failure.status === 409);
      setError(messageOf(failure));
      setSaving(false);
    }
  };

  const loadLatest = async () => {
    if (!item) return;
    try {
      const latest = (await api.listItems(config.area)).find((candidate) => candidate.id === item.id);
      if (!latest) {
        onDone(false);
        return;
      }
      setValue(config.toInput(latest.data));
      setVersion(latest.version);
      setConflict(false);
      setError(null);
    } catch (failure) {
      setError(messageOf(failure));
    }
  };

  const heading = item ? `Edit ${config.singular}` : `Add ${config.singular}`;

  return (
    <form className="admin-card admin-editor" onSubmit={save} aria-label={heading} noValidate>
      <h1>{heading}</h1>
      {error && (
        <div className="admin-error" role="alert">
          {error}
          {conflict && (
            <>
              {" "}
              Your unsaved changes will be replaced.{" "}
              <button className="admin-button" type="button" onClick={() => void loadLatest()}>
                Load their version
              </button>
            </>
          )}
        </div>
      )}
      <config.Form value={value} onChange={setValue} />
      <div className="admin-actions">
        <button className="admin-button admin-button--primary" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
        <button className="admin-button" type="button" onClick={() => onDone(false)} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
}
```

Replace `ProjectForm` and `IndustryForm` in `src/admin/forms.tsx` (keep the two stubs below them) and update the imports:
```tsx
import type { FormProps } from "./areas";
import { RepeatableList, TextField } from "./fields";
import type { IndustryInput, ProjectInput } from "./types";

export function ProjectForm({ value, onChange }: FormProps) {
  const project = value as ProjectInput;
  const set = (patch: Partial<ProjectInput>) => onChange({ ...project, ...patch });
  return (
    <>
      <TextField label="Title" value={project.title} onChange={(title) => set({ title })} maxLength={300} required hint="Shown on the card." />
      <TextField
        label="Description"
        value={project.description}
        onChange={(description) => set({ description })}
        maxLength={5000}
        multiline
        rows={8}
        hint="Shown when a visitor taps the card. Leave a blank line between paragraphs. With no description and no links, the card is not clickable."
      />
      <RepeatableList
        legend="Links"
        items={project.links}
        max={10}
        addLabel="Add link"
        itemName="link"
        empty={() => ({ label: "", url: "" })}
        onChange={(links) => set({ links })}
        render={(link, update, index) => (
          <>
            <TextField
              label={`Link ${index + 1} label`}
              value={link.label}
              onChange={(label) => update({ ...link, label })}
              maxLength={100}
              required
            />
            <TextField
              label={`Link ${index + 1} address`}
              type="url"
              value={link.url}
              onChange={(url) => update({ ...link, url })}
              required
              hint="Must start with https:// or http://"
            />
          </>
        )}
      />
    </>
  );
}

export function IndustryForm({ value, onChange }: FormProps) {
  const card = value as IndustryInput;
  const set = (patch: Partial<IndustryInput>) => onChange({ ...card, ...patch });
  return (
    <>
      <TextField label="Heading" value={card.heading} onChange={(heading) => set({ heading })} maxLength={100} required />
      <RepeatableList
        legend="Bullets"
        items={card.bullets}
        min={1}
        max={12}
        addLabel="Add bullet"
        itemName="bullet"
        empty={() => ({ text: "", label: "" })}
        onChange={(bullets) => set({ bullets })}
        render={(bullet, update, index) => (
          <>
            <TextField
              label={`Bullet ${index + 1} label (optional)`}
              value={bullet.label ?? ""}
              onChange={(label) => update({ ...bullet, label })}
              maxLength={60}
              hint="Shown in bold before the text, like “Cost Reduction:”."
            />
            <TextField
              label={`Bullet ${index + 1} text`}
              value={bullet.text}
              onChange={(text) => update({ ...bullet, text })}
              maxLength={300}
              required
            />
          </>
        )}
      />
    </>
  );
}
```

In `src/admin/AreaPage.tsx`:
- Add `import { EditPanel } from "./EditPanel";`.
- Add state: `const [editing, setEditing] = useState<{ item: AdminItem | null } | null>(null);`.
- In the reset effect add `setEditing(null);`.
- Change `onEdit` to `onEdit: (item: AdminItem) => setEditing({ item }),`.
- Give the Add button `onClick={() => setEditing({ item: null })}`.
- Before the `return (<section>...`, add:
```tsx
  if (editing) {
    return (
      <EditPanel
        key={editing.item?.id ?? "new"}
        config={config}
        item={editing.item}
        onDone={(saved) => {
          setEditing(null);
          setError(null);
          setNotice(saved ? "Saved. It is live on the website." : null);
          void load();
        }}
      />
    );
  }
```

Append to `src/admin/admin.css`:
```css
.admin-editor {
  max-width: 760px;
}

.admin-actions {
  display: flex;
  gap: 0.6rem;
  margin-top: 1.25rem;
}

.admin-actions .admin-button--primary {
  margin-top: 0;
}
```

- [ ] **Step 4: Verify and commit**

Run: `npx vitest run src/admin && npx tsc -b && npm run test`
Expected: all pass.
```bash
git add src/admin
git commit -m "feat(admin): edit panel with conflict recovery, project and industry forms"
```

---

### Task 7: Photo uploads, people and gallery forms

**Files:**
- Create: `src/admin/PhotoField.tsx`
- Modify: `src/admin/forms.tsx` (`PersonForm`, `GalleryForm`), `src/admin/admin.css`
- Test: `src/admin/photos.test.tsx`

**Interfaces:**
- Consumes: `useApi`, `messageOf`, `TextField`, `CheckboxField`.
- Produces: `export function PhotoField(props: { kind: UploadKind; label: string; value: string; onChange(path: string): void }): JSX.Element`.

- [ ] **Step 1: Write the failing tests**

Create `src/admin/photos.test.tsx`:
```tsx
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FakeAdminApi } from "../test/fakeAdminApi";
import { renderAdmin } from "../test/renderAdmin";

const change = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

function choose(label: string, file: File) {
  fireEvent.change(screen.getByLabelText(label), { target: { files: [file] } });
}

const photo = (bytes = 10) => new File([new Uint8Array(bytes)], "photo.jpg", { type: "image/jpeg" });

describe("people editor", () => {
  it("uploads a photo, previews it as a circle and saves only the accepted fields", async () => {
    const { api } = renderAdmin("/admin/people");
    fireEvent.click(await screen.findByRole("button", { name: "Add person" }));
    choose("Photo", photo());
    const preview = (await screen.findByAltText("Preview of the uploaded photo")) as HTMLImageElement;
    expect(preview.getAttribute("src")).toBe("/media/person-1.webp");
    expect(preview.classList.contains("admin-photo--person")).toBe(true);
    change("Name", "Jane Doe");
    change("Designation", "Professor");
    change("Institution", "TIET");
    change("LinkedIn profile (optional)", "https://www.linkedin.com/in/jane");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByText("Jane Doe");
    expect(api.called("createItem")[0].args[1]).toEqual({
      name: "Jane Doe",
      designation: "Professor",
      institution: "TIET",
      photo: "/media/person-1.webp",
      linkedin: "https://www.linkedin.com/in/jane"
    });
  });

  it("asks for a photo before saving a new person", async () => {
    const { api } = renderAdmin("/admin/people");
    fireEvent.click(await screen.findByRole("button", { name: "Add person" }));
    change("Name", "Jane Doe");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Upload a photo first.");
    expect(api.called("createItem")).toHaveLength(0);
  });

  it("refuses a photo over 10 MB without uploading it", async () => {
    const { api } = renderAdmin("/admin/people");
    fireEvent.click(await screen.findByRole("button", { name: "Add person" }));
    choose("Photo", photo(10 * 1024 * 1024 + 1));
    expect((await screen.findByRole("alert")).textContent).toBe("Photo must be under 10 MB.");
    expect(api.called("upload")).toHaveLength(0);
  });

  it("never sends the stored alt text back when editing", async () => {
    const api = new FakeAdminApi();
    api.seed("people", {
      name: "Jane Doe",
      designation: "Professor",
      institution: "TIET",
      photo: "/assets/people/jane.webp",
      photoAlt: "Jane Doe, Dean",
      linkedin: ""
    });
    renderAdmin("/admin/people", api);
    fireEvent.click(await screen.findByRole("button", { name: "Edit Jane Doe" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByRole("status");
    expect(api.called("updateItem")[0].args[2]).not.toHaveProperty("photoAlt");
  });
});

describe("gallery editor", () => {
  it("saves a photo with its title, description and carousel choice", async () => {
    const { api } = renderAdmin("/admin/gallery");
    fireEvent.click(await screen.findByRole("button", { name: "Add photo" }));
    choose("Photo", photo());
    await screen.findByAltText("Preview of the uploaded photo");
    change("Title", "DED system");
    change("Description", "The DED system used for metal additive manufacturing.");
    fireEvent.click(screen.getByLabelText("Show in the home page carousel"));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByText("DED system");
    expect(api.called("createItem")[0].args[1]).toEqual({
      image: "/media/gallery-1.webp",
      title: "DED system",
      description: "The DED system used for metal additive manufacturing.",
      inHomeCarousel: true
    });
  });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx vitest run src/admin/photos.test.tsx`
Expected: FAIL — `Unable to find a label with the text of: Photo` (the forms are still stubs).

- [ ] **Step 3: Implement**

Create `src/admin/PhotoField.tsx`:
```tsx
import { type ChangeEvent, useId, useState } from "react";
import { messageOf, useApi } from "./context";
import type { UploadKind } from "./types";

const MAX_BYTES = 10 * 1024 * 1024;

export function PhotoField({
  kind,
  label,
  value,
  onChange
}: {
  kind: UploadKind;
  label: string;
  value: string;
  onChange(path: string): void;
}) {
  const api = useApi();
  const id = useId();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const choose = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setError("Photo must be under 10 MB.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      onChange(await api.upload(kind, file));
    } catch (failure) {
      setError(messageOf(failure));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="admin-field admin-field--required">
      <label htmlFor={id}>{label}</label>
      {value && (
        <img
          className={kind === "person" ? "admin-photo admin-photo--person" : "admin-photo"}
          src={value}
          alt="Preview of the uploaded photo"
        />
      )}
      <input id={id} type="file" accept="image/jpeg,image/png,image/webp" onChange={choose} disabled={uploading} />
      <p className="admin-hint">
        {kind === "person"
          ? "JPG, PNG or WebP under 10 MB. It is cropped to a square from the centre; the preview shows the result."
          : "JPG, PNG or WebP under 10 MB. Large photos are resized automatically."}
      </p>
      {uploading && <p role="status">Uploading…</p>}
      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
```

Replace the `PersonForm` and `GalleryForm` stubs in `src/admin/forms.tsx`, and extend the imports to:
```tsx
import type { FormProps } from "./areas";
import { CheckboxField, RepeatableList, TextField } from "./fields";
import { PhotoField } from "./PhotoField";
import type { GalleryInput, IndustryInput, PersonInput, ProjectInput } from "./types";
```
```tsx
export function PersonForm({ value, onChange }: FormProps) {
  const person = value as PersonInput;
  const set = (patch: Partial<PersonInput>) => onChange({ ...person, ...patch });
  return (
    <>
      <PhotoField kind="person" label="Photo" value={person.photo} onChange={(photo) => set({ photo })} />
      <TextField label="Name" value={person.name} onChange={(name) => set({ name })} maxLength={150} required />
      <TextField
        label="Designation"
        value={person.designation}
        onChange={(designation) => set({ designation })}
        maxLength={150}
        required
      />
      <TextField
        label="Institution"
        value={person.institution}
        onChange={(institution) => set({ institution })}
        maxLength={150}
        required
      />
      <TextField
        label="LinkedIn profile (optional)"
        type="url"
        value={person.linkedin}
        onChange={(linkedin) => set({ linkedin })}
        hint="An https://www.linkedin.com/in/… address. Leave empty to show “LinkedIn — coming soon”."
      />
    </>
  );
}

export function GalleryForm({ value, onChange }: FormProps) {
  const photo = value as GalleryInput;
  const set = (patch: Partial<GalleryInput>) => onChange({ ...photo, ...patch });
  return (
    <>
      <PhotoField kind="gallery" label="Photo" value={photo.image} onChange={(image) => set({ image })} />
      <TextField label="Title" value={photo.title} onChange={(title) => set({ title })} maxLength={60} required />
      <TextField
        label="Description"
        value={photo.description}
        onChange={(description) => set({ description })}
        maxLength={400}
        multiline
        required
        hint="Shown under the photo and read aloud by screen readers."
      />
      <CheckboxField
        label="Show in the home page carousel"
        checked={photo.inHomeCarousel}
        onChange={(inHomeCarousel) => set({ inHomeCarousel })}
      />
    </>
  );
}
```

Append to `src/admin/admin.css`:
```css
.admin-photo {
  border: 1px solid var(--line);
  border-radius: 6px;
  display: block;
  margin: 0.4rem 0 0.6rem;
  max-height: 220px;
  max-width: 100%;
  object-fit: cover;
}

.admin-photo--person {
  border-radius: 50%;
  height: 136px;
  width: 136px;
}
```

- [ ] **Step 4: Verify and commit**

Run: `npx vitest run src/admin && npx tsc -b && npm run test`
Expected: all pass.
```bash
git add src/admin
git commit -m "feat(admin): photo uploads with preview, people and gallery forms"
```

---

### Task 8: Recently deleted, audit log, admins and backup

**Files:**
- Create: `src/admin/DeletedPage.tsx`, `src/admin/AuditPage.tsx`, `src/admin/AdminsPage.tsx`
- Modify: `src/admin/AdminApp.tsx`, `src/admin/admin.css`
- Test: `src/admin/utility.test.tsx`

**Interfaces:**
- Consumes: `useApi`, `useAuth`, `messageOf`, `areaConfig`.
- Produces: `DeletedPage(props: { now?: () => number })`, `AuditPage()`, `AdminsPage()`, routed at `deleted`, `audit`, `admins`.

- [ ] **Step 1: Write the failing tests**

Create `src/admin/utility.test.tsx`:
```tsx
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FakeAdminApi } from "../test/fakeAdminApi";
import { renderAdmin } from "../test/renderAdmin";

afterEach(() => vi.restoreAllMocks());

const DAY = 24 * 60 * 60 * 1000;

describe("recently deleted", () => {
  it("lists deleted items with their area and days left, and restores one", async () => {
    const api = new FakeAdminApi();
    api.seed("people", { name: "Jane Doe" }, { deletedAt: Date.now() - 3 * DAY });
    renderAdmin("/admin/deleted", api);
    const row = (await screen.findByText("Jane Doe")).closest("li")!;
    expect(within(row).getByText("People")).toBeTruthy();
    expect(within(row).getByText(/permanently removed in 27 days/)).toBeTruthy();
    fireEvent.click(within(row).getByRole("button", { name: "Restore Jane Doe" }));
    await waitFor(() => expect(screen.queryByText("Jane Doe")).toBeNull());
    expect(screen.getByRole("status").textContent).toMatch(/Restored "Jane Doe"/);
    expect(api.live("people")).toHaveLength(1);
  });

  it("says when nothing was deleted", async () => {
    renderAdmin("/admin/deleted");
    expect(await screen.findByText("Nothing was deleted in the last 30 days.")).toBeTruthy();
  });
});

describe("audit log", () => {
  it("shows readable actions and loads older entries", async () => {
    const api = new FakeAdminApi();
    for (let id = 1; id <= 60; id++) {
      api.audit.push({ id, at: Date.UTC(2026, 8, 27, 4, 30), adminEmail: "admin@thapar.edu", action: "item_updated", detail: `projects: Entry ${id}`, ip: "203.0.113.9" });
    }
    api.audit.push({ id: 61, at: Date.UTC(2026, 8, 27, 5), adminEmail: null, action: "login_failed", detail: "x@thapar.edu (password)", ip: "198.51.100.1" });
    renderAdmin("/admin/audit", api);
    expect(await screen.findByText("Failed sign-in")).toBeTruthy();
    expect(screen.getAllByRole("row")).toHaveLength(51);
    fireEvent.click(screen.getByRole("button", { name: "Load older entries" }));
    await waitFor(() => expect(screen.getAllByRole("row")).toHaveLength(62));
    expect(screen.queryByRole("button", { name: "Load older entries" })).toBeNull();
    // 04:30 UTC is 10:00 in India; compute the label the same way the page does,
    // because ICU versions differ on month abbreviations ("Sep" / "Sept").
    const expected = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(
      Date.UTC(2026, 8, 27, 4, 30)
    );
    expect(expected).toMatch(/10:00/);
    expect(screen.getAllByText(expected).length).toBeGreaterThan(0);
  });
});

describe("admins and backup", () => {
  it("lists admins and resets the other admin's login after confirmation", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const { api } = renderAdmin("/admin/admins");
    const other = (await screen.findByText("second@thapar.edu")).closest("li")!;
    const mine = screen.getByText("admin@thapar.edu", { selector: ".admin-row-label" }).closest("li")!;
    expect(within(mine).queryByRole("button", { name: /Reset login/ })).toBeNull();
    expect(within(mine).getByText("You")).toBeTruthy();
    fireEvent.click(within(other).getByRole("button", { name: "Reset login for second@thapar.edu" }));
    const link = (await screen.findByLabelText("New setup link")) as HTMLInputElement;
    expect(link.value).toBe("https://am-tiet.thapar.edu/admin/setup#reset-2");
    expect(link.readOnly).toBe(true);
    expect(api.called("resetAdmin")[0].args).toEqual([2]);
  });

  it("offers the full backup as a download", async () => {
    renderAdmin("/admin/admins");
    const download = await screen.findByRole("link", { name: "Download full backup" });
    expect(download.getAttribute("href")).toBe("/api/backup");
    expect(download.hasAttribute("download")).toBe(true);
  });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx vitest run src/admin/utility.test.tsx`
Expected: FAIL — the placeholder pages show only a heading.

- [ ] **Step 3: Implement**

Create `src/admin/DeletedPage.tsx`:
```tsx
import { useCallback, useEffect, useState } from "react";
import { areaConfig } from "./areas";
import { messageOf, useApi } from "./context";
import type { AdminItem } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 30;

export function DeletedPage({ now = Date.now }: { now?: () => number }) {
  const api = useApi();
  const [items, setItems] = useState<AdminItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await api.listDeleted());
    } catch (failure) {
      setError(messageOf(failure));
    }
  }, [api]);

  useEffect(() => {
    void load();
  }, [load]);

  const restore = async (item: AdminItem, label: string) => {
    setError(null);
    setNotice(null);
    try {
      await api.restoreItem(item.area, item.id);
      setNotice(`Restored "${label}". It is back on the website, at the end of its list.`);
    } catch (failure) {
      setError(messageOf(failure));
    }
    await load();
  };

  return (
    <section>
      <h1>Recently deleted</h1>
      {notice && (
        <p className="admin-notice" role="status">
          {notice}
        </p>
      )}
      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
      {items === null && <p className="admin-loading">Loading…</p>}
      {items?.length === 0 && <p className="admin-empty">Nothing was deleted in the last 30 days.</p>}
      {items && items.length > 0 && (
        <ul className="admin-list">
          {items.map((item) => {
            const config = areaConfig(item.area);
            const label = config.label(item.data) || "(untitled)";
            const daysLeft = Math.max(0, WINDOW_DAYS - Math.floor((now() - (item.deletedAt ?? 0)) / DAY_MS));
            return (
              <li className="admin-row" key={item.id}>
                <span className="admin-badge">{config.title}</span>
                <span className="admin-row-label">{label}</span>
                <span className="admin-hint">permanently removed in {daysLeft} days</span>
                <button className="admin-button" type="button" aria-label={`Restore ${label}`} onClick={() => void restore(item, label)}>
                  Restore
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
```

Create `src/admin/AuditPage.tsx`:
```tsx
import { useEffect, useState } from "react";
import { messageOf, useApi } from "./context";
import type { AuditEntry } from "./types";

const PAGE = 50;

const ACTION_LABELS: Record<string, string> = {
  login: "Signed in",
  login_failed: "Failed sign-in",
  logout: "Signed out",
  logout_all: "Signed out everywhere",
  recovery_code_used: "Signed in with a recovery code",
  admin_created: "Admin created",
  admin_reset: "Admin login reset",
  setup_completed: "Admin setup completed",
  item_created: "Added",
  item_updated: "Edited",
  item_hidden: "Hidden",
  item_shown: "Shown",
  item_reordered: "Reordered",
  item_deleted: "Deleted",
  item_restored: "Restored",
  backup_downloaded: "Backup downloaded"
};

const timeFormat = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

export function AuditPage() {
  const api = useApi();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (before?: number) => {
    setLoading(true);
    try {
      const page = await api.listAudit(before);
      setEntries((current) => (before ? [...current, ...page] : page));
      setMore(page.length === PAGE);
    } catch (failure) {
      setError(messageOf(failure));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // Load the first page once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section>
      <h1>Audit log</h1>
      <p className="admin-hint">Every sign-in and change, newest first. Entries are kept for one year. Times are Indian Standard Time.</p>
      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
      <table className="admin-table">
        <thead>
          <tr>
            <th scope="col">When</th>
            <th scope="col">Who</th>
            <th scope="col">What</th>
            <th scope="col">Details</th>
            <th scope="col">From</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td>{timeFormat.format(entry.at)}</td>
              <td>{entry.adminEmail ?? "—"}</td>
              <td>{ACTION_LABELS[entry.action] ?? entry.action}</td>
              <td>{entry.detail}</td>
              <td>{entry.ip ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {loading && <p className="admin-loading">Loading…</p>}
      {more && !loading && (
        <button className="admin-button" type="button" onClick={() => void load(entries.at(-1)?.id)}>
          Load older entries
        </button>
      )}
    </section>
  );
}
```

Create `src/admin/AdminsPage.tsx`:
```tsx
import { useEffect, useState } from "react";
import { messageOf, useApi, useAuth } from "./context";
import type { AdminAccount } from "./types";

export function AdminsPage() {
  const api = useApi();
  const { state } = useAuth();
  const me = state.status === "signedIn" ? state.email : "";
  const [admins, setAdmins] = useState<AdminAccount[] | null>(null);
  const [link, setLink] = useState<{ email: string; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setAdmins(await api.listAdmins());
    } catch (failure) {
      setError(messageOf(failure));
    }
  };

  useEffect(() => {
    void load();
    // Load once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reset = async (admin: AdminAccount) => {
    const ok = window.confirm(
      `Reset the login for ${admin.email}? They are signed out everywhere and must set up a new password and authenticator with the link you will get.`
    );
    if (!ok) return;
    setError(null);
    try {
      setLink({ email: admin.email, url: await api.resetAdmin(admin.id) });
    } catch (failure) {
      setError(messageOf(failure));
    }
    await load();
  };

  return (
    <section>
      <h1>Admins &amp; backup</h1>
      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}

      <h2 className="admin-subheading">Admins</h2>
      {admins === null ? (
        <p className="admin-loading">Loading…</p>
      ) : (
        <ul className="admin-list">
          {admins.map((admin) => (
            <li className="admin-row" key={admin.id}>
              <span className="admin-row-label">{admin.email}</span>
              <span className="admin-badge">{admin.active ? "Active" : "Setup pending"}</span>
              {admin.email === me ? (
                <span className="admin-badge">You</span>
              ) : (
                <button
                  className="admin-button"
                  type="button"
                  aria-label={`Reset login for ${admin.email}`}
                  onClick={() => void reset(admin)}
                >
                  Reset login
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {link && (
        <div className="admin-notice" role="status">
          <label htmlFor="setup-link">New setup link</label>
          <input id="setup-link" readOnly value={link.url} onFocus={(event) => event.target.select()} />
          <p className="admin-hint">
            Send this to {link.email} privately (in person or by phone, not a group chat). It works once and expires in 24
            hours.
          </p>
          <button className="admin-button" type="button" onClick={() => void navigator.clipboard?.writeText(link.url)}>
            Copy link
          </button>
        </div>
      )}

      <h2 className="admin-subheading">Backup</h2>
      <p>
        The server backs itself up every night. If Thapar does not also copy the server's backups elsewhere, download a full
        backup once a month and keep it somewhere safe.
      </p>
      <a className="admin-button" href={api.backupUrl} download>
        Download full backup
      </a>
    </section>
  );
}
```

In `src/admin/AdminApp.tsx` import the three pages and replace the `deleted`, `audit` and `admins` placeholder routes with:
```tsx
            <Route path="deleted" element={<DeletedPage />} />
            <Route path="audit" element={<AuditPage />} />
            <Route path="admins" element={<AdminsPage />} />
```
Delete the now-unused `AreaPlaceholder` component.

Append to `src/admin/admin.css`:
```css
.admin-subheading {
  color: var(--navy);
  font-family: var(--font-display);
  font-size: 1.05rem;
  margin: 1.75rem 0 0.75rem;
}

.admin-table {
  background: #fff;
  border: 1px solid var(--line);
  border-collapse: collapse;
  border-radius: 8px;
  display: block;
  margin: 1rem 0;
  overflow-x: auto;
  width: 100%;
}

.admin-table th,
.admin-table td {
  border-bottom: 1px solid var(--line);
  padding: 0.5rem 0.7rem;
  text-align: left;
  vertical-align: top;
}

.admin-table th {
  color: var(--navy);
  font-size: 0.82rem;
}
```

- [ ] **Step 4: Verify and commit**

Run: `npx vitest run src/admin && npx tsc -b && npm run test`
Expected: all pass.
```bash
git add src/admin
git commit -m "feat(admin): recently deleted, audit log, admin reset and backup download"
```

---

### Task 9: Verify the whole plan

**Files:** none changed unless a check fails.

- [ ] **Step 1: Every test and type check**

Run from the root: `npx tsc -b && npm run test`
Run from `server/`: `npm test && npm run typecheck`
Expected: every command exits 0.

- [ ] **Step 2: Public visitors never load admin code**

Run: `npm run build`
Run: `grep -l "CoE-AM Admin" dist/assets/*.js`
Expected: only the `AdminApp-*.js` chunk (and chunks it alone imports, such as `@dnd-kit`), never `index-*.js`.
Run: `grep -l "admin-row" dist/assets/*.css`
Expected: only the admin CSS chunk, never the main stylesheet.

- [ ] **Step 3: End-to-end run against the real API (owner, about 10 minutes)**

1. In one terminal: `npm run dev:api` → expect the API listening on port 8787.
2. In a second terminal: `npm run admin:create -- you@thapar.edu` → copy the printed `http://localhost:5173/admin/setup#…` link.
3. In a third terminal: `npm run dev`, open the link, set a password, scan the QR code with an authenticator app, enter the code, download the recovery codes.
4. Sign in at `http://localhost:5173/admin`.
5. Projects: open the first project, add a description and a link, save. In another tab open `http://localhost:5173/research` — within 60 seconds and without reloading, that card shows "View details" and opens the popup.
6. People: add a person with a photo; hide them; confirm they disappear from `/people` within a minute; show them again.
7. Gallery: add a photo with "Show in the home page carousel" ticked; confirm it appears on `/gallery` and in the home carousel.
8. Delete an item, restore it from Recently deleted.
9. Audit log lists each step. Admins & backup downloads a `.tar.gz`.
10. Stop both servers. Delete `server/dev-data` to start fresh next time.
