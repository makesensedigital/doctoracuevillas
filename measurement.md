# Measurement setup — GA4, Google Tag Manager, Search Console

**What this is:** the console work that cannot be done from this repository, written down so it takes
minutes rather than an afternoon, and so that whoever does it makes the same decisions the site was
built around.

**Status, verified 2026-08-25** from a signed-in browser against the live site, GA4, Tag Manager,
Search Console and the public DNS. This replaces the 2026-08-11 reading, which said the container
was empty and the property unclaimed. Neither was true by then, and the gap between the document and
the consoles is what cost an afternoon.

| | |
|---|---|
| Container `GTM-TCHKKB37` loading on all nine pages | ✅ |
| Consent Mode defaulting every category to denied | ✅ — hits carry `gcs=G100` until the banner is accepted, `gcs=G111` after |
| The site's own events reaching `dataLayer` | ✅ |
| **GA4 inside the container** | ✅ Google tag `G-2PXQZ6PZNE` on *Initialization — All Pages*, plus one GA4 event tag covering the six custom events |
| **GA4 receiving data** | ✅ `/g/collect?v=2&tid=G-2PXQZ6PZNE`; Realtime shows live visits; the last 7 days held 11 users / 109 events |
| All ten parameters wired in the container | ✅ container **version 3**, published 2026-08-25 |
| All ten custom dimensions registered in GA4 | ✅ 2026-08-25 |
| Search Console claimed | ✅ **domain property, DNS-verified — since before 2026-08-10** |
| Sitemap submitted | ✅ `/sitemap.xml`, last read 2026-08-19, *Correcto*, 8 pages |
| GA4 ↔ Search Console linked | ✅ since 2026-08-10 |

Nothing is outstanding. What follows is the map, and the three traps that made a working setup look
broken.

## Trap 1 — the property was named `make-sense-caf66`

**Fixed 2026-08-25: it is now named `doctoracuevillas.com`.** For its first fortnight the GA4
property carried the name of an unrelated project, so anyone scanning the property list concluded the
site had never been connected. The data was arriving the whole time.

| | |
|---|---|
| Account | `doctoracuevillas.com` — `406037496` *(moved out of `Make Sense` on 2026-08-25)* |
| **Property** | `doctoracuevillas.com` — `514219489` *(was `make-sense-caf66`)* |
| Data stream | `doctoracuevillas.com` — `https://doctoracuevillas.com`, stream `15415188486` |
| Measurement id | `G-2PXQZ6PZNE` |
| Container | `GTM-TCHKKB37`, GTM account `guadacuevillas` (`6370529813`), container `260745096` |
| Search Console | domain property `sc-domain:doctoracuevillas.com` |

Direct link, worth a bookmark:
`https://analytics.google.com/analytics/web/#/a406037496p514219489/reports/intelligenthome`

**The property no longer lives in the agency account.** On 2026-08-25 it was moved into a GA4 account
of its own, `doctoracuevillas.com` (`406037496`), with the *replace permissions* option — so access
is what the new account grants and not what `Make Sense` happens to grant. Account administrators are
`Juan.Torresel@gmail.com` and `endodracuevillas@gmail.com`.

The move changes nothing downstream: property id, stream id and measurement id are unchanged, so the
container needed no edit, and the Search Console link survived it. **The container itself is a
separate question** — it sits in the GTM account `guadacuevillas`, and `www` still CNAMEs to
`makesensedigital.github.io`. See the ownership table in `README.md`.

*Renaming has a toll GA4 does not warn you about:* it refuses to save the name until **Sector**,
**Tamaño de la empresa** and **Objetivos de negocio** are filled, and the error names only Sector.
Recorded as answered on 2026-08-25: *Salud* · *Pequeña: de 1 a 10 empleados* · *Conocer el tráfico
web o de aplicaciones* + *Ver la interacción y la retención de usuarios*. The objectives are
deliberately the two behavioural ones: the lead-generation collection is built around key events,
and §4 explains why this property has none.

## Trap 2 — "Google tag not detected"

GA4's *Admin → Data streams → Google tag*, and the setup assistant beside it, fetch the page
**without executing JavaScript**. `analytics.js` injects the container only after the window `load`
event, during idle time, so the served markup contains no `G-…` and no `gtm.js` — and the check
reports the tag missing on a site where it is demonstrably firing.

This is expected, and it is not a finding. The valid checks are GTM Preview and GA4 Realtime, in §6.

`scripts/check-config.mjs` fails the gate on a `G-…` literal found anywhere in the markup, on
purpose: the container stays the single measurement entry point, so changing a tag never needs a
deploy. Do not "fix" the detector's complaint by pasting the measurement id into a page.

## Trap 3 — `search.google.com/search-console/welcome`

That URL **always** renders the add-a-property screen, whether or not the account already holds
properties. Opening it directly and concluding "no properties are verified" is wrong, and it is how
this document came to claim for two weeks that Search Console was unclaimed when it had been
DNS-verified since before 2026-08-10.

Land on `https://search.google.com/search-console` instead, or go straight to the property.

---

## 1. GA4 property — done

Created, with a **web** data stream for `https://doctoracuevillas.com`. Coordinates above. The
measurement id does not go in this repository.

## 2. Inside GTM-TCHKKB37 — done

**a. The Google tag.** ✅ `G-2PXQZ6PZNE`, on *Initialization — All Pages*.

Neither tag carries an *additional consent* requirement on `analytics_storage`. That is a defensible
setting rather than a bug: the site declares every category denied before the container loads, so a
denied visitor produces cookieless consent-mode pings instead of nothing at all. It does mean
**traffic that never touches the banner is collected in a form standard reports largely do not
show** — which is the honest explanation for a report that looks emptier than the site feels.

**b. Data layer variables.** ✅ all ten, named `DLV - <name>`, data layer **version 2**:

`puerta` · `event_label` · `agenda` · `audiencia` · `outcome_confirmed` · `event_category` ·
`link_url` · `link_text` · `origen_puerta` · `origen_control`

The last five were added on 2026-08-25. `event_category`, `link_url` and `link_text` were in the
original plan and never created; `origen_puerta` and `origen_control` have been emitted by
`analytics.js` since the booking-origin change (commit `f5e2721`) and the container was discarding
them — which meant *which door sent her to the scheduler*, the question the instrumentation exists
to answer, was unanswerable for a fortnight.

**c. Triggers.** ✅ One custom-event trigger covering all six names:

`puerta` · `cta_click` · `agenda_intent` · `messaging_intent` · `newsletter_intent` · `mail_intent`

**d. Event tags.** ✅ One GA4 event tag, event name taken from the dataLayer event, sending all ten
parameters. Published as container **version 3**, *"Los cinco parametros que faltaban"*.

## 3. Custom dimensions in GA4 — done

*Admin → Custom definitions*, **event-scoped**, all ten registered and matching the parameter names
above. The five added on 2026-08-25 are `event_category`, `link_url`, `link_text`, `origen_puerta`
and `origen_control`.

Skipping this step is the classic failure: the parameters are still collected and are **not
reportable** — they simply never appear in any report, which looks exactly like a site that never
sent them.

## 4. Key events — read this before marking one

**This site has no outcome it can verify.** Four of its six events are departures: the visitor
leaves for the scheduler, for WhatsApp, for the mailing platform, for a mail client, and the site
observes her leaving and never arriving. That is why they are named `*_intent` and stamped
`outcome_confirmed: false`.

So: **do not mark any `*_intent` as a key event.** The property reports **0 key events**, which is
the correct state and not an oversight. If a headline number is needed anyway, the honest one is
`agenda_intent`, understood as an **upper bound on bookings, not a count of them** — and whoever
reads that report has to know it. A conversion figure inflated by a margin nobody can estimate is
worse than no figure, and the history cannot be recomputed once it exists.

**Known bias, to record beside the number.** Most traffic arrives from Instagram — the 7 days read on
2026-08-25 were 12 sessions `ig / social` against 2 `(direct) / (none)` and 2
`chatgpt.com / ai-assistant` — and Instagram opens links in an embedded browser with partitioned
storage. Returning-visitor counts and attribution are therefore wrong in a known direction: sessions
over-counted, returns under-counted. Read trends and pairs, never absolutes.

## 5. Search Console — done, by DNS

The **domain property** `sc-domain:doctoracuevillas.com` is verified by the TXT record
`google-site-verification=qESgSpK3f_zoyy2YNCABaVwa3u5dt4bmcyunpI0AzRM`, live in the zone at DonWeb
(nameservers `ns3.hostmar.com` / `ns4.hostmar.com`). This is the route this document recommended: it
covers the apex, `www` and every subdomain at once, and needs nothing from this repository.

Owners: `Juan.Torresel@gmail.com` (propietario, verificado) and `endodracuevillas@gmail.com`
(permiso completo).

**Guadalupe is not an owner, and no button in the console can make her one.** On a domain property
ownership *is* the DNS verification — *Ajustes → Verificación de la propiedad* offers no delegated
owner, and *Cambiar permisos* only moves a user between **Completo** and **Restringido**. The way she
becomes an independent owner is to verify the domain herself:

1. She signs in to Search Console as `endodracuevillas@gmail.com` and adds a **Dominio** property for
   `doctoracuevillas.com`.
2. Google issues *her own* `google-site-verification=…` token.
3. Add it to the zone as a **second** TXT record on `doctoracuevillas.com` — several
   `google-site-verification` records coexist without interfering. The zone is at DonWeb
   (*Hosting Revendedores → Dominios → Zona DNS → Agregar registro*), nameservers `ns3.hostmar.com` /
   `ns4.hostmar.com`.
4. She presses *Verificar*.

Then neither owner depends on the other, which is the point: a delegated owner loses ownership when
the owner who delegated it does.

**The verifying TXT record is load-bearing.** `google-site-verification=qESgSpK3f_zoyy2YNCABaVwa3u5dt4bmcyunpI0AzRM`
lives on `doctoracuevillas.com`, TTL 14400. If a DNS or registrar migration drops it, the property
silently unverifies and the GA4 link goes with it — and nothing in this repository would notice.
Carry it across any zone move, together with the SPF, DKIM and DMARC records that carry the mail.

**Because DNS did the verifying, `config.searchConsole.verification` stays `null` — correctly.** It
exists for the HTML-tag route, which renders the token into the served markup of the home page via
`node scripts/build-derived.mjs`, deliberately, because Google's verifier fetches the page without
executing JavaScript. That route is not needed here and setting it would add a second, redundant
proof of the same thing.

**Do not add a URL-prefix property beside the domain one.** The domain property is a strict superset,
and a duplicate in the list is the same species of confusion as Trap 1. One was created by mistake on
2026-08-25 and removed the same day.

**Sitemap:** `https://doctoracuevillas.com/sitemap.xml` — submitted, last read 2026-08-19, status
*Correcto*, 8 pages discovered. Google found it from the `Sitemap:` line in `robots.txt`, which is
why it was indexed before anyone opened the console.

**GA4 ↔ Search Console:** linked since 2026-08-10, domain property to stream `15415188486`, so search
queries appear beside behaviour instead of in a separate tab nobody opens.

### 5b. The two "no se indexaron" emails are the architecture working — do not "fix" them

Google has sent two *Nuevos motivos que impiden la indexación* notices, and **neither is a defect.**
Both are written down here because the notice will arrive again, and the cost of not recording it is
that the next person re-investigates from nothing — or worse, "corrects" it and breaks canonical
identity to make a console message go away.

| Notice | Date | What it actually is |
|---|---|---|
| *Página alternativa con etiqueta canónica adecuada* | 2026-08-16 | `…/index.html` serves 200 beside `…/`, and carries a canonical to the directory form. Google consolidates them. **"Adecuada" is the console saying the canonical was honoured.** |
| *Página con redirección* | 2026-09-20 | The `www`, the `http` and the no-trailing-slash forms. Every one is a real 301 to the canonical URL. |

**Why they appear at all:** the property is a **domain** property, `sc-domain:doctoracuevillas.com`,
which is a strict superset — it covers `http`, `https`, the apex and every subdomain. So Google
crawls and reports address forms that a URL-prefix property would never have shown. That is the
price of the DNS route, and the DNS route is still the right one (§5).

Verified against the live site on 2026-09-21, with a Googlebot user agent:

```
https://doctoracuevillas.com/            200
https://www.doctoracuevillas.com/        301 → https://doctoracuevillas.com/
http://doctoracuevillas.com/             301 → https://doctoracuevillas.com/
http://www.doctoracuevillas.com/         301 → https://doctoracuevillas.com/
https://doctoracuevillas.com/sobre-mi    301 → https://doctoracuevillas.com/sobre-mi/
all 8 sitemap URLs                       200, none redirecting
```

The `www` 301 is served by GitHub Pages from the `CNAME` file, with `www` CNAMEd to
`makesensedigital.github.io` — see `_redirects`, which says so and explains why the rules in it are
inert. **Removing any of these redirects to empty the report would mean one page reachable at two
addresses, which is the thing the redirects exist to prevent.**

What WOULD be a defect, and is worth checking if the notice ever names a URL not in the list above:
a sitemap URL that redirects, or an internal link written without its trailing slash. Neither exists
today — every internal `href` on this site is already in canonical form, and the gate's link check
walks them on a server that mirrors the host's redirect behaviour.

## 6. Verify before trusting any of it

Neither automatic check GA4 offers is valid here — see Trap 2. Use these:

- GTM **Preview** on the live site: click one control of each kind and confirm the event arrives
  **with `puerta` populated**. An event without it cannot be assigned to a door afterwards.
- GA4 **Realtime**, on property `514219489`: the same six events, with intents and outcomes
  distinguishable.
- Accept the cookie banner and confirm `analytics_storage` flips to granted; reject it and confirm
  nothing is collected. In the request itself this is the `gcs` parameter on `/g/collect` — `G100`
  denied, `G111` granted.
- **Read the request, not the console.** The fastest end-to-end check is the query string of
  `/g/collect` in DevTools. Walking `/fertilidad/` → footer link to the booking section → a scheduler
  control on 2026-08-25 produced, on one `agenda_intent`:

  ```
  ep.puerta = como-es-la-consulta      ep.event_category = engagement
  ep.event_label = cierre_fertilidad_primera_consulta
  ep.agenda = primera_consulta         ep.link_url  = https://primerconsultanapro.youcanbook.me
  ep.outcome_confirmed = false         ep.link_text = Primera consulta de fertilidad
  ep.origen_puerta = fertilidad        ep.origen_control = footer_turno
  ```

  `origen_puerta` is empty when the visitor lands on the booking page directly. That is correct, not
  a fault: there was no door to attribute.

**Loading policy, since 2026-08-11:** the first-party analytics collector is deferred, while GTM and
Clarity are requested only after the window `load` event, during idle time. Events produced before
GTM arrives remain ordered in `dataLayer` and are consumed when the container starts. Validate this
after deployment in GTM Preview by clicking a measured control immediately after first paint, then
confirming that the event appears once the container has loaded.

## 7. What stays out of reach here

`_headers` is inert on GitHub Pages, so the container is loaded from a page whose response headers
this project does not control. It is declared in `brief.md` under *Absent controls*. Nothing in this
document changes that.
