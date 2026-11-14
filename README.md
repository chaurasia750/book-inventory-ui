# Book Inventory — Angular Nx Monorepo

An Nx monorepo containing three Angular 21 applications (standalone components, signals) and a set of shared libraries for the **Book Inventory, Billing & Ledger System**. It started as a copy of the HautInHousing UI; pages that still describe the previous product (public site, member portal, genealogy and wallet screens) are carried over and are replaced feature by feature through the spec and plan flow.

> Business source of truth: [`book-inventory-api/docs/bussiness/BRD-Book-Inventory-Phase1.md`](../book-inventory-api/docs/bussiness/BRD-Book-Inventory-Phase1.md) in the sibling API repo. This README only covers the frontend monorepo's own structure and tooling.

## 📦 Project Overview

### Applications (`apps/`)

| App           | Purpose                                                              | Auth                        |
| ------------- | --------------------------------------------------------------------- | ---------------------------- |
| `public-site` | Public marketing website (home, about, pricing, blog, careers, etc.) — **also hosts the single login page** for all apps | None (login page itself is public) |
| `admin`       | Admin portal — users, login log, audit log, account pages (Book Inventory screens arrive per module) | JWT, role `admin`             |
| `member`      | Member portal — welcome page and own account pages (profile, sessions, login history, change password) | JWT, roles `member` / `admin` |

### 🔐 Unified login

There is **one login page**, served by `public-site` at `/login` — `admin` and `member` do not have their own login screens. After a successful sign-in, the login page inspects the authenticated user's role and does a hard browser redirect:

- role `admin` → `/admin`
- role `member` → `/member`
- (if the guard sent the user to `/login?returnUrl=...` because they hit a protected deep link while logged out, that exact URL is honored instead, as long as it points back into `/admin` or `/member`)

This works because all three apps share one browser origin (the API serves them; in development each app has its own port and the login redirect uses an absolute `loginUrl`). The access token is held in memory only and the refresh token is an HttpOnly cookie, so every app restores its session at start-up through `POST auth/refresh`; nothing secret is stored in the browser. `admin`/`member` never redirect in-app to a login route; `authGuard`/`roleGuard` do a **hard** redirect to `/login` when there is no session, since login lives in a different Angular app/bundle.

### Shared libraries (`libs/`)

| Library         | Contents                                                             |
| --------------- | --------------------------------------------------------------------- |
| `ui`            | 19 reusable UI components (button, card, table, modal, toast, …)     |
| `layout`        | Public/admin/member/auth layout shells, headers, sidebars, footers    |
| `auth`          | Signal-based `AuthService` — login/logout/refresh/forgot/reset       |
| `guards`        | `authGuard`, `roleGuard`, `guestGuard`                               |
| `interceptors`  | `authInterceptor` (attaches JWT), `errorInterceptor` (401 handling)  |
| `form-controls` | Reactive-forms field components (text, select, checkbox, textarea)   |
| `api-services`  | Thin `ApiService` wrapper around `HttpClient`                       |
| `shared-models` | TypeScript interfaces (User, LoginRequest, BlogPost, …)             |
| `shared-utils`  | Date/string formatting, validators, storage helpers                  |
| `pipes`         | `appTruncate`, `timeAgo`, `safeHtml`, `fileSize`                    |
| `directives`    | `clickOutside`, `autofocus`, `tooltip`, `hasRole`                   |
| `constants`     | Route path constants, storage keys, app constants                    |

## 🛠️ Prerequisites

- Node.js 20+ (project was built/verified on Node 24)
- npm 10+

## 🚀 Local Development

Since login now lives only on `public-site`, the recommended way to run this locally is **single-port mode** (below) — `admin`/`member` alone have no way to sign in. Running an individual app with `nx serve` is still useful for iterating on that app's own pages once you already have a session (the guard's hard-redirect to `/login` will just bounce you to whatever port that app is serving on, since it doesn't know about the other apps).

```bash
# Install dependencies
npm install

# Serve an individual app in isolation (mainly useful once already signed in,
# or for public-site since it needs no auth)
npx nx serve public-site   # http://localhost:4200
npx nx serve admin --port=4201
npx nx serve member --port=4202

# or use the npm scripts:
npm run start:public-site
npm run start:admin
npm run start:member
```

### Single-port local mode (all 3 apps behind one URL) — recommended

For a production-like preview where all three apps are reachable from **one port** with path-based routing and a working unified login (mirrors the IIS "sub-applications" deployment below):

```bash
npm run start:single
```                 

This builds `public-site` at `/`, `admin` at `/admin/`, and `member` at `/member/` (via `--base-href`), then serves all three from a single Node static server (`scripts/serve-single.mjs`) with SPA fallback per app:

- http://localhost:4200/ — public site
- http://localhost:4200/login — the one login page for all apps
- http://localhost:4200/admin — admin portal (redirects to `/login?returnUrl=...` if not signed in as `admin`)
-   http://localhost:4200/member — member portal (redirects to `/login?returnUrl=...` if not signed in)

Demo logins (mocked — no real backend, `AuthService` fabricates a session): `admin@example.com` + any 6+ char password signs in with the `admin` role and lands on `/admin`; any other email signs in with the `member` role and lands on `/member`.

If you've already built and just want to restart the server: `npm run serve:single`. To rebuild only: `npm run build:single`.

#### Debugging (Chrome DevTools / breakpoints)

`npm run start:single` builds with the **production** configuration by default — minified, no sourcemaps, so Chrome's Sources panel only shows opaque `chunk-XXXXXXXX.js` files you can't set meaningful breakpoints in or read. The `chunk-*.js` files themselves are normal (Angular splits each lazy-loaded route into its own chunk in both dev and prod) — the debugging problem is specifically the missing sourcemaps.

For a debuggable single-port build, use the development configuration instead:

```bash
npm run start:single:dev
```

This builds all three apps with `--configuration=development` (unminified, `sourceMap: true`) so Chrome DevTools resolves the original `.ts`/`.html` files (under a `webpack://` or similar virtual path in Sources) instead of the bundled chunk. `npm run build:single:dev` / the existing `npm run serve:single` work the same way if you want to build and serve separately.

If you're only working on one app at a time, `nx serve <app>` (e.g. `npx nx serve admin`) is simpler and already uses the development configuration with sourcemaps by default — prefer that for day-to-day debugging, and reach for `start:single(:dev)` when you specifically need all three apps together (e.g. testing the login → role redirect flow).

### Build

```bash
# Build a single app (production config is the default)
npx nx build public-site
npx nx build admin
npx nx build member

# Build everything
npx nx run-many -t build
# or: npm run build:all
```

Each build outputs to `dist/apps/<app-name>/browser/` — this folder (containing `index.html`, JS/CSS chunks, and `web.config`) is what you deploy.

### Lint

```bash
npx nx run-many -t lint
# or: npm run lint:all
```

### Useful Nx commands

```bash
npx nx graph                      # Interactive dependency graph
npx nx show project admin --web   # Inspect a single project
npx nx affected -t build          # Build only projects affected by your changes
```

## 🌐 Production Deployment to IIS

Each app is a static Single Page Application — IIS just needs to serve the built files and rewrite unknown paths back to `index.html` so Angular's client-side router can handle them. That rewrite rule already ships in each app's `public/web.config` and is copied into the build output automatically.

### 1. One-time IIS setup

1. Install **IIS** (Windows Features → Internet Information Services).
2. Install the **[URL Rewrite Module](https://www.iis.net/downloads/microsoft/url-rewrite)** — required for the SPA fallback rule in `web.config`. Without it, deep links (e.g. `/admin/dashboard` typed directly in the browser) will 404.
3. (Optional but recommended) Install the **[IIS Compression](https://learn.microsoft.com/iis/configuration/system.webserver/httpcompression/)** feature — already enabled via `web.config`, but the server role must have it available.

### 2. Build for production

**Option A — One-command deploy script (recommended):**

```bash
# Build all apps + merge into dist/deploy/
npm run deploy

# Build + copy directly to IIS site root
npm run deploy:copy

# Build + copy to a custom path
node scripts/production-deploy.js --copy "E:\Sites\bookinventory"
```

The script (`scripts/production-deploy.js`) does everything:
1. Builds all 3 apps with production config and correct `--base-href`
2. Merges them into a single `dist/deploy/` folder
3. Copies a root `web.config` (SPA fallback excluding `/admin/` and `/member/`)
4. Optionally copies the merged output to your IIS site root (`--copy`)

**Option B — Manual build:**

```bash
npx nx run-many -t build
```

This produces:

```
dist/apps/public-site/browser/
dist/apps/admin/browser/
dist/apps/member/browser/
```

### 3. Deploying all three under one domain as sub-applications (recommended — required for the unified login)

Since login lives only on `public-site` and `admin`/`member` redirect to it with a plain `window.location.href = '/'` (see [Unified login](#-unified-login)), all three apps **must share one browser origin** for sign-in to work — host them under one domain as IIS **Applications**:

**Using the deploy script (recommended):**

```bash
# 1. Build + merge
npm run deploy

# 2. Copy dist/deploy/ contents to your IIS site root
npm run deploy:copy                                    # default: D:\inetpub\bookinventory
npm run deploy:copy "C:\Inetpub\vhosts\example.com\httpdocs"  # custom path
```

The merged `dist/deploy/` structure:

```
dist/deploy/
├── web.config          ← root SPA fallback (excludes /admin/ and /member/)
├── index.html          ← public-site
├── *.js, *.css         ← public-site assets
├── admin/
│   ├── web.config      ← admin SPA rewrite only (inherits headers from root)
│   ├── index.html
│   └── *.js, *.css
└── member/
    ├── web.config      ← member SPA rewrite only (inherits headers from root)
    ├── index.html
    └── *.js, *.css
```

**Manual deployment:**

1. Build with matching `base-href` (or just run `npm run deploy`, which does this for you):
   ```bash
   npx nx build public-site
   npx nx build admin --base-href=/admin/
    npx nx build member --base-href=/member/
   ```
2. In IIS Manager, create **one site** for `public-site` at the domain root, physical path = `dist\apps\public-site\browser`, binding e.g. `https://example.com`.
3. Under that same site, **Add Application** for path `/admin` → physical path `dist\apps\admin\browser`, and another for path `/member` → physical path `dist\apps\member\browser`. Give each Application its own app pool, set to **"No Managed Code"** (these are static files — no .NET runtime needed).
4. Confirm each folder's `web.config` (already present in `browser/`, copied automatically at build time) is intact — it provides the SPA rewrite rule scoped to that application's root. Headers, MIME types, and compression are inherited from the root `web.config`.
5. Browse to `https://example.com/login`, sign in, and confirm you land on `/admin` or `/member` depending on role; also verify deep links (e.g. `https://example.com/admin/reports`) 404 gracefully into a redirect back to `/login` when signed out, and load correctly when signed in.

> **Note:** Sub-app `web.config` files (admin, member) only contain the SPA rewrite rule. Custom headers, MIME types, and compression are defined once in the root `web.config` and inherited by all sub-apps — this avoids IIS 500.19 duplicate entry errors.

### 4. Alternative: separate hostnames/ports per app

If you deploy `admin` and/or `member` on a **different domain** than `public-site` (e.g. `admin.example.com` vs `www.example.com`), the default hard-redirect-to-`/`-on-this-origin behavior won't reach the shared login page, and `localStorage` won't be shared across origins either. To support this, you'd need to:

- Override the `LOGIN_ROUTE` (and related) DI tokens from `@org/guards` in each app's `app.config.ts` with the full public-site URL (e.g. `https://www.example.com/login`), and
- Replace the `localStorage`-based session in `AuthService` with a cross-origin session mechanism (e.g. a shared cookie domain, or a real backend session/SSO).

This is more work and isn't wired up out of the box — prefer the single-domain sub-application approach above unless you have a specific reason to split domains.

### 5. Updating a deployed app

**Using the deploy script:**

```bash
npm run deploy:copy "C:\Inetpub\vhosts\example.com\httpdocs"
```

This rebuilds everything and copies fresh files to the IIS site root in one step.

**Manual update:**

1. `npx nx build <app>` (with the same `--base-href` used originally, if any).
2. Stop the app pool (optional, avoids serving a half-copied deployment): `Stop-WebAppPool -Name "<pool-name>"`.
3. Replace the contents of the site's physical path with the new `browser` folder contents.
4. Start the app pool again: `Start-WebAppPool -Name "<pool-name>"`.

### 6. HTTPS

Bind a TLS certificate to each site/binding in IIS Manager (**Bindings → Add → https**) and consider adding an HTTP→HTTPS redirect rule in `web.config` if the app must always be served over TLS:

```xml
<rule name="Redirect to HTTPS" stopProcessing="true">
  <match url="(.*)" />
  <conditions>
    <add input="{HTTPS}" pattern="^OFF$" />
  </conditions>
  <action type="Redirect" url="https://{HTTP_HOST}/{R:1}" redirectType="Permanent" />
</rule>
```
Add this rule **above** the "Angular SPA Routes" rule in each app's `web.config`.

### 7. API backend

`AuthService` calls the new backend's versioned API (`/api/v1/auth/*`). In production the API serves these three apps from its own origin, so calls are same-origin and the refresh cookie is same-site; hosting is described in the API repository's plan `0010-platform-hosting`.

## 🌍 Environment-based API configuration

Each app has its own `src/environments/` folder (required by Angular's `fileReplacements` build mechanism — the file path itself has to exist per app), but the **actual values live in one shared place**: `@org/constants` → `libs/constants/src/lib/environment.const.ts` (`DEV_ENVIRONMENT`, `STAGING_ENVIRONMENT`, `PRODUCTION_ENVIRONMENT`). Each app's environment file just re-exports one of these, e.g. `apps/admin/src/environments/environment.production.ts` is a one-liner: `export { PRODUCTION_ENVIRONMENT as environment } from '@org/constants';`. **To change an `apiUrl`, edit it once in `environment.const.ts`** — all three apps pick it up; you do not need to touch the files under `apps/*/src/environments/` unless one app genuinely needs a different value than the others (in which case give just that app's file a literal object instead of a re-export).

| File                                  | Used by                          | Default `apiUrl`                          |
| -------------------------------------- | --------------------------------- | ------------------------------------------ |
| `environment.ts` → `DEV_ENVIRONMENT`   | `nx serve` / `--configuration=development` (default) | `https://localhost:7100/api/v1`            |
| `environment.staging.ts` → `STAGING_ENVIRONMENT` | `--configuration=staging` | `/api/v1` (API serves the apps)            |
| `environment.production.ts` → `PRODUCTION_ENVIRONMENT` | `--configuration=production` (default for `nx build`) | `/api/v1` (API serves the apps)            |

```bash
npx nx build admin                          # production apiUrl ('/api/v1')
npx nx build admin --configuration=staging  # staging apiUrl
npx nx serve admin                          # development apiUrl (https://localhost:7100/api/v1)
```

All HTTP calls made through `ApiService` (`@org/api-services`) automatically resolve relative paths against the current environment's `apiUrl` — call `this.api.get('/users')`, not a hardcoded host. The `API_BASE_URL` DI token it reads is provided per-app in `app.config.ts` from that app's `environment.ts`. To add a new environment (e.g. `qa`), add a `QA_ENVIRONMENT` export to `environment.const.ts`, a re-exporting `environment.qa.ts` in each app, a matching `fileReplacements` entry in each app's `project.json` `build.configurations`, and a `serve.configurations` entry if you also want `nx serve --configuration=qa`.

`AuthService`'s login/forgot/reset methods call the real endpoints (`/auth/login`, `/auth/refresh`, `/auth/forgot-password`, ...) through `API_BASE_URL`.

## 📁 Project Structure

```
apps/
  public-site/    — public marketing site (no auth)
  admin/          — admin portal (JWT + role:admin guarded)
  member/         — member portal (JWT + role:member/admin guarded)
libs/
  ui/                 [scope:shared] — UI component library
  layout/             [scope:shared] — layout shells
  auth/               [scope:shared] — auth service
  guards/             [scope:shared] — route guards
  interceptors/       [scope:shared] — HTTP interceptors
  form-controls/      [scope:shared] — reactive form field components
  api-services/       [scope:shared] — HttpClient wrapper
  shared-models/      [scope:shared] — TypeScript interfaces
  shared-utils/       [scope:shared] — utility functions
  pipes/              [scope:shared] — standalone pipes
  directives/         [scope:shared] — standalone directives
  constants/          [scope:shared] — route/storage/app constants
nx.json               — Nx configuration
eslint.config.mjs      — ESLint + module-boundary rules
tsconfig.base.json     — path aliases (@org/*)
```

## 🏷️ Module Boundaries

Each app is tagged `scope:<app-name>` and every library is tagged `scope:shared`. The ESLint `@nx/enforce-module-boundaries` rule (see `eslint.config.mjs`) restricts apps and libraries to only depend on `scope:shared` libraries — apps cannot import from one another.
