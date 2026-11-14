#!/usr/bin/env node

/**
 * Production build & deploy script for IIS, or for the BookInventory API's wwwroot
 * (single-process deploy: the .NET API serves these apps itself).
 *
 * Builds all 3 apps (public-site, admin, member) with production configuration,
 * merges them into a single deployable folder, and optionally copies to a site root.
 *
 * Usage:
 *   node scripts/production-deploy.js                          (build only → dist/deploy/)
 *   node scripts/production-deploy.js --copy                   (build + copy to default IIS path)
 *   node scripts/production-deploy.js --copy "E:\Sites\bookinventory"   (build + copy to custom path)
 *   node scripts/production-deploy.js --api                    (build + copy into ../book-inventory-api BookInventory.Api/wwwroot)
 *
 * npm shortcuts:
 *   npm run deploy        → build only
 *   npm run deploy:copy   → build + copy to D:\inetpub\bookinventory
 *   npm run deploy:api    → build + copy into the sibling API's wwwroot
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const DEPLOY_DIR = path.join(DIST, 'deploy');

const DEFAULT_SITE_ROOT = 'D:\\inetpub\\bookinventory';
const API_WWWROOT = path.resolve(
  ROOT,
  '..',
  'book-inventory-api',
  'src',
  'BookInventory.Api',
  'wwwroot'
);

const APPS = [
  { name: 'public-site', baseHref: '/' },
  { name: 'admin', baseHref: '/admin/' },
  { name: 'member', baseHref: '/member/' },
];

// ── Helpers ──────────────────────────────────────────────────────────────

function log(msg) {
  console.log(`\n▸ ${msg}`);
}

function exec(cmd) {
  log(cmd);
  execSync(cmd, { cwd: ROOT, stdio: 'inherit', shell: true });
}

function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) {
    console.error(`  ✗ Source not found: ${src}`);
    process.exit(1);
  }
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function cleanDirSync(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });
}

// ── Parse args ───────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const deployToApi = args.includes('--api');
const shouldCopy = args.includes('--copy') || deployToApi;
const siteRoot = deployToApi ? API_WWWROOT : args.find((a) => !a.startsWith('--')) || DEFAULT_SITE_ROOT;

// ── Step 1: Clean previous deploy ────────────────────────────────────────

if (fs.existsSync(DEPLOY_DIR)) {
  log('Cleaning previous deploy...');
  fs.rmSync(DEPLOY_DIR, { recursive: true, force: true });
}

// ── Step 2: Build all apps with production config ────────────────────────

log('Building all apps with production configuration...');
for (const app of APPS) {
  const baseHrefArg = app.baseHref !== '/' ? ` --base-href=${app.baseHref}` : '';
  exec(`npx nx build ${app.name} --configuration=production${baseHrefArg}`);
}

// ── Step 3: Verify builds exist ─────────────────────────────────────────

for (const app of APPS) {
  const browserDir = path.join(DIST, 'apps', app.name, 'browser');
  if (!fs.existsSync(browserDir)) {
    console.error(`  ✗ dist/apps/${app.name}/browser/ not found. Build may have failed.`);
    process.exit(1);
  }
}

// ── Step 4: Merge into deploy folder ─────────────────────────────────────

log('Merging apps into deploy folder...');
fs.mkdirSync(DEPLOY_DIR, { recursive: true });

// Copy public-site (root) to deploy root
const publicSiteBrowser = path.join(DIST, 'apps', 'public-site', 'browser');
log('Copying public-site → deploy root...');
for (const entry of fs.readdirSync(publicSiteBrowser, { withFileTypes: true })) {
  const srcPath = path.join(publicSiteBrowser, entry.name);
  const destPath = path.join(DEPLOY_DIR, entry.name);
  if (entry.isDirectory()) {
    copyDirSync(srcPath, destPath);
  } else {
    fs.copyFileSync(srcPath, destPath);
  }
}

// Copy admin and member into subdirectories
for (const app of APPS.filter((a) => a.name !== 'public-site')) {
  const browserDir = path.join(DIST, 'apps', app.name, 'browser');
  const destDir = path.join(DEPLOY_DIR, app.name);
  log(`Copying ${app.name} → deploy/${app.name}/...`);
  copyDirSync(browserDir, destDir);
}

// ── Step 5: web.config handling ─────────────────────────────────────────
//
// Each Angular app ships its own web.config (apps/*/public/web.config) for
// standalone IIS hosting, which the asset pipeline copies straight into
// dist/apps/*/browser and therefore into this merged deploy folder.
//
// For the API target that's not just unused, it's actively harmful: those
// nested web.config files carry IIS URL-Rewrite rules that IIS's native
// Rewrite module (if installed) can apply ahead of the ASP.NET Core Module,
// short-circuiting requests for real static files (e.g. hashed .js chunks)
// straight to index.html — which is exactly what Program.cs's own
// UseStaticFiles/MapFallbackToFile already handles correctly. So strip them
// all out; for a plain IIS target, keep them and add our own root one.

function removeWebConfigsRecursive(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      removeWebConfigsRecursive(p);
    } else if (entry.name.toLowerCase() === 'web.config') {
      fs.unlinkSync(p);
    }
  }
}

if (deployToApi) {
  log('Stripping per-app web.config files (not used by the ASP.NET Core host)...');
  removeWebConfigsRecursive(DEPLOY_DIR);
} else {
  log('Copying root web.config...');
  fs.copyFileSync(path.join(ROOT, 'scripts', 'iis-web.config'), path.join(DEPLOY_DIR, 'web.config'));
}

// ── Done ────────────────────────────────────────────────────────────────

log('Build complete!');
console.log(`\n  Deploy folder: ${DEPLOY_DIR}`);
console.log('  Contents:');
for (const item of fs.readdirSync(DEPLOY_DIR)) {
  const stat = fs.statSync(path.join(DEPLOY_DIR, item));
  console.log(`    ${stat.isDirectory() ? '📁' : '📄'} ${item}`);
}

// ── Step 6: Optional copy to IIS site root ──────────────────────────────

if (shouldCopy) {
  log(`Copying to ${deployToApi ? 'API wwwroot' : 'IIS site root'}: ${siteRoot}`);
  fs.mkdirSync(siteRoot, { recursive: true });

  // Clean old app files (preserve system files)
  for (const entry of fs.readdirSync(siteRoot)) {
    const p = path.join(siteRoot, entry);
    try {
      if (fs.lstatSync(p).isDirectory()) {
        if (['admin', 'member', 'assets'].includes(entry)) {
          fs.rmSync(p, { recursive: true, force: true });
        }
      } else if (['.js', '.css', '.html', '.json', '.config', '.mjs'].some((ext) => entry.endsWith(ext))) {
        fs.unlinkSync(p);
      }
    } catch {
      // Skip locked / system files
    }
  }

  // Copy deploy folder contents to site root
  copyDirSync(DEPLOY_DIR, siteRoot);

  console.log(`\n✓ Deployed to ${siteRoot}`);
  console.log('  - Public site loads at /');
  console.log('  - Admin portal loads at /admin/');
  console.log('  - Member portal loads at /member/');
} else {
  console.log(`\n✓ To copy to IIS, run:`);
  console.log(`  node scripts/production-deploy.js --copy`);
  console.log(`  node scripts/production-deploy.js --copy "E:\\Sites\\bookinventory"`);
}
