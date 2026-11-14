// Serves all 3 built Angular apps from a single HTTP server/port.
// Path routing:
//   /admin/*   -> dist/apps/admin/browser      (SPA fallback to /admin/index.html)
//   /member/*  -> dist/apps/member/browser     (SPA fallback to /member/index.html)
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

const apps = [
  { mount: '/admin', dir: join(root, 'dist/apps/admin/browser') },
  { mount: '/member', dir: join(root, 'dist/apps/member/browser') },
  { mount: '', dir: join(root, 'dist/apps/public-site/browser') }, // fallback / default app
];

async function fileExists(path) {
  try {
    const s = await stat(path);
    return s.isFile();
  } catch {
    return false;
  }
}

async function resolveApp(pathname) {
  for (const app of apps) {
    if (app.mount && (pathname === app.mount || pathname.startsWith(app.mount + '/'))) {
      return app;
    }
  }
  return apps[apps.length - 1];
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
      content = Buffer.from(
        data.toString('utf-8').replace(/<base href="[^"]*"\/?>/, `<base href="${app.mount}/">`)
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
  console.log(`  Member      -> http://localhost:${PORT}/member\n`);
});
