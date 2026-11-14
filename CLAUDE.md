<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

# Project-specific guidelines (this workspace)

This is a 3-app Angular monorepo: `public-site` (public, no auth), `admin` (JWT + role `admin`), `member` (JWT + roles `member`/`admin`). Read `README.md` first — it documents local dev, single-port mode, IIS deployment, environment config, and the unified login flow in detail. The rules below are the load-bearing conventions that aren't obvious from the code alone; violating them re-introduces bugs that were already found and fixed once.

## Unified login — do not re-add per-app login pages
- There is exactly **one** login page: `apps/public-site/src/app/pages/auth/login`. `admin` and `member` have no login/forgot/reset-password pages of their own — do not recreate them there.
- `admin`/`member` guards (`@org/guards` → `authGuard`, `roleGuard`, `appRoleGuard`) redirect unauthenticated users with a **hard** browser navigation (`AuthService.redirectToLogin`), never an in-app `Router` navigation — login lives in a different Angular bundle, so `router.navigate(...)` cannot reach it.
- **Session model (new backend):** the access token is kept in memory only (`AuthService`, a private field) and the refresh token is an HttpOnly cookie. Because memory does not survive a page load or a hard navigation between apps, every app restores its session at start-up (`provideAppInitializer(() => inject(AuthService).initializeSession())` → `POST auth/refresh`). **Never write a token or credential to `localStorage`/`sessionStorage`/cookies from JavaScript**; the only stored value is the non-secret hint `book_inventory.session`. This only works while the three apps share one origin (the API serves them); if you ever split origins, override `LOGIN_URL` (`@org/auth`) with an absolute URL and revisit the cookie `SameSite` setting.
- Roles are the API's strings (`SUPER_ADMIN`, `SALES_CRM`, `ACCOUNTS`, `MEMBER`, type `AppRole`). Older pages still use the two buckets `admin`/`member` through `AuthService.roles()` (staff → `admin`); new code should use `AuthService.role()`/`hasAppRole(...)`.
## Route prefix / base-href — the double-prefix trap
- `admin` and `member` are always built with `--base-href=/admin/` / `--base-href=/member/` (single-port dev server and IIS sub-applications both rely on this). Because of that, **every route path and every `routerLink`/`window.location.href` inside those two apps must be relative to the app's own root — never include the literal `admin/` or `member/` prefix**, or the browser URL doubles up (`/admin/admin/dashboard`) and 404s.
- `ADMIN_ROUTES`/`MEMBER_ROUTES` in `@org/constants` store full segments (e.g. `'admin/dashboard'`) for readability elsewhere. Whenever you consume them inside the `admin` or `member` app (routes, sidebar links, quick-links, redirects), strip the prefix first with `stripAppRoutePrefix` from `@org/shared-utils`. Grep for `stripAppRoutePrefix` usage before adding a new nav link/route to copy the existing pattern.
- `public-site` has no such prefix (`base-href` stays `/`) — its routes use `PUBLIC_ROUTES`/`AUTH_ROUTES` directly.

## Shared layout — don't duplicate sidebar/header per app
- `AppSidebarComponent` and `AppHeaderComponent` (`@org/layout`) are the **one** sidebar/header used by both `admin-layout` and `member-layout`. Menu **labels** differ per app via each layout component's own `navItems` array (`admin-layout.ts` / `member-layout.ts`) — do not fork the sidebar/header component itself to change labels; add/edit the `navItems` array in the relevant `*-layout.ts` instead.

## Module boundaries
- Every app is tagged `scope:<app-name>`; every lib is tagged `scope:shared`. `eslint.config.mjs`'s `@nx/enforce-module-boundaries` only allows `scope:shared → scope:shared` and `scope:<app> → scope:shared` — apps cannot import from each other, and a new lib needs a `scope:shared` tag in its `project.json` or lint will fail.

## Environment / API config — one source of truth
- Per-environment `apiUrl` values live in exactly one place: `libs/constants/src/lib/environment.const.ts` (`DEV_ENVIRONMENT` / `STAGING_ENVIRONMENT` / `PRODUCTION_ENVIRONMENT`). Each app's `src/environments/environment*.ts` is a one-line re-export from there — **edit the value in `environment.const.ts`, not in `apps/*/src/environments/`**, unless one specific app genuinely needs to diverge.
- The new API is versioned (`/api/v1`): production/staging use the relative `/api/v1` (the API serves the apps, so calls are same-origin); development uses the API's dev URL and an absolute `loginUrl` for the separate dev ports.
- All real HTTP calls go through `ApiService`/`HttpClient` with `API_BASE_URL` — don't hardcode a host in a component or service. The auth interceptor only adds the token to requests that start with `API_BASE_URL`.
## The new API has no response envelope — errors are problem details
- The new backend returns payloads directly (no `{ data, errorCode }` wrapper). Do **not** unwrap `.data`; type calls as `Observable<T>` and read the fields directly. (Legacy services written for the old backend still expect the old shape; they are hidden by `FEATURES` until their module is adapted, see below.)
- Every error is RFC 9457 problem details (`ProblemDetails` in `@org/shared-models`) with a stable `code`. `errorInterceptor` shows a toast with the catalogue text `errors.<code>` (`assets/i18n/en.json`); pages that show the error themselves mark the request with `SKIP_ERROR_TOAST` and use `messageForError(error, translate)`. Add a text to the catalogue when the API adds a code; do not hard-code messages in components you create or change.
- `TranslateService` must not be injected while the interceptor chain is built (its loader uses `HttpClient`: circular dependency NG0200); resolve it lazily, as `errorInterceptor` does.
## Working rules for this repo
- **The UI started as a copy of the HautInHousing UI.** All screens of the previous product (MLM, shop, marketing pages, master data, settings, notifications, old images) were removed in the setup. What remains is login and password flows, user management, login and audit logs, account pages, the layout and the shared UI library. New screens come module by module through the spec and plan flow.
- **`FEATURES` switch** (`@org/constants`): navigation only links modules whose flag is on (`iam` on). To enable a module, adapt its services/pages to the new API first, then flip its flag.
- **Specs and plans live in the API repository** (`book-inventory-api/docs/specs`, `docs/plans`, rules in its `CLAUDE.md`). Every feature follows spec → plan → code; a plan has an Api and a Ui section. Read the module's spec and the active plan before changing UI code. There are no automated test projects: verify by building, linting and exercising the real screens, and record what you ran.
## Before finishing any change here
- Run `npx nx run-many -t lint` and `npx nx run-many -t build` (the latter needs `MSYS_NO_PATHCONV=1` prefix in Git Bash on Windows if passing `--base-href`, otherwise MSYS mangles the path into a Windows filesystem path).
- If you touched routing/guards/layout, do a real smoke test — build with the correct `--base-href` per app and hit deep routes (`/admin/dashboard`, `/member/dashboard`, `/login?returnUrl=...`) through `npm run start:single`, not just `nx serve` on one app in isolation (that config lacks the `base-href` and the other two apps to redirect to/from).
- `npm run start:single` builds with the `production` configuration (minified, no sourcemaps) — fine for a routing/deployment smoke test, useless for debugging in Chrome DevTools. If the user needs to set breakpoints or read a stack trace across all three apps together, use `npm run start:single:dev` instead (development configuration, `sourceMap: true`); for single-app debugging, `nx serve <app>` already has sourcemaps by default.
