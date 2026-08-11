# Measurement setup — GA4, Google Tag Manager, Search Console

**What this is:** the console work that cannot be done from this repository, written down so it takes
minutes rather than an afternoon, and so that whoever does it makes the same decisions the site was
built around.

**Status, verified 2026-08-11 against the live site:**

| | |
|---|---|
| Container `GTM-TCHKKB37` loading on all nine pages | ✅ |
| Consent Mode defaulting every category to denied | ✅ |
| The site's own events reaching `dataLayer` | ✅ — a real click in production produced `agenda_intent · puerta=fertilidad · outcome_confirmed=false` |
| **GA4 inside the container** | ❌ **empty.** The container returns its runtime and not one `G-` measurement id, no Ads tag, no pixel |
| Search Console | ❌ not claimed |

So the plumbing works and nothing is on the other end. **Everything emitted so far is gone and cannot
be reconstructed** — measurement is not recoverable backwards, which is why this is a launch
condition rather than a nice-to-have.

**Loading policy, changed 2026-08-11:** the first-party analytics collector is deferred, while GTM
and Clarity are requested only after the window `load` event, during idle time. Events produced
before GTM arrives remain ordered in `dataLayer` and are consumed when the container starts. Validate
this after deployment in GTM Preview by clicking a measured control immediately after first paint,
then confirming that the event appears once the container has loaded.

---

## 1. GA4 property

Create the property and a **web** data stream for `https://doctoracuevillas.com`. Keep the
measurement id (`G-…`) for the next step.

**It does not go in this repository.** The site's single measurement entry point is the tag
container; `scripts/check-config.mjs` fails the gate on a `G-…` literal found anywhere in the markup
precisely so this stays true. One place to change a tag, without a deploy.

## 2. Inside GTM-TCHKKB37

**a. The Google tag.** New tag → *Google tag*, with the measurement id from step 1. Trigger:
*Initialization — All Pages*. In its consent settings, require **`analytics_storage`**. The site
already declares every category denied before the container loads, so this is the setting that makes
the banner mean something rather than decorate.

**b. Data layer variables.** Create one for each, named exactly as the site emits them:

`puerta` · `agenda` · `audiencia` · `outcome_confirmed` · `event_label` · `event_category` ·
`link_url` · `link_text`

**c. Triggers.** One *Custom Event* trigger per event name:

`puerta` · `cta_click` · `agenda_intent` · `messaging_intent` · `newsletter_intent` · `mail_intent`

**d. Event tags.** One GA4 event tag per trigger, event name identical to the trigger, sending the
variables that event carries. Every event carries `puerta`; `agenda_intent` also carries `agenda`;
`newsletter_intent` also carries `audiencia`.

## 3. Inside GA4: register the custom dimensions

*Admin → Custom definitions → Create custom dimension*, **event-scoped**, one for each:

`puerta` · `agenda` · `audiencia` · `outcome_confirmed`

Skip this and the parameters are still collected and are **not reportable** — they simply never
appear in any report, which looks exactly like a site that never sent them. This is the step people
miss.

## 4. Key events — read this before marking one

**This site has no outcome it can verify.** Four of its six events are departures: the visitor
leaves for the scheduler, for WhatsApp, for the mailing platform, for a mail client, and the site
observes her leaving and never arriving. That is why they are named `*_intent` and stamped
`outcome_confirmed: false`.

So: **do not mark any `*_intent` as a key event.** If a headline number is needed anyway, the honest
one is `agenda_intent`, understood as an **upper bound on bookings, not a count of them** — and
whoever reads that report has to know it. A conversion figure inflated by a margin nobody can
estimate is worse than no figure, and the history cannot be recomputed once it exists.

**Known bias, to record beside the number.** Most traffic arrives from Instagram, which opens links
in an embedded browser with partitioned storage. Returning-visitor counts and attribution are
therefore wrong in a known direction: sessions over-counted, returns under-counted. Read trends and
pairs, never absolutes.

## 5. Search Console

**Claim the property.** Two ways, in order of preference:

1. **DNS TXT record.** Covers the apex, `www` and every subdomain at once, and needs nothing from
   this repository. Best if the zone is at hand.
2. **HTML tag.** Put the token in `config.searchConsole.verification` and run
   `node scripts/build-derived.mjs`. It is rendered into the served markup of the home page —
   deliberately, because Google's verifier fetches the page **without executing JavaScript**, so a
   token injected at runtime is a token it never sees.

There is a third way Google offers, an HTML file at the web root. It would have to be committed, and
`scripts/stage-site.mjs` decides what reaches the domain — so it is a change to make on purpose, not
a file to drop in.

**Then submit the sitemap:** `https://doctoracuevillas.com/sitemap.xml` — live, 8 URLs, all with the
trailing slash the site actually serves.

**Then link GA4 ↔ Search Console**, so search queries appear beside behaviour instead of in a
separate tab nobody opens.

## 6. Verify before trusting any of it

- GTM **Preview** on the live site: click one control of each kind and confirm the event arrives
  **with `puerta` populated**. An event without it cannot be assigned to a door afterwards, and
  which door converts is the entire question the measurement exists to answer.
- GA4 **Realtime**: the same six events, with intents and outcomes distinguishable.
- Accept the cookie banner and confirm `analytics_storage` flips to granted; reject it and confirm
  nothing is collected.

## 7. What stays out of reach here

`_headers` is inert on GitHub Pages, so the container is loaded from a page whose response headers
this project does not control. It is declared in `brief.md` under *Absent controls*. Nothing in this
document changes that.
