#!/usr/bin/env node
// The local server the gate runs against — Handbook §26. Node stdlib only.
//
//   node scripts/serve.mjs [--port 8080] [--root .]
//
// WHY THIS EXISTS INSTEAD OF `python3 -m http.server`
//
// Because the gate has to test what the HOST serves, not what a different server happens to serve.
// A plain file server does not redirect `/fertilidad` to `/fertilidad/`, does not answer a directory
// with its index, and returns its own 404 body instead of the site's — so the link check would pass
// or fail for reasons that have nothing to do with the published site.
//
// So this mirrors the host's routing rules, and only those. The host is GitHub Pages:
//
//   /             →  index.html
//   /path/        →  path/index.html      (a directory index — every static host serves this)
//   /path         →  301 to /path/        when `path` is a directory
//   /file.css     →  the file
//   anything else →  404.html with status 404
//
// Note what is NOT here: extensionless resolution of `/fertilidad` to `fertilidad.html`. Some hosts
// do it and some do not, so this site does not depend on it — every page is a directory index, and
// that is why the canonical URLs carry a trailing slash.
//
// It is a test fixture. It serves the working tree, it has no configuration, and nothing depends on
// it at runtime.

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { gzipSync } from "node:zlib";
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

const isDirectory = async (path) => {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
};

// Text responses are compressed, because the host compresses them. Without this the performance
// budget is measured against a payload no visitor ever receives — roughly 45 KB heavier here — and
// the gate goes red for something the live site does not do. Already-compressed formats (woff2,
// webp, jpeg, png) are sent as they are; gzipping them costs time and adds bytes.
const COMPRESSIBLE = new Set([".html", ".css", ".js", ".json", ".xml", ".txt", ".svg"]);

const send = async (res, status, path, req) => {
  let body = await readFile(path);
  const type = TYPES[extname(path).toLowerCase()] || "application/octet-stream";
  const headers = { "Content-Type": type };

  const accepts = String(req.headers["accept-encoding"] || "").includes("gzip");
  if (accepts && COMPRESSIBLE.has(extname(path).toLowerCase())) {
    body = gzipSync(body);
    headers["Content-Encoding"] = "gzip";
    headers.Vary = "Accept-Encoding";
  }
  headers["Content-Length"] = body.length;

  res.writeHead(status, headers);
  res.end(body);
};

createServer(async (req, res) => {
  // `normalize` collapses any `..` before the path is joined, so a request cannot escape the root.
  const url = new URL(req.url, "http://localhost");
  const path = normalize(decodeURIComponent(url.pathname)).replace(/\\/g, "/").replace(/^(\.\.\/)+/, "");

  if (path === "/") return send(res, 200, join(ROOT, "index.html"), req);

  // A directory asked for without its trailing slash is redirected to the canonical form, which is
  // what the host does — and what keeps one page from being reachable at two addresses.
  if (!path.endsWith("/") && (await isDirectory(join(ROOT, path)))) {
    res.writeHead(301, { Location: `${path}/` });
    return res.end();
  }

  const candidates = path.endsWith("/")
    ? [join(ROOT, path, "index.html")]
    : [join(ROOT, path)];

  for (const candidate of candidates) {
    if (await isFile(candidate)) return send(res, 200, candidate, req);
  }

  const notFound = join(ROOT, "404.html");
  if (await isFile(notFound)) return send(res, 404, notFound, req);
  res.writeHead(404).end("Not found");
}).listen(PORT, () => process.stdout.write(`serving ${ROOT} on http://127.0.0.1:${PORT}\n`));
