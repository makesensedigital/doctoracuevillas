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

  if (facts.medicalSpecialty && facts.medicalSpecialty.length) {
    node.medicalSpecialty = facts.medicalSpecialty;
  }

  const locations = facts.locations || [];
  if (locations.length) {
    const first = locations[0];
    // The practice publishes exactly one number and it is the messaging line, which lives in the
    // configuration module like every other external identifier. Deriving it from there rather than
    // copying it into facts.js is the whole point of the rule: one number, one place.
    node.telephone = first.telephone || `+${config.messagingNumber}`;
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
    node.makesOffer = facts.offerings.map((o) => {
      const service = { "@type": "Service", name: o.name, description: o.summary };
      if (o.url) service.url = `${origin}${o.url}`;
      return { "@type": "Offer", itemOffered: service };
    });
  }
  return JSON.stringify(node, null, 2);
};

// ------------------------------------------------------------------ offerings markup
//
// An offering that has its own URL gets its own link, generated here rather than written by hand
// beside the generated block. A door whose card and whose page disagree about its name is the same
// published contradiction one level down.
const offeringsMarkup = () => {
  // Emitted WITHOUT leading indentation; replaceBlock indents it to its marker.
  const cards = (facts.offerings || [])
    .map(
      (o) => `  <article class="card card--door" id="${esc(o.id)}">
    <h3>${esc(o.name)}</h3>
    <p class="card__lead">${esc(o.summary)}</p>
    <p>${esc(o.detail)}</p>
    <a class="card__go" href="${esc(o.url)}" data-analytics-event="puerta" data-analytics-label="${esc(o.id)}"
      >Entrar a ${esc(o.name.toLowerCase())}<span aria-hidden="true"> →</span></a
    >
  </article>`,
    )
    .join("\n");
  return `<div class="grid grid--doors">\n${cards}\n</div>`;
};

// ------------------------------------------------------------------ navigation and footer
//
// WHY THESE ARE GENERATED TOO
//
// The footer of every page carries the registration number, both consulting rooms and the medical
// disclaimer. Nine hand-written copies of an address is the failure this whole file exists to
// prevent, one level down: by the third change one has been missed, and a published contradiction
// about where a doctor sees patients is not a stale comment.
//
// The navigation is site structure rather than a business fact, so its editorial entries are
// declared here — but the three doors come from facts.js, because their names are.
const EDITORIAL = [
  { href: "/sobre-mi/", label: "Sobre mí" },
  { href: "/como-es-la-consulta/", label: "La consulta" },
  { href: "/contacto/", label: "Contacto" },
];

const navEntries = () => [
  ...(facts.offerings || []).map((o) => ({ href: o.url, label: o.navLabel || o.name })),
  ...EDITORIAL,
];

const navMarkup = (path) => {
  const items = navEntries()
    .map(
      (e) =>
        `  <li><a href="${esc(e.href)}"${e.href === path ? ' aria-current="page"' : ""}>${esc(e.label)}</a></li>`,
    )
    .join("\n");
  return `<ul id="nav-menu" class="nav__menu">\n${items}\n</ul>`;
};

const footerMarkup = () => {
  const doors = (facts.offerings || [])
    .map((o) => `      <li><a href="${esc(o.url)}">${esc(o.name)}</a></li>`)
    .join("\n");
  const rooms = (facts.locations || [])
    .map((l) => `      <li>${esc(l.label)} — ${esc([l.street, l.city].filter(Boolean).join(", "))}</li>`)
    .join("\n");
  const reg = facts.registration
    ? ` · ${esc(facts.registration.label)} ${esc(facts.registration.value)}`
    : "";

  return `<div class="footer__grid">
  <div>
    <h2>Consultas</h2>
    <ul>
${doors}
      <li><a href="/como-es-la-consulta/">Cómo es la consulta</a></li>
    </ul>
  </div>
  <div>
    <h2>Consultorios</h2>
    <ul>
${rooms}
      <li>Videoconsulta a todo el país y el exterior</li>
    </ul>
  </div>
  <div>
    <h2>Contacto</h2>
    <ul>
      <li><a data-messaging="contacto" data-analytics-event="messaging" data-analytics-label="footer">WhatsApp</a></li>
      <li><a data-mailbox href="/contacto/" data-analytics-event="mail" data-analytics-label="footer">Escribirme por mail</a></li>
      <li><a data-profile="instagram" href="/contacto/">Instagram @dracuevillas</a></li>
      <li><a href="/contacto/">Ubicaciones y mapas</a></li>
    </ul>
  </div>
</div>

<div class="footer__legal">
  <p><strong>${esc(facts.name)}</strong> — Médica endocrinóloga${reg}</p>
  <p>
    El contenido de este sitio es informativo y no reemplaza la consulta médica.
    <a href="/privacidad/">Política de privacidad y aviso legal</a>.
  </p>
</div>`;
};

// ------------------------------------------------------------------ llms.txt
//
// The canonical fact sheet for an assistant. FACTS, NEVER INSTRUCTIONS: this is content published
// for agents to read, and content is data rather than instruction — which applies to the publisher
// too. A directive here would be an attempt to steer somebody else's agent.
// The headings are in the site's declared language, not in English: this file is published copy that
// a reader or an assistant quotes, and §13 puts user-facing copy in the visitor's language.
const llmsTxt = () => {
  const lines = [`# ${facts.name}`, "", `> ${facts.tagline}`, "", facts.description, ""];

  if (facts.registration) {
    lines.push(
      `## Matrícula`,
      "",
      `${facts.registration.label} ${facts.registration.value}${facts.registration.authority ? ` — ${facts.registration.authority}` : ""}`,
      "",
    );
  }

  if (facts.offerings && facts.offerings.length) {
    lines.push("## Motivos de consulta", "");
    for (const o of facts.offerings) {
      lines.push(`- **${o.name}** — ${o.summary}${o.url ? ` ${origin}${o.url}` : ""}`);
    }
    lines.push("");
  }

  if (facts.locations && facts.locations.length) {
    lines.push("## Consultorios", "");
    for (const l of facts.locations) {
      const parts = [l.street, l.city, l.region].filter(Boolean).join(", ");
      lines.push(`- ${l.label}: ${parts}${l.telephone ? ` — ${l.telephone}` : ""}${l.hours ? ` (${l.hours})` : ""}`);
    }
    lines.push("");
  }

  lines.push("## Contacto", "", `- Web: ${origin}/`, `- Email: ${config.contactMailbox}`);
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
const blockRe = (name) =>
  new RegExp(
    `([ \\t]*)(<!-- BEGIN GENERATED: ${name} -->\\n)[\\s\\S]*?([ \\t]*<!-- END GENERATED: ${name} -->)`,
  );

const hasBlock = (text, name) => blockRe(name).test(text);

const replaceBlock = (text, name, body) => {
  const re = blockRe(name);
  const m = re.exec(text);
  if (!m) throw new Error(`no generated block named "${name}"`);
  const indent = m[1];
  const indented = body
    .split("\n")
    .map((line) => (line.trim() ? indent + line : line))
    .join("\n");
  return text.replace(re, `${indent}$2${indented}\n$3`);
};

// ------------------------------------------------------------------ run
//
// Every page except the home page and the 404 lives in its own directory as `index.html`, so its URL
// is `/fertilidad/` and no host has to guess. That is not a cosmetic choice: an extensionless URL
// like `/fertilidad` only works where the server maps it to `fertilidad.html`, which some hosts do
// and others do not, and the canonical URL of every page on this site would have been resting on
// that. A directory index is served by every static host there is.
const { readdir } = await import("node:fs/promises");

const documentsOnDisk = async () => {
  const found = [];
  for (const e of await readdir(ROOT, { withFileTypes: true })) {
    if (e.isFile() && e.name.endsWith(".html")) {
      found.push({ file: e.name, route: e.name === "index.html" ? "/" : `/${e.name}` });
      continue;
    }
    if (!e.isDirectory() || e.name.startsWith(".") || ["assets", "scripts", "_site"].includes(e.name)) continue;
    const inner = await readdir(join(ROOT, e.name), { withFileTypes: true });
    if (inner.some((i) => i.isFile() && i.name === "index.html")) {
      found.push({ file: `${e.name}/index.html`, route: `/${e.name}/` });
    }
  }
  return found.sort((a, b) => (a.route === "/" ? -1 : b.route === "/" ? 1 : a.route.localeCompare(b.route)));
};

const found = await documentsOnDisk();

// Only pages meant to be found. Anything carrying `noindex` stays out of the sitemap — a sitemap
// that lists a noindex page sends a crawler two contradictory instructions about the same URL.
const pages = [];
const documents = [];
for (const { file, route } of found) {
  let text = await read(join(ROOT, file));
  if (!/<meta\s+name="robots"[^>]*content="[^"]*noindex/i.test(text)) pages.push(route);

  if (hasBlock(text, "json-ld")) {
    text = replaceBlock(
      text,
      "json-ld",
      `<script type="application/ld+json">\n${jsonLd()
        .split("\n")
        .map((l) => "  " + l)
        .join("\n")}\n</script>`,
    );
  }
  if (hasBlock(text, "offerings")) text = replaceBlock(text, "offerings", offeringsMarkup());
  if (hasBlock(text, "nav")) text = replaceBlock(text, "nav", navMarkup(route));
  if (hasBlock(text, "footer")) text = replaceBlock(text, "footer", footerMarkup());

  documents.push([file, text]);
}

const artifacts = [
  ...documents,
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
