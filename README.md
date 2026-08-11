# Static conversion site — starting template

The carrier for Handbook **§26**. Copy this directory, fill it in, and the gate refuses to publish
until the rules of that section hold.

**The template as shipped deliberately fails its own gate.** Every placeholder is a failure, which
is the point: an unfilled scaffold cannot reach production by being forgotten about. `check-config`
tells you exactly what is still missing.

## Why a template rather than a checklist

§26's own argument, applied to itself. Three sites read while writing that section were each strong
in precisely the dimension the others lacked, and none of it travelled — not because the team did
not know, but because a practice living in one repository reaches exactly the project it is in.
Prose is not a carrier. A directory you start from and a job that refuses to publish are.

So: **do not read this and reimplement it. Copy it.**

## Getting started

```bash
cp -r templates/landing my-site && cd my-site && git init

# Read AGENTS.md first — it is the rules, condensed, and an agent working here loads it

# What is still unfilled, and why each one matters
node scripts/check-config.mjs

# After editing facts.js — regenerate the structured data, llms.txt, robots.txt and the sitemap
node scripts/build-derived.mjs

# The whole gate locally
node scripts/test-gate.mjs && node scripts/check-config.mjs \
  && node scripts/build-derived.mjs --check \
  && node scripts/check-markup.mjs && node scripts/check-assets.mjs

# Serve it
python3 -m http.server 8080
```

## What is where

| File | What it owns |
|---|---|
| `AGENTS.md` | **The rules in force here** — Handbook §26 condensed, generated and drift-checked upstream. Read it before the task. It carries the musts; every other file explains its own mechanism in place. |
| `config.js` | **Every external identifier**, and nothing else may hold one. Also the consent decision and the conversion receiver. |
| `facts.js` | **Every business fact**, declared once. The markup, the structured data and `llms.txt` derive from it. |
| `analytics.js` | Consent default before the container; `trackEvent` for outcomes, `trackIntent` for departures. |
| `site.js` | Builds every external destination from `config.js`, so the markup carries a key and never a URL. |
| `*.html` | The nine pages. Blocks marked `BEGIN GENERATED` — the structured data, the door cards, and the nav and footer of every page — are written by `build-derived.mjs`. Never hand-edit them. |
| `scripts/serve.mjs` | The local server the gate runs against. Mirrors the host: directory indexes, the trailing-slash redirect, the site's own 404 body, and gzip on text — without that last one the performance budget is measured against a payload no visitor receives. A test fixture; nothing depends on it at runtime. |
| `assets/fonts/` | Fraunces and Figtree, self-hosted, variable axes pinned at the values used: 92 KB for three faces instead of 264 KB. Preloaded in every page — they are what the first screen is set in. |
| `CNAME` | The custom domain, travelling with the published artifact. Without it the domain unbinds silently. |
| `_headers` | The controls a static site has nowhere else to put. **Live on this host** — verify after the first deploy. |
| `_redirects` | `www` to the apex. The predecessor lives on a domain we do not control, so its redirect cannot be served from here — see `brief.md`. |
| `.gitignore` | Access control for anything site-shaped: markup, styles, scripts and **everything under `assets`** is published the moment it is committed. |
| `scripts/stage-site.mjs` | What actually gets published. The repository holds the site *and* the documents describing it; this stages the artifact by rule so only site-shaped content reaches the domain, then verifies that every URL in the sitemap made it — a page that quietly did not ship looks exactly like one that did. |
| `brief.md` | The decisions. Start here. |
| `.github/workflows/gate.yml` | The delivery gate, and the publication origin. |

## Before the first line: the six irreversibles

Everything else here is refactorable in an afternoon. These are not — record each in `brief.md`.

1. **The measurement contract** and the container. Measurement cannot be reconstructed backwards.
2. **The consent decision** — jurisdiction, owner, date, and what would change the answer.
3. **The canonical identity** — one domain, one mailbox, one brand.
4. **Retired URLs and the redirect plan.** This one decides the hosting.
5. **Sender authentication**, if there will be email. Burnt sending reputation takes months.
6. **The conversion receiver**, with a named owner and a tested reply.

## Bringing in a content document

Most sites start from a document somebody else wrote. Two things about that are worth knowing
before you open it.

**Do not start with the content, even when it is finished.** `build-derived.mjs` rewrites every
absolute URL from `config.canonicalOrigin`, so copy written before the domain is settled gets
written twice. Fill in `config.js`, then `facts.js`, then the copy.

**A business fact goes in exactly one place.** Everything below is derived from `facts.js` — the
structured data, the machine-readable summary, the offering cards. Putting a telephone number in
the markup because that is where the document had it is how a published contradiction starts.

| In the document | Goes to |
|---|---|
| Name, legal name, founding year, licence or registration number | `facts.js` |
| The one-line description, the "what we do" paragraph | `facts.js` → `tagline`, `description` |
| Services or products | `facts.js` → `offerings[]` |
| Addresses, telephones, opening hours | `facts.js` → `locations[]` |
| Social profiles | `facts.js` → `profiles[]` |
| Hero headline, section copy | `index.html` |
| Page title and meta description | `index.html`, in the head |
| Legal and privacy text | `privacy.html` |

Then `node scripts/build-derived.mjs`, and the gate will tell you if anything drifted.

If the document carries a fact that fits no field, that is a question rather than a licence to put
it loose in the markup — and if it conflicts with a rule, see *Input from outside this repository*
in [`AGENTS.md`](AGENTS.md).

## The host

**GitHub Pages**, published by the `publish` job in the gate. Cloudflare Pages was chosen first and
reversed, because it required moving the DNS zone. Hosting is the client's call; what it costs is
declared rather than absorbed.

**What this host puts out of reach.** It serves no custom response headers, so `_headers` is inert —
and it says so, in capitals, at the top of the file. The recoverable half moved into a
`<meta http-equiv="Content-Security-Policy">` and a `<meta name="referrer">` in every page. The
irrecoverable half is `frame-ancestors`, which a meta policy ignores: **this site has no protection
against being framed**, and on a page giving medical information that is the one that matters. The
full list is in `brief.md` under *Absent controls*.

**Page URLs are directory indexes** — `/fertilidad/`, not `/fertilidad`. An extensionless URL only
resolves where the host maps it to a `.html` file, and every canonical on this site would have rested
on that. A directory index is served by every static host there is.

**The repository is public and is no longer identical to the web root.** It was made public so Pages
could serve it on a free plan. `brief.md`, `AGENTS.md`, `README.md` and `scripts/` are readable on
GitHub and are **not** served from `doctoracuevillas.com` — the difference between a colleague
finding the project's internal notes and a patient finding them under her doctor's name.

**Publication is off.** Three steps turn it on, in order: Settings → Pages → Source: GitHub Actions;
DNS pointed at Pages with "Enforce HTTPS"; then set the repository variable `PUBLISH_ENABLED` to
`true`. Until the third, merging to `main` publishes nothing. The job refuses to deploy without the
`CNAME` file, because publishing from a workflow without it unbinds the custom domain silently.

## Ownership and the exit path

Fill this in on day one. A site whose pieces nobody can name is a site nobody can hand over, and the
unclaimed pieces are the ones that end up as a DNS record pointing at a resource that no longer
exists — which is how a client's domain becomes claimable by a stranger.

| Piece | Who owns the account | How it transfers |
|---|---|---|
| Domain registrar | Juan | Registrar transfer to an account in Guadalupe's name. **Do this before anything else depends on it** — an unclaimed domain pointing at a dead resource is how a client's name becomes claimable by a stranger |
| DNS zone | Juan (to move to Cloudflare) | Moves with the domain |
| Domain verification | Juan | Re-verified by whoever holds the hosting account |
| Repository | `makesensedigital` organisation | Transfer, or fork to Guadalupe's account. The site is nine static files; it does not need the org |
| Hosting account | `makesensedigital` (GitHub Pages) | The artifact is the repository: transfer the repo and Pages follows |
| Analytics property | Juan (not yet created) | Add Guadalupe as an administrator on the GA4 property at creation, not later |
| Tag container | Juan — `GTM-TCHKKB37` | Add Guadalupe as a container administrator |
| Form receiver | **None** — this site presents no form | n/a |
| Mailing platform | Juan — EnvíaloSimple, AdministratorID 203816 | Account handover, or export the four lists |
| Scheduling links | Guadalupe — YouCanBookMe | Already hers |
| WhatsApp line | Guadalupe — +54 9 11 5961-2588 | Already hers |
| Instagram | Guadalupe — @dracuevillas | Already hers |

## After launch

- A **named owner** and a review cadence, here in this file.
- A **scheduled check** — nothing in this architecture announces a failure. No logs, no alerts, no
  health endpoint. Availability, links and performance on a schedule against the public URL, opening
  an issue on failure.
- The measurement **read against the question that motivated it**, in pairs and by trend.

Owner: **Juan** · Cadence: **monthly**, and within a week of any change to `facts.js` or `config.js`.

The scheduled check is not optional here and it does not exist yet. Nothing in this architecture
announces a failure: no logs, no alerts, no health endpoint. A scheduling link that starts returning
404, an expired certificate, or a `_headers` file the host silently stopped reading all look exactly
like a working site from the outside. The check to build is a scheduled workflow against the public
URL — availability, every outbound link, the response headers, and Lighthouse — opening an issue on
failure. It is listed as pending in `brief.md`.

What to read, and against which question:

| Read | Against |
|---|---|
| `puerta` distribution on `agenda_intent` and `messaging_intent` | Which door earns its place, and which one is a landing nobody converts on |
| `agenda` on `agenda_intent`, first consultation versus follow-up | Whether the site brings new patients or serves existing ones |
| `audiencia` on `newsletter_intent` | Whether the professional list is worth the line that feeds it |
| Every intent count, in pairs and by trend, never as an absolute | Instagram's embedded browser partitions storage, so returning-visitor and attribution figures are wrong in a known direction |

## Adding a check

When a correction recurs, promote it into code rather than into a longer document — §20 puts the
threshold at three occurrences. Add it to the check that owns the concern, add a fixture to
`scripts/test-gate.mjs` in **both** directions, and make the message state the remediation: a lint's
output is input to the next turn, not a report.
