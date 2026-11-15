// Serves all 3 built Angular apps from a single HTTP server/port.
// Path routing:
//   /admin/*   -> dist/apps/admin/browser      (SPA fallback to /admin/index.html)
//   /<company slug>/* -> dist/apps/member/browser (SPA fallback to its index.html; platform spec U12). /member/* still
//                        reaches the same app (the old address; the app moves the user to the company's own address).
//                        The member index is served with <base href="/<slug>/"> written into the markup: the browser
//                        reads the page's preload hints before base-href.js can add a base.
//   /*         -> dist/apps/public-site/browser (SPA fallback to /index.html)
//
// Run `npx nx run-many -t build` first, then `node scripts/serve-single.mjs`.

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { request as httpsRequest } from 'node:https';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const root = join(__dirname, '..');
const PORT = process.env.PORT ? Number(process.env.PORT) : 4200;
// The apps call the API on their own origin (`/api/v1`, so the SameSite=Strict refresh cookie is sent), so `/api` is
// forwarded to the API like the `nx serve` proxy does (proxy.conf.json). Override with API_TARGET_PORT.
const API_HOST = 'localhost';
const API_PORT = process.env.API_TARGET_PORT ? Number(process.env.API_TARGET_PORT) : 7100;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

const memberDir = join(root, 'dist/apps/member/browser');
const adminApp = { mount: '/admin', dir: join(root, 'dist/apps/admin/browser') };
const publicApp = { mount: '', dir: join(root, 'dist/apps/public-site/browser') };

// The first address segments that belong to the application itself (company spec R15); any other is a company slug.
const OWN_SEGMENTS = new Set(['', 'admin', 'login', 'auth', 'error', 'welcome', 'api', 'assets', 'unauthorized']);

async function fileExists(path) {
  try {
    const s = await stat(path);
    return s.isFile();
  } catch {
    return false;
  }
}

async function resolveApp(pathname) {
  const first = pathname.split('/')[1] ?? '';
  if (first === 'admin') return adminApp;
  if (OWN_SEGMENTS.has(first) || first.includes('.')) return publicApp;
  // /member or /<company slug>: the member app, mounted at that first segment.
  return { mount: `/${first}`, dir: memberDir };
}

function proxyToApi(req, res) {
  const upstream = httpsRequest(
    { host: API_HOST, port: API_PORT, path: req.url, method: req.method, rejectUnauthorized: false, headers: { ...req.headers, host: `${API_HOST}:${API_PORT}` } },
    (apiRes) => {
      res.writeHead(apiRes.statusCode ?? 502, apiRes.headers);
      apiRes.pipe(res);
    },
  );
  upstream.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end(`API not reachable on https://${API_HOST}:${API_PORT}: ${err.message}`);
  });
  req.pipe(upstream);
}

const server = createServer(async (req, res) => {
  try {
    if (req.url.startsWith('/api/')) return proxyToApi(req, res);
    const url = new URL(req.url, `http://${req.headers.host}`);
    const app = await resolveApp(url.pathname);

    let relativePath = url.pathname;
    if (app.mount) {
      relativePath = relativePath.slice(app.mount.length) || '/';
    }

    const safePath = normalize(relativePath).replace(/^(\.\.[/\\])+/, '');
    let filePath = join(app.dir, safePath);

    if (!(await fileExists(filePath))) {
      // SPA fallback: any non-file request within this app's mount serves its index.html
      filePath = join(app.dir, 'index.html');
    }

    const data = await readFile(filePath);
    let content = data;
    const ext = extname(filePath);
    let contentType = MIME_TYPES[ext] ?? 'application/octet-stream';

    if (ext === '.html' && app.mount) {
      // The base address of a mounted app is its mount point (for the company app the first segment is the company's
      // slug, platform spec U12). It has to be in the markup, not only written by base-href.js: the browser resolves the
      // relative modulepreload hints of index.html before that script runs.
      const html = data.toString('utf-8');
      const base = `<base href="${app.mount}/">`;
      content = Buffer.from(
        /<base\b/i.test(html)
          ? html.replace(/<base href="[^"]*"\/?>/i, base)
          : html.replace(/<head([^>]*)>/i, `<head$1>${base}`),
      );
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(`Server error: ${err.message}`);
  }
});

server.listen(PORT, () => {
  console.log(`\nAll 3 apps served on one port: http://localhost:${PORT}`);
  console.log(`  Public site -> http://localhost:${PORT}/`);
  console.log(`  Admin       -> http://localhost:${PORT}/admin`);
  console.log(`  Company app -> http://localhost:${PORT}/<company slug>/  (for example /abc-book-center/)
`);
});
