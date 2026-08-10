# Brief — <site name>

**Version 0.1 · <date> · Owner: <name>**

The specification is source code, not documentation: when an agent does the building, this file is
the literal input to the system that produces the software. It is versioned with the code that comes
out of it, and a change here is a commit like any other.

Four sections, three of which are usually skipped and all of which earn their place.

---

## 1. Decided — do not re-litigate

Closed decisions. Without this section every iteration reopens debates that were already settled,
and the cost is paid in rework nobody records.

| Decision | What was decided | Who | When |
|---|---|---|---|
| Canonical domain | | | |
| Hosting, and what it puts out of reach | | | |
| Primary conversion | | | |
| Copy language and register | | | |

### The six irreversibles

Everything else is refactorable. These are not, so they are answered before the first line.

| # | Decision | Answer | Owner |
|---|---|---|---|
| 1 | Measurement contract and container | | |
| 2 | Consent — jurisdiction, decision, **and what would change it** | | |
| 3 | Canonical identity: domain, mailbox, brand | | |
| 4 | Retired URLs and the redirect plan | | |
| 5 | Sender authentication (if there will be email) | | |
| 6 | Conversion receiver, with a tested reply | | |

### The measurement contract

Written before the code that emits it. Every property exists because a stated question depends on
it — nothing is instrumented "just in case".

| Event | Type | Properties | The question it answers |
|---|---|---|---|
| `contact_form_submitted` | outcome | — | Did the primary conversion happen? |
| `messaging_intent` | **intent** | `event_label` | Which control sends people to messaging? |

**Outcome or intent is not a naming preference.** Anything completing outside this site — a
messaging app, a scheduler, a payment page — can be observed leaving and never arriving. Recording
one of those as an outcome produces a headline number inflated by a margin nobody can estimate, and
the history cannot be recomputed.

---

## 2. Pending — with an owner and what it blocks

The middle column is the one that matters: without it a cosmetic gap stalls the build as effectively
as a real blocker.

| Item | What it blocks | Owner | Due |
|---|---|---|---|
| | Nothing — build around it | | |
| | Publication | | |

An unknown value is a named constant in `config.js` with a working fallback, never a stop. The cost
of replacing it later is one line.

---

## 3. Assumed — nobody validated these

The most dangerous section, because an assumption reads exactly like a decision six weeks later.

| Assumption | Who would confirm it | What breaks if it is wrong |
|---|---|---|
| | | |

---

## 4. Do not do

The specific mistakes already identified for *this* site. Positive requirements describe the
destination; these close the known wrong turns.

An agent fills a gap in the specification with the most common pattern in its training, and when
that pattern is exactly the one to avoid, only saying so prevents it.

- Do not …
- Do not …

---

## Corrections

A reversed conclusion is struck through and explained, never deleted. The value is not only in the
current answer but in knowing what was discarded and why — otherwise a later pass reintroduces an
error that was already fixed.

| Initial conclusion | Correction | What triggered it |
|---|---|---|
| | | |

The commit history carries this too, provided each message says *why* rather than *what*.

---

## External configuration inventory

Parts of this system live in a provider's web interface and are invisible to version control. The
inventory is the only record.

| Provider | Object | Identifier | What it does | Restricted to our origin? |
|---|---|---|---|---|
| | | | | |

---

## Verification before publication

Publishing is not finishing. The gate covers what a machine can see; these are the rest.

- [ ] The gate passes, and publication came from the pipeline rather than a branch
- [ ] Every conversion path walked end to end, on a real phone, on mobile data
- [ ] Opened **from a link in the channel the traffic actually comes from**, not by typing the URL —
      an embedded browser is not the browser you tested in
- [ ] The URL pasted into the messaging app and the social network the site is promoted on, and the
      preview card looked at
- [ ] Events seen arriving in the measurement tool's live view, with intent and outcome distinct
- [ ] Sitemap submitted; structured data validated
- [ ] Every retired URL redirects, verified by requesting it
- [ ] Keyboard-only walkthrough of every interactive element — roughly half of the accessibility
      requirement is invisible to any automated pass
- [ ] Sector-specific legal requirements present, treated as acceptance criteria rather than a final
      review item
