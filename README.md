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
| `index.html` | The page. Blocks marked `BEGIN GENERATED` are written by `build-derived.mjs` — never hand-edit them. |
| `_headers` | The controls a static site has nowhere else to put. **Does nothing on a host that cannot serve headers.** |
| `_redirects` | Every URL the predecessor had. **Impossible on a host with no real redirect** — which is why hosting is chosen first. |
| `.gitignore` | Access control. The repository is the web root, so committing is publishing. |
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

## Choosing the host — before the markup, not after

The host decides which rules you are *able* to obey. Test for the capability rather than trusting a
product name:

- Can it serve **custom response headers**? Without them there is no enforceable content policy and
  **no protection against framing at all** — that one cannot be expressed from inside the document.
- Can it issue a **real redirect status**? Without it §26's canonical-identity rule is
  unimplementable, and a markup page that refreshes the browser is not a substitute.
- Does it give **access logs**, **cache purge**, **one-click rollback**, **per-change previews**?

The `publish` job here targets GitHub Pages because it is the common case. **GitHub Pages serves no
custom headers and issues no real redirects**, so `_headers` and `_redirects` do nothing there. If
this site replaces one whose URLs are indexed, or needs a content policy, that is a reason to choose
a different host — not a reason to proceed quietly. Record what you chose and what it puts out of
reach in `brief.md`.

## Ownership and the exit path

Fill this in on day one. A site whose pieces nobody can name is a site nobody can hand over, and the
unclaimed pieces are the ones that end up as a DNS record pointing at a resource that no longer
exists — which is how a client's domain becomes claimable by a stranger.

| Piece | Who owns the account | How it transfers |
|---|---|---|
| Domain registrar | | |
| DNS zone | | |
| Domain verification | | |
| Repository | | |
| Hosting account | | |
| Analytics property | | |
| Tag container | | |
| Form receiver | | |
| Mailing platform | | |
| Scheduling links | | |

## After launch

- A **named owner** and a review cadence, here in this file.
- A **scheduled check** — nothing in this architecture announces a failure. No logs, no alerts, no
  health endpoint. Availability, links and performance on a schedule against the public URL, opening
  an issue on failure.
- The measurement **read against the question that motivated it**, in pairs and by trend.

Owner: _TBD_ · Cadence: _TBD_

## Adding a check

When a correction recurs, promote it into code rather than into a longer document — §20 puts the
threshold at three occurrences. Add it to the check that owns the concern, add a fixture to
`scripts/test-gate.mjs` in **both** directions, and make the message state the remediation: a lint's
output is input to the next turn, not a report.
