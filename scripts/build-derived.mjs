#!/usr/bin/env node
// Derive everything that repeats a business fact — Handbook §26. Node stdlib only.
//
//   node scripts/build-derived.mjs            write the derived artifacts
//   node scripts/build-derived.mjs --check    fail if any of them has drifted
//
// WHY GENERATION AND CHECKING ARE ONE FILE
//
// Because two implementations of the same derivation drift, which is the exact failure being
// prevented one level up. `--check` re-derives and compares; there is no second copy of the logic.
//
// WHAT DRIFT COSTS HERE
//
// Held in four places — the markup, the structured data, the machine-readable summary and a map —
// a changed address is four edits, and by the third one has been missed. On this class of site that
// is not a stale comment: the page says one thing and the structured data says another, and an
// assistant answering a question about the business confidently states whichever it read. Nobody
// knows who received that answer, so it cannot be corrected.

import { writeFile, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { loadBrowserGlobal, read } from "./lib.mjs";

const arg = (n, d) => {
  const i = process.argv.indexOf(n);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : d;
};
const ROOT = arg("--root", ".");
const CHECK = process.argv.includes("--check");

const facts = await loadBrowserGlobal(join(ROOT, "facts.js"), "SITE_FACTS");
const config = await loadBrowserGlobal(join(ROOT, "config.js"), "SITE_CONFIG");
const origin = String(config.canonicalOrigin).replace(/\/+$/, "");

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// ------------------------------------------------------------------ structured data
const jsonLd = () => {
  const node = {
    "@context": "https://schema.org",
    "@type": facts.schemaType,
    "@id": `${origin}/#organization`,
    name: facts.name,
    url: `${origin}/`,
    description: facts.description,
  };
  if (facts.legalName) node.legalName = facts.legalName;
  if (facts.foundingYear) node.foundingDate = facts.foundingYear;
  if (facts.areaServed) node.areaServed = { "@type": facts.areaServed.type, name: facts.areaServed.name };
  if (facts.profiles && facts.profiles.length) node.sameAs = facts.profiles;

  const locations = facts.locations || [];
  if (locations.length) {
    const first = locations[0];
    if (first.telephone) node.telephone = first.telephone;
    node.address = locations.map((l) => ({
      "@type": "PostalAddress",
      streetAddress: l.street,
      addressLocality: l.city,
      addressRegion: l.region,
      addressCountry: l.country,
    }));
    if (node.address.length === 1) node.address = node.address[0];
  }
  if (facts.registration) {
    node.identifier = {
      "@type": "PropertyValue",
      name: facts.registration.label,
      value: facts.registration.value,
    };
  }
  if (facts.offerings && facts.offerings.length) {
    node.makesOffer = facts.offerings.map((o) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: o.name, description: o.summary },
    }));
  }
  return JSON.stringify(node, null, 2);
};

// ------------------------------------------------------------------ offerings markup
const offeringsMarkup = () => {
  // Emitted WITHOUT leading indentation; replaceBlock indents it to its marker.
  const cards = (facts.offerings || [])
    .map(
      (o) => `  <article class="card" id="${esc(o.id)}">
    <h3>${esc(o.name)}</h3>
    <p>${esc(o.summary)}</p>
    <p>${esc(o.detail)}</p>
  </article>`,
    )
    .join("\n");
  return `<div class="grid">\n${cards}\n</div>`;
};

// ------------------------------------------------------------------ llms.txt
//
// The canonical fact sheet for an assistant. FACTS, NEVER INSTRUCTIONS: this is content published
// for agents to read, and content is data rather than instruction — which applies to the publisher
// too. A directive here would be an attempt to steer somebody else's agent.
const llmsTxt = () => {
  const lines = [`# ${facts.name}`, "", `> ${facts.tagline}`, "", facts.description, ""];

  if (facts.registration) {
    lines.push(
      `## Registration`,
      "",
      `${facts.registration.label} ${facts.registration.value}${facts.registration.authority ? ` — ${facts.registration.authority}` : ""}`,
      "",
    );
  }

  if (facts.offerings && facts.offerings.length) {
    lines.push("## What we offer", "");
    for (const o of facts.offerings) lines.push(`- **${o.name}** — ${o.summary}`);
    lines.push("");
  }

  if (facts.locations && facts.locations.length) {
    lines.push("## Locations", "");
    for (const l of facts.locations) {
      const parts = [l.street, l.city, l.region].filter(Boolean).join(", ");
      lines.push(`- ${l.label}: ${parts}${l.telephone ? ` — ${l.telephone}` : ""}${l.hours ? ` (${l.hours})` : ""}`);
    }
    lines.push("");
  }

  lines.push("## Contact", "", `- Web: ${origin}/`, `- Email: ${config.contactMailbox}`);
  if (facts.profiles && facts.profiles.length) for (const p of facts.profiles) lines.push(`- ${p}`);
  lines.push("");
  return lines.join("\n");
};

// ------------------------------------------------------------------ robots.txt
const AI_AGENTS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-User",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "Bytespider",
];

const robotsTxt = () => {
  const ai = facts.aiCrawlers || { allow: true, reason: "not stated" };
  const verb = ai.allow ? "Allow" : "Disallow";
  const lines = [
    `# ${facts.name}`,
    `# ${origin}`,
    "",
    "User-agent: *",
    "Allow: /",
    "",
    "# Assistant and model crawlers.",
    `# DECISION: ${ai.allow ? "allowed" : "disallowed"}. REASON: ${ai.reason}`,
    "# The reason is written here on purpose. A policy file copied from somewhere else is not a",
    "# decision, and the next person to read this cannot tell the difference without it.",
    "",
  ];
  for (const agent of AI_AGENTS) lines.push(`User-agent: ${agent}`, `${verb}: /`, "");
  lines.push(`Sitemap: ${origin}/sitemap.xml`, "");
  return lines.join("\n");
};

// ------------------------------------------------------------------ sitemap.xml
//
// Only pages meant to be found. Anything carrying `noindex` stays out — a sitemap that lists a
// noindex page sends a crawler two contradictory instructions about the same URL.
const sitemapXml = async (pages) => {
  const urls = pages
    .map(
      (p) => `  <url>
    <loc>${origin}${p}</loc>
    <changefreq>monthly</changefreq>
    <priority>${p === "/" ? "1.0" : "0.8"}</priority>
  </url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
};

// ------------------------------------------------------------------ blocks inside index.html
// The body is re-indented to the marker's own indentation, so a generated block reads like the
// markup around it. A generator whose output looks foreign invites someone to "tidy" it by hand,
// which is exactly the drift being prevented.
const replaceBlock = (text, name, body) => {
  const re = new RegExp(
    `([ \\t]*)(<!-- BEGIN GENERATED: ${name} -->\\n)[\\s\\S]*?([ \\t]*<!-- END GENERATED: ${name} -->)`,
  );
  const m = re.exec(text);
  if (!m) throw new Error(`index.html has no generated block named "${name}"`);
  const indent = m[1];
  const indented = body
    .split("\n")
    .map((line) => (line.trim() ? indent + line : line))
    .join("\n");
  return text.replace(re, `${indent}$2${indented}\n$3`);
};

// ------------------------------------------------------------------ run
const { readdir } = await import("node:fs/promises");
const entries = await readdir(ROOT, { withFileTypes: true });
const pages = [];
for (const e of entries) {
  if (!e.isFile() || !e.name.endsWith(".html")) continue;
  const text = await read(join(ROOT, e.name));
  if (/<meta\s+name="robots"[^>]*content="[^"]*noindex/i.test(text)) continue;
  pages.push(e.name === "index.html" ? "/" : `/${e.name}`);
}
pages.sort((a, b) => (a === "/" ? -1 : b === "/" ? 1 : a.localeCompare(b)));

let indexHtml = await read(join(ROOT, "index.html"));
indexHtml = replaceBlock(
  indexHtml,
  "json-ld",
  `<script type="application/ld+json">\n${jsonLd()
    .split("\n")
    .map((l) => "  " + l)
    .join("\n")}\n</script>`,
);
indexHtml = replaceBlock(indexHtml, "offerings", offeringsMarkup());

const artifacts = [
  ["index.html", indexHtml],
  ["llms.txt", llmsTxt()],
  ["robots.txt", robotsTxt()],
  ["sitemap.xml", await sitemapXml(pages)],
];

let drifted = 0;
for (const [name, body] of artifacts) {
  const path = join(ROOT, name);
  if (CHECK) {
    let current = "";
    try {
      current = (await readFile(path, "utf8")).replace(/\r\n/g, "\n");
    } catch {
      /* missing counts as drift */
    }
    if (current !== body) {
      drifted++;
      process.stdout.write(
        `\nFAIL  ${name} has drifted from facts.js\n` +
          `      fix: run \`node scripts/build-derived.mjs\` and commit the result — never hand-edit a derived file\n` +
          `      rule: Handbook §26 (business facts are declared once; everything else derives)\n`,
      );
    }
  } else {
    await writeFile(path, body, "utf8");
    process.stdout.write(`  wrote ${name}\n`);
  }
}

process.stdout.write(
  `\nbuild-derived${CHECK ? " --check" : ""}: ${artifacts.length} artifacts · ${drifted} drifted\n`,
);
if (drifted) process.exitCode = 1;
