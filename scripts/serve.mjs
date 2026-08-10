#!/usr/bin/env node
// The local server the gate runs against — Handbook §26. Node stdlib only.
//
//   node scripts/serve.mjs [--port 8080] [--root .]
//
// WHY THIS EXISTS INSTEAD OF `python3 -m http.server`
//
// Because the gate has to test what the HOST serves, not what a different server happens to serve.
// This site's canonical URLs are extensionless — `/fertilidad`, not `/fertilidad.html` — because the
// host resolves them that way and redirects the `.html` form away. A plain file server answers 404
// for every one of those, so the link check would fail on the whole site while the live site works,
// and the obvious way to make it green would be to write the wrong URLs into the markup.
//
// So this mirrors the host's routing rules, and only those:
//
//   /path        →  path.html, then path/index.html
//   /path.html   →  301 to /path          (the host's own canonicalisation)
//   /            →  index.html
//   anything else→  404.html with status 404
//
// It is a test fixture. It serves the working tree, it has no configuration, and nothing depends on
// it at runtime.

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, normalize } from "node:path";

const arg = (n, d) => {
  const i = process.argv.indexOf(n);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : d;
};
const ROOT = arg("--root", ".");
const PORT = Number(arg("--port", "8080"));

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

const isFile = async (path) => {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
};

const send = async (res, status, path) => {
  const body = await readFile(path);
  res.writeHead(status, {
    "Content-Type": TYPES[extname(path).toLowerCase()] || "application/octet-stream",
    "Content-Length": body.length,
  });
  res.end(body);
};

createServer(async (req, res) => {
  // `normalize` collapses any `..` before the path is joined, so a request cannot escape the root.
  const url = new URL(req.url, "http://localhost");
  const path = normalize(decodeURIComponent(url.pathname)).replace(/\\/g, "/").replace(/^(\.\.\/)+/, "");

  if (path.endsWith(".html")) {
    res.writeHead(301, { Location: path.replace(/(\/index)?\.html$/, "") || "/" });
    return res.end();
  }

  const candidates =
    path === "/"
      ? [join(ROOT, "index.html")]
      : [join(ROOT, path), join(ROOT, `${path}.html`), join(ROOT, path, "index.html")];

  for (const candidate of candidates) {
    if (await isFile(candidate)) return send(res, 200, candidate);
  }

  const notFound = join(ROOT, "404.html");
  if (await isFile(notFound)) return send(res, 404, notFound);
  res.writeHead(404).end("Not found");
}).listen(PORT, () => process.stdout.write(`serving ${ROOT} on http://127.0.0.1:${PORT}\n`));
