#!/usr/bin/env node
// What actually gets published — Handbook §26. Node stdlib only.
//
//   node scripts/stage-site.mjs [--out _site] [--root .]
//
// WHY THIS EXISTS, AND WHAT IT CHANGES
//
// §26's model is that the repository IS the web root: committing is publishing. That model assumes
// the repository holds nothing but the site. This one does not, and cannot — the section itself
// requires `brief.md`, `AGENTS.md` and the gate's own scripts to live here.
//
// While the repository was private that cost nothing. It is public now, so that it can be served by
// GitHub Pages at all, and the publish job uploads the working tree wholesale. That would put
// `doctoracuevillas.com/brief.md` on the open web: a document stating that the privacy policy is an
// unreviewed draft, that nobody confirmed the photographs are publishable, and that a credential
// claim has an open advertising-compliance question. On GitHub that is internal candour a colleague
// might find. Under the practitioner's own domain, indexed, it is something a patient finds when she
// searches her doctor's name.
//
// So the artifact is staged instead of uploaded raw. The repository is still the source of the web
// root; it is no longer identical to it.
//
// THE RULE IS BY KIND, NOT BY NAME
//
// A hand-written list of files has the wrong failure mode: add a page and it is silently not
// published, which looks exactly like a page that was published. These rules include anything that
// IS site content by its shape — root documents, page directories, everything under `assets` — and
// exclude everything else. A new door publishes itself; a new internal note never does.
//
// And because "silently not published" is still the expensive direction, `--verify` re-reads the
// sitemap afterwards and fails if any URL the site claims to have is missing from the artifact.

import { readdir, mkdir, copyFile, rm, stat } from "node:fs/promises";
import { join, dirname, extname } from "node:path";
import { read } from "./lib.mjs";

const arg = (n, d) => {
  const i = process.argv.indexOf(n);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : d;
};
const ROOT = arg("--root", ".");
const OUT = arg("--out", "_site");

// Directories that are never site content, whatever they hold.
const NEVER = new Set([".git", ".github", "node_modules", ".lighthouseci", "scripts", OUT]);

// Root files that ARE the site despite not being markup: the browser scripts, the stylesheet, the
// machine-readable artifacts, and the two files the host itself reads.
const ROOT_FILES = new Set([
  "CNAME",
  ".nojekyll",
  "styles.css",
  "config.js",
  "facts.js",
  "analytics.js",
  "site.js",
  "llms.txt",
  "robots.txt",
  "sitemap.xml",
]);

/** Every path, relative to the root, that belongs in the published artifact. */
const siteFiles = async () => {
  const keep = [];
  for (const entry of await readdir(ROOT, { withFileTypes: true })) {
    if (NEVER.has(entry.name)) continue;

    if (entry.isFile()) {
      if (entry.name.endsWith(".html") || ROOT_FILES.has(entry.name)) keep.push(entry.name);
      continue;
    }

    // Everything under `assets` is published — an unreferenced file in there is still a published
    // URL, which is exactly what check-assets' orphan rule is about.
    if (entry.name === "assets") {
      const walkAssets = async (dir) => {
        for (const e of await readdir(join(ROOT, dir), { withFileTypes: true })) {
          if (e.isDirectory()) await walkAssets(`${dir}/${e.name}`);
          else keep.push(`${dir}/${e.name}`);
        }
      };
      await walkAssets("assets");
      continue;
    }

    // A page directory is one holding an index.html. Nothing else in it is published: a page is a
    // document, not a folder somebody can drop files into.
    const inner = await readdir(join(ROOT, entry.name), { withFileTypes: true });
    if (inner.some((i) => i.isFile() && i.name === "index.html")) keep.push(`${entry.name}/index.html`);
  }
  return keep.sort();
};

const files = await siteFiles();

await rm(join(ROOT, OUT), { recursive: true, force: true });
for (const rel of files) {
  const target = join(ROOT, OUT, rel);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(join(ROOT, rel), target);
}

// ---------------------------------------------------------------- verify
//
// The dangerous direction is a page that quietly did not ship, so the sitemap — which is derived
// from what is on disk — is read back and every URL in it has to resolve inside the artifact.
let failures = 0;
const fail = (what, fix) => {
  failures++;
  process.stdout.write(`\nFAIL  ${what}\n      fix: ${fix}\n      rule: Handbook §26\n`);
};

const sitemap = await read(join(ROOT, OUT, "sitemap.xml"));
for (const m of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  const path = m[1].replace(/^https?:\/\/[^/]+/, "");
  const rel = path === "/" ? "index.html" : `${path.replace(/^\/|\/$/g, "")}/index.html`;
  try {
    await stat(join(ROOT, OUT, rel));
  } catch {
    fail(
      `${path} is in the sitemap but no file for it reached the artifact`,
      "the staging rules did not recognise this page as site content — a page is a directory holding index.html; check the shape before adding an exception",
    );
  }
}

// The mirror: nothing that documents the project should ever be served from the practice's domain.
for (const rel of files) {
  if ([".md", ".yml", ".yaml", ".json"].includes(extname(rel))) {
    fail(
      `${rel} reached the artifact, and project documentation is not site content`,
      "it would be served under the practitioner's own domain and indexed there; keep it out of the published set",
    );
  }
}

process.stdout.write(`\nstage-site: ${files.length} files staged into ${OUT}/ · ${failures} failures\n`);
if (failures) process.exitCode = 1;
