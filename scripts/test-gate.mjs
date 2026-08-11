#!/usr/bin/env node
// The gate's own test — Handbook §20. Node stdlib only.
//
//   node scripts/test-gate.mjs
//
// A check that has never failed on purpose is not known to work, and a check that fires on correct
// input is worse than no check, because it teaches people to route around the gate. So this tests
// BOTH directions:
//
//   1. The site as committed passes every check. (Catches a check that fires on correct input.)
//   2. One deliberate defect at a time makes exactly the right check fail. (Catches a check that
//      cannot see the thing it exists to see.)
//
// WHAT CHANGED FROM THE TEMPLATE, AND WHY
//
// The template's baseline began by replacing its own placeholders, because a template is unfilled by
// design. This site is filled in, so the baseline is the repository as committed — and every fixture
// now anchors on real markup rather than on the template's. Two fixtures had to be rewritten rather
// than re-anchored: this site presents NO FORM and declares NO RECEIVER, which is a legitimate
// answer under §26, so "a form whose receiver was removed" is no longer a defect that can be
// expressed. What replaces it is the defect that actually threatens this site: a form appearing on a
// page with nothing behind it.

import { cp, mkdtemp, rm, readFile, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
const TEMPLATE = resolve(HERE, "..");

const CHECKS = ["check-config.mjs", "check-markup.mjs", "check-assets.mjs", "stage-site.mjs"];

const edit = async (dir, file, from, to) => {
  const path = join(dir, file);
  const text = await readFile(path, "utf8");
  if (!text.includes(from)) throw new Error(`fixture setup: "${from}" not found in ${file}`);
  await writeFile(path, text.replace(from, to), "utf8");
};

/** Append to a file — the shape of a defect that ADDS a rule rather than changing one. */
const append = async (dir, file, text) => {
  const path = join(dir, file);
  await writeFile(path, (await readFile(path, "utf8")) + text, "utf8");
};

/** A copy of the site as committed: the baseline every fixture starts from. */
const makeSite = async () => {
  const dir = await mkdtemp(join(tmpdir(), "landing-gate-"));
  await cp(TEMPLATE, dir, {
    recursive: true,
    // Version control and tool output are not part of the site. Excluding them also makes this
    // twenty times cheaper, which is the difference between a check people run and one they skip.
    filter: (src) => !/[\\/](\.git|node_modules|\.lighthouseci)([\\/]|$)/.test(src),
  });

  // A no-op when the derived files are committed in step, and a real regeneration when they are
  // not — so every fixture starts from a coherent site rather than from a drifted one.
  await run(process.execPath, [join(HERE, "build-derived.mjs"), "--root", dir], { cwd: dir });
  return dir;
};

// ---------------------------------------------------------------- the fixtures
//
// Each is a single realistic defect, taken from what actually happens on this class of site.
const FIXTURES = [
  {
    name: "a messaging number written as a literal in the markup",
    check: "check-config.mjs",
    apply: (dir) =>
      edit(dir, "index.html", 'data-messaging="home"', 'href="https://wa.me/5491159612588"'),
  },
  {
    name: "the asset version bumped in config but not in the markup",
    check: "check-config.mjs",
    apply: (dir) => edit(dir, "config.js", "assetVersion: 4", "assetVersion: 5"),
  },
  {
    // The defect this site is actually exposed to. It presents no form and declares no receiver,
    // which §26 allows — right up until somebody adds a form and the copy starts claiming that
    // something was sent.
    name: "a form added to a page with no receiver behind it",
    check: "check-config.mjs",
    apply: (dir) =>
      edit(
        dir,
        "contacto/index.html",
        "<h2>Canales</h2>",
        '<h2>Canales</h2>\n<form><label for="x">Nombre</label><input id="x" name="x" /></form>',
      ),
  },
  {
    name: "a receiver that is not origin-restricted",
    check: "check-config.mjs",
    apply: (dir) => edit(dir, "config.js", "endpoint: null,", 'endpoint: "https://forms.example-provider.test/f/1",'),
  },
  {
    name: "an unanswered placeholder left in the configuration module",
    check: "check-config.mjs",
    apply: (dir) => edit(dir, "config.js", 'decidedBy: "María Guadalupe Cuevillas"', 'decidedBy: "TBD"'),
  },
  {
    name: "a second h1",
    check: "check-markup.mjs",
    apply: (dir) => edit(dir, "index.html", "<h2>Quién te atiende</h2>", "<h1>Quién te atiende</h1>"),
  },
  {
    name: "a heading level skipped",
    check: "check-markup.mjs",
    apply: (dir) => edit(dir, "index.html", "<h2>¿Con qué venís?</h2>", "<h4>¿Con qué venís?</h4>"),
  },
  {
    name: "a relative social image",
    check: "check-markup.mjs",
    apply: (dir) =>
      edit(
        dir,
        "index.html",
        'og:image" content="https://doctoracuevillas.com/assets/social.jpg"',
        'og:image" content="assets/social.jpg"',
      ),
  },
  {
    name: "a full-height section measured in vh",
    check: "check-markup.mjs",
    apply: (dir) => edit(dir, "styles.css", "min-height: 64dvh", "min-height: 64vh"),
  },
  {
    name: "the bottom-fixed conversion bar losing its safe area",
    check: "check-markup.mjs",
    apply: (dir) =>
      edit(
        dir,
        "styles.css",
        "padding: 12px var(--gutter) calc(12px + env(safe-area-inset-bottom, 0px));",
        "padding: 12px var(--gutter);",
      ),
  },
  {
    // Shipped to production: the consent banner reported `hidden === true` and stayed visible,
    // because `.consent` sets `display: grid` and that beats the browser's own `[hidden]` rule.
    name: "the hidden attribute left unable to win against the stylesheet",
    check: "check-markup.mjs",
    apply: (dir) => edit(dir, "styles.css", "[hidden] {\n  display: none !important;\n}", ""),
  },
  {
    // This site has no form, so there is no form-control rule to break — the defect is a rule being
    // ADDED below the threshold, which is exactly how it would arrive the day a form is introduced.
    name: "form controls below the size that triggers zoom on iOS",
    check: "check-markup.mjs",
    apply: (dir) => append(dir, "styles.css", "\n.field input {\n  font-size: 15px;\n}\n"),
  },
  {
    name: "an image with no alt text",
    check: "check-markup.mjs",
    apply: (dir) =>
      edit(
        dir,
        "index.html",
        "<h2>Quién te atiende</h2>",
        '<h2>Quién te atiende</h2>\n<img src="/assets/social.jpg" width="100" height="100">',
      ),
  },
  {
    name: "a conversion control pointing at the page it sits on",
    check: "check-markup.mjs",
    apply: (dir) =>
      edit(dir, "index.html", '<a class="btn" href="#puertas"', '<a class="btn" href="https://doctoracuevillas.com/"'),
  },
  {
    name: "the skip link removed",
    check: "check-markup.mjs",
    apply: (dir) => edit(dir, "index.html", '<a class="skip-link" href="#main">Saltar al contenido</a>', ""),
  },
  {
    name: "a third-party typeface fetched on first render",
    check: "check-assets.mjs",
    apply: (dir) =>
      edit(
        dir,
        "index.html",
        '<link rel="stylesheet" href="/styles.css?v=4" />',
        '<link rel="stylesheet" href="https://fonts.example-cdn.test/css?family=X" />\n    <link rel="stylesheet" href="/styles.css?v=1" />',
      ),
  },
  {
    // The subscription form is loaded on click, never with the page. This is the check that keeps it
    // that way — put the frame in the markup and it reaches the provider before the visitor has
    // chosen anything, which is the failure the consent decision exists to prevent.
    name: "the subscription frame embedded at first render instead of on request",
    check: "check-assets.mjs",
    apply: (dir) =>
      edit(
        dir,
        "fertilidad/index.html",
        '<div class="subscribe__frame" id="suscripcion-fertilidad" hidden>',
        '<div class="subscribe__frame" id="suscripcion-fertilidad" hidden><iframe src="https://v3.envialosimple.com/form/x" title="x"></iframe>',
      ),
  },
  {
    name: "an image over the per-image budget",
    check: "check-assets.mjs",
    apply: async (dir) => {
      await writeFile(join(dir, "assets", "hero.jpg"), Buffer.alloc(400 * 1024, 1));
      await edit(
        dir,
        "index.html",
        "<h2>Quién te atiende</h2>",
        '<h2>Quién te atiende</h2>\n<img src="/assets/hero.jpg" alt="x" width="10" height="10">',
      );
    },
  },
  {
    name: "a committed asset referenced from nowhere",
    check: "check-assets.mjs",
    apply: (dir) => writeFile(join(dir, "assets", "orphan.png"), Buffer.alloc(64, 1)),
  },
  {
    // The mirror, and the one that costs more: a 404 on the live site that raises nothing. Found
    // by running the gate against a served copy rather than by reading the check.
    name: "an asset referenced but not committed",
    check: "check-assets.mjs",
    apply: (dir) => rm(join(dir, "assets", "guada-retrato.webp"), { force: true }),
  },
  {
    // A typeface is referenced ONLY from the stylesheet, which the reference scan did not read
    // until this site self-hosted one. Without this fixture that blind spot returns silently: every
    // font reads as an orphan, and a missing one raises nothing at all.
    name: "a self-hosted typeface referenced from CSS but not committed",
    check: "check-assets.mjs",
    apply: (dir) => rm(join(dir, "assets", "fonts", "figtree.woff2"), { force: true }),
  },
  {
    // Everything under `assets` publishes wholesale, so a document dropped in there would be served
    // from the practitioner's own domain and indexed under her name.
    name: "project documentation dropped into a published directory",
    check: "stage-site.mjs",
    apply: (dir) => writeFile(join(dir, "assets", "notas-internas.md"), "# pendientes\n"),
  },
  {
    // The expensive direction: a page that quietly did not ship looks exactly like one that did.
    name: "a page the staging rules no longer recognise",
    check: "stage-site.mjs",
    apply: async (dir) => {
      await writeFile(join(dir, "climaterio", "pagina.html"), await readFile(join(dir, "climaterio", "index.html"), "utf8"));
      await rm(join(dir, "climaterio", "index.html"), { force: true });
    },
  },
  {
    name: "a derived file hand-edited away from facts.js",
    check: "build-derived.mjs",
    args: ["--check"],
    apply: (dir) => edit(dir, "llms.txt", "# Dra. María Guadalupe Cuevillas", "# Otra Persona"),
  },
  {
    // A hand-edited verification token is a property that never verifies, and the failure is silent:
    // Search Console simply says it could not confirm ownership, weeks after somebody "tidied" it.
    name: "the Search Console block hand-edited away from config.js",
    check: "build-derived.mjs",
    args: ["--check"],
    apply: (dir) =>
      edit(dir, "index.html", "<!-- No Search Console token set.", "<!-- token va aca."),
  },
  {
    // The blocks generated into every page, not only into the home page. The registration number and
    // both consulting rooms live in that footer, and a hand-edit there is a published contradiction
    // about where a doctor sees patients.
    name: "a generated footer hand-edited on one page only",
    check: "build-derived.mjs",
    args: ["--check"],
    apply: (dir) => edit(dir, "contacto/index.html", "M.N. 149275", "M.N. 000000"),
  },
];

// ---------------------------------------------------------------- run
let failures = 0;
const say = (s) => process.stdout.write(s + "\n");

say("");
say("direction 1 — the site as committed passes every check");

const baseline = await makeSite();
for (const check of [...CHECKS, "build-derived.mjs"]) {
  const args = check === "build-derived.mjs" ? ["--check"] : [];
  let result;
  try {
    await run(process.execPath, [join(HERE, check), "--root", baseline, ...args], { cwd: baseline });
    result = 0;
  } catch (error) {
    const out = String(error.stdout || "") + String(error.stderr || "");
    result = 1;
    say(`  FAIL  ${check} fires on a correct site — a check that fails on valid input teaches people to route around the gate`);
    say(out.split("\n").filter((l) => l.startsWith("FAIL") || l.startsWith("      ")).slice(0, 6).map((l) => "        " + l).join("\n"));
  }
  if (result === 0) say(`  ok    ${check}`);
  failures += result;
}
await rm(baseline, { recursive: true, force: true });

say("");
say("direction 2 — each deliberate defect is caught by the check that owns it");

for (const fixture of FIXTURES) {
  const dir = await makeSite();
  await fixture.apply(dir);

  const check = fixture.check;
  const args = fixture.args || [];
  let caught = false;
  try {
    await run(process.execPath, [join(HERE, check), "--root", dir, ...args], { cwd: dir });
  } catch {
    caught = true;
  }

  if (caught) say(`  ok    ${check.padEnd(20)} caught: ${fixture.name}`);
  else {
    say(`  FAIL  ${check.padEnd(20)} MISSED: ${fixture.name}`);
    failures++;
  }
  await rm(dir, { recursive: true, force: true });
}

say("");
say(`test-gate: ${FIXTURES.length} fixtures + ${CHECKS.length + 1} clean-run assertions · ${failures} failures`);
if (failures) process.exitCode = 1;
